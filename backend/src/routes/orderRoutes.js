/**
 * Order Routes
 * /api/orders
 */
const express = require('express');
const router = express.Router();
const {
  getCurrentOrder,
  getMyOrders,
  updateOrderSlot,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getDeliveryOrders,
  getDeliveryOrderById,
  startDelivery,
  completeDelivery,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect); // All order routes require JWT authentication

router.get('/current', getCurrentOrder);
router.get('/history', getMyOrders);
router.get('/delivery/list', getDeliveryOrders);
router.get('/delivery/:id', getDeliveryOrderById);
router.patch('/:id/start-delivery', startDelivery);
router.patch('/:id/complete-delivery', completeDelivery);
router.put('/:id/slot', updateOrderSlot);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.delete('/:id', cancelOrder);

module.exports = router;
