/**
 * Slot Routes
 * /api/slots
 */
const express = require('express');
const router = express.Router();
const { getSlots, reserveSlot } = require('../controllers/slotController');
const { protect } = require('../middleware/auth');

// Public route: list slots by date & type
router.get('/', getSlots);

// Private route: reserve a slot
router.post('/:id/reserve', protect, reserveSlot);

module.exports = router;
