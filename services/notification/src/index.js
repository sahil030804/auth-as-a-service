require('dotenv').config();
const amqp = require('amqplib');
const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

const start = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    const exchange = 'user_events';
    const queue = 'notification_queue';

    await channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await channel.assertQueue(queue, { exclusive: false });

    await channel.bindQueue(q.queue, exchange, 'user.created');

    logger.info(`✅ Notification Service listening on queue: ${q.queue}`);

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        const event = JSON.parse(msg.content.toString());
        logger.info({ event }, 'Received user event, sending notification...');
        // Simulate sending an email
        console.log(`📧 [EMAIL] Sending welcome email to: ${event.payload.email}`);
        channel.ack(msg);
      }
    });
  } catch (error) {
    logger.error('🛑 Notification Service RabbitMQ error:', error.message);
    process.exit(1);
  }
};

start();
