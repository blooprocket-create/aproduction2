
const { verify } = require('./jwt');

function getAuth(event) {
  const hdr = event.headers?.authorization || event.headers?.Authorization || '';
  const m = hdr.match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  const decoded = verify(m[1]);
  return decoded;
}

function requireRole(decoded, roles = []) {
  if (!decoded) return false;
  if (!roles || roles.length === 0) return !!decoded;
  return roles.includes(decoded.role);
}

module.exports = { getAuth, requireRole };
