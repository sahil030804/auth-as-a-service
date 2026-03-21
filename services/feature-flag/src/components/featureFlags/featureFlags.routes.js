const express = require("express");
const { validate } = require("../../middleware/validation");
const featureFlagController = require("./featureFlags.controller");
const featureFlagValidation = require("./featureFlags.validation");
const router = express.Router();

// Get all feature flags
router.get("/flags", featureFlagController.getAllFlags);

// Get specific feature flag
router.get("/flags/:key", featureFlagController.getFlag);

// Get flags by category
router.get("/flags/category/:category", featureFlagController.getFlagsByCategory);

// Check if feature is enabled
router.get("/flags/:key/enabled", featureFlagController.isFeatureEnabled);

// Get feature configuration
router.get("/flags/:key/config", featureFlagController.getFeatureConfig);

// Create feature flag
router.post("/flags", validate(featureFlagValidation.createFlag), featureFlagController.createFlag);

// Update feature flag
router.put("/flags/:key", validate(featureFlagValidation.updateFlag), featureFlagController.updateFlag);

// Delete feature flag
router.delete("/flags/:key", featureFlagController.deleteFlag);

// Bulk update flags
router.put("/flags/bulk", validate(featureFlagValidation.bulkUpdate), featureFlagController.bulkUpdateFlags);

// Clear cache
router.post("/cache/clear", validate(featureFlagValidation.clearCache), featureFlagController.clearCache);

// Health check
router.get("/health", featureFlagController.healthCheck);

module.exports = router;
