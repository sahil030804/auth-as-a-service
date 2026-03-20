const { Pool } = require("pg");
const logger = require("../config/logger");
const { database } =
  require("../config")[process.env.NODE_ENV || "development"];

const pool = new Pool({
  connectionString: database.userDbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => logger.error("❌ Identity DB Error:", err));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      await pool.query("SELECT 1");
      logger.info("✅ Identity Postgres Connected");
      return;
    } catch (error) {
      retries--;
      logger.error(
        `🛑 Identity DB Startup Failed (Retries left: ${retries}):`,
        error.message,
      );
      if (retries === 0) process.exit(1);
      await sleep(5000);
    }
  }
};

module.exports = {
  pool,
  connectDB,
};
