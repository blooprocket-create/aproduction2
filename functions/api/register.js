
const bcrypt = require('bcryptjs');
const { pool } = require('./util/db');
const { json, badRequest, readJSON } = require('./util/http');
const { sign } = require('./util/jwt');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const { name, email, password } = await readJSON(event);
  if (!name || !email || !password) return badRequest('Name, email, and password are required.');

  const client = await pool.connect();
  try {
    const exists = await client.query('SELECT id FROM users WHERE lower(email)=lower($1)', [email]);
    if (exists.rowCount > 0) return json(409, { error: 'Email already registered.' });

    const hash = await bcrypt.hash(password, 10);
    const role = 'customer';
    const result = await client.query(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role',
      [name, email, role, hash]
    );
    const user = result.rows[0];
    const token = sign({ id: user.id, role: user.role, email: user.email, name: user.name });
    return json(200, { user, token });
  } finally {
    client.release();
  }
};
