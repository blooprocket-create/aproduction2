
const { pool } = require('./util/db');
const { json, readJSON } = require('./util/http');

exports.handler = async (event) => {
  if (event.httpMethod === 'POST') {
    const { email } = await readJSON(event);
    if (!email) return json(400, { error: 'Email required' });
    const client = await pool.connect();
    try {
      await client.query('INSERT INTO emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [email]);
      return json(200, { ok: true });
    } finally {
      client.release();
    }
  }
  if (event.httpMethod === 'GET') {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT email, created_at FROM emails ORDER BY created_at DESC LIMIT 500');
      return json(200, { emails: res.rows });
    } finally {
      client.release();
    }
  }
  return json(405, { error: 'Method Not Allowed' });
};
