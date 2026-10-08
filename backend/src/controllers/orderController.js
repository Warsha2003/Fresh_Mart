/**
 * Order Controller
 * Manages order creation, slot assignment, order status tracking, and cancellation.
 */
const Order = require('../models/Order');
const Slot = require('../models/Slot');
const Address = require('../models/Address');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const { notifyOrderStatusChange } = require('../services/orderNotifications');
const {
  DELIVERY_CHARGE,
  FREE_DELIVERY_THRESHOLD,
  PROMO_CODES,
  calculatePromoDiscount,
} = require('../config/customerConstants');

const getDeliveryCharge = (subtotal) =>
  subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;

// Helper to generate order numbers like #CD-98432
const generateOrderNumber = () => {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
  return `#CD-${randomFiveDigits}`;
};

// @desc    Get active draft order for checkout, or create one if none exists
// @route   GET /api/orders/current
// @access  Private
const getCurrentOrder = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .populate('selectedAddress');
    const items = (cart?.items || [])
      .filter((item) => item.product && item.product.isActive)
      .map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.unitPrice,
        unit: item.product.packSize,
      }));

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Add products before checkout.',
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let order = await Order.findOne({
      user: req.user._id,
      status: 'draft',
    })
      .populate('slot')
      .populate('deliveryAddress');

    if (!order) {
      order = await Order.create({
        orderNumber: generateOrderNumber(),
        user: req.user._id,
        fulfillmentType: 'pickup',
        items,
        subtotal,
        deliveryFee: 0,
        totalAmount: subtotal,
        status: 'draft',
        deliveryAddress: cart.selectedAddress?._id || null,
        storeAddress: '203 Galle Road, Colombo 03',
        estimatedTime: '12:15 PM',
      });
    } else {
      order.items = items;
      order.subtotal = subtotal;
      order.deliveryAddress = cart.selectedAddress?._id || null;
      order.discountAmount = calculatePromoDiscount(order.promoCode, subtotal);
      order.deliveryFee = order.fulfillmentType === 'delivery' ? getDeliveryCharge(subtotal) : 0;
      order.totalAmount = order.subtotal - order.discountAmount + order.deliveryFee;
      await order.save();
    }

    order = await Order.findById(order._id).populate('slot').populate('deliveryAddress');
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List the current customer's non-draft orders
// @route   GET /api/orders/history
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      status: { $ne: 'draft' },
    })
      .populate('slot')
      .populate('deliveryAddress')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order's assigned slot & fulfillment type
// @route   PUT /api/orders/:id/slot
// @access  Private
const updateOrderSlot = async (req, res, next) => {
  try {
    const { slotId, fulfillmentType, promoCode } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid slotId.',
      });
    }
    if (!['draft', 'placed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only draft or placed orders can change their time slot.',
      });
    }
    if (order.status === 'placed' && fulfillmentType && fulfillmentType !== order.fulfillmentType) {
      return res.status(400).json({
        success: false,
        message: 'A placed order can only change its time slot.',
      });
    }
    if (fulfillmentType && !['pickup', 'delivery'].includes(fulfillmentType)) {
      return res.status(400).json({
        success: false,
        message: 'Fulfillment type must be pickup or delivery.',
      });
    }
    if (
      order.status === 'draft' &&
      promoCode !== undefined &&
      promoCode &&
      !PROMO_CODES[promoCode.trim().toUpperCase()]
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promo code.',
      });
    }

    const newSlot = await Slot.findById(slotId);
    if (!newSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found.',
      });
    }

    const nextFulfillmentType = fulfillmentType || order.fulfillmentType;
    if (newSlot.type !== nextFulfillmentType) {
      return res.status(400).json({
        success: false,
        message: 'The selected slot does not match the order fulfillment type.',
      });
    }
    let selectedAddressId = order.deliveryAddress;
    if (nextFulfillmentType === 'delivery' && order.status === 'draft') {
      const cart = await Cart.findOne({ user: req.user._id }).populate('selectedAddress');
      const selectedAddress = cart?.selectedAddress ||
        await Address.findOne({ user: req.user._id, isDefault: true });
      if (!selectedAddress) {
        return res.status(400).json({
          success: false,
          message: 'Please select a saved delivery address before booking a delivery slot.',
        });
      }
      selectedAddressId = selectedAddress._id;
    }
    if (nextFulfillmentType === 'delivery' && !selectedAddressId) {
      return res.status(400).json({
        success: false,
        message: 'The delivery address for this order is missing.',
      });
    }

    // Check if new slot is full
    const changingSlot = !order.slot || order.slot.toString() !== slotId;
    if (
      changingSlot &&
      (newSlot.isFull || newSlot.bookedCount >= newSlot.maxCapacity)
    ) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is full. Please choose another slot.',
      });
    }

    // If order already had a different slot, decrement the old slot's count
    if (order.slot && order.slot.toString() !== slotId) {
      const oldSlot = await Slot.findById(order.slot);
      if (oldSlot) {
        oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - 1);
        oldSlot.isFull = oldSlot.bookedCount >= oldSlot.maxCapacity;
        await oldSlot.save();
      }
    }

    // If assigning this slot for the first time
    if (!order.slot || order.slot.toString() !== slotId) {
      newSlot.bookedCount += 1;
      newSlot.isFull = newSlot.bookedCount >= newSlot.maxCapacity;
      await newSlot.save();
    }

    order.slot = newSlot._id;
    if (order.status === 'draft') {
      order.deliveryAddress = nextFulfillmentType === 'delivery' ? selectedAddressId : null;
      order.fulfillmentType = nextFulfillmentType;
      if (promoCode !== undefined) {
        order.promoCode = promoCode.trim().toUpperCase();
      }
      order.discountAmount = calculatePromoDiscount(order.promoCode, order.subtotal);
      order.deliveryFee = nextFulfillmentType === 'delivery'
        ? getDeliveryCharge(order.subtotal)
        : 0;
      order.totalAmount = order.subtotal - order.discountAmount + order.deliveryFee;
    }
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('slot')
      .populate('deliveryAddress');

    res.status(200).json({
      success: true,
      message: 'Fulfillment slot assigned to order successfully.',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('slot')
      .populate('deliveryAddress');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (delivery partner or shop owner)
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res, next) => {
  try {
    if (!['delivery', 'owner'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only delivery partners or owners can update order statuses.',
      });
    }
    const { status } = req.body;
    const allowedStatuses = ['placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (status === 'cancelled' && order.status !== 'placed') {
      return res.status(400).json({
        success: false,
        message: 'Only placed orders can be cancelled.',
      });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();
    await notifyOrderStatusChange(order, previousStatus);

    const updatedOrder = await Order.findById(order._id)
      .populate('slot')
      .populate('deliveryAddress');

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a placed order (releases slot)
// @route   PATCH /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.status !== 'placed') {
      return res.status(400).json({
        success: false,
        message: 'Only placed orders can be cancelled.',
      });
    }

    // Release slot booking count
    if (order.slot) {
      const slot = await Slot.findById(order.slot);
      if (slot) {
        slot.bookedCount = Math.max(0, slot.bookedCount - 1);
        slot.isFull = slot.bookedCount >= slot.maxCapacity;
        await slot.save();
      }
    }

    const previousStatus = order.status;
    order.status = 'cancelled';
    await order.save();
    await notifyOrderStatusChange(order, previousStatus);

    res.status(200).json({
      success: true,
      message: 'Order has been cancelled successfully.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a cancelled order belonging to the customer
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'cancelled',
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Cancelled order not found.',
      });
    }

    await Promise.all([
      Order.deleteOne({ _id: order._id, user: req.user._id, status: 'cancelled' }),
      Notification.deleteMany({ user: req.user._id, orderId: order._id }),
    ]);

    res.status(200).json({ success: true, message: 'Cancelled order permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active/pending delivery orders for delivery partner (Screen 21)
// @route   GET /api/orders/delivery/list
// @access  Private
const getDeliveryOrders = async (req, res, next) => {
  try {
    if (!['delivery', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Delivery access is required.' });
    }
    const orders = await Order.find({
      fulfillmentType: 'delivery',
      status: { $in: ['placed', 'packed', 'out_for_delivery'] },
    })
      .populate('user', 'name phone email')
      .populate('deliveryAddress')
      .sort({ createdAt: -1 });
    const payments = await Payment.find({
      order: { $in: orders.map((order) => order._id) },
    }).lean();
    const paymentsByOrder = new Map(
      payments.map((payment) => [payment.order.toString(), payment])
    );
    const ordersWithPayment = orders.map((order) => ({
      ...order.toObject(),
      payment: paymentsByOrder.get(order._id.toString()) || null,
    }));

    res.status(200).json({
      success: true,
      count: ordersWithPayment.length,
      data: ordersWithPayment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details for delivery partner (Screen 23)
// @route   GET /api/orders/delivery/:id
// @access  Private
const getDeliveryOrderById = async (req, res, next) => {
  try {
    if (!['delivery', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Delivery access is required.' });
    }
    const order = await Order.findOne({
      _id: req.params.id,
      fulfillmentType: 'delivery',
    })
      .populate('user', 'name phone email')
      .populate('deliveryAddress');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for delivery.',
      });
    }

    const payment = await Payment.findOne({ order: order._id }).lean();

    res.status(200).json({
      success: true,
      data: {
        ...order.toObject(),
        payment: payment || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start package delivery (Screen 22 / 23 -> Screen 24)
// @route   PATCH /api/orders/:id/start-delivery
// @access  Private
const startDelivery = async (req, res, next) => {
  try {
    if (!['delivery', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Delivery access is required.' });
    }
    const order = await Order.findOne({
      _id: req.params.id,
      fulfillmentType: 'delivery',
    })
      .populate('user', 'name phone email')
      .populate('deliveryAddress');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (!['placed', 'packed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Delivery cannot be started while the order is '${order.status}'.`,
      });
    }

    const previousStatus = order.status;
    order.status = 'out_for_delivery';
    await order.save();
    await notifyOrderStatusChange(order, previousStatus);

    res.status(200).json({
      success: true,
      message: 'Delivery started successfully.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete package delivery & collect cash (Screen 24 -> Screen 25)
// @route   PATCH /api/orders/:id/complete-delivery
// @access  Private
const completeDelivery = async (req, res, next) => {
  try {
    if (!['delivery', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Delivery access is required.' });
    }
    const order = await Order.findOne({
      _id: req.params.id,
      fulfillmentType: 'delivery',
    })
      .populate('user', 'name phone email')
      .populate('deliveryAddress');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'out_for_delivery') {
      return res.status(400).json({
        success: false,
        message: `Only orders out for delivery can be completed (current status: '${order.status}').`,
      });
    }

    const previousStatus = order.status;
    order.status = 'delivered';
    await order.save();
    await notifyOrderStatusChange(order, previousStatus);
    const payment = await Payment.findOne({ order: order._id });
    if (payment?.method === 'cash_on_delivery' && payment.status === 'pending') {
      payment.status = 'successful';
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Delivery marked as completed successfully.',
      data: {
        ...order.toObject(),
        payment: payment ? payment.toObject() : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentOrder,
  getMyOrders,
  updateOrderSlot,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getDeliveryOrders,
  getDeliveryOrderById,
  startDelivery,
  completeDelivery,
};
