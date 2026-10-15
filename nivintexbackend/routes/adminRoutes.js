const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');


router.post('/admin/register', adminController.register);
router.post('/admin/login', adminController.login);

module.exports = router;