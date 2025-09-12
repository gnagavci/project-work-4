import amqp from 'amqplib';

let connection;
let channel;

export async function getChannel() {
  if (!connection) {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('simulations', { durable: true });
  }
  return channel;
}