/**
 * Product Routes
 * /api/products
 */
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getProductCategories,
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/meta/categories', getProductCategories);
router.get('/:idOrSlug', getProductById);

module.exports = router;
