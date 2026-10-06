/**
 * Slot Controller
 * Handles time slot retrieval and reservation.
 */
const Slot = require('../models/Slot');

// @desc    Get slots by date and fulfillment type
// @route   GET /api/slots
// @access  Public
const getSlots = async (req, res, next) => {
  try {
    const { date, type } = req.query;

    const query = {};
    if (date) query.date = date;
    if (type) query.type = type;

    // Sort by startTime
    const slots = await Slot.find(query).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reserve a slot (validates capacity)
// @route   POST /api/slots/:id/reserve
// @access  Private
const reserveSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found.',
      });
    }

    if (slot.isFull || slot.bookedCount >= slot.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is already full. Please select another slot.',
      });
    }

    slot.bookedCount += 1;
    if (slot.bookedCount >= slot.maxCapacity) {
      slot.isFull = true;
    }
    await slot.save();

    res.status(200).json({
      success: true,
      message: 'Slot reserved successfully.',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSlots,
  reserveSlot,
};
