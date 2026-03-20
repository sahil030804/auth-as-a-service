const amqp = require('amqplib');
const logger = require('../config/logger');

let channel;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const connectRabbitMQ = async (retries = 5) => {
  while (retries > 0) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      channel = await connection.createChannel();
      await channel.assertExchange('user_events', 'topic', { durable: true });
      logger.info('✅ Identity RabbitMQ Connected');
      return;
    } catch (error) {
      retries--;
      logger.error(`🛑 Identity RabbitMQ Connection Failed (Retries left: ${retries}):`, error.message);
      if (retries === 0) break;
      await sleep(5000);
    }
  }
};

const emitUserCreated = (user) => {
  if (!channel) {
    logger.warn('RabbitMQ channel not available, cannot emit event');
    return;
  }
  const event = {
    type: 'USER_CREATED',
    payload: {
      id: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    }
  };
  channel.publish('user_events', 'user.created', Buffer.from(JSON.stringify(event)));
  logger.info({ user_id: user.id }, 'Emitted user.created event');
};

module.exports = {
  connectRabbitMQ,
  emitUserCreated
};
