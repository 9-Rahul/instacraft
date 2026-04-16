// src/lib/db.js
import mysql from 'mysql2/promise';

let pool;
try {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL is missing! Database features will fail.');
  }
  
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL || '',
    waitForConnections: true,
    connectionLimit: 10, // More conservative for VPS memory
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });
} catch (error) {
  console.error('❌ Database Pool Error:', error.message);
}

/**
 * Execute a SQL query and return the results.
 * @param {string} sql - The SQL query to execute.
 * @param {any[]} params - The parameters for the query.
 * @returns {Promise<any>}
 */
export async function query(sql, params) {
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Execute a function within a transaction.
 * @param {function(mysql.Connection): Promise<any>} callback - The function to execute.
 * @returns {Promise<any>}
 */
export async function transaction(callback) {
  if (!pool) throw new Error('Database not initialized');
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export default { query, transaction };
