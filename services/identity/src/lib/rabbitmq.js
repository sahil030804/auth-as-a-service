const amqp = require("amqplib");
const logger = require("../config/logger");
const { EXCHANGES } = require("../../../../common/messaging.constant");
let channel;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  async connectRabbitMQ(retries = 5) {
    while (retries > 0) {
      try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        // Automatically assert ALL defined exchanges
        const exchangePromises = Object.values(EXCHANGES).map((ex) => {
          logger.info(`🔨 Asserting Exchange: ${ex.name} (${ex.type})`);
          return channel.assertExchange(ex.name, ex.type, ex.options);
        });

        await Promise.all(exchangePromises);

        logger.info("✅ RabbitMQ Infrastructure Provisioned");
        return { connection, channel };
      } catch (error) {
        retries--;
        logger.error(
          `🛑 Identity RabbitMQ Connection Failed (Retries left: ${retries}):`,
          error.message,
        );
        if (retries === 0) process.exit(1);
        await sleep(5000);
      }
    }
  },

  async emitEventToQueue(eventName, queueType, queueName, payload) {
    if (!channel) {
      logger.warn("RabbitMQ channel not available, cannot emit event");
      return;
    }
    const event = {
      type: eventName,
      payload,
      timestamp: new Date().toISOString(),
    };
    channel.publish(queueType, queueName, Buffer.from(JSON.stringify(event)));
    logger.info({ queueName, queueType }, "Emitted event to queue");
  },
};
