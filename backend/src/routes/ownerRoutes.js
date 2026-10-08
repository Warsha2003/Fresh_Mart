/**
 * Owner Routes
 * /api/owner
 * Protects all routes with JWT authentication and provides full CRUD for the Shop Owner portal.
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboard,
  getOrders,
  getOrderById,
  acceptOrder,
  rejectOrder,
  getOrderPrep,
  updateOrderPrep,
  markReadyForDelivery,
  getInventoryProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  getOwnerProfileStats,
} = require('../controllers/ownerController');

// All owner routes require JWT authentication
router.use(protect);

// Dashboard
router.get('/dashboard', getDashboard);

// Orders Workflow
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/accept', acceptOrder);
router.patch('/orders/:id/reject', rejectOrder);
router.get('/orders/:id/prep', getOrderPrep);
router.patch('/orders/:id/prep', updateOrderPrep);
router.post('/orders/:id/ready', markReadyForDelivery);

// Inventory Catalog CRUD
router.get('/products', getInventoryProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Fulfillment Slots CRUD
router.get('/slots', getSlots);
router.post('/slots', createSlot);
router.put('/slots/:id', updateSlot);
router.delete('/slots/:id', deleteSlot);

// Profile Stats
router.get('/profile-stats', getOwnerProfileStats);

module.exports = router;
