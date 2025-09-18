// Main API server dependencies
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getPool } from './db.js';
import { publishToQueue } from './mq.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
// API server port configuration
const port = 3002;

// Configure CORS for frontend access
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
// Parse JSON request bodies
app.use(express.json());

// Convert database snake_case fields to frontend camelCase
function toCamelCase(obj) {
  const camelCaseObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    camelCaseObj[camelKey] = obj[key];
  }
  return camelCaseObj;
}

// Convert frontend camelCase to database snake_case fields
function toSnakeCase(obj) {
  const snakeCaseObj = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, (match, letter) => '_' + letter.toLowerCase());
    snakeCaseObj[snakeKey] = obj[key];
  }
  return snakeCaseObj;
}

// API endpoint to create new simulation request
app.post('/api/simulations', async (req, res) => {
  try {
    // Extract simulation parameters from request body
    const { name, behavior, runs, agentCount, seed, speed, cohesion, separation, alignment, noise, steps } = req.body;

    // Validate required simulation parameters
    if (!name || !behavior || !runs || !agentCount) {
      return res.status(400).json({ error: 'Missing required fields: name, behavior, runs, agentCount' });
    }
    
    // Get database connection pool
    const pool = await getPool();

    // Insert new simulation record with queued status
    const [result] = await pool.execute(
      `INSERT INTO simulations 
       (id, name, behavior, runs, agent_count, seed, speed, cohesion, separation, alignment, noise, steps, status) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')`,
      [name, behavior, runs, agentCount, seed || null, speed || null, cohesion || null, separation || null, alignment || null, noise || null, steps || null]
    );
    
    // Retrieve the newly created simulation record
    const [rows] = await pool.execute(
      'SELECT * FROM simulations WHERE name = ? AND runs = ? AND agent_count = ? ORDER BY created_at DESC LIMIT 1',
      [name, runs, agentCount]
    );
    
    // Extract simulation data from database result
    const simulation = rows[0];

    // Send simulation job to message queue for worker processing
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
    
    // Transform database format to frontend format
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

// API endpoint to fetch simulations with query options
app.get('/api/simulations', async (req, res) => {
  try {
    // Extract query parameters with default values
    const {
      q = '',
      status = '',
      behavior = '',
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc'
    } = req.query;
    
    // Get database connection and calculate pagination
    const pool = await getPool();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // Build dynamic WHERE clause for filtering
    let whereConditions = [];
    let queryParams = [];
    
    if (q) {
      whereConditions.push('LOWER(name) LIKE ?');
      queryParams.push(`%${q.toLowerCase()}%`);
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
    
    // Count total matching records for pagination
    const countQuery = `SELECT COUNT(*) as total FROM simulations ${whereClause}`;
    const [countRows] = await pool.execute(countQuery, queryParams);
    const total = countRows[0].total;
    
    // Fetch paginated simulation records
    const dataQuery = `
      SELECT id, name, behavior, runs, agent_count, status, created_at, updated_at, result 
      FROM simulations ${whereClause} ${orderClause} LIMIT ${limitNum} OFFSET ${offset}
    `;
    const [rows] = await pool.execute(dataQuery, queryParams);
    
    // Transform database records to frontend format
    const items = rows.map(row => {
      const camelRow = toCamelCase(row);
      if (camelRow.result && typeof camelRow.result === 'string') {
        camelRow.result = JSON.parse(camelRow.result);
      }
      return camelRow;
    });
    
    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total
    });
  } catch (error) {
    console.error('Error fetching simulations:', error);
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
});

// API endpoint to fetch specific simulation by ID
app.get('/api/simulations/:id', async (req, res) => {
  try {
    // Extract simulation ID from URL parameters
    const { id } = req.params;
    // Get database connection and query for specific simulation
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

// Start the API server on all interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});