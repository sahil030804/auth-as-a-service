const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const pinoHttp = require("pino-http");
const logger = require("./config/logger");

const app = express();

app.use(express.json());

// 🔐 Security
app.use(helmet());

// 🌐 CORS
app.use(cors());

// 📊 Logging middleware
app.use(
  pinoHttp({
    logger,
  }),
);

// Health check
app.get("/health", (req, res) => {
  req.log.info("Health check called");
  res.send({ status: "ok" });
});

module.exports = app;
