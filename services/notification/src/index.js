const pino = require("pino");
const { NOTIFICATION_WORKERS } = require("common");
// Use the local lib, don't reach into identity service!
const { createWorker } = require("./lib/rabbitMq");
const { messaging } =
  require("./config")[process.env.NODE_ENV || "development"];
const emailService = require("./components/email/email.service");
const amqp = require("amqplib");

const logger = pino({
  transport: { target: "pino-pretty", options: { colorize: true } },
});

const start = async () => {
  try {
    // 1. Connect and get the channel
    const connection = await amqp.connect(messaging.rabbitMqUrl);

    if (!connection) {
      throw new Error("Could not initialize RabbitMQ channel");
    }

    const channel = await connection.createChannel();

    for (const workerCfg of NOTIFICATION_WORKERS) {
      // 3. Look up the logic in our local email service
      const processorFn = emailService[workerCfg.processor].bind(emailService);

      if (typeof processorFn !== "function") {
        logger.error(`❌ No processor found for: ${workerCfg.processor}`);
        continue;
      }

      // 4. Start the worker
      await createWorker(
        channel,
        {
          exchange: workerCfg.exchange,
          queue: workerCfg.queue,
          routingKey: workerCfg.routingKey,
        },
        async (event) => {
          // 'event' is the full message, 'event.payload' is the user data
          await processorFn(event.payload);
        },
      );
    }

    logger.info("🚀 Notification Service Workers initialized");
  } catch (error) {
    logger.error(`🛑 Startup Error: ${error.message}`);
    process.exit(1);
  }
};

start();
