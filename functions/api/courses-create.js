
const { pool } = require('./util/db');
const { json, badRequest, readJSON, unauthorized, forbidden } = require('./util/http');
const { getAuth, requireRole } = require('./util/guard');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const auth = getAuth(event); if (!auth) return unauthorized();
  if (!requireRole(auth, ['admin','editor'])) return forbidden();

  const { title, description, hours, level, price, image, published } = await readJSON(event);
  if (!title) return badRequest('Title required.');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

  const client = await pool.connect();
  try {
    const res = await client.query(`
      INSERT INTO courses (title, slug, description, hours, level, price, image, published, sales)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0)
      RETURNING id, title, slug, description, hours, level, price, image, published, sales
    `, [title, slug, description||'', hours||0, level||'', price||0, image||'', !!published]);
    return json(200, { course: res.rows[0] });
  } finally {
    client.release();
  }
};
