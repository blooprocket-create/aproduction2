
const { verify } = require('./jwt');
function getAuth(req){
  const h = req.headers['authorization'] || req.headers['Authorization'];
  if(!h) return null;
  const m = /^Bearer\s+(.+)$/.exec(h);
  return m ? verify(m[1]) : null;
}
function requireRole(d, roles=[]){
  if(!d) return false; if(!roles.length) return !!d; return roles.includes(d.role);
}
module.exports = { getAuth, requireRole };
