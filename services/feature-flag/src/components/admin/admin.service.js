const { query } = require("../../lib/connections");
const logger = require("../../config/logger");

class AdminService {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_flags,
          COUNT(*) FILTER (WHERE enabled = true) as enabled_flags,
          COUNT(*) FILTER (WHERE enabled = false) as disabled_flags,
          COUNT(DISTINCT category) as categories
        FROM feature_flags
      `);

      const stats = result.rows[0];

      // Get stats by category
      const categoryStats = await query(`
        SELECT 
          category,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE enabled = true) as enabled
        FROM feature_flags
        GROUP BY category
        ORDER BY category
      `);

      stats.by_category = {};
      categoryStats.rows.forEach(row => {
        stats.by_category[row.category] = {
          total: parseInt(row.total),
          enabled: parseInt(row.enabled)
        };
      });

      return stats;
    } catch (error) {
      logger.error({ error }, "Failed to get dashboard stats");
      throw error;
    }
  }

  // Get flag usage analytics
  async getFlagUsageAnalytics(key, days = 7) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_calls,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT context) as contexts,
          DATE_TRUNC('hour', timestamp) as hour,
          COUNT(*) as calls_per_hour
        FROM flag_usage 
        WHERE flag_key = $1 
          AND timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour DESC
        LIMIT 24
      `, [key]);

      return {
        key,
        period_days: parseInt(days),
        total_calls: parseInt(result.rows[0]?.total_calls || 0),
        unique_users: parseInt(result.rows[0]?.unique_users || 0),
        contexts: parseInt(result.rows[0]?.contexts || 0),
        hourly_breakdown: result.rows.map(row => ({
          hour: row.hour,
          calls: parseInt(row.calls_per_hour)
        }))
      };
    } catch (error) {
      logger.error({ error, key }, "Failed to get flag usage analytics");
      throw error;
    }
  }

  // Get flag change history
  async getFlagHistory(key, limit = 10) {
    try {
      const result = await query(`
        SELECT 
          old_enabled,
          new_enabled,
          old_config,
          new_config,
          changed_by,
          change_reason,
          timestamp
        FROM flag_history 
        WHERE flag_key = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `, [key, limit]);

      return {
        key,
        history: result.rows.map(row => ({
          timestamp: row.timestamp.toISOString(),
          old_enabled: row.old_enabled,
          new_enabled: row.new_enabled,
          changed_by: row.changed_by,
          change_reason: row.change_reason,
          config_changed: JSON.stringify(row.old_config) !== JSON.stringify(row.new_config)
        }))
      };
    } catch (error) {
      logger.error({ error, key }, "Failed to get flag history");
      throw error;
    }
  }

  // Clone flag
  async cloneFlag(originalKey, newKey, newDescription) {
    try {
      const { query } = require("../../lib/connections");
      
      // Get original flag
      const originalResult = await query("SELECT * FROM feature_flags WHERE key = $1", [originalKey]);
      if (originalResult.rows.length === 0) {
        throw new Error(`Original flag '${originalKey}' not found`);
      }
      
      const original = originalResult.rows[0];

      // Create new flag with same settings
      const result = await query(`
        INSERT INTO feature_flags (key, enabled, config, description, category, public, metadata, created_by)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7::jsonb, $8)
        RETURNING *
      `, [
        newKey,
        original.enabled,
        original.config,
        newDescription || `Cloned from ${originalKey}`,
        original.category,
        original.public,
        original.metadata,
        'system'
      ]);

      const row = result.rows[0];
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
    } catch (error) {
      logger.error({ error, originalKey, newKey }, "Failed to clone flag");
      throw error;
    }
  }

  // Toggle flag
  async toggleFlag(key) {
    try {
      const result = await query(`
        UPDATE feature_flags 
        SET enabled = NOT enabled,
            updated_at = CURRENT_TIMESTAMP
        WHERE key = $1
        RETURNING *
      `, [key]);

      if (result.rows.length === 0) {
        throw new Error(`Feature flag '${key}' not found`);
      }

      const row = result.rows[0];
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
    } catch (error) {
      logger.error({ error, key }, "Failed to toggle flag");
      throw error;
    }
  }

  // Reset flag to defaults
  async resetFlag(key) {
    try {
      // Define default configurations for known flags
      const defaults = {
        'email_verification': {
          enabled: true,
          config: {
            required: true,
            token_expiry_hours: 24,
            resend_allowed: true,
            resend_interval_minutes: 5
          }
        },
        'password_strength': {
          enabled: true,
          config: {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_special_chars: false
          }
        },
        'captcha': {
          enabled: false,
          config: {
            provider: "recaptcha",
            required_for_signup: false,
            required_for_login: false,
            score_threshold: 0.5
          }
        },
        'rate_limiting': {
          enabled: true,
          config: {
            signup: { attempts: 5, window_minutes: 15, block_duration_minutes: 60 },
            login: { attempts: 10, window_minutes: 15, block_duration_minutes: 30 }
          }
        },
        'ip_blocking': {
          enabled: true,
          config: {
            auto_block_enabled: true,
            failed_attempts_threshold: 10,
            block_duration_hours: 24
          }
        }
      };
      
      const defaultConfig = defaults[key];
      if (!defaultConfig) {
        throw new Error('No default configuration found for this flag');
      }

      const result = await query(`
        UPDATE feature_flags 
        SET enabled = $1, config = $2::jsonb, updated_at = CURRENT_TIMESTAMP
        WHERE key = $3
        RETURNING *
      `, [defaultConfig.enabled, defaultConfig.config, key]);

      if (result.rows.length === 0) {
        throw new Error(`Feature flag '${key}' not found`);
      }

      const row = result.rows[0];
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
    } catch (error) {
      logger.error({ error, key }, "Failed to reset flag");
      throw error;
    }
  }

  // Import flags
  async importFlags(flags, overwrite = false) {
    try {
      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };

      for (const flagData of flags) {
        try {
          if (overwrite) {
            await query(`
              UPDATE feature_flags 
              SET enabled = $1, config = $2::jsonb, description = $3, updated_at = CURRENT_TIMESTAMP
              WHERE key = $4
            `, [flagData.enabled, flagData.config, flagData.description, flagData.key]);
          } else {
            await query(`
              INSERT INTO feature_flags (key, enabled, config, description, category, public, metadata, created_by)
              VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7::jsonb, $8)
            `, [
              flagData.key,
              flagData.enabled,
              flagData.config,
              flagData.description,
              flagData.category || 'general',
              flagData.public !== false,
              flagData.metadata || {},
              'import'
            ]);
          }
          results.imported++;
        } catch (error) {
          results.skipped++;
          results.errors.push({ key: flagData.key, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error({ error }, "Failed to import flags");
      throw error;
    }
  }

  // Export flags
  async exportFlags() {
    try {
      const result = await query("SELECT * FROM feature_flags ORDER BY key");
      
      return {
        exported_at: new Date().toISOString(),
        version: "1.0.0",
        flags: result.rows.map(row => ({
          key: row.key,
          enabled: row.enabled,
          config: row.config,
          description: row.description,
          category: row.category,
          public: row.public,
          metadata: row.metadata,
          created_at: row.created_at.toISOString(),
          updated_at: row.updated_at.toISOString()
        }))
      };
    } catch (error) {
      logger.error({ error }, "Failed to export flags");
      throw error;
    }
  }
}

module.exports = new AdminService();
