/**
 * Profile Routes
 * /api/profile
 */
const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  createAddress,
  deleteAddress,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect); // All profile routes require JWT authentication

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.get('/addresses', getAddresses);
router.post('/addresses', createAddress);
router.delete('/addresses/:id', deleteAddress);

module.exports = router;
