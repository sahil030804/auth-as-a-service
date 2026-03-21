const featureFlagService = require("./featureFlags.service");
const logger = require("../../config/logger");

class FeatureFlagController {
  // Get all feature flags
  async getAllFlags(req, res, next) {
    try {
      const flags = await featureFlagService.getAllFlags();
      res.json({ success: true, data: flags });
    } catch (error) {
      logger.error({ error }, "Failed to get all flags via REST API");
      next(error);
    }
  }

  // Get specific feature flag
  async getFlag(req, res, next) {
    try {
      const { key } = req.params;
      const { user_id, context } = req.query;
      
      const flag = await featureFlagService.getFlag(key, user_id, context);
      res.json({ success: true, data: flag });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to get flag via REST API");
      next(error);
    }
  }

  // Get flags by category
  async getFlagsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const flags = await featureFlagService.getFlagsByCategory(category);
      res.json({ success: true, data: flags });
    } catch (error) {
      logger.error({ error, category: req.params.category }, "Failed to get flags by category via REST API");
      next(error);
    }
  }

  // Check if feature is enabled
  async isFeatureEnabled(req, res, next) {
    try {
      const { key } = req.params;
      const { user_id, context } = req.query;
      
      const flag = await featureFlagService.getFlag(key, user_id, context);
      res.json({ success: true, data: { key, enabled: flag.enabled } });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to check flag enabled status via REST API");
      next(error);
    }
  }

  // Get feature configuration
  async getFeatureConfig(req, res, next) {
    try {
      const { key } = req.params;
      const { user_id, context } = req.query;
      
      const flag = await featureFlagService.getFlag(key, user_id, context);
      const config = flag.enabled ? JSON.parse(flag.config) : null;
      res.json({ success: true, data: { key, config } });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to get flag config via REST API");
      next(error);
    }
  }

  // Create feature flag
  async createFlag(req, res, next) {
    try {
      const { key, enabled, config, description, category, isPublic, metadata } = req.body;
      
      const flag = await featureFlagService.createFlag(
        key, 
        enabled, 
        config || {}, 
        description, 
        category || 'general', 
        isPublic !== false, 
        metadata || {}
      );
      
      res.status(201).json({ success: true, data: flag });
    } catch (error) {
      logger.error({ error, key: req.body.key }, "Failed to create flag via REST API");
      next(error);
    }
  }

  // Update feature flag
  async updateFlag(req, res, next) {
    try {
      const { key } = req.params;
      const { enabled, config, description, metadata } = req.body;
      
      const flag = await featureFlagService.updateFlag(
        key, 
        enabled, 
        config, 
        description, 
        metadata
      );
      
      res.json({ success: true, data: flag });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to update flag via REST API");
      next(error);
    }
  }

  // Delete feature flag
  async deleteFlag(req, res, next) {
    try {
      const { key } = req.params;
      
      const result = await featureFlagService.deleteFlag(key);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to delete flag via REST API");
      next(error);
    }
  }

  // Bulk update flags
  async bulkUpdateFlags(req, res, next) {
    try {
      const { updates } = req.body;
      
      const result = await featureFlagService.bulkUpdateFlags(updates);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error({ error }, "Failed to bulk update flags via REST API");
      next(error);
    }
  }

  // Clear cache
  async clearCache(req, res, next) {
    try {
      const { key } = req.body;
      
      const result = await featureFlagService.clearCache(key || "");
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error({ error }, "Failed to clear cache via REST API");
      next(error);
    }
  }

  // Health check
  async healthCheck(req, res) {
    try {
      res.json({ 
        healthy: true, 
        service: process.env.FEATURE_FLAG_SERVICE_URL || "localhost:50052",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({ 
        healthy: false, 
        service: process.env.FEATURE_FLAG_SERVICE_URL || "localhost:50052",
        error: error.message 
      });
    }
  }
}

module.exports = new FeatureFlagController();
