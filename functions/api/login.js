
const bcrypt = require('bcryptjs');
const { pool } = require('./util/db');
const { json, badRequest, readJSON } = require('./util/http');
const { sign } = require('./util/jwt');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const { email, password } = await readJSON(event);
  if (!email || !password) return badRequest('Email and password required.');

  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, name, email, role, password_hash FROM users WHERE lower(email)=lower($1)', [email]);
    if (res.rowCount === 0) return json(401, { error: 'Invalid credentials.' });
    const u = res.rows[0];
    const ok = await bcrypt.compare(password, u.password_hash || '');
    if (!ok) return json(401, { error: 'Invalid credentials.' });
    const token = sign({ id: u.id, role: u.role, email: u.email, name: u.name });
    return json(200, { user: { id: u.id, name: u.name, email: u.email, role: u.role }, token });
  } finally {
    client.release();
  }
};
