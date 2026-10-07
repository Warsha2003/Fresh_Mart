/**
 * Favourite Controller
 * Handles customer saved-product CRUD.
 */
const Favourite = require('../models/Favourite');
const Product = require('../models/Product');
const User = require('../models/User');
const { normalizeProduct } = require('./productController');

const refreshSavedCount = async (userId) => {
  const count = await Favourite.countDocuments({ user: userId });
  await User.findByIdAndUpdate(userId, { 'stats.savedItems': count });
  return count;
};

// @desc    Read saved products
// @route   GET /api/favourites
// @access  Private
const getFavourites = async (req, res, next) => {
  try {
    const favourites = await Favourite.find({ user: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    const products = favourites
      .filter((item) => item.product && item.product.isActive)
      .map((item) => normalizeProduct(item.product));

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save a product
// @route   POST /api/favourites/:productId
// @access  Private
const addFavourite = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await Favourite.findOneAndUpdate(
      { user: req.user._id, product: product._id },
      { user: req.user._id, product: product._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const count = await refreshSavedCount(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Product saved.',
      count,
      data: normalizeProduct(product),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a saved product
// @route   DELETE /api/favourites/:productId
// @access  Private
const removeFavourite = async (req, res, next) => {
  try {
    await Favourite.findOneAndDelete({
      user: req.user._id,
      product: req.params.productId,
    });

    const count = await refreshSavedCount(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Product removed from saved list.',
      count,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavourites,
  addFavourite,
  removeFavourite,
};
