
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function sign(payload, opts = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d', ...opts });
}
function verify(token) {
  try { return jwt.verify(token, SECRET); } catch (_) { return null; }
}
module.exports = { sign, verify };
