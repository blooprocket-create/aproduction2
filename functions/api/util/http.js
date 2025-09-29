
function json(status, body, headers={}) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }, body: JSON.stringify(body) };
}
function badRequest(msg='Bad Request') { return json(400, { error: msg }); }
function unauthorized(msg='Unauthorized') { return json(401, { error: msg }); }
function forbidden(msg='Forbidden') { return json(403, { error: msg }); }
function notFound(msg='Not Found') { return json(404, { error: msg }); }

async function readJSON(event) {
  try { return JSON.parse(event.body || '{}'); } catch { return {}; }
}
module.exports = { json, badRequest, unauthorized, forbidden, notFound, readJSON };
