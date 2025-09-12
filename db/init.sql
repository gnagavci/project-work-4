-- sql
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS simulations_db;
USE simulations_db;

-- Create app user if it doesn't exist
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_password';
GRANT ALL PRIVILEGES ON simulations_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;

-- Create simulations table
CREATE TABLE IF NOT EXISTS simulations (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    runs INT NOT NULL,
    params JSON,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    result JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);