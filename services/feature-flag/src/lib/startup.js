const { connectDB, connectRedis } = require("./connections");
const { startGrpcServer, stopGrpcServer, forceStopGrpcServer } = require("./grpc-server");
const { startRestServer, stopRestServer } = require("./rest-server");
const logger = require("../config/logger");
const { application } = require("../config");

let grpcServer = null;
let restServer = null;

const start = async () => {
  try {
    logger.info("🚀 Starting Feature Flag Service...");
    
    // Connect to database and Redis
    await Promise.all([
      connectDB(),
      connectRedis()
    ]);
    
    // Start gRPC server
    grpcServer = await startGrpcServer();
    
    // Start REST server
    restServer = await startRestServer();
    
    logger.info(`✅ Feature Flag Service started successfully`);
    logger.info(`🔧 Environment: ${application.nodeEnv}`);
    logger.info(`📊 Health check: http://localhost:${application.restPort}/health`);
    
  } catch (error) {
    logger.error({ error }, "Failed to start Feature Flag Service");
    await shutdown();
    process.exit(1);
  }
};

const shutdown = async () => {
  logger.info("🛑 Shutting down Feature Flag Service...");
  
  try {
    // Stop servers gracefully
    const shutdownPromises = [];
    
    if (restServer) {
      shutdownPromises.push(stopRestServer(restServer));
    }
    
    if (grpcServer) {
      shutdownPromises.push(stopGrpcServer());
    }
    
    await Promise.all(shutdownPromises);
    logger.info("✅ Service shutdown complete");
    
  } catch (error) {
    logger.error({ error }, "Error during shutdown");
    // Force shutdown if graceful fails
    if (grpcServer) {
      await forceStopGrpcServer();
    }
  }
};

const handleShutdown = async (signal) => {
  logger.info(`📡 Received ${signal}, shutting down gracefully`);
  await shutdown();
  process.exit(0);
};

// Handle process signals
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, "Uncaught Exception");
  shutdown();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Promise Rejection");
  shutdown();
  process.exit(1);
});

module.exports = {
  start,
  shutdown,
};
