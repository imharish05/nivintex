const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function requireAdmin(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, { attributes: ['id'] });
    if (!user) return res.status(401).json({ success: false, message: 'Admin authentication required.' });
    req.admin = user;
    return next();
  } catch (_) {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  }
};
