const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Public: submit contact form
router.post('/submit', contactController.submitContact);

// SSE stream for admin to receive new contact notifications
router.get('/stream', contactController.streamContacts);

// Admin: get all contacts (with optional status filter)
router.get('/all', contactController.getAllContacts);

// Admin: get single contact by ID
router.get('/:id', contactController.getContactById);

// Admin: update status (new | read | replied)
router.patch('/:id/status', contactController.updateContactStatus);

// Admin: delete a contact
router.delete('/:id', contactController.deleteContact);

module.exports = router;