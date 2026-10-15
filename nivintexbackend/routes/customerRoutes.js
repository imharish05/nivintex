const express    = require('express');
const router     = express.Router();
const Customer   = require('../models/Customer');  
const customerController = require('../controllers/customerController');

router.post('/add',        customerController.addCustomer);
router.get('/',            customerController.getAllCustomers);

// ✅ by-email route
router.get('/by-email', async (req, res) => {
    try {
        const customer = await Customer.findOne({ 
            where:      { email: req.query.email },
            attributes: ['id', 'name', 'email', 'phone']
        });
        if (!customer) return res.status(404).json({ error: 'Not found' });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/update/:id',  customerController.updateCustomer);
router.delete('/:id',      customerController.deleteCustomer);

module.exports = router;