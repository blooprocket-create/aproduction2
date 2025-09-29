const bcrypt = require('bcryptjs');
const { pool } = require('./util/db');
const { json, badRequest, readJSON, unauthorized, forbidden } = require('./util/http');
const { getAuth, requireRole } = require('./util/guard');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error:'Method Not Allowed' });

  const auth = getAuth(event); if (!auth) return unauthorized();
  if (!requireRole(auth, ['admin'])) return forbidden();

  const { name, email, role='customer', password } = await readJSON(event);
  if (!name || !email) return badRequest('Name and email required.');

  const client = await pool.connect();
  try {
    const exists = await client.query('SELECT 1 FROM users WHERE lower(email)=lower($1)', [email]);
    if (exists.rowCount) return json(409, { error:'Email already exists' });

    const hash = password ? await bcrypt.hash(password, 10) : null;
    const res = await client.query(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, created_at',
      [name, email, role, hash]
    );
    return json(200, { user: res.rows[0] });
  } finally { client.release(); }
};
