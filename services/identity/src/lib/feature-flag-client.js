const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.resolve(__dirname, "../../../../proto/feature-flag.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const featureFlagProto = grpc.loadPackageDefinition(packageDefinition).featureflag;

class FeatureFlagClient {
  constructor() {
    this.serviceUrl = process.env.FEATURE_FLAG_SERVICE_URL || "localhost:50052";
    this.client = new featureFlagProto.FeatureFlagService(
      this.serviceUrl,
      grpc.credentials.createInsecure(),
    );
  }

  // Promise-based wrapper methods
  async getFlag(key, userId = null, context = null) {
    return new Promise((resolve, reject) => {
      this.client.GetFlag({ key, user_id: userId, context }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async getAllFlags() {
    return new Promise((resolve, reject) => {
      this.client.GetAllFlags({}, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async updateFlag(key, enabled, config, description = null) {
    return new Promise((resolve, reject) => {
      const request = { key, enabled, config: typeof config === 'string' ? config : JSON.stringify(config) };
      if (description !== null) request.description = description;
      
      this.client.UpdateFlag(request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Convenience methods for common operations
  async isFeatureEnabled(key, userId = null, context = null) {
    try {
      const flag = await this.getFlag(key, userId, context);
      return flag.enabled;
    } catch (error) {
      console.warn(`Failed to check feature flag '${key}':`, error.message);
      return false;
    }
  }

  async getFeatureConfig(key, userId = null, context = null) {
    try {
      const flag = await this.getFlag(key, userId, context);
      return flag.enabled ? JSON.parse(flag.config) : null;
    } catch (error) {
      console.warn(`Failed to get feature config for '${key}':`, error.message);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.getAllFlags();
      return { healthy: true, service: this.serviceUrl };
    } catch (error) {
      return { healthy: false, service: this.serviceUrl, error: error.message };
    }
  }
}

module.exports = new FeatureFlagClient();
