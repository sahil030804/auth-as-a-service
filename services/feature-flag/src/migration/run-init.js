const { Client } = require("pg");
const logger = require("../config/logger");
const { database, security } = require("../config");

const runMigration = async () => {
  const rootClient = new Client({
    connectionString: database.rootDbUrl,
  });

  await rootClient.connect();
  await rootClient.query(`CREATE DATABASE feature_flag_db`);
  await rootClient.end();

  const client = new Client({
    connectionString: database.featureFlagDbUrl,
  });

  try {
    await client.connect();
    console.log("🚩 Creating tables in feature_flag_db...");
    
    // Feature flags table with enhanced schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        enabled BOOLEAN DEFAULT FALSE,
        config JSONB DEFAULT '{}',
        description TEXT,
        category VARCHAR(50) DEFAULT 'general',
        public BOOLEAN DEFAULT TRUE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        version INTEGER DEFAULT 1
      );
    `);

    // Feature flag usage analytics
    await client.query(`
      CREATE TABLE IF NOT EXISTS flag_usage (
        id SERIAL PRIMARY KEY,
        flag_key VARCHAR(100) NOT NULL,
        user_id VARCHAR(255),
        context VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flag_key) REFERENCES feature_flags(key) ON DELETE CASCADE
      );
    `);

    // Feature flag change history
    await client.query(`
      CREATE TABLE IF NOT EXISTS flag_history (
        id SERIAL PRIMARY KEY,
        flag_key VARCHAR(100) NOT NULL,
        old_enabled BOOLEAN,
        new_enabled BOOLEAN,
        old_config JSONB,
        new_config JSONB,
        changed_by VARCHAR(255),
        change_reason TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flag_key) REFERENCES feature_flags(key) ON DELETE CASCADE
      );
    `);

    // API keys for external access
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        permissions JSONB DEFAULT '[]',
        rate_limit INTEGER DEFAULT 1000,
        created_by VARCHAR(255),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    // Insert default feature flags for auth service
    await client.query(`
      INSERT INTO feature_flags (key, enabled, config, description, category, public) VALUES
      ('email_verification', true, '{
        "required": true,
        "token_expiry_hours": 24,
        "resend_allowed": true,
        "resend_interval_minutes": 5,
        "verification_url_template": "https://yourapp.com/verify?token={token}"
      }', 'Require email verification for new accounts', 'auth', true),
      ('password_strength', true, '{
        "min_length": 8,
        "require_uppercase": true,
        "require_lowercase": true,
        "require_numbers": true,
        "require_special_chars": false,
        "prevent_common_passwords": true,
        "strength_check_enabled": true
      }', 'Enforce strong password requirements', 'auth', true),
      ('rate_limiting', true, '{
        "signup": {"attempts": 5, "window_minutes": 15, "block_duration_minutes": 60},
        "login": {"attempts": 10, "window_minutes": 15, "block_duration_minutes": 30},
        "password_reset": {"attempts": 3, "window_minutes": 60, "block_duration_minutes": 120},
        "global_enabled": true
      }', 'Rate limiting for various actions', 'auth', true),
      ('captcha', false, '{
        "provider": "recaptcha",
        "required_for_signup": false,
        "required_for_login": false,
        "required_for_password_reset": false,
        "score_threshold": 0.5,
        "site_key": "",
        "secret_key": "",
        "enabled": false
      }', 'CAPTCHA integration settings', 'auth', true),
      ('ip_blocking', true, '{
        "auto_block_enabled": true,
        "failed_attempts_threshold": 10,
        "block_duration_hours": 24,
        "whitelist_ips": [],
        "blacklist_ips": [],
        "geo_blocking_enabled": false,
        "allowed_countries": []
      }', 'IP-based blocking rules', 'auth', true),
      ('two_factor_auth', false, '{
        "required": false,
        "methods": ["sms", "email", "totp"],
        "sms_provider": "twilio",
        "email_template": "2fa-code",
        "code_expiry_minutes": 10,
        "max_attempts": 3
      }', 'Two-factor authentication settings', 'auth', true),
      ('session_management', true, '{
        "max_sessions_per_user": 3,
        "session_timeout_hours": 24,
        "remember_me_days": 30,
        "concurrent_sessions_allowed": true,
        "secure_cookies": true
      }', 'Session management settings', 'auth', true),
      ('social_login', false, '{
        "providers": ["google", "github", "facebook"],
        "google": {"enabled": false, "client_id": "", "client_secret": ""},
        "github": {"enabled": false, "client_id": "", "client_secret": ""},
        "facebook": {"enabled": false, "app_id": "", "app_secret": ""},
        "auto_registration": true
      }', 'Social login integration', 'auth', true),
      ('maintenance_mode', false, '{
        "enabled": false,
        "message": "System under maintenance. Please try again later.",
        "allowed_ips": ["127.0.0.1"],
        "bypass_key": ""
      }', 'Maintenance mode settings', 'system', true),
      ('analytics_enabled', true, '{
        "track_user_actions": true,
        "track_performance": true,
        "track_errors": true,
        "data_retention_days": 90,
        "anonymize_ips": true
      }', 'Analytics and tracking settings', 'analytics', true)
      ON CONFLICT (key) DO NOTHING;
    `);

    // Create indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_feature_flags_public ON feature_flags(public);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_flag_usage_timestamp ON flag_usage(timestamp);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_flag_usage_flag_key ON flag_usage(flag_key);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_flag_history_timestamp ON flag_history(timestamp);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);`);

    // Insert default API key for development
    const keyHash = require('crypto').createHash('sha256').update(security.defaultApiKey).digest('hex');
    
    await client.query(`
      INSERT INTO api_keys (key_hash, name, permissions, created_by) VALUES
      ($1, 'Development API Key', '["read", "write"]', 'system')
      ON CONFLICT (key_hash) DO NOTHING
    `, [keyHash]);

    await client.end();
    console.log("✅ Feature Flag migrations completed successfully!");
    console.log("🔑 Default API Key:", security.defaultApiKey);
  } catch (err) {
    console.error("❌ Feature Flag migration failed:", err.message);
    process.exit(1);
  }
};

runMigration();
