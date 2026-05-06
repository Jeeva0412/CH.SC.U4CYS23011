const axios = require('axios');

let authToken = null;

function setToken(token) {
    authToken = token;
}

async function logToService(level, packageName, message) {
    const url = 'http://20.207.122.201/evaluation-service/logs';
    const payload = {
        stack: 'backend',
        level: level,
        package: packageName,
        message: message
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
    }
}

const logger = {
    setToken,
    info: (pkg, msg) => logToService('info', pkg, msg),
    error: (pkg, msg) => logToService('error', pkg, msg),
    warn: (pkg, msg) => logToService('warn', pkg, msg)
};

module.exports = logger;
