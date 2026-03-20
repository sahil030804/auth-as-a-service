require("dotenv-safe").config({ path: "./.env", sample: "./.env.example" });

module.exports = {
  development: {
    messaging: {
      rabbitMqUrl: process.env.RABBITMQ_URL,
      resendApiKey: process.env.RESEND_API_KEY,
    },
  },
  staging: {
    messaging: {
      rabbitMqUrl: process.env.RABBITMQ_URL,
      resendApiKey: process.env.RESEND_API_KEY,
    },
  },
  production: {
    messaging: {
      rabbitMqUrl: process.env.RABBITMQ_URL,
      resendApiKey: process.env.RESEND_API_KEY,
    },
  },
};
