const { Client } = require('pg');

const runMigration = async () => {
    const client = new Client({
        connectionString: process.env.TOKEN_DB_URL
    });

    try {
        await client.connect();
        console.log("🔑 Creating tables in token_db...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token_value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
    `);
        await client.end();
        console.log("✅ Token migrations completed successfully!");
    } catch (err) {
        console.error("❌ Token migration failed:", err.message);
        process.exit(1);
    }
};

runMigration();
