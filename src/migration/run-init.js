const { Client } = require('pg');
require('dotenv').config();

const runMigration = async () => {
    // 1. Connect to the default 'postgres' database first
    const rootClient = new Client({
        connectionString: process.env.ROOT_DB_URL
    });

    try {
        await rootClient.connect();

        // 2. Create the Databases (Pure SQL)
        console.log("🛠️ Creating databases...");
        await rootClient.query('CREATE DATABASE user_db');
        await rootClient.query('CREATE DATABASE token_db');
        await rootClient.end();

        // 3. Connect to user_db to create tables
        const userClient = new Client({
            connectionString: process.env.USER_DB_URL
        });
        await userClient.connect();
        console.log("👤 Creating tables in user_db...");
        await userClient.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await userClient.end();

        // 4. Connect to token_db to create tables
        const tokenClient = new Client({
            connectionString: process.env.TOKEN_DB_URL
        });
        await tokenClient.connect();
        console.log("🔑 Creating tables in token_db...");
        await tokenClient.query(`
      CREATE TABLE refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token_value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
    `);
        await tokenClient.end();

        console.log("✅ All migrations completed successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

runMigration();
