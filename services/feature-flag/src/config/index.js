require("dotenv-safe").config({ path: "./.env", sample: "./.env.example" });

module.exports = {
  development: {
    application: {
      grpcPort: process.env.GRPC_PORT || 50052,
      restPort: process.env.REST_PORT || 50053,
      nodeEnv: process.env.NODE_ENV || "development",
      logLevel: process.env.LOG_LEVEL || "info",
    },
    database: {
      rootDbUrl: process.env.ROOT_DB_URL,
      featureFlagDbUrl: process.env.FEATURE_FLAG_DB_URL,
    },
    cache: {
      redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
      cacheTimeout: process.env.CACHE_TIMEOUT || 300, // 5 minutes
    },
    security: {
      defaultApiKey: process.env.DEFAULT_API_KEY || "dev-feature-flag-api-key-12345",
      corsOrigin: process.env.CORS_ORIGIN || "*",
    },
    features: {
      analyticsEnabled: process.env.ANALYTICS_ENABLED === "true",
      usageTracking: process.env.USAGE_TRACKING !== "false",
    },
  },
  staging: {
    application: {
      grpcPort: process.env.GRPC_PORT || 50052,
      restPort: process.env.REST_PORT || 50053,
      nodeEnv: process.env.NODE_ENV || "staging",
      logLevel: process.env.LOG_LEVEL || "info",
    },
    database: {
      rootDbUrl: process.env.ROOT_DB_URL,
      featureFlagDbUrl: process.env.FEATURE_FLAG_DB_URL,
    },
    cache: {
      redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
      cacheTimeout: process.env.CACHE_TIMEOUT || 300,
    },
    security: {
      defaultApiKey: process.env.DEFAULT_API_KEY,
      corsOrigin: process.env.CORS_ORIGIN || "*",
    },
    features: {
      analyticsEnabled: process.env.ANALYTICS_ENABLED === "true",
      usageTracking: process.env.USAGE_TRACKING !== "false",
    },
  },
  production: {
    application: {
      grpcPort: process.env.GRPC_PORT || 50052,
      restPort: process.env.REST_PORT || 50053,
      nodeEnv: process.env.NODE_ENV || "production",
      logLevel: process.env.LOG_LEVEL || "warn",
    },
    database: {
      rootDbUrl: process.env.ROOT_DB_URL,
      featureFlagDbUrl: process.env.FEATURE_FLAG_DB_URL,
    },
    cache: {
      redisUrl: process.env.REDIS_URL,
      cacheTimeout: process.env.CACHE_TIMEOUT || 600, // 10 minutes for production
    },
    security: {
      defaultApiKey: process.env.DEFAULT_API_KEY,
      corsOrigin: process.env.CORS_ORIGIN,
    },
    features: {
      analyticsEnabled: process.env.ANALYTICS_ENABLED === "true",
      usageTracking: process.env.USAGE_TRACKING !== "false",
    },
  },
};
