// Worker service for processing simulation jobs from message queue
import dotenv from 'dotenv';
import { getPool } from './db.js';
import { getChannel } from './mq.js';

// Load environment configuration
dotenv.config();

// Process individual simulation job from message queue
async function processSimulation(message) {
  // Extract simulation parameters from queue message
  const { simulationId, name, behavior, runs, agentCount, seed, speed, cohesion, separation, alignment, noise, steps } = message;
  
  console.log(`Processing simulation ${simulationId}: ${name}`);

  // Mark simulation as running in database
  const pool = await getPool();
  await pool.execute(
    'UPDATE simulations SET status = ?, updated_at = NOW() WHERE id = ?',
    ['running', simulationId]
  );
  
  // Simulate computation time with 2-second delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Calculate how many optional parameters were provided
  const advancedParams = [seed, speed, cohesion, separation, alignment, noise, steps];
  const advancedProvided = advancedParams.filter(param => param !== null && param !== undefined).length;
  
  // Create simulation result object with basic metrics
  const result = {
    ok: true,
    metrics: {
      echoRuns: runs,
      echoAgentCount: agentCount,
      advancedProvided: advancedProvided
    }
  };
  
  // Save completion status and results to database
  await pool.execute(
    'UPDATE simulations SET status = ?, result = JSON_OBJECT(?, ?, ?, JSON_OBJECT(?, ?, ?, ?, ?, ?)), updated_at = NOW() WHERE id = ?',
    ['done', 'ok', true, 'metrics', 'echoRuns', runs, 'echoAgentCount', agentCount, 'advancedProvided', advancedProvided, simulationId]
  );
  
  console.log(`Completed simulation ${simulationId}`);
}

// Initialize and start the worker service
async function startWorker() {
  try {
    // Get RabbitMQ channel and set processing limit
    const channel = await getChannel();
    await channel.prefetch(1);
    
    console.log('Worker started, waiting for messages...');

    // Start consuming messages from simulations queue
    await channel.consume('simulations', async (msg) => {
      // Process received message if present
      if (msg) {
        try {
          // Parse JSON message content
          const message = JSON.parse(msg.content.toString());
          // Execute simulation processing
          await processSimulation(message);
          // Acknowledge successful processing
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          // Reject message without requeuing to prevent infinite loops
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error('Worker error:', error);
    process.exit(1);
  }
}

// Start the worker process
startWorker();