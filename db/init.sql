-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS simulations_db;
USE simulations_db;

-- Create app user if it doesn't exist
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_password';
GRANT ALL PRIVILEGES ON simulations_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;

-- Set SQL mode for strict validation
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Create simulations table with explicit columns
CREATE TABLE IF NOT EXISTS simulations (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    behavior ENUM('None','Random','Directed','Collective','Flow') DEFAULT 'None',
    runs INT NOT NULL,
    agent_count INT NOT NULL,
    seed INT NULL,
    speed DOUBLE NULL,
    cohesion DOUBLE NULL,
    separation DOUBLE NULL,
    alignment DOUBLE NULL,
    noise DOUBLE NULL,
    steps INT NULL,
    status VARCHAR(32) DEFAULT 'queued',
    result JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_behavior (behavior),
    INDEX idx_created_at (created_at)
);