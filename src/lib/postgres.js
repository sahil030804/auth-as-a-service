const { Pool } = require('pg');

// 1. Identity DB Pool (Login / Registration / User Profiles)
const identityPool = new Pool({
    connectionString: process.env.USER_DB_URL,
    max: 20,
    idleTimeoutMillis: 30000,
});

// 2. Token/Audit DB Pool (OAuth Tokens / Session History / Logs)
const tokenPool = new Pool({
    connectionString: process.env.TOKEN_DB_URL,
    max: 10, // Adjust based on expected traffic for tokens
    idleTimeoutMillis: 30000,
});

// Error handling for each pool
identityPool.on('error', (err) => console.error('❌ Identity DB Error:', err));
tokenPool.on('error', (err) => console.error('❌ Token DB Error:', err));

/**
 * Ensures both databases are reachable before the server starts
 */
const connectAllDatabases = async () => {
    try {
        await identityPool.query('SELECT 1');
        console.log('✅ Identity Postgres Connected');

        await tokenPool.query('SELECT 1');
        console.log('✅ Token Postgres Connected');
    } catch (error) {
        console.error('🛑 DB Startup Failed:', error.message);
        process.exit(1);
    }
};

module.exports = {
    identityPool,
    tokenPool,
    connectAllDatabases
};
