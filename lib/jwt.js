
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const sign = (payload, opts={}) => jwt.sign(payload, SECRET, { expiresIn: '7d', ...opts });
const verify = (token) => { try { return jwt.verify(token, SECRET); } catch { return null; } };
module.exports = { sign, verify };
