const express = require("express");
const { validate } = require("../../middleware/validation");
const adminController = require("./admin.controller");
const adminValidation = require("./admin.validation");
const router = express.Router();

// Admin dashboard - get all flags with stats
router.get("/dashboard", adminController.getDashboard);

// Get flag usage analytics
router.get("/analytics/usage/:key", adminController.getFlagUsageAnalytics);

// Get flag change history
router.get("/history/:key", adminController.getFlagHistory);

// Export flags for backup
router.get("/export", adminController.exportFlags);

// Import flags from backup
router.post("/import", validate(adminValidation.importFlags), adminController.importFlags);

// Clone flag
router.post("/flags/:key/clone", validate(adminValidation.cloneFlag), adminController.cloneFlag);

// Toggle flag (quick enable/disable)
router.post("/flags/:key/toggle", validate(adminValidation.toggleFlag), adminController.toggleFlag);

// Reset flag to defaults
router.post("/flags/:key/reset", validate(adminValidation.resetFlag), adminController.resetFlag);

module.exports = router;
