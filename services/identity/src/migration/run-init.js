const { Client } = require("pg");
require("dotenv").config();

const runMigration = async () => {
  const rootClient = new Client({
    connectionString: process.env.ROOT_DB_URL,
  });

  await rootClient.connect();
  await rootClient.query(`CREATE DATABASE identity_db`);
  await rootClient.end();

  const client = new Client({
    connectionString: process.env.USER_DB_URL,
  });

  try {
    await client.connect();
    console.log("👤 Creating tables in identity_db...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.end();
    console.log("✅ Identity migrations completed successfully!");
  } catch (err) {
    console.error("❌ Identity migration failed:", err.message);
    process.exit(1);
  }
};

runMigration();
