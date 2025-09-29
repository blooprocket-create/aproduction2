const { pool } = require('./util/db');
const { json, badRequest, readJSON, unauthorized, forbidden } = require('./util/http');
const { getAuth, requireRole } = require('./util/guard');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const auth = getAuth(event); if (!auth) return unauthorized();
  if (!requireRole(auth, ['admin','editor'])) return forbidden();

  const { id, title, description, hours, level, price, image, published } = await readJSON(event);
  if (!id) return badRequest('id required');

  const client = await pool.connect();
  try {
    const res = await client.query(`
      UPDATE courses
         SET title = COALESCE($2, title),
             description = COALESCE($3, description),
             hours = COALESCE($4, hours),
             level = COALESCE($5, level),
             price = COALESCE($6, price),
             image = COALESCE($7, image),
             published = COALESCE($8, published)
       WHERE id = $1
     RETURNING id, title, slug, description, hours, level, price, image, published, sales
    `, [id, title, description, hours, level, price, image, typeof published==='boolean'?published:null]);
    if (res.rowCount === 0) return json(404, { error: 'Course not found' });
    return json(200, { course: res.rows[0] });
  } finally { client.release(); }
};
