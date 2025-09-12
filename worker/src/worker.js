import dotenv from 'dotenv';
import { getPool } from './db.js';
import { getChannel } from './mq.js';

dotenv.config();

async function processSimulation(message) {
  const { simulationId, name, behavior, runs, agentCount, seed, speed, cohesion, separation, alignment, noise, steps } = message;
  
  console.log(`Processing simulation ${simulationId}: ${name}`);
  
  // Update status to running
  const pool = await getPool();
  await pool.execute(
    'UPDATE simulations SET status = ?, updated_at = NOW() WHERE id = ?',
    ['running', simulationId]
  );
  
  // Simulate work - wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Count advanced parameters provided
  const advancedParams = [seed, speed, cohesion, separation, alignment, noise, steps];
  const advancedProvided = advancedParams.filter(param => param !== null && param !== undefined).length;
  
  // Generate result with metrics
  const result = {
    ok: true,
    metrics: {
      echoRuns: runs,
      echoAgentCount: agentCount,
      advancedProvided: advancedProvided
    }
  };
  
  // Update database with result
  await pool.execute(
    'UPDATE simulations SET status = ?, result = JSON_OBJECT(?, ?, ?, JSON_OBJECT(?, ?, ?, ?, ?, ?)), updated_at = NOW() WHERE id = ?',
    ['done', 'ok', true, 'metrics', 'echoRuns', runs, 'echoAgentCount', agentCount, 'advancedProvided', advancedProvided, simulationId]
  );
  
  console.log(`Completed simulation ${simulationId}`);
}

async function startWorker() {
  try {
    const channel = await getChannel();
    await channel.prefetch(1);
    
    console.log('Worker started, waiting for messages...');
    
    await channel.consume('simulations', async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await processSimulation(message);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          channel.nack(msg, false, false); // Don't requeue on error
        }
      }
    });
  } catch (error) {
    console.error('Worker error:', error);
    process.exit(1);
  }
}

startWorker();