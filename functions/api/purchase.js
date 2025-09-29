
const { pool } = require('./util/db');
const { json, badRequest, readJSON, unauthorized } = require('./util/http');
const { getAuth } = require('./util/guard');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const auth = getAuth(event); if (!auth) return unauthorized();
  const { courseId } = await readJSON(event);
  if (!courseId) return badRequest('courseId required.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO purchases (user_id, course_id) VALUES ($1,$2)
      ON CONFLICT DO NOTHING
    `, [auth.id, courseId]);
    await client.query('UPDATE courses SET sales = COALESCE(sales,0)+1 WHERE id=$1', [courseId]);
    await client.query('COMMIT');
    return json(200, { ok: true });
  } catch (e) {
    await client.query('ROLLBACK'); throw e;
  } finally {
    client.release();
  }
};
