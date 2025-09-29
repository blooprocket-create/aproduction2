
const { pool } = require('./util/db');
const { json } = require('./util/http');

exports.handler = async (event) => {
  const onlyPublished = event.queryStringParameters?.published !== 'false';
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT id, title, slug, description, hours, level, price, image, published, sales
      FROM courses
      ${onlyPublished ? 'WHERE published=true' : ''}
      ORDER BY sales DESC NULLS LAST, title ASC
      LIMIT 200
    `);
    return json(200, { courses: res.rows });
  } finally {
    client.release();
  }
};
