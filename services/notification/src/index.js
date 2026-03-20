require('dotenv').config();
const amqp = require('amqplib');
const { Resend } = require('resend');
const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

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

    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        const event = JSON.parse(msg.content.toString());
        logger.info({ event }, 'Received user event, sending notification...');
        
        try {
          // Send real email using Resend
          await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: event.payload.email,
            subject: 'Welcome to our platform!',
            html: `<p>Congrats on joining our platform! Your account has been successfully created.</p>`
          });
          
          logger.info(`📧 Email sent successfully to: ${event.payload.email}`);
        } catch (emailError) {
          logger.error({ emailError }, 'Failed to send email');
        }
        
        channel.ack(msg);
      }
    });
  } catch (error) {
    logger.error('🛑 Notification Service RabbitMQ error:', error.message);
    process.exit(1);
  }
};

start();
