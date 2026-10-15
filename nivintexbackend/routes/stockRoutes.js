const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const requireAdmin = require('../middleware/requireAdmin');

router.post('/add', stockController.createStock);
router.post('/decrement', requireAdmin, stockController.decrementBillingStock);
router.get('/', stockController.getAllStock);
router.get('/:id', stockController.getStockById);
router.put('/update/:id', stockController.updateStock);
router.delete('/:id', stockController.deleteStock);

module.exports = router;
