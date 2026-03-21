const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const logger = require("../config/logger");
const FeatureFlagService = require("../components/featureFlags/featureFlags.service");
const { application } =
  require("../config")[process.env.NODE_ENV || "development"];

// Load proto file from proto package
const { featureFlagPath } = require("proto");
const packageDefinition = protoLoader.loadSync(featureFlagPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const featureFlagProto =
  grpc.loadPackageDefinition(packageDefinition).featureflag;

let server = null;

const createGrpcServer = () => {
  if (server) {
    return server;
  }

  server = new grpc.Server();

  // Add service implementation
  server.addService(featureFlagProto.FeatureFlagService.service, {
    getFlag: FeatureFlagService.getFlag.bind(FeatureFlagService),
    updateFlag: FeatureFlagService.updateFlag.bind(FeatureFlagService),
    getAllFlags: FeatureFlagService.getAllFlags.bind(FeatureFlagService),
    deleteFlag: FeatureFlagService.deleteFlag.bind(FeatureFlagService),
    clearCache: FeatureFlagService.clearCache.bind(FeatureFlagService),
    createFlag: FeatureFlagService.createFlag.bind(FeatureFlagService),
    getFlagsByCategory:
      FeatureFlagService.getFlagsByCategory.bind(FeatureFlagService),
    bulkUpdateFlags:
      FeatureFlagService.bulkUpdateFlags.bind(FeatureFlagService),
  });

  return server;
};

const startGrpcServer = async () => {
  const grpcServer = createGrpcServer();

  return new Promise((resolve, reject) => {
    grpcServer.bindAsync(
      `0.0.0.0:${application.grpcPort}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          logger.error({ error }, "Failed to start gRPC server");
          reject(error);
          return;
        }

        logger.info(`🚀 Feature Flag Service (gRPC) running on port ${port}`);
        logger.info(`🔗 gRPC Service ready for external connections`);
        resolve(grpcServer);
      },
    );
  });
};

const stopGrpcServer = async () => {
  if (server) {
    return new Promise((resolve) => {
      server.tryShutdown(() => {
        logger.info("🛑 gRPC server stopped");
        server = null;
        resolve();
      });
    });
  }
};

const forceStopGrpcServer = async () => {
  if (server) {
    server.forceShutdown();
    logger.info("🛑 gRPC server force stopped");
    server = null;
  }
};

module.exports = {
  createGrpcServer,
  startGrpcServer,
  stopGrpcServer,
  forceStopGrpcServer,
};
