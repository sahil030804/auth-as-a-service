require("dotenv-safe").config({ path: "./.env", sample: "./.env.example" });

module.exports = {
  development: {
    application: {
      grpcPort: process.env.GRPC_PORT,
    },
    database: {
      rootDbUrl: process.env.ROOT_DB_URL,
      tokenDbUrl: process.env.TOKEN_DB_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.REFRESH_SECRET,
    },
  },
  staging: {
    application: {
      grpcPort: process.env.GRPC_PORT,
    },
    database: {
      rootDbUrl: process.env.ROOT_DB_URL,
      tokenDbUrl: process.env.TOKEN_DB_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.REFRESH_SECRET,
    },
  },
  production: {
    application: {
      grpcPort: process.env.GRPC_PORT,
    },
    database: {
      rootDbUrl: process.env.ROOT_DB_URL,
      tokenDbUrl: process.env.TOKEN_DB_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.REFRESH_SECRET,
    },
  },
};
