const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const pinoHttp = require("pino-http");
const { connectDB, connectRedis } = require("./lib/connections");
const { startGrpcServer } = require("./lib/grpc-server");
const logger = require("./config/logger");
const { application } = require("./config")[process.env.NODE_ENV || "development"];
const featureFlagRoutes = require("./components/featureFlags/featureFlags.routes");
const adminRoutes = require("./components/admin/admin.routes");

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(pinoHttp({ logger }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "feature-flag" });
});

app.use("/api/v1", featureFlagRoutes);
app.use("/admin", adminRoutes);

const start = async () => {
  await Promise.all([connectDB(), connectRedis()]);
  
  // Start gRPC server
  await startGrpcServer();
  
  // Start REST server
  app.listen(application.restPort, () => {
    logger.info(`Feature Flag Service (REST) running on port ${application.restPort}`);
  });
};

start();
