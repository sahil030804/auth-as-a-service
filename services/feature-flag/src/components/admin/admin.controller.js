const adminService = require("./admin.service");
const featureFlagService = require("../featureFlags/featureFlags.service");
const logger = require("../../config/logger");

class AdminController {
  // Admin dashboard - get all flags with stats
  async getDashboard(req, res, next) {
    try {
      const flags = await featureFlagService.getAllFlags();
      const stats = await adminService.getDashboardStats();
      
      res.json({ success: true, data: { flags: flags.flags, stats } });
    } catch (error) {
      logger.error({ error }, "Failed to get admin dashboard data");
      next(error);
    }
  }

  // Get flag usage analytics
  async getFlagUsageAnalytics(req, res, next) {
    try {
      const { key } = req.params;
      const { days = 7 } = req.query;
      
      const analytics = await adminService.getFlagUsageAnalytics(key, parseInt(days));
      res.json({ success: true, data: analytics });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to get flag usage analytics");
      next(error);
    }
  }

  // Get flag change history
  async getFlagHistory(req, res, next) {
    try {
      const { key } = req.params;
      const { limit = 10 } = req.query;
      
      const history = await adminService.getFlagHistory(key, parseInt(limit));
      res.json({ success: true, data: history });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to get flag history");
      next(error);
    }
  }

  // Export flags for backup
  async exportFlags(req, res, next) {
    try {
      const { format = 'json' } = req.query;
      
      const exportData = await adminService.exportFlags();
      
      if (format === 'json') {
        res.setHeader('Content-Disposition', 'attachment; filename=feature-flags.json');
        res.json(exportData);
      } else {
        res.status(400).json({ success: false, error: 'Unsupported format' });
      }
    } catch (error) {
      logger.error({ error }, "Failed to export flags");
      next(error);
    }
  }

  // Import flags from backup
  async importFlags(req, res, next) {
    try {
      const { flags, overwrite = false } = req.body;
      
      const results = await adminService.importFlags(flags, overwrite);
      res.json({ success: true, data: results });
    } catch (error) {
      logger.error({ error }, "Failed to import flags");
      next(error);
    }
  }

  // Clone flag
  async cloneFlag(req, res, next) {
    try {
      const { key } = req.params;
      const { new_key, new_description } = req.body;
      
      const newFlag = await adminService.cloneFlag(key, new_key, new_description);
      res.status(201).json({ success: true, data: newFlag });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to clone flag");
      next(error);
    }
  }

  // Toggle flag (quick enable/disable)
  async toggleFlag(req, res, next) {
    try {
      const { key } = req.params;
      
      const updatedFlag = await adminService.toggleFlag(key);
      res.json({ success: true, data: updatedFlag });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to toggle flag");
      next(error);
    }
  }

  // Reset flag to defaults
  async resetFlag(req, res, next) {
    try {
      const { key } = req.params;
      
      const updatedFlag = await adminService.resetFlag(key);
      res.json({ success: true, data: updatedFlag });
    } catch (error) {
      logger.error({ error, key: req.params.key }, "Failed to reset flag");
      next(error);
    }
  }
}

module.exports = new AdminController();
