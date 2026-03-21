const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { featureFlagPath } = require("proto");

const packageDefinition = protoLoader.loadSync(featureFlagPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const featureFlagProto = grpc.loadPackageDefinition(packageDefinition).featureflag;

class FeatureFlagClient {
  constructor(serviceUrl = null) {
    this.serviceUrl = serviceUrl || process.env.FEATURE_FLAG_SERVICE_URL || "localhost:50052";
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

  async createFlag(key, enabled, config, description = "", category = "general", public = true, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.client.CreateFlag({ 
        key, 
        enabled, 
        config: typeof config === 'string' ? config : JSON.stringify(config), 
        description, 
        category, 
        public, 
        metadata 
      }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async updateFlag(key, enabled, config, description = null, metadata = null) {
    return new Promise((resolve, reject) => {
      const request = { key, enabled, config: typeof config === 'string' ? config : JSON.stringify(config) };
      if (description !== null) request.description = description;
      if (metadata !== null) request.metadata = metadata;
      
      this.client.UpdateFlag(request, (error, response) => {
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

  async deleteFlag(key) {
    return new Promise((resolve, reject) => {
      this.client.DeleteFlag({ key }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async clearCache(key = "") {
    return new Promise((resolve, reject) => {
      this.client.ClearCache({ key }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async getFlagsByCategory(category) {
    return new Promise((resolve, reject) => {
      this.client.GetFlagsByCategory({ category }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async bulkUpdateFlags(updates) {
    return new Promise((resolve, reject) => {
      this.client.BulkUpdateFlags({ updates }, (error, response) => {
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

  // Batch operations for multiple flags
  async getMultipleFlags(keys, userId = null, context = null) {
    const promises = keys.map(key => this.getFlag(key, userId, context));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      key: keys[index],
      success: result.status === 'fulfilled',
      flag: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
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

module.exports = FeatureFlagClient;
