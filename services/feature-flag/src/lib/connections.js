const { Pool } = require("pg");
const redis = require("redis");
const logger = require("../config/logger");
const { database, cache } =
  require("../config")[process.env.NODE_ENV || "development"];

let pool;
let redisClient;

const connectDB = async () => {
  try {
    pool = new Pool({
      connectionString: database.featureFlagDbUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    logger.info("🗄️  Connected to Feature Flag database");
  } catch (error) {
    logger.error({ error }, "Failed to connect to Feature Flag database");
    throw error;
  }
};

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: cache.redisUrl,
      retry_delay_on_failover: 100,
      enable_offline_queue: false,
    });

    redisClient.on("error", (err) => {
      logger.error({ error: err }, "Redis Client Error");
    });

    redisClient.on("connect", () => {
      logger.info("🔗 Connected to Redis");
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn(
      { error },
      "Failed to connect to Redis, continuing without cache",
    );
    redisClient = null;
  }
};

const runInTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(
      { query: text, duration, rows: result.rowCount },
      "Executed query",
    );
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(
      { query: text, duration, error: error.message },
      "Query failed",
    );
    throw error;
  }
};

// Cache helpers
const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.warn({ error, key }, "Cache get failed");
    return null;
  }
};

const cacheSet = async (key, value, ttl = cache.cacheTimeout) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.warn({ error, key }, "Cache set failed");
  }
};

const cacheDelete = async (key) => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.warn({ error, key }, "Cache delete failed");
  }
};

const cacheClear = async (pattern = "*") => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.warn({ error, pattern }, "Cache clear failed");
  }
};

module.exports = {
  connectDB,
  connectRedis,
  runInTransaction,
  query,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheClear,
};
