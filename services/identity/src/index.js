const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const pinoHttp = require("pino-http");
const joi = require("joi");
const { connectDB } = require("./lib/postgres");
const { connectRabbitMQ } = require("./lib/rabbitmq");
const logger = require("./config/logger");
const { application } =
  require("./config")[process.env.NODE_ENV || "development"];
const indexRoute = require("./indexRoute");
const { errorHandler } = require("./middleware/errorHandler");
const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(pinoHttp({ logger }));

const signupSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "identity" });
});

app.use("/api", indexRoute);
app.use(errorHandler());

const PORT = application.port || 3001;

const start = async () => {
  await Promise.all([connectDB(), connectRabbitMQ()]);
  app.listen(PORT, () => {
    logger.info(`Identity Service (REST) running on port ${PORT}`);
  });
};

start();
