# Simulation Processing System - Project Context

## Overview
This is a **containerized simulation processing system** built with a **microservices architecture** using Docker Compose. The system allows users to create, monitor, and manage agent-based simulations through a web interface with real-time updates and background processing.

## Architecture

### High-Level Components
1. **Web Frontend** (React + Vite) - Port 5173
2. **API Service** (Node.js + Express) - Port 3002  
3. **Worker Service** (Node.js) - Background processor
4. **MySQL Database** - Port 3307 (host) → 3306 (container)
5. **RabbitMQ Message Broker** - Ports 5672, 15672

### Data Flow
1. User creates simulation via web UI
2. API validates and stores simulation in MySQL with status='queued'
3. API publishes message to RabbitMQ 'simulations' queue
4. Worker consumes message, processes simulation (~2 seconds), updates status='done'
5. Frontend polls API every 2 seconds for real-time updates

## Database Schema

### `simulations` Table Structure
```sql
CREATE TABLE simulations (
    -- Primary Key
    id CHAR(36) PRIMARY KEY,                    -- UUID generated via UUID()
    
    -- Basic Simulation Info
    name VARCHAR(255) NOT NULL,                 -- User-provided simulation name
    behavior ENUM('None','Random','Directed','Collective','Flow') DEFAULT 'None',
    runs INT NOT NULL,                          -- Number of simulation runs
    agent_count INT NOT NULL,                   -- Number of agents in simulation
    
    -- Optional Parameters (can be NULL)
    seed INT NULL,                              -- Random seed
    speed DOUBLE NULL,                          -- Agent speed
    cohesion DOUBLE NULL,                       -- Cohesion parameter
    separation DOUBLE NULL,                     -- Separation parameter  
    alignment DOUBLE NULL,                      -- Alignment parameter
    noise DOUBLE NULL,                          -- Noise parameter
    steps INT NULL,                             -- Number of steps
    
    -- Status & Results
    status VARCHAR(32) DEFAULT 'queued',        -- 'queued', 'running', 'done', 'failed'
    result JSON NULL,                           -- Worker processing results
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_status (status),
    INDEX idx_behavior (behavior),
    INDEX idx_created_at (created_at)
);
```

### Key Schema Notes
- **NO "params" JSON column** - all parameters are explicit top-level columns
- Uses `UUID()` function in INSERT statements (not as DEFAULT)
- `agent_count` maps to `agentCount` in API/frontend (snake_case ↔ camelCase)
- `result` column stores JSON from worker processing

## API Endpoints & Data Mapping

### POST /api/simulations
**Request Body** (camelCase):
```json
{
  "name": "string",
  "behavior": "None|Random|Directed|Collective|Flow", 
  "runs": "number",
  "agentCount": "number",
  "seed": "number (optional)",
  "speed": "number (optional)", 
  "cohesion": "number (optional)",
  "separation": "number (optional)",
  "alignment": "number (optional)", 
  "noise": "number (optional)",
  "steps": "number (optional)"
}
```

**Database Mapping**:
- `agentCount` → `agent_count`
- Other camelCase → snake_case conversion
- Insert with `id = UUID()`
- Publish to RabbitMQ with all fields + `simulationId`

### GET /api/simulations
**Query Parameters**:
- `q` - Search by name (substring, case-insensitive)
- `status` - Filter by status (queued|running|done|failed)  
- `behavior` - Filter by behavior enum
- `page` - Page number (default 1)
- `limit` - Items per page (default 10)
- `sort` - Sort field (created_at|updated_at, default created_at)
- `order` - Sort order (asc|desc, default desc)

**Response Format**:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "behavior": "enum",
      "runs": "number",
      "agentCount": "number",  // snake_case → camelCase
      "status": "string", 
      "result": "object|null",
      "createdAt": "iso-date",
      "updatedAt": "iso-date"
    }
  ],
  "page": "number",
  "limit": "number", 
  "total": "number"
}
```

### GET /api/simulations/:id
Returns single simulation with same structure as list items.

## Worker Processing Logic

### Message Format (RabbitMQ)
```json
{
  "simulationId": "uuid",
  "name": "string", 
  "behavior": "enum",
  "runs": "number",
  "agentCount": "number",
  "seed": "number|null",
  "speed": "number|null",
  "cohesion": "number|null", 
  "separation": "number|null",
  "alignment": "number|null",
  "noise": "number|null",
  "steps": "number|null"
}
```

### Processing Steps
1. Receive message from 'simulations' queue
2. Sleep ~2000ms (simulates computation)
3. Calculate metrics:
   - `echoRuns` = runs value
   - `echoAgentCount` = agentCount value  
   - `advancedProvided` = count of non-null numeric parameters
4. Update database:
```sql
UPDATE simulations 
SET status='done', 
    result=JSON_OBJECT('ok', true, 'metrics', JSON_OBJECT(
        'echoRuns', ?, 
        'echoAgentCount', ?, 
        'advancedProvided', ?
    )), 
    updated_at=NOW() 
WHERE id=?
```
5. ACK message only after successful UPDATE

## Frontend Architecture

### Technology Stack
- **React 18** with Vite 4.5
- **react-router-dom** for routing
- **Plain CSS** (no external frameworks)
- Environment: `VITE_API_BASE=http://localhost:3002`

### Page Structure
- **Dashboard** (`/`) - Simulation listing with filtering/pagination
- **Create Simulation** (`/create`) - Form for new simulations

### Dashboard Features
- **Auto-refresh**: Polls API every 2 seconds when page visible
- **Filtering**: By name search, status, behavior
- **Sorting**: By created_at, updated_at (asc/desc)
- **Pagination**: 10/20/50 items per page
- **Real-time updates**: Preserves filters during refresh

### Create Simulation Form
**Form Sections**:
1. **Basics** (required): name, behavior, runs, agentCount
2. **Randomization** (optional): seed
3. **Advanced** (collapsible, optional): speed, cohesion, separation, alignment, noise, steps

**Validation**:
- Client-side validation with inline error messages
- Disable submit button when invalid
- Success: Navigate to dashboard with success message

### CSS Architecture
**File**: `src/styles.css`
- CSS variables for theming
- Responsive design (mobile-first)
- Component-based class naming
- Status badges with color coding
- Sticky table headers
- Form validation states

## Docker Configuration

### Service Dependencies
```
web → api → (mysql + rabbitmq)
worker → (mysql + rabbitmq)
```

### Port Mappings
- **mysql**: 3307:3306 (external MySQL conflicts)
- **rabbitmq**: 5672:5672, 15672:15672
- **api**: 3002:3002 
- **web**: 5173:5173

### Environment Variables
```env
# Database
MYSQL_HOST=mysql
MYSQL_PORT=3306  
MYSQL_DB=simulations_db
MYSQL_USER=app_user
MYSQL_PASSWORD=app_password

# Message Queue
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# CORS
CORS_ORIGIN=http://localhost:5173

# Frontend API
VITE_API_BASE=http://localhost:3002
```

### Health Checks
- **MySQL**: `mysqladmin ping -h localhost`
- **RabbitMQ**: `rabbitmq-diagnostics ping`

## Current Implementation Status

### ✅ Completed Components
1. **Database Schema**: Complete with proper indexes
2. **Docker Configuration**: All services configured with health checks
3. **Frontend Structure**: 
   - React app with routing
   - Comprehensive CSS styling
   - Dashboard component with filtering/pagination
   - Form components for creation
   - Real-time polling implementation

### 🔄 In Progress
1. **API Service**: Structure exists but needs complete implementation
   - Express server setup
   - Database connection pool
   - All REST endpoints
   - RabbitMQ publishing

### ❌ Pending  
1. **Worker Service**: Needs complete implementation
   - RabbitMQ consumer
   - Database connection
   - Simulation processing logic
2. **Integration Testing**: End-to-end workflow verification

## Key Implementation Details

### Database Connection Pattern
```javascript
// mysql2/promise pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER, 
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});
```

### RabbitMQ Pattern  
```javascript
// Queue setup
await channel.assertQueue('simulations', { durable: true });
channel.prefetch(1); // Process one message at a time

// Publishing
channel.sendToQueue('simulations', Buffer.from(JSON.stringify(message)));

// Consuming  
channel.consume('simulations', async (msg) => {
  // Process message
  // Update database
  // Ack only on success
});
```

### API Response Transformation
```javascript
// Convert database snake_case to API camelCase
const transformSimulation = (dbRow) => ({
  id: dbRow.id,
  name: dbRow.name,
  behavior: dbRow.behavior,
  runs: dbRow.runs,
  agentCount: dbRow.agent_count,  // Key transformation
  status: dbRow.status,
  result: dbRow.result,
  createdAt: dbRow.created_at,
  updatedAt: dbRow.updated_at
});
```

## Testing Acceptance Criteria

### End-to-End Test Flow
1. Start all services: `docker-compose up --build`
2. Visit http://localhost:5173
3. Navigate to Create Simulation
4. Submit form with:
   ```json
   {
     "name": "flock-demo",
     "behavior": "Collective", 
     "runs": 3,
     "agentCount": 50,
     "seed": 42,
     "speed": 1.2,
     "cohesion": 0.7,
     "separation": 0.5,
     "alignment": 0.6, 
     "noise": 0.1,
     "steps": 1000
   }
   ```
5. Redirect to Dashboard
6. Verify simulation appears with status "queued" 
7. Within ~5 seconds, status changes to "done"
8. Result shows: `ok=true`, `echoRuns=3`, `echoAgentCount=50`, `advancedProvided≥6`
9. Test filtering: search "flock", filter behavior="Collective"
10. Test pagination and sorting
11. Verify RabbitMQ UI shows queue activity at http://localhost:15672

## Common Issues & Solutions

### Port Conflicts
- **MySQL**: Uses port 3307 externally to avoid conflicts
- **API**: Uses port 3002 (was 3000) to avoid conflicts

### CSS Not Loading  
- Ensure `main.jsx` imports `./styles.css` not `./index.css`
- Restart web container after CSS import changes

### Docker Build Issues
- Use `.dockerignore` to exclude `node_modules`
- Copy only necessary files, install deps in container
- Use `npm install` not `npm ci` for flexibility

### Database Connection
- Wait for health checks before starting dependent services
- Use service names (`mysql`, `rabbitmq`) for internal communication
- Use localhost ports for external access

This comprehensive context should allow a new Claude instance to understand the complete project architecture, current implementation status, and continue development from the current state.