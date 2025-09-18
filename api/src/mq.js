// RabbitMQ message queue integration module
import amqp from 'amqplib';

// Global RabbitMQ connection and channel instances
let connection;
let channel;

// Get or create RabbitMQ channel with queue setup
export async function getChannel() {
  // Initialize connection and channel only once
  if (!connection) {
    // Connect to RabbitMQ using environment URL
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    // Create communication channel
    channel = await connection.createChannel();
    // Ensure simulations queue exists and is durable
    await channel.assertQueue('simulations', { durable: true });
  }
  return channel;
}

// Publish message to specified queue as persistent JSON
export async function publishToQueue(queueName, message) {
  // Get RabbitMQ channel
  const ch = await getChannel();
  // Send serialized message with persistence for durability
  return ch.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
}