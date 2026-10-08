/**
 * Product Controller
 * Provides read-only customer catalogue endpoints.
 */
const Product = require('../models/Product');

const normalizeProduct = (product) => ({
  id: product._id,
  _id: product._id,
  name: product.name,
  slug: product.slug,
  category: product.category,
  packSize: product.packSize,
  unitPrice: product.unitPrice,
  imageKey: product.imageKey,
  imageUrl: product.imageUrl || '',
  stock: product.stock,
  lowStockThreshold: product.lowStockThreshold,
  isLowStock: product.stock > 0 && product.stock <= product.lowStockThreshold,
  isOutOfStock: product.stock <= 0,
  description: product.description,
  origin: product.origin,
  deliveryEta: product.deliveryEta,
});

// @desc    List products with optional search/category filters
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    const query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const products = await Product.find(query).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products.map(normalizeProduct),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get one product by Mongo id or slug
// @route   GET /api/products/:idOrSlug
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const product = await Product.findOne({
      isActive: true,
      ...(isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }),
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: normalizeProduct(product),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List catalogue categories for filter chips
// @route   GET /api/products/meta/categories
// @access  Public
const getProductCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      data: ['All', ...categories.sort()],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductCategories,
  normalizeProduct,
};
