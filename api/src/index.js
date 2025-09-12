import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getPool } from './db.js';
import { publishToQueue } from './mq.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

// Convert snake_case to camelCase
function toCamelCase(obj) {
  const camelCaseObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    camelCaseObj[camelKey] = obj[key];
  }
  return camelCaseObj;
}

// Convert camelCase to snake_case for database
function toSnakeCase(obj) {
  const snakeCaseObj = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, (match, letter) => '_' + letter.toLowerCase());
    snakeCaseObj[snakeKey] = obj[key];
  }
  return snakeCaseObj;
}

// Create new simulation
app.post('/api/simulations', async (req, res) => {
  try {
    const { name, behavior, runs, agentCount, seed, speed, cohesion, separation, alignment, noise, steps } = req.body;
    
    if (!name || !behavior || !runs || !agentCount) {
      return res.status(400).json({ error: 'Missing required fields: name, behavior, runs, agentCount' });
    }
    
    const pool = await getPool();
    
    // Insert with explicit field mapping
    const [result] = await pool.execute(
      `INSERT INTO simulations 
       (id, name, behavior, runs, agent_count, seed, speed, cohesion, separation, alignment, noise, steps, status) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')`,
      [name, behavior, runs, agentCount, seed || null, speed || null, cohesion || null, separation || null, alignment || null, noise || null, steps || null]
    );
    
    // Get the created simulation
    const [rows] = await pool.execute(
      'SELECT * FROM simulations WHERE name = ? AND runs = ? AND agent_count = ? ORDER BY created_at DESC LIMIT 1',
      [name, runs, agentCount]
    );
    
    const simulation = rows[0];
    
    // Publish to queue with explicit fields
    await publishToQueue('simulations', {
      simulationId: simulation.id,
      name: simulation.name,
      behavior: simulation.behavior,
      runs: simulation.runs,
      agentCount: simulation.agent_count,
      seed: simulation.seed,
      speed: simulation.speed,
      cohesion: simulation.cohesion,
      separation: simulation.separation,
      alignment: simulation.alignment,
      noise: simulation.noise,
      steps: simulation.steps
    });
    
    // Convert to camelCase and parse JSON
    const camelSimulation = toCamelCase(simulation);
    if (camelSimulation.result && typeof camelSimulation.result === 'string') {
      camelSimulation.result = JSON.parse(camelSimulation.result);
    }
    
    res.json(camelSimulation);
  } catch (error) {
    console.error('Error creating simulation:', error);
    res.status(500).json({ error: 'Failed to create simulation' });
  }
});

// Get simulations with filtering, sorting, pagination
app.get('/api/simulations', async (req, res) => {
  try {
    const {
      q = '',
      status = '',
      behavior = '',
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc'
    } = req.query;
    
    const pool = await getPool();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];
    
    if (q) {
      whereConditions.push('LOWER(name) LIKE CONCAT(\'%\', LOWER(?), \'%\')');
      queryParams.push(q);
    }
    
    if (status) {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }
    
    if (behavior) {
      whereConditions.push('behavior = ?');
      queryParams.push(behavior);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const orderClause = `ORDER BY ${sort} ${order.toUpperCase()}`;
    const limitClause = `LIMIT ? OFFSET ?`;
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM simulations ${whereClause}`;
    const [countRows] = await pool.execute(countQuery, queryParams);
    const total = countRows[0].total;
    
    // Get paginated results
    const dataQuery = `
      SELECT id, name, behavior, runs, agent_count, status, created_at, updated_at, result 
      FROM simulations ${whereClause} ${orderClause} ${limitClause}
    `;
    const [rows] = await pool.execute(dataQuery, [...queryParams, parseInt(limit), offset]);
    
    // Convert to camelCase and parse JSON
    const items = rows.map(row => {
      const camelRow = toCamelCase(row);
      if (camelRow.result && typeof camelRow.result === 'string') {
        camelRow.result = JSON.parse(camelRow.result);
      }
      return camelRow;
    });
    
    res.json({
      items,
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });
  } catch (error) {
    console.error('Error fetching simulations:', error);
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
});

// Get single simulation
app.get('/api/simulations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM simulations WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    
    const simulation = toCamelCase(rows[0]);
    if (simulation.result && typeof simulation.result === 'string') {
      simulation.result = JSON.parse(simulation.result);
    }
    
    res.json(simulation);
  } catch (error) {
    console.error('Error fetching simulation:', error);
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});