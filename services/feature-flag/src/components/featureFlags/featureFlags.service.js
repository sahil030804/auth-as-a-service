const { runInTransaction, query, cacheGet, cacheSet, cacheDelete, cacheClear } = require("../../lib/connections");
const logger = require("../../config/logger");
const crypto = require("crypto");

class FeatureFlagService {
  constructor() {
    this.cacheTimeout = 5 * 60; // 5 minutes default
  }

  async getFlag(key, userId = null, context = null) {
    try {
      const cacheKey = this.getCacheKey(key, userId, context);
      
      // Check cache first
      const cached = await cacheGet(cacheKey);
      if (cached) {
        await this.logFlagUsage(key, userId, context);
        return cached;
      }

      const result = await runInTransaction(async (client) => {
        const res = await client.query(
          "SELECT * FROM feature_flags WHERE key = $1 AND (public = true OR $2 = ANY(ARRAY['admin', 'system']))",
          [key, 'admin'] // Simplified auth check
        );
        
        if (res.rows.length === 0) {
          return {
            key,
            enabled: false,
            config: "{}",
            description: "",
            category: "general",
            public: false,
            metadata: {},
            created_at: "",
            updated_at: ""
          };
        }
        
        const row = res.rows[0];
        return {
          key: row.key,
          enabled: row.enabled,
          config: JSON.stringify(row.config),
          description: row.description,
          category: row.category,
          public: row.public,
          metadata: row.metadata || {},
          created_at: row.created_at.toISOString(),
          updated_at: row.updated_at.toISOString()
        };
      });

      // Cache the result
      await cacheSet(cacheKey, result, this.cacheTimeout);

      // Log usage for analytics
      await this.logFlagUsage(key, userId, context);

      logger.info({ key, enabled: result.enabled, user_id: userId, context }, "Feature flag retrieved");
      return result;
    } catch (error) {
      logger.error({ error, key }, "Failed to get feature flag");
      throw error;
    }
  }

  async createFlag(key, enabled, config, description = "", category = "general", isPublic = true, metadata = {}) {
    try {
      const result = await runInTransaction(async (client) => {
        // Check if flag already exists
        const existing = await client.query("SELECT id FROM feature_flags WHERE key = $1", [key]);
        if (existing.rows.length > 0) {
          throw new Error(`Feature flag '${key}' already exists`);
        }

        const res = await client.query(`
          INSERT INTO feature_flags (key, enabled, config, description, category, public, metadata, created_by)
          VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7::jsonb, $8)
          RETURNING *
        `, [key, enabled, config, description, category || 'general', isPublic, metadata, 'system']);
        
        const row = res.rows[0];
        return {
          key: row.key,
          enabled: row.enabled,
          config: JSON.stringify(row.config),
          description: row.description,
          category: row.category,
          public: row.public,
          metadata: row.metadata || {},
          created_at: row.created_at.toISOString(),
          updated_at: row.updated_at.toISOString()
        };
      });

      // Clear cache
      await cacheDelete(`flag:${key}`);

      logger.info({ key, enabled, category }, "Feature flag created");
      return result;
    } catch (error) {
      logger.error({ error, key }, "Failed to create feature flag");
      throw error;
    }
  }

  async updateFlag(key, enabled, config, description = null, metadata = null) {
    try {
      // Get old values for history
      const oldFlag = await runInTransaction(async (client) => {
        const res = await client.query("SELECT * FROM feature_flags WHERE key = $1", [key]);
        return res.rows[0] || null;
      });

      const result = await runInTransaction(async (client) => {
        const res = await client.query(`
          UPDATE feature_flags 
          SET enabled = COALESCE($1, enabled),
              config = COALESCE($2::jsonb, config),
              description = COALESCE($3, description),
              metadata = COALESCE($4::jsonb, metadata),
              updated_at = CURRENT_TIMESTAMP,
              version = version + 1
          WHERE key = $5
          RETURNING *
        `, [enabled, config, description, metadata, key]);
        
        if (res.rows.length === 0) {
          throw new Error(`Feature flag '${key}' not found`);
        }
        
        const row = res.rows[0];
        return {
          key: row.key,
          enabled: row.enabled,
          config: JSON.stringify(row.config),
          description: row.description,
          category: row.category,
          public: row.public,
          metadata: row.metadata || {},
          created_at: row.created_at.toISOString(),
          updated_at: row.updated_at.toISOString()
        };
      });

      // Log change history
      if (oldFlag) {
        await this.logFlagHistory(key, oldFlag.enabled, result.enabled, 
          oldFlag.config, JSON.parse(result.config), 'system');
      }

      // Clear cache
      await cacheDelete(`flag:${key}`);

      logger.info({ key, enabled, config }, "Feature flag updated");
      return result;
    } catch (error) {
      logger.error({ error, key }, "Failed to update feature flag");
      throw error;
    }
  }

  async getAllFlags() {
    try {
      const result = await runInTransaction(async (client) => {
        const res = await client.query(
          "SELECT * FROM feature_flags ORDER BY category, key"
        );
        
        return res.rows.map(row => ({
          key: row.key,
          enabled: row.enabled,
          config: JSON.stringify(row.config),
          description: row.description,
          category: row.category,
          public: row.public,
          metadata: row.metadata || {},
          created_at: row.created_at.toISOString(),
          updated_at: row.updated_at.toISOString()
        }));
      });

      logger.info({ count: result.length }, "All feature flags retrieved");
      return { flags: result };
    } catch (error) {
      logger.error({ error }, "Failed to get all feature flags");
      throw error;
    }
  }

  async deleteFlag(key) {
    try {
      const result = await runInTransaction(async (client) => {
        const res = await client.query(
          "DELETE FROM feature_flags WHERE key = $1 RETURNING key",
          [key]
        );
        
        return res.rowCount > 0;
      });

      // Clear from cache
      await cacheDelete(`flag:${key}`);

      logger.info({ key, deleted: result }, "Feature flag deleted");
      return { success: result, message: result ? "Flag deleted successfully" : "Flag not found" };
    } catch (error) {
      logger.error({ error, key }, "Failed to delete feature flag");
      throw error;
    }
  }

  async clearCache(key = "") {
    try {
      if (key) {
        await cacheDelete(`flag:${key}`);
        logger.info({ key }, "Feature flag cache cleared for key");
      } else {
        await cacheClear("flag:*");
        logger.info("All feature flag cache cleared");
      }

      return { success: true, message: "Cache cleared successfully" };
    } catch (error) {
      logger.error({ error }, "Failed to clear cache");
      throw error;
    }
  }

  async getFlagsByCategory(category) {
    try {
      const result = await runInTransaction(async (client) => {
        const res = await client.query(
          "SELECT * FROM feature_flags WHERE category = $1 ORDER BY key",
          [category]
        );
        
        return res.rows.map(row => ({
          key: row.key,
          enabled: row.enabled,
          config: JSON.stringify(row.config),
          description: row.description,
          category: row.category,
          public: row.public,
          metadata: row.metadata || {},
          created_at: row.created_at.toISOString(),
          updated_at: row.updated_at.toISOString()
        }));
      });

      logger.info({ category, count: result.length }, "Feature flags retrieved by category");
      return { flags: result };
    } catch (error) {
      logger.error({ error, category }, "Failed to get flags by category");
      throw error;
    }
  }

  async bulkUpdateFlags(updates) {
    try {
      const updatedFlags = [];
      const failedKeys = [];

      for (const update of updates) {
        try {
          const result = await this.updateFlagInternal(update.key, update.enabled, update.config);
          updatedFlags.push(result);
        } catch (error) {
          failedKeys.push(update.key);
          logger.warn({ error, key: update.key }, "Failed to update flag in bulk operation");
        }
      }

      // Clear cache for all updated flags
      for (const update of updates) {
        await cacheDelete(`flag:${update.key}`);
      }

      logger.info({ 
        total: updates.length, 
        updated: updatedFlags.length, 
        failed: failedKeys.length 
      }, "Bulk update completed");

      return { 
        updated_flags: updatedFlags, 
        failed_keys: failedKeys 
      };
    } catch (error) {
      logger.error({ error }, "Failed to bulk update flags");
      throw error;
    }
  }

  // Helper methods
  getCacheKey(key, userId, context) {
    const parts = ['flag', key];
    if (userId) parts.push(userId);
    if (context) parts.push(context);
    return parts.join(':');
  }

  async logFlagUsage(key, userId, context) {
    try {
      await query(`
        INSERT INTO flag_usage (flag_key, user_id, context)
        VALUES ($1, $2, $3)
      `, [key, userId, context]);
    } catch (error) {
      logger.warn({ error, key }, "Failed to log flag usage");
    }
  }

  async logFlagHistory(key, oldEnabled, newEnabled, oldConfig, newConfig, changedBy) {
    try {
      await query(`
        INSERT INTO flag_history (flag_key, old_enabled, new_enabled, old_config, new_config, changed_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [key, oldEnabled, newEnabled, oldConfig, newConfig, changedBy]);
    } catch (error) {
      logger.warn({ error, key }, "Failed to log flag history");
    }
  }

  async updateFlagInternal(key, enabled, config) {
    const result = await runInTransaction(async (client) => {
      const res = await client.query(`
        UPDATE feature_flags 
        SET enabled = $1, config = $2::jsonb, updated_at = CURRENT_TIMESTAMP
        WHERE key = $3
        RETURNING *
      `, [enabled, config, key]);
      
      const row = res.rows[0];
      return {
        key: row.key,
        enabled: row.enabled,
        config: JSON.stringify(row.config),
        description: row.description,
        category: row.category,
        public: row.public,
        metadata: row.metadata || {},
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString()
      };
    });

    return result;
  }
}

module.exports = new FeatureFlagService();
