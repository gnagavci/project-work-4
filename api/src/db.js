// MySQL database connection module
import mysql from 'mysql2/promise';

// Global connection pool instance
let pool;

// Get or create MySQL connection pool with environment configuration
export async function getPool() {
  // Create pool only once (singleton pattern)
  if (!pool) {
    pool = mysql.createPool({
      // Database connection parameters from environment
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
      // Connection pool configuration
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}