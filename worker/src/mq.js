// Message Queue (RabbitMQ) connection management for the worker service
// This module provides a singleton pattern for managing RabbitMQ connections
import amqp from 'amqplib';

// Singleton variables to maintain a single connection and channel across the application
let connection;
let channel;

/**
 * Gets or creates a RabbitMQ channel for message processing
 * Uses singleton pattern to ensure only one connection is established
 *
 * @returns {Promise<Channel>} RabbitMQ channel ready for use
 */
export async function getChannel() {
  // Only create connection if it doesn't exist (lazy initialization)
  if (!connection) {
    // Connect to RabbitMQ using URL from environment variables
    connection = await amqp.connect(process.env.RABBITMQ_URL);

    // Create a channel for message operations
    channel = await connection.createChannel();

    // Ensure the 'simulations' queue exists and is durable
    // Durable queues survive RabbitMQ server restarts
    await channel.assertQueue('simulations', { durable: true });
  }

  // Return the existing channel (subsequent calls reuse the same channel)
  return channel;
} 