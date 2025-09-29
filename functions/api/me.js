
const { pool } = require('./util/db');
const { json, unauthorized } = require('./util/http');
const { getAuth } = require('./util/guard');

exports.handler = async (event) => {
  const auth = getAuth(event);
  if (!auth) return unauthorized();
  const client = await pool.connect();
  try {
    const me = await client.query('SELECT id, name, email, role FROM users WHERE id=$1', [auth.id]);
    const owned = await client.query(`
      SELECT c.id, c.title, c.slug, c.price, c.level, c.hours, c.image
      FROM purchases p JOIN courses c ON c.id=p.course_id
      WHERE p.user_id=$1
      ORDER BY p.created_at DESC
    `, [auth.id]);
    return json(200, { user: me.rows[0], owned: owned.rows });
  } finally {
    client.release();
  }
};
