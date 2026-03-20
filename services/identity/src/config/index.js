require("dotenv-safe").config({ path: "./.env", sample: "./.env.example" });

module.exports = {
  development: {
    application: {
      port: process.env.PORT,
    },
    database: {
      rootDbUrl: process.env.ROOT_DB_URL,
      userDbUrl: process.env.USER_DB_URL,
    },
    services: {
      tokenServiceUrl: process.env.TOKEN_SERVICE_URL,
    },
    messaging: {
      rabbitMqUrl: process.env.RABBITMQ_URL,
    },
    features: {
      sendWelcomeEmail: process.env.SEND_WELCOME_EMAIL === "true",
    },
  },
  staging: {
    application: {
      port: process.env.PORT,
    },
    database: {
      rootDbUrl: process.env.ROOT_DB_URL,
      userDbUrl: process.env.USER_DB_URL,
    },
    services: {
      tokenServiceUrl: process.env.TOKEN_SERVICE_URL,
    },
    messaging: {
      rabbitMqUrl: process.env.RABBITMQ_URL,
    },
    features: {
      sendWelcomeEmail: process.env.SEND_WELCOME_EMAIL === "true",
    },
  },
  production: {
    application: {
      port: process.env.PORT,
    },
    database: {
      rootDbUrl: process.env.ROOT_DB_URL,
      userDbUrl: process.env.USER_DB_URL,
    },
    services: {
      tokenServiceUrl: process.env.TOKEN_SERVICE_URL,
    },
    messaging: {
      rabbitMqUrl: process.env.RABBITMQ_URL,
    },
    features: {
      sendWelcomeEmail: process.env.SEND_WELCOME_EMAIL === "true",
    },
  },
};
