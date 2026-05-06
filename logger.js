const axios = require('axios');

let authToken = null;

function setToken(token) {
    authToken = token;
}

async function logToService(level, packageName, message) {
    const url = 'http://20.207.122.201/evaluation-service/logs';
    const fullMessage = `[${packageName}] ${message}`;
    const payload = {
        stack: 'backend',
        level: level,
        package: 'controller',
        message: fullMessage.length > 48 ? fullMessage.substring(0, 45) + '...' : fullMessage
    };

    const config = {};
    if (authToken) {
        config.headers = { 'Authorization': `Bearer ${authToken}` };
    }

    try {
        await axios.post(url, payload, config);
        // console.log(`[${level.toUpperCase()}] Log sent: ${message}`);
    } catch (error) {
        // Fallback to console if service is down
        console.error(`Logging service failed: ${error.message}`);
        if (error.response && error.response.data) {
            console.error('Error details:', JSON.stringify(error.response.data));
        }
    }
}

const logger = {
    setToken,
    info: (pkg, msg) => logToService('info', pkg, msg),
    error: (pkg, msg) => logToService('error', pkg, msg),
    warn: (pkg, msg) => logToService('warn', pkg, msg)
};

module.exports = logger;
