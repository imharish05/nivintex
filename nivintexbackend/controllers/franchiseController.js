const FranchiseUser = require('../models/FranchiseUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────
// 🏢 FRANCHISE LOGIN
// ─────────────────────────────────────────
const loginFranchise = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const franchiseUser = await FranchiseUser.findOne({ where: { email } });
        if (!franchiseUser) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, franchiseUser.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: franchiseUser.id, franchise_id: franchiseUser.franchise_id }, 
            process.env.JWT_SECRET || 'secretkey', 
            { expiresIn: '1d' }
        );

        return res.json({ 
            success: true, 
            token, 
            franchise: {
                id: franchiseUser.id,
                franchise_id: franchiseUser.franchise_id,
                franchise_name: franchiseUser.franchise_name,
                email: franchiseUser.email
            }
        });
    } catch (err) {
        console.error('loginFranchise error:', err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ─────────────────────────────────────────
// 🏢 CREATE FRANCHISE USER (Admin Only)
// ─────────────────────────────────────────
const createFranchiseUser = async (req, res) => {
    try {
        const { franchise_id, franchise_name, email, password } = req.body;
        
        const existing = await FranchiseUser.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const existingFranchise = await FranchiseUser.findOne({ where: { franchise_id } });
        if (existingFranchise) {
            return res.status(400).json({ success: false, message: 'Franchise ID already has a user account' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const franchiseUser = await FranchiseUser.create({
            franchise_id,
            franchise_name,
            email,
            password: hashedPassword
        });

        return res.json({ success: true, message: 'Franchise user created successfully', user: franchiseUser });
    } catch (err) {
        console.error('createFranchiseUser error:', err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getAllFranchises = async (req, res) => {
    try {
        const Franchise = require('../models/Franchise');
        const franchises = await Franchise.findAll();
        res.json({ status: 200, franchises });
    } catch (err) {
        console.error('getAllFranchises error:', err);
        res.status(500).json({ error: err.message });
    }
};

const createFranchise = async (req, res) => {
    try {
        const Franchise = require('../models/Franchise');
        const { name } = req.body;
        if (!String(name || '').trim()) return res.status(400).json({ success: false, message: 'Franchise name is required.' });
        const allowed = ['owner_name', 'email', 'phone', 'gst', 'address', 'state_id', 'city_id', 'pincode_id', 'pincode', 'area_name', 'status'];
        const values = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
        const franchise = await Franchise.create({ ...values, name: String(name).trim() });
        return res.status(201).json({ success: true, franchise });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const updateFranchise = async (req, res) => {
    try {
        const Franchise = require('../models/Franchise');
        const franchise = await Franchise.findByPk(req.params.id);
        if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found.' });
        const allowed = ['name', 'owner_name', 'email', 'phone', 'gst', 'address', 'state_id', 'city_id', 'pincode_id', 'pincode', 'area_name', 'status'];
        const values = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
        if (values.name !== undefined && !String(values.name).trim()) return res.status(400).json({ success: false, message: 'Franchise name cannot be empty.' });
        if (values.name) values.name = String(values.name).trim();
        await franchise.update(values);
        return res.json({ success: true, franchise });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const deleteFranchise = async (req, res) => {
    try {
        const Franchise = require('../models/Franchise');
        const franchise = await Franchise.findByPk(req.params.id);
        if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found.' });
        await franchise.destroy();
        return res.json({ success: true, message: 'Franchise deleted.' });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = {
    loginFranchise,
    createFranchiseUser,
    getAllFranchises,
    createFranchise,
    updateFranchise,
    deleteFranchise
};
