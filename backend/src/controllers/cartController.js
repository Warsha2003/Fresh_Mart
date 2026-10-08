/**
 * Cart Controller
 * Handles customer cart CRUD and selected delivery address persistence.
 */
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Address = require('../models/Address');
const { DELIVERY_CHARGE, FREE_DELIVERY_THRESHOLD } = require('../config/customerConstants');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    const defaultAddress = await Address.findOne({ user: userId, isDefault: true });
    cart = await Cart.create({
      user: userId,
      items: [],
      selectedAddress: defaultAddress ? defaultAddress._id : null,
    });
  }

  return cart;
};

const loadCart = async (cartId) =>
  Cart.findById(cartId)
    .populate('items.product')
    .populate('selectedAddress');

const serializeCart = (cart) => {
  const items = (cart.items || [])
    .filter((item) => item.product)
    .map((item) => {
      const product = item.product;
      const lineTotal = product.unitPrice * item.quantity;

      return {
        productId: product._id,
        id: product._id,
        name: product.name,
        category: product.category,
        packSize: product.packSize,
        unitPrice: product.unitPrice,
        imageKey: product.imageKey,
        imageUrl: product.imageUrl || '',
        stock: product.stock,
        isLowStock: product.stock > 0 && product.stock <= product.lowStockThreshold,
        isOutOfStock: product.stock <= 0,
        quantity: item.quantity,
        lineTotal,
      };
    });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: cart._id,
    items,
    itemCount,
    uniqueItemCount: items.length,
    subtotal,
    deliveryCharge: subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    selectedAddress: cart.selectedAddress || null,
    updatedAt: cart.updatedAt,
  };
};

const sendCart = async (res, cart) => {
  const hydrated = await loadCart(cart._id);
  res.status(200).json({
    success: true,
    data: serializeCart(hydrated),
  });
};

// @desc    Read current cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await sendCart(res, cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to cart; adding same product increments quantity
// @route   POST /api/cart/items
// @access  Private
const addCartItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const amount = Number(quantity);

    if (!productId || !Number.isInteger(amount) || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a productId and a positive quantity.',
      });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'This product is out of stock.' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existing = cart.items.find((item) => item.product.toString() === productId);
    const nextQuantity = (existing?.quantity || 0) + amount;

    if (nextQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) available in stock.`,
      });
    }

    if (existing) {
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({ product: product._id, quantity: amount });
    }

    await cart.save();
    await sendCart(res, cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a cart item quantity
// @route   PUT /api/cart/items/:productId
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive whole number.',
      });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) available in stock.`,
      });
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((cartItem) => cartItem.product.toString() === productId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    item.quantity = quantity;
    await cart.save();
    await sendCart(res, cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove one product from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private
const removeCartItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    await cart.save();
    await sendCart(res, cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all cart items
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    await sendCart(res, cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Persist selected address for cart/checkout
// @route   PUT /api/cart/address
// @access  Private
const setCartAddress = async (req, res, next) => {
  try {
    const { addressId } = req.body;
    const cart = await getOrCreateCart(req.user._id);

    if (!addressId) {
      cart.selectedAddress = null;
    } else {
      const address = await Address.findOne({ _id: addressId, user: req.user._id });
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found.',
        });
      }
      cart.selectedAddress = address._id;
    }

    await cart.save();
    await sendCart(res, cart);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  setCartAddress,
  serializeCart,
};
