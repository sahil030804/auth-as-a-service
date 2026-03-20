module.exports = {
  async createWorker(channel, config, processor) {
    const { exchange, queue, routingKey } = config;

    // 1. Setup Infrastructure
    await channel.assertExchange(exchange, "topic", { durable: true });
    const q = await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(q.queue, exchange, routingKey);

    console.log(`📥 Worker listening: ${queue} -> [${routingKey}]`);

    // 2. Start Consuming
    channel.consume(q.queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());

        // 3. Execute the "Business Logic" passed into the function
        await processor(content);

        // 4. Acknowledge only if processor succeeds
        channel.ack(msg);
      } catch (error) {
        console.error(`❌ Worker Error in ${queue}:`, error.message);
        // In production, you might want to nack (negative ack) to retry later
        // channel.nack(msg, false, true);
      }
    });
  },
};
