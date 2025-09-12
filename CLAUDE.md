# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simulation processing system built with a microservices architecture using Docker Compose. The system consists of:

- **Web Frontend** (React + Vite): User interface for creating and monitoring simulations
- **API Service** (Node.js + Express): REST API for managing simulations  
- **Worker Service** (Node.js): Background processor for executing simulations
- **MySQL Database**: Stores simulation data and results
- **RabbitMQ**: Message queue for background job processing

## Development Commands

### Web Frontend (`/web` directory)
```bash
cd web
npm run dev        # Start development server (port 5173)
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### API Service (`/api` directory)
No specific build commands defined - runs directly with Node.js

### Worker Service (`/worker` directory)
No specific build commands defined - runs directly with Node.js

### Docker Development
```bash
docker-compose up --build    # Start all services with rebuild
docker-compose up           # Start all services
docker-compose down         # Stop all services
```

## Architecture Details

### Database Schema
- **simulations table**: Stores simulation requests and results
  - `id`: CHAR(36) UUID primary key
  - `name`: VARCHAR(255) simulation name
  - `runs`: INT number of runs
  - `params`: JSON simulation parameters
  - `status`: VARCHAR(32) ('queued', 'done')
  - `result`: JSON simulation results
  - `created_at/updated_at`: Timestamps

### Message Queue Flow
1. API receives simulation request → saves to database as 'queued'
2. API publishes message to 'simulations' queue via RabbitMQ
3. Worker consumes message → processes simulation → updates database to 'done'

### Environment Configuration
Key environment variables (see `.env.example`):
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DB`, `MYSQL_USER`, `MYSQL_PASSWORD`: Database connection
- `RABBITMQ_URL`: Message queue connection
- `CORS_ORIGIN`: Frontend URL for CORS
- `VITE_API_BASE`: API endpoint for frontend

### Service Dependencies
- API depends on MySQL and RabbitMQ health checks
- Worker depends on MySQL and RabbitMQ health checks  
- Web depends on API service
- All services run in Docker containers with proper networking

### Frontend Architecture
- Single-page React application with polling for real-time updates
- Fetches simulations list every 2 seconds
- Form validation for JSON parameters
- Inline styling (no CSS framework)

### API Endpoints
- `POST /api/simulations`: Create new simulation
- `GET /api/simulations`: Get recent simulations (last 20)
- `GET /api/simulations/:id`: Get specific simulation

### Worker Processing
- Simple simulation that waits 2 seconds and returns basic metrics
- Uses RabbitMQ prefetch(1) for controlled message processing
- Updates simulation status from 'queued' to 'done'