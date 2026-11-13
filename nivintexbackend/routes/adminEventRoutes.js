const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { subscribe } = require('../services/adminOrderEvents');

const router = express.Router();

router.get('/orders', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, { attributes: ['id'] });
    if (!user) return res.status(401).json({ success: false, message: 'Admin authentication required.' });
    return subscribe(req, res);
  } catch (_) {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  }
});

module.exports = router;
