# Development Workflow Guide

This guide provides comprehensive step-by-step instructions for setting up and running the Simulation Processing System on a fresh development machine.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Setup Instructions](#setup-instructions)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Development Commands](#development-commands)
7. [Troubleshooting](#troubleshooting)
8. [Architecture Overview](#architecture-overview)

## Prerequisites

Before setting up the project, ensure you have the following prerequisites installed on your machine:

### Required Software

#### 1. Git (Version Control)
**Check if Git is installed:**
```bash
git --version
```

**Install Git:**
- **Windows**: Download from [git-scm.com](https://git-scm.com/download/win)
- **macOS**:
  ```bash
  # Using Homebrew
  brew install git
  # Or using Xcode Command Line Tools
  xcode-select --install
  ```
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install git
  ```
- **Linux (CentOS/RHEL)**:
  ```bash
  sudo yum install git
  ```

#### 2. Docker & Docker Compose
**Check if Docker is installed:**
```bash
docker --version
docker-compose --version
```

**Install Docker:**
- **Windows/macOS**: Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
- **Linux (Ubuntu)**:
  ```bash
  # Update package index
  sudo apt update

  # Install required packages
  sudo apt install apt-transport-https ca-certificates curl software-properties-common

  # Add Docker's GPG key
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

  # Add Docker repository
  echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  # Install Docker
  sudo apt update
  sudo apt install docker-ce docker-ce-cli containerd.io

  # Install Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose

  # Add current user to docker group (requires logout/login)
  sudo usermod -aG docker $USER
  ```

**Verify Docker installation:**
```bash
docker run hello-world
```

#### 3. Node.js (Optional - for local development)
While Docker handles the runtime environment, you may want Node.js for local development:

**Check if Node.js is installed:**
```bash
node --version
npm --version
```

**Install Node.js:**
- **Windows/macOS**: Download from [nodejs.org](https://nodejs.org/) (LTS version recommended)
- **Linux**:
  ```bash
  # Using NodeSource repository
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

## Project Overview

This is a **microservices-based simulation processing system** with the following components:

- **Web Frontend** (React + Vite): User interface on port 5173
- **API Service** (Node.js + Express): REST API on port 3002
- **Worker Service** (Node.js): Background simulation processor
- **MySQL Database**: Data storage on port 3307
- **RabbitMQ**: Message queue on ports 5672 (AMQP) and 15672 (Management UI)

## Setup Instructions

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd project-work-4

# Verify project structure
ls -la
```

**Expected directory structure:**
```
project-work-4/
├── api/                 # API service code
├── web/                 # React frontend code
├── worker/              # Worker service code
├── db/                  # Database initialization scripts
├── docker-compose.yml   # Service orchestration
├── .env.example         # Environment variables template
├── CLAUDE.md           # Claude Code instructions
└── README.md           # Project documentation
```

### Step 2: Verify Prerequisites

Run the following checks to ensure all prerequisites are properly installed:

```bash
# Check Git
git --version
# Expected: git version 2.x.x

# Check Docker
docker --version
# Expected: Docker version 20.x.x or higher

# Check Docker Compose
docker-compose --version
# Expected: docker-compose version 1.29.x or higher

# Test Docker functionality
docker run --rm hello-world
# Expected: "Hello from Docker!" message
```

## Environment Configuration

### Step 3: Create Environment Files

The application requires environment configuration for each service. Follow these steps carefully:

#### 3.1 Root Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file (use your preferred editor)
nano .env
# or
code .env
# or
vim .env
```

**Default .env content (can be used as-is for development):**
```env
# Database Configuration
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DB=simulations_db
MYSQL_USER=app_user
MYSQL_PASSWORD=app_password

# Message Queue Configuration
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# CORS and API Configuration
CORS_ORIGIN=http://localhost:5173
VITE_API_BASE=http://localhost:3002
```

#### 3.2 API Service Environment

```bash
# Navigate to API directory
cd api

# Create environment file
cat > .env << 'EOF'
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DB=simulations_db
MYSQL_USER=app_user
MYSQL_PASSWORD=app_password
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
CORS_ORIGIN=http://localhost:5173
EOF

# Return to root directory
cd ..
```

#### 3.3 Worker Service Environment

```bash
# Navigate to Worker directory
cd worker

# Create environment file
cat > .env << 'EOF'
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DB=simulations_db
MYSQL_USER=app_user
MYSQL_PASSWORD=app_password
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
EOF

# Return to root directory
cd ..
```

#### 3.4 Web Frontend Environment

```bash
# Navigate to Web directory
cd web

# Create environment file
cat > .env << 'EOF'
VITE_API_BASE=http://localhost:3002
EOF

# Return to root directory
cd ..
```

### Step 4: Verify Environment Configuration

```bash
# Check that all environment files exist
ls -la .env api/.env worker/.env web/.env

# Verify content of root .env
cat .env
```

## Running the Application

### Step 5: Start All Services

The application uses Docker Compose to orchestrate all services. Follow these steps:

#### 5.1 Initial Setup (First Time)

```bash
# Build and start all services (this will take several minutes on first run)
docker-compose up --build

# Alternative: Run in detached mode (background)
docker-compose up --build -d
```

**What happens during startup:**
1. **MySQL Database** starts and initializes with schema from `db/init.sql`
2. **RabbitMQ** message queue starts with management interface
3. **API Service** builds from `api/` directory and connects to database/queue
4. **Worker Service** builds from `worker/` directory and connects to database/queue
5. **Web Frontend** builds from `web/` directory and serves React application

#### 5.2 Monitor Startup Progress

If running in detached mode, monitor the logs:

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f web
docker-compose logs -f mysql
docker-compose logs -f rabbitmq
```

#### 5.3 Verify Services are Running

```bash
# Check service status
docker-compose ps

# Expected output shows all services as "Up"
```

**Service Health Checks:**
- **MySQL**: `mysql:3307` - Database connection test
- **RabbitMQ**: `rabbitmq:5672` - AMQP connection test
- **API**: `http://localhost:3002` - Express server
- **Web**: `http://localhost:5173` - Vite dev server

### Step 6: Access the Application

#### 6.1 Web Application
Open your browser and navigate to: **http://localhost:5173**

**Expected interface:**
- Simulation creation form
- List of recent simulations
- Real-time status updates

#### 6.2 RabbitMQ Management Interface
Access the message queue management at: **http://localhost:15672**
- **Username**: `guest`
- **Password**: `guest`

#### 6.3 API Endpoints
Test the API directly:
```bash
# Get simulations list
curl http://localhost:3002/api/simulations

# Health check
curl http://localhost:3002/health
```

## Development Commands

### For Container-based Development (Recommended)

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up web

# Rebuild and start (after code changes)
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes (full reset)
docker-compose down -v

# View logs
docker-compose logs -f [service-name]

# Execute commands in running container
docker-compose exec api bash
docker-compose exec worker bash
docker-compose exec web bash
```

### For Local Development (Optional)

If you prefer to run services locally for development:

#### Web Frontend
```bash
cd web
npm install
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

#### API Service
```bash
cd api
npm install
node src/index.js  # Start API server
```

#### Worker Service
```bash
cd worker
npm install
node src/worker.js # Start worker process
```

**Note**: For local development, you'll still need MySQL and RabbitMQ running via Docker:
```bash
docker-compose up mysql rabbitmq
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
**Error**: `bind: address already in use`

**Solution**:
```bash
# Check what's using the port
sudo lsof -i :5173  # or :3002, :3307, :5672, :15672

# Stop conflicting process
sudo kill -9 <PID>

# Or use different ports in docker-compose.yml
```

#### 2. Docker Permission Denied
**Error**: `permission denied while trying to connect to Docker daemon`

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker
```

#### 3. Services Not Starting
**Error**: Services fail health checks

**Solution**:
```bash
# Check service logs
docker-compose logs mysql
docker-compose logs rabbitmq

# Reset everything
docker-compose down -v
docker system prune -f
docker-compose up --build
```

#### 4. Database Connection Issues
**Error**: `ECONNREFUSED` or database connection errors

**Solution**:
```bash
# Verify MySQL is healthy
docker-compose exec mysql mysqladmin ping -h localhost -u root -p

# Check environment variables
docker-compose exec api env | grep MYSQL
```

#### 5. Frontend Not Loading
**Error**: Web interface shows errors or won't load

**Solution**:
```bash
# Check web service logs
docker-compose logs web

# Verify API is accessible
curl http://localhost:3002/api/simulations

# Clear browser cache and reload
```

#### 6. RabbitMQ Connection Issues
**Error**: Worker can't connect to message queue

**Solution**:
```bash
# Check RabbitMQ status
docker-compose exec rabbitmq rabbitmq-diagnostics ping

# Restart RabbitMQ
docker-compose restart rabbitmq
```

### Development Tips

#### Monitoring Service Health
```bash
# Real-time resource usage
docker stats

# Service dependencies
docker-compose config

# Network inspection
docker network ls
docker network inspect project-work-4_default
```

#### Database Management
```bash
# Access MySQL shell
docker-compose exec mysql mysql -u app_user -p simulations_db

# Common SQL commands:
SHOW TABLES;
SELECT * FROM simulations LIMIT 10;
DESCRIBE simulations;
```

#### Log Management
```bash
# Follow logs with timestamps
docker-compose logs -f -t

# Filter logs by service and time
docker-compose logs --since 2023-01-01T00:00:00Z web
```

## Architecture Overview

### Service Communication Flow

1. **User Interface** → **API Service**
   - Web frontend sends HTTP requests to API
   - API validates requests and stores simulation data

2. **API Service** → **Message Queue**
   - API publishes simulation jobs to RabbitMQ
   - Jobs include simulation parameters and database ID

3. **Message Queue** → **Worker Service**
   - Worker consumes jobs from RabbitMQ queue
   - Processes simulations with specified parameters

4. **Worker Service** → **Database**
   - Worker updates simulation status and results
   - Stores final results in JSON format

5. **Web Frontend** ← **API Service**
   - Frontend polls API for simulation updates
   - Real-time status updates via periodic fetching

### Database Schema

The `simulations` table structure:
```sql
CREATE TABLE simulations (
    id CHAR(36) PRIMARY KEY,           -- UUID
    name VARCHAR(255) NOT NULL,        -- Simulation name
    behavior ENUM(...) DEFAULT 'None', -- Simulation type
    runs INT NOT NULL,                 -- Number of runs
    agent_count INT NOT NULL,          -- Number of agents
    seed INT NULL,                     -- Random seed
    speed DOUBLE NULL,                 -- Agent speed
    cohesion DOUBLE NULL,              -- Cohesion parameter
    separation DOUBLE NULL,            -- Separation parameter
    alignment DOUBLE NULL,             -- Alignment parameter
    noise DOUBLE NULL,                 -- Noise parameter
    steps INT NULL,                    -- Simulation steps
    status VARCHAR(32) DEFAULT 'queued', -- Processing status
    result JSON NULL,                  -- Simulation results
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Environment Variables Reference

| Variable | Service | Description | Default Value |
|----------|---------|-------------|---------------|
| `MYSQL_HOST` | API, Worker | Database hostname | `mysql` |
| `MYSQL_PORT` | API, Worker | Database port | `3306` |
| `MYSQL_DB` | API, Worker | Database name | `simulations_db` |
| `MYSQL_USER` | API, Worker | Database username | `app_user` |
| `MYSQL_PASSWORD` | API, Worker | Database password | `app_password` |
| `RABBITMQ_URL` | API, Worker | Message queue URL | `amqp://guest:guest@rabbitmq:5672` |
| `CORS_ORIGIN` | API | Allowed CORS origin | `http://localhost:5173` |
| `VITE_API_BASE` | Web | API endpoint URL | `http://localhost:3002` |

This completes the comprehensive development workflow guide. The system should now be fully operational and ready for development work.