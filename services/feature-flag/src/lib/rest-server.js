const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const logger = require("../config/logger");
const { application, security } = require("../config");

// Import routes from components
const featureFlagRoutes = require("../components/featureFlags/featureFlags.routes");
const adminRoutes = require("../components/admin/admin.routes");

let restApp = null;

const createRestApp = () => {
  if (restApp) {
    return restApp;
  }

  restApp = express();
  
  // Security middleware
  restApp.use(helmet());
  restApp.use(cors({
    origin: security.corsOrigin,
    credentials: true
  }));
  restApp.use(pinoHttp({ logger }));
  restApp.use(express.json());

  // Routes
  restApp.use("/api/v1", featureFlagRoutes);
  restApp.use("/admin", adminRoutes);
  
  // Health check endpoint
  restApp.get("/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      service: "feature-flag-service",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: application.nodeEnv
    });
  });

  return restApp;
};

const startRestServer = async () => {
  const app = createRestApp();
  
  return new Promise((resolve, reject) => {
    const server = app.listen(application.restPort, (error) => {
      if (error) {
        logger.error({ error }, "Failed to start REST server");
        reject(error);
        return;
      }
      
      logger.info(`🌐 Feature Flag Admin API running on port ${application.restPort}`);
      logger.info(`📊 Health check available at http://localhost:${application.restPort}/health`);
      resolve(server);
    });

    // Handle graceful shutdown
    server.on('close', () => {
      logger.info("🛑 REST server stopped");
    });
  });
};

const stopRestServer = async (server) => {
  if (server) {
    return new Promise((resolve) => {
      server.close(() => {
        logger.info("🛑 REST server stopped");
        resolve();
      });
    });
  }
};

module.exports = {
  createRestApp,
  startRestServer,
  stopRestServer,
};
