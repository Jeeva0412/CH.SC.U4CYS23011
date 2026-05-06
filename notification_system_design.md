# Stage 1: Campus Notification Platform - System Design

## Core Actions
The campus notification platform supports the following core actions:
1.  **Fetch Notifications:** Retrieve a list of notifications for the authenticated student.
2.  **Mark as Read:** Update the status of a specific notification to 'read'.
3.  **Mark All as Read:** Update all unread notifications for a student to 'read'.
4.  **Delete Notification:** Remove a notification from the user's view.
5.  **Fetch Unread Count:** Get the number of unread notifications for badge icons.

---

## REST API Endpoints

### 1. Fetch Notifications
- **Endpoint:** `GET /api/v1/notifications`
- **Headers:**
    - `Authorization: Bearer <token>`
    - `Content-Type: application/json`
- **Query Parameters:**
    - `page` (int, optional): Page number for pagination.
    - `limit` (int, optional): Number of items per page.
    - `type` (string, optional): Filter by `Event`, `Result`, or `Placement`.
- **Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "uuid-1234",
      "type": "Placement",
      "message": "New placement drive from Google!",
      "isRead": false,
      "createdAt": "2024-05-06T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10
  }
}
```

### 2. Mark Notification as Read
- **Endpoint:** `PATCH /api/v1/notifications/{id}/read`
- **Headers:**
    - `Authorization: Bearer <token>`
- **Response (204 No Content):** (Success)

### 3. Mark All as Read
- **Endpoint:** `PATCH /api/v1/notifications/read-all`
- **Headers:**
    - `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "message": "All notifications marked as read",
  "count": 12
}
```

### 4. Fetch Unread Count
- **Endpoint:** `GET /api/v1/notifications/unread-count`
- **Headers:**
    - `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "unreadCount": 5
}
```

---

## Real-time Notifications Mechanism

To ensure students receive updates instantly without refreshing the page, we will implement **Server-Sent Events (SSE)**.

### Why SSE?
- **Uni-directional:** Notifications are pushed from server to client, which fits the notification use case perfectly.
- **Lightweight:** Uses standard HTTP protocol, unlike WebSockets which requires a protocol upgrade.
- **Automatic Reconnection:** Browsers natively handle reconnections for SSE.

### Implementation Logic:
1.  **Client Connection:** The frontend establishes a connection to `GET /api/v1/notifications/stream`.
2.  **Server Subscription:** The backend maintains a list of active student connections (e.g., using a Map or a Pub/Sub system like Redis).
3.  **Trigger:** When a new notification is created (e.g., a "Notify All" action), the backend publishes an event.
4.  **Push:** The SSE handler identifies the relevant connected students and pushes the JSON payload through the open HTTP stream.

---

# Stage 2

## Suggested Persistent Storage: PostgreSQL
For a campus notification microservice, **PostgreSQL (Relational DB)** is the most suitable choice for the following reasons:
1.  **ACID Compliance:** Ensures that marking a notification as 'read' is atomic and consistent.
2.  **Structured Data:** Notifications have a well-defined structure (id, type, student_id, etc.).
3.  **Relational Integrity:** Easy to join with a `students` table to ensure notifications are only sent to valid users.
4.  **Indexing:** Robust support for B-tree and GIN indexes, essential for querying millions of notifications by student and status.

## DB Schema

### Tables

#### 1. students
| Column | Type | Constraints |
| :--- | :--- | :--- |
| id | UUID | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| roll_no | VARCHAR(50) | UNIQUE, NOT NULL |

#### 2. notifications
| Column | Type | Constraints |
| :--- | :--- | :--- |
| id | UUID | PRIMARY KEY |
| student_id | UUID | FOREIGN KEY (students.id), INDEX |
| type | notification_type (ENUM) | INDEX |
| message | TEXT | NOT NULL |
| is_read | BOOLEAN | DEFAULT FALSE, INDEX |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP, INDEX |

#### 3. notification_type (ENUM)
Values: `Event`, `Result`, `Placement`

## Scalability Problems and Solutions

### 1. Data Volume Growth
**Problem:** As the number of students and notifications grows into millions, simple indexes might not be enough. Queries like "Fetch all unread" will slow down.
**Solution:**
- **Database Partitioning:** Partition the `notifications` table by `created_at` (range partitioning) or `student_id` (hash partitioning). This reduces the index size scanned for each query.
- **Archiving:** Move notifications older than 6 months to a cold storage or a "historical_notifications" table.

### 2. High Write Load
**Problem:** Sending a notification to 50,000 students at once causes a write spike.
**Solution:**
- **Batch Insertion:** Use multi-row `INSERT` statements.
- **Asynchronous Writes:** Use a message queue (Stage 5) to buffer writes.

## SQL Queries based on Stage 1 APIs

### 1. Fetch Notifications (Paginated)
```sql
SELECT * FROM notifications
WHERE student_id = :student_id
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

### 2. Mark as Read
```sql
UPDATE notifications
SET is_read = TRUE
WHERE id = :notification_id AND student_id = :student_id;
```

### 3. Mark All as Read
```sql
UPDATE notifications
SET is_read = TRUE
WHERE student_id = :student_id AND is_read = FALSE;
```

### 4. Unread Count
```sql
SELECT COUNT(*) FROM notifications
WHERE student_id = :student_id AND is_read = FALSE;
```

---

# Stage 3

## Query Analysis
**Query:** `SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC;`

### 1. Is this query accurate?
**Yes.** It correctly filters notifications for a specific student (`studentID = 1042`) that are unread (`isRead = false`) and sorts them by the most recent first (`ORDER BY createdAt DESC`).

### 2. Why is this slow?
With 5,000,000 notifications, the database likely has to perform a **Sequential Scan** (Full Table Scan) if no appropriate index is present. Even with individual indexes on `studentID` or `isRead`, the database still has to fetch many rows and then sort them by `createdAt`, which is expensive for large datasets.

### 3. What would you change and what is the computation cost?
**Proposed Change:** Add a **Composite Index** on `(studentID, isRead, createdAt DESC)`.
```sql
CREATE INDEX idx_student_unread_recent ON notifications (studentID, isRead, createdAt DESC);
```
**Likely Computation Cost:**
- **Search:** The index search will take $O(\log N)$ time to find the starting point in the B-tree.
- **Fetch:** Since the index already includes the sort order and the filter criteria, the DB can perform an "Index Scan" or "Index Only Scan", avoiding an expensive sort step in memory/disk. The computation cost drops from linear $O(N)$ to logarithmic $O(\log N)$.

### 4. Is "adding indexes on every column" effective?
**No.** This is generally poor advice for several reasons:
- **Write Overhead:** Every index must be updated on `INSERT`, `UPDATE`, and `DELETE`. With 5M rows and high frequency, this significantly slows down the "Notify All" actions.
- **Storage Cost:** Indexes take up significant disk space, sometimes exceeding the size of the table data itself.
- **Query Planner Confusion:** Too many indexes can sometimes lead the query optimizer to choose a less efficient plan.
- **Inefficiency:** Single-column indexes often cannot satisfy queries with multiple filters as efficiently as a single composite index.

## Placement Notifications Query
Find all students who got a "Placement" notification in the last 7 days:
```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= (CURRENT_DATE - INTERVAL '7 days');
```
*(Assuming `notificationType` matches the enum value and `createdAt` is a timestamp).*

---

# Stage 4

## Problem: DB Overwhelmed by Frequent Fetching
Fetching all notifications on every page load for every student creates a massive read load on the database, especially during peak times like placement season.

## Proposed Solutions & Tradeoffs

### 1. In-Memory Caching (Redis)
Store the most recent notifications or the "unread count" in Redis.
- **Strategy:** When a student logs in, fetch the last 20 notifications from Redis. If a cache miss occurs, fetch from the DB and populate the cache.
- **Tradeoff:**
    - **Pros:** Extremely fast reads; significantly reduces DB load.
    - **Cons:** Added architectural complexity; requires cache invalidation logic (e.g., when a notification is marked as read or a new one is sent).

### 2. Push-Based Architecture (WebSockets / SSE)
Instead of the client asking "Do I have new notifications?" on every page load, the server pushes new notifications as they occur.
- **Strategy:** The client maintains a single persistent connection.
- **Tradeoff:**
    - **Pros:** Real-time experience; removes the need for frequent polling/fetching on navigation.
    - **Cons:** High server memory usage to maintain thousands of concurrent connections; requires a load balancer that supports persistent connections (sticky sessions or shared state).

### 3. Client-Side State Management & Pagination
Fetch only the "Unread Count" frequently and only fetch the full list when the user explicitly clicks the notification bell. Implement infinite scroll/pagination.
- **Strategy:** Use `ETag` or `If-Modified-Since` headers to avoid downloading the same data if it hasn't changed.
- **Tradeoff:**
    - **Pros:** Lowers data transfer; reduces DB query frequency.
    - **Cons:** Slightly less "instant" feel if the user has to wait for a fetch on click.

### 4. Read Replicas
Scale the database by using Read Replicas.
- **Strategy:** All `UPDATE/INSERT` (Mark as read, Send notification) go to the Primary DB, while all `SELECT` (Fetch notifications) go to the Read Replicas.
- **Tradeoff:**
    - **Pros:** Horizontal scaling of read capacity.
    - **Cons:** Replication lag (a student might mark a notification as read, but it still appears unread for a few milliseconds).

---

# Stage 5

## Analysis of Proposed Implementation
```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)   # calls Email API
        save_to_db(student_id, message)   # DB insert
        push_to_app(student_id, message)  # real time push
```

### 1. Shortcomings
- **Synchronous Bottleneck:** Processing 50,000 students in a loop will take a long time. If each student takes 100ms (API call + DB write), the total time is 5,000 seconds (~1.4 hours). The HTTP request will time out.
- **Partial Failure:** If the loop crashes at index 25,000, half the students are notified, and there's no record of who was missed.
- **API Rate Limits:** Most Email APIs will throttle or block you if you send 50,000 requests in a tight loop.
- **DB Pressure:** 50,000 individual `INSERT` statements in a loop will overwhelm the DB transaction log.

### 2. Failure Handling (200 failed midway)
If 200 calls failed, we need:
- **Retries:** Exponential backoff for failed API calls.
- **Idempotency:** Ensure that if we restart the process, students don't get the same notification twice.
- **Dead Letter Queues (DLQ):** Capture failed messages for manual inspection or later reprocessing.

### 3. Redesign for Reliability and Speed
**Solution:** Use a **Message Queue (e.g., RabbitMQ, Redis BullMQ, or Kafka)**.

- **Step 1:** The "Notify All" action creates a single record in a `broadcasts` table and pushes 50,000 small "jobs" (student_id + message) into a Message Queue.
- **Step 2:** Multiple **Worker Processes** consume jobs from the queue in parallel.
- **Step 3:** Workers perform `save_to_db` and `send_email` independently.

### 4. Should DB saves and Email sends happen together?
**No.** They should be decoupled:
1.  **DB Save is High Priority:** The in-app notification state must be recorded first.
2.  **Email is Best Effort:** Email delivery can be delayed or fail without breaking the app experience.
3.  **Independence:** If the Email API is down, we should still save to the DB and push to the app.

---

## Revised Pseudocode

```python
# API Controller
function notify_all_request(student_ids, message):
    # 1. Log the broadcast action
    broadcast_id = db.create_broadcast(message)
    
    # 2. Push jobs to queue in batches
    for chunk in chunks(student_ids, 500):
        message_queue.push_bulk(chunk, message, broadcast_id)
        
    return 202, "Broadcast started"

# Background Worker
function process_notification_job(student_id, message, broadcast_id):
    try:
        # 1. Save to DB (Persistent record)
        save_to_db(student_id, message)
        
        # 2. Push to App (SSE/Websocket)
        push_to_app(student_id, message)
        
        # 3. Queue Email separately (Lower priority)
        email_queue.push(student_id, message)
        
    except Exception as e:
        log_error(e)
        retry_job(student_id, message)
```

---

# Stage 6

## Priority Inbox Approach

To implement the Priority Inbox, we calculate a score for each notification and sort them to find the top 'n'.

**Score Logic:**
1.  **Weight:** `Placement` (3) > `Result` (2) > `Event` (1).
2.  **Recency:** Unix Timestamp (milliseconds).

We first sort by `Weight` in descending order. If the weights are equal, we sort by `Timestamp` in descending order. This ensures that a recent Placement notification will always appear above an older Placement notification, and any Placement notification will appear above any Result notification.

**Implementation Details:**
- Language: Node.js / JavaScript
- File: `priority_inbox.js`
- Logging: Integrated custom logging middleware (`logger.js`).

**Maintaining Top 10 Efficiently:**
As new notifications arrive, instead of re-sorting the entire list of notifications:
1.  **Min-Heap (Priority Queue):** Maintain a Min-Heap of size `n` (10).
2.  When a new notification arrives, calculate its score.
3.  If its score is greater than the root of the Min-Heap (the minimum score currently in the top 10), remove the root and insert the new notification.
4.  This reduces the insertion time of a new notification from $O(N \log N)$ (sorting) to $O(\log n)$ where $n=10$.
