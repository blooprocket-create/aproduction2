
const { Pool } = require('pg');
const conn = process.env.DATABASE_URL;
if (!conn) throw new Error('Missing DATABASE_URL');
const useSSL = !/localhost|127\.0\.0\.1/.test(conn);
const pool = new Pool({ connectionString: conn, ssl: useSSL ? { rejectUnauthorized: false } : false });
module.exports = { pool };
