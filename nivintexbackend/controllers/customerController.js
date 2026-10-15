const Customer = require('../models/Customer');

exports.addCustomer = async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        const newCustomer = await Customer.create({
            name,
            phone: phone || null,
            email: email || null
        });

        res.status(201).json({ message: "Customer Registered!", data: newCustomer });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// 2. Get All Customers List
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.status(200).json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Update Customer Details
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await Customer.update(req.body, { where: { id } });
        res.status(200).json({ message: "Customer details updated!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Delete Customer
exports.deleteCustomer = async (req, res) => {
    try {
        await Customer.destroy({ where: { id: req.params.id } });
        res.status(200).json({ message: "Customer deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};