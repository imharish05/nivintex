const express = require('express');
const router = express.Router();
const { loginFranchise, createFranchiseUser, getAllFranchises, createFranchise, updateFranchise, deleteFranchise } = require('../controllers/franchiseController');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', getAllFranchises);
router.post('/', requireAdmin, createFranchise);
router.put('/:id', requireAdmin, updateFranchise);
router.delete('/:id', requireAdmin, deleteFranchise);
router.post('/login', loginFranchise);
router.post('/create', createFranchiseUser);

module.exports = router;
