# Simulation Processing System

A containerized simulation processing system built with a microservices architecture using Docker Compose.

## Architecture

- **Web Frontend** (React + Vite): User interface for creating and monitoring simulations
- **API Service** (Node.js + Express): REST API for managing simulations  
- **Worker Service** (Node.js): Background processor for executing simulations
- **MySQL Database**: Stores simulation data and results
- **RabbitMQ**: Message queue for background job processing

## Quick Start

1. Clone the repository
2. Copy environment variables: `cp .env.example .env`
3. Start all services: `docker-compose up --build`
4. Access the application:
   - Frontend: http://localhost:5173
   - API: http://localhost:3000
   - RabbitMQ Management: http://localhost:15672 (guest/guest)

## Development

### Docker Development
```bash
docker-compose up --build    # Start all services with rebuild
docker-compose up           # Start all services
docker-compose down         # Stop all services
```

### Individual Services

**Web Frontend** (`/web` directory)
```bash
cd web
npm run dev        # Start development server (port 5173)
npm run build      # Build for production
```

**API Service** (`/api` directory)
```bash
cd api
npm start          # Start API server (port 3000)
```

**Worker Service** (`/worker` directory)
```bash
cd worker
npm start          # Start worker process
```

## API Endpoints

- `POST /api/simulations`: Create new simulation
- `GET /api/simulations`: Get simulations list with filtering/pagination
- `GET /api/simulations/:id`: Get specific simulation

## Database Schema

The `simulations` table stores:
- Basic info: id, name, behavior, runs, agent_count
- Optional parameters: seed, speed, cohesion, separation, alignment, noise, steps
- Status tracking: status (queued/running/done/failed)
- Results: JSON results from worker processing
- Timestamps: created_at, updated_at

## Environment Variables

See `.env.example` for all configuration options.