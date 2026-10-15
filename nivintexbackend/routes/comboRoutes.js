const express = require('express');
const router = express.Router();
const {
  upload,
  getAllRootCombos,
  getStorefrontCombos,
  addRootCombo,
  updateRootCombo,
  deleteRootCombo,
  getChildrenByRoot,
  addChildCombo,
  updateChildCombo,
  deleteChildCombo
} = require('../controllers/comboController');

// Root Combo routes
router.get('/', getAllRootCombos);
router.get('/storefront', getStorefrontCombos);
router.post('/add', upload.single('image'), addRootCombo);
router.put('/update/:id', upload.single('image'), updateRootCombo);
router.delete('/:id', deleteRootCombo);

// Child Combo routes
router.get('/:rootComboId/children', getChildrenByRoot);
router.post('/children/add', upload.single('image'), addChildCombo);
router.put('/children/update/:id', upload.single('image'), updateChildCombo);
router.delete('/children/:id', deleteChildCombo);

module.exports = router;
