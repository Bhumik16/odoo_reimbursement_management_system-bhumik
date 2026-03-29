/**
 * db/index.js
 * -----------
 * PostgreSQL connection pool via the `pg` package.
 * Reads DATABASE_URL from environment (set in server/.env).
 *
 * Usage anywhere in the server:
 *   const db = require('./db');
 *   const { rows } = await db.query('SELECT * FROM users WHERE id=$1', [id]);
 */

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add it to server/.env before starting the server.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Neon DB
  },
  max: 10,               // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle DB client:', err);
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Failed to connect to NeonDB:', err.message);
  } else {
    console.log('✅ Connected to NeonDB (PostgreSQL)');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
