import mysql from 'mysql2/promise';

// Single shared pool (cached on globalThis so Next.js hot-reload does not open new pools)
const g = globalThis;
export const pool =
  g._mysqlPool ||
  (g._mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  }));

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
