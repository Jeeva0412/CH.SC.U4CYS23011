const axios = require('axios');
const logger = require('./logger');

const CONFIG = {
    authUrl: 'http://20.207.122.201/evaluation-service/auth',
    notificationsUrl: 'http://20.207.122.201/evaluation-service/notifications',
    credentials: {
        email: "ch.sc.u4cys23011@ch.students.amrita.edu",
        name: "j jeeva",
        rollNo: "ch.sc.u4cys23011",
        accessCode: "PTBMmQ",
        clientID: "3cdbf6c7-5b5d-43dd-827a-5f10c4b648ca",
        clientSecret: "AFXJdWBcpjYjyWXk"
    },
    weights: {
        'Placement': 3,
        'Result': 2,
        'Event': 1
    }
};

async function getAccessToken() {
    try {
        const response = await axios.post(CONFIG.authUrl, CONFIG.credentials);
        const token = response.data.access_token;
        logger.setToken(token);
        await logger.info('auth', 'Access token retrieved successfully');
        return token;
    } catch (error) {
        await logger.error('auth', `Authentication failed: ${error.message}`);
        throw error;
    }
}

async function fetchNotifications(token) {
    await logger.info('notifications', 'Fetching notifications from API');
    try {
        const response = await axios.get(CONFIG.notificationsUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await logger.info('notifications', `Successfully fetched ${response.data.notifications.length} notifications`);
        return response.data.notifications;
    } catch (error) {
        await logger.error('notifications', `Failed to fetch notifications: ${error.message}`);
        throw error;
    }
}

function getPriorityScore(notification) {
    const weight = CONFIG.weights[notification.Type] || 0;
    const timestamp = new Date(notification.Timestamp).getTime();
    return { weight, timestamp };
}

function findTopNNotifications(notifications, n = 10) {
    return notifications
        .map(notif => ({
            ...notif,
            score: getPriorityScore(notif)
        }))
        .sort((a, b) => {
            // Sort by weight descending
            if (b.score.weight !== a.score.weight) {
                return b.score.weight - a.score.weight;
            }
            // If weights are equal, sort by timestamp descending (recency)
            return b.score.timestamp - a.score.timestamp;
        })
        .slice(0, n);
}

async function main() {
    try {
        const token = await getAccessToken();
        await logger.info('main', 'Starting Priority Inbox evaluation');
        const notifications = await fetchNotifications(token);
        
        const top10 = findTopNNotifications(notifications, 10);
        
        console.log('\n--- TOP 10 PRIORITY NOTIFICATIONS ---');
        console.table(top10.map(n => ({
            ID: n.ID,
            Type: n.Type,
            Message: n.Message,
            Timestamp: n.Timestamp
        })));
        
        await logger.info('main', 'Priority Inbox processing completed successfully');
    } catch (error) {
        console.error('Execution failed:', error.message);
    }
}

main();
