// RabbitMQ message queue consumer module for worker service
import amqp from 'amqplib';

// Global RabbitMQ connection and channel instances
let connection;
let channel;

// Get or create RabbitMQ channel for consuming simulation jobs
export async function getChannel() {
  // Initialize connection and channel only once
  if (!connection) {
    // Connect to RabbitMQ using environment URL
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    // Create communication channel for message consumption
    channel = await connection.createChannel();
    // Ensure simulations queue exists and is durable
    await channel.assertQueue('simulations', { durable: true });
  }
  return channel;
}