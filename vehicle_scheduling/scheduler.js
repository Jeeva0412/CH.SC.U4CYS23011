const axios = require('axios');
const logger = require('../logger');

const CONFIG = {
    authUrl: 'http://20.207.122.201/evaluation-service/auth',
    depotsUrl: 'http://20.207.122.201/evaluation-service/depots',
    vehiclesUrl: 'http://20.207.122.201/evaluation-service/vehicles',
    credentials: {
        email: "ch.sc.u4cys23011@ch.students.amrita.edu",
        name: "j jeeva",
        rollNo: "ch.sc.u4cys23011",
        accessCode: "PTBMmQ",
        clientID: "3cdbf6c7-5b5d-43dd-827a-5f10c4b648ca",
        clientSecret: "AFXJdWBcpjYjyWXk"
    }
};

async function getAccessToken() {
    try {
        const response = await axios.post(CONFIG.authUrl, CONFIG.credentials);
        const token = response.data.access_token;
        logger.setToken(token);
        await logger.info('auth', 'Access token retrieved successfully for Vehicle Scheduler');
        return token;
    } catch (error) {
        console.error('Authentication failed:', error.message);
        throw error;
    }
}

async function fetchDepots(token) {
    await logger.info('vehicle_scheduler', 'Fetching depots data');
    try {
        const response = await axios.get(CONFIG.depotsUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.depots;
    } catch (error) {
        await logger.error('vehicle_scheduler', `Failed to fetch depots: ${error.message}`);
        throw error;
    }
}

async function fetchVehicles(token) {
    await logger.info('vehicle_scheduler', 'Fetching vehicles data');
    try {
        const response = await axios.get(CONFIG.vehiclesUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.vehicles;
    } catch (error) {
        await logger.error('vehicle_scheduler', `Failed to fetch vehicles: ${error.message}`);
        throw error;
    }
}

function solveKnapsack(vehicles, capacity) {
    const n = vehicles.length;
    const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));
    
    for (let i = 1; i <= n; i++) {
        const { Duration, Impact } = vehicles[i - 1];
        for (let w = 0; w <= capacity; w++) {
            if (Duration <= w) {
                dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - Duration] + Impact);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    
    let res = dp[n][capacity];
    let w = capacity;
    const selected = [];
    
    for (let i = n; i > 0 && res > 0; i--) {
        if (res !== dp[i - 1][w]) {
            const vehicle = vehicles[i - 1];
            selected.push(vehicle);
            res -= vehicle.Impact;
            w -= vehicle.Duration;
        }
    }
    
    return { maxImpact: dp[n][capacity], selected };
}

async function main() {
    try {
        await logger.info('vehicle_scheduler', 'Starting Vehicle Maintenance Scheduler');
        
        const token = await getAccessToken();
        
        const depots = await fetchDepots(token);
        const vehicles = await fetchVehicles(token);
        
        console.log(`Total Vehicles to evaluate: ${vehicles.length}`);
        
        // Evaluate for each depot
        for (const depot of depots) {
            console.log(`\n======================================================`);
            console.log(`--- OPTIMAL SCHEDULE FOR DEPOT ${depot.ID} (Budget: ${depot.MechanicHours}) ---`);
            const result = solveKnapsack(vehicles, depot.MechanicHours);
            
            console.log(`Maximum Impact Score: ${result.maxImpact}`);
            console.log(`Total Vehicles Selected: ${result.selected.length}`);
            
            const totalDurationUsed = result.selected.reduce((sum, v) => sum + v.Duration, 0);
            console.log(`Mechanic-Hours Used: ${totalDurationUsed} / ${depot.MechanicHours}`);
            
            console.log('\nSelected Vehicles:');
            console.table(result.selected.map(v => ({
                TaskID: v.TaskID,
                Duration: v.Duration,
                Impact: v.Impact
            })));
        }
        
        await logger.info('vehicle_scheduler', 'Vehicle Maintenance Scheduler completed successfully');
    } catch (error) {
        console.error('Execution failed:', error.message);
    }
}

main();
