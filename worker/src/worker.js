import dotenv from 'dotenv';
import { getPool } from './db.js';
import { getChannel } from './mq.js';

dotenv.config();

async function processSimulation(simulationId, name, runs, params) {
  console.log(`Processing simulation ${simulationId}: ${name}`);
  
  // Simulate work - wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate result
  const result = {
    ok: true,
    metrics: {
      echoRuns: runs,
      paramKeys: Object.keys(params).length
    }
  };
  
  // Update database
  const pool = await getPool();
  await pool.execute(
    'UPDATE simulations SET status = ?, result = CAST(? AS JSON), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['done', JSON.stringify(result), simulationId]
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
          const { simulationId, name, runs, params } = JSON.parse(msg.content.toString());
          await processSimulation(simulationId, name, runs, params);
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