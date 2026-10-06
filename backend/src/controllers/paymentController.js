/**
 * Payment Controller
 * Handles payment creation (card simulation & cash on pickup), receipt generation,
 * and order state transition to 'placed'.
 * 
 * SECURITY COMPLIANCE NOTE:
 * Full credit card number and CVV are NEVER stored, logged, or retained.
 * Only cardBrand and last4 digits are recorded.
 * Payment processing is simulated for this university assignment.
 */
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');

// Helper to determine card brand from prefix
const detectCardBrand = (cardNumber) => {
  if (!cardNumber) return 'Card';
  const clean = cardNumber.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'Visa';
  if (/^5[1-5]/.test(clean)) return 'Mastercard';
  if (/^3[47]/.test(clean)) return 'Amex';
  return 'Card';
};

// @desc    Process simulated payment and place order
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res, next) => {
  try {
    const { orderId, method, cardNumber, cardExpiry, cardCvv, cardHolderName } = req.body;

    if (!orderId || !method) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and payment method are required.',
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    }).populate('slot');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const supportedMethods = ['card', 'cash_on_pickup', 'cash_on_delivery'];
    if (!supportedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Allowed values: ${supportedMethods.join(', ')}.`,
      });
    }

    if (
      (method === 'cash_on_delivery' && order.fulfillmentType !== 'delivery') ||
      (method === 'cash_on_pickup' && order.fulfillmentType !== 'pickup')
    ) {
      return res.status(400).json({
        success: false,
        message: 'The selected cash payment method does not match the order fulfillment type.',
      });
    }

    if (order.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `This order is already in '${order.status}' status.`,
      });
    }

    if (!order.slot) {
      return res.status(400).json({
        success: false,
        message: 'Please select a pickup or delivery time slot before proceeding to payment.',
      });
    }

    let cardBrand = null;
    let last4 = null;

    if (method === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 15) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid credit or debit card number.',
        });
      }

      const cleanNum = cardNumber.replace(/\s/g, '');
      last4 = cleanNum.slice(-4);
      cardBrand = detectCardBrand(cleanNum);

      // SECURITY AUDIT: CVV and full card number are discarded here and NEVER persisted or logged
    }

    // Generate unique simulated transaction reference
    const transactionRef = `TXN-SIM-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    // Create payment record
    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      method,
      cardBrand,
      last4,
      amount: order.totalAmount,
      currency: 'LKR',
      status: method === 'cash_on_delivery' ? 'pending' : 'successful',
      transactionRef,
      isSimulated: true,
    });

    // Update order status to placed
    order.status = 'placed';
    await order.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'stats.ordersCount': 1,
        'stats.totalSpent': order.totalAmount,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully.',
      data: {
        payment,
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment receipt summary for an order
// @route   GET /api/payments/order/:orderId
// @access  Private
const getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      order: req.params.orderId,
      user: req.user._id,
    }).populate('order');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found for this order.',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPaymentByOrder,
};
