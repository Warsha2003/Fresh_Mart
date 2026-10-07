/**
 * Cart Routes
 * /api/cart
 */
const express = require('express');
const router = express.Router();
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  setCartAddress,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getCart);
router.post('/items', addCartItem);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/clear', clearCart);
router.put('/address', setCartAddress);

module.exports = router;
