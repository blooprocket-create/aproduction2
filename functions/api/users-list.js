const { pool } = require('./util/db');
const { json, unauthorized, forbidden } = require('./util/http');
const { getAuth, requireRole } = require('./util/guard');

exports.handler = async (event) => {
  const auth = getAuth(event); if (!auth) return unauthorized();
  if (!requireRole(auth, ['admin'])) return forbidden();

  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 500');
    return json(200, { users: res.rows });
  } finally { client.release(); }
};
