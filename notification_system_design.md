## Campus Notification Platform: System Design Summary

### Stage 1: API & Real-time Delivery
*   **Core Actions:** Fetch (paginated), Mark Read/All Read, Delete, and Unread Count.
*   **Protocol:** **Server-Sent Events (SSE)** for real-time updates.
*   **Pros:** Uni-directional, lightweight (HTTP), and native browser reconnection.

### Stage 2: Storage & Schema
*   **DB:** **PostgreSQL** for ACID compliance and indexing.
*   **Schema:** 
    *   `students`: `id (UUID)`, `name`, `email`, `roll_no`.
    *   `notifications`: `id`, `student_id (FK)`, `type (Enum)`, `message`, `is_read (Bool)`, `created_at`.
*   **Scalability:** Use **Partitioning** (by date/ID) and **Archiving** for historical data.

### Stage 3: Query Optimization
*   **Slow Query:** `SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC;`
*   **Problem:** Sequential scans/expensive sorting on 5M+ rows.
*   **Fix:** **Composite Index** on `(studentID, isRead, createdAt DESC)`.
*   **Cost:** Reduces search from $O(N)$ to $O(\log N)$ by eliminating manual sorting.
*   **Anti-pattern:** Avoid indexing every column; it increases write overhead and storage bloat.

### Stage 4: Read Scalability
*   **Redis Caching:** Store unread counts and recent notifications to bypass DB.
*   **Read Replicas:** Direct `SELECT` queries to replicas; keep `INSERT/UPDATE` on Primary.
*   **Client Logic:** Fetch full list only on interaction; use `ETags` to prevent redundant transfers.

### Stage 5: High-Volume Notifications
*   **The Issue:** Synchronous loops for 50k+ students cause timeouts and partial failures.
*   **Redesign:** Use a **Message Queue** (RabbitMQ/Kafka) with **Worker Processes**.
*   **Decoupling:** 
    1.  **Immediate:** Save to DB and push via SSE (critical state).
    2.  **Asynchronous:** Queue Email sends separately (low priority/rate-limited).
*   **Reliability:** Implement **Idempotency** and **Dead Letter Queues** for failures.

### Stage 6: Priority Inbox
*   **Scoring:** `Weight (Placement > Result > Event)` + `Recency (Timestamp)`.
*   **Efficiency:** Instead of sorting the entire DB, use a **Min-Heap (size 10)**.
*   **Complexity:** New notifications are inserted in $O(\log 10)$ time, keeping Top 10 ready.

---

**Key SQL: Recent Placement Notifications**
```sql
SELECT DISTINCT studentID FROM notifications 
WHERE notificationType = 'Placement' 
AND createdAt >= (CURRENT_DATE - INTERVAL '7 days');
```
