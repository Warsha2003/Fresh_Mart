/**
 * Payment Routes
 * /api/payments
 */
const express = require('express');
const router = express.Router();
const { createPayment, getPaymentByOrder } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect); // All payment routes require JWT authentication

router.post('/', createPayment);
router.get('/order/:orderId', getPaymentByOrder);

module.exports = router;
