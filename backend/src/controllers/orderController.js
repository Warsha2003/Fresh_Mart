/**
 * Order Controller
 * Manages order creation, slot assignment, order status tracking, and cancellation.
 */
const Order = require('../models/Order');
const Slot = require('../models/Slot');
const Address = require('../models/Address');
const Payment = require('../models/Payment');

// Helper to generate unique order number like #FM-98432
const generateOrderNumber = () => {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
  return `#FM-${randomFiveDigits}`;
};

// @desc    Get active draft order for checkout, or create one if none exists
// @route   GET /api/orders/current
// @access  Private
const getCurrentOrder = async (req, res, next) => {
  try {
    let order = await Order.findOne({
      user: req.user._id,
      status: 'draft',
    })
      .populate('slot')
      .populate('deliveryAddress');

    // If no draft order exists, create a default cart order matching Figma items
    if (!order) {
      // Find default address if available
      const defaultAddress = await Address.findOne({ user: req.user._id, isDefault: true });

      order = await Order.create({
        orderNumber: generateOrderNumber(),
        user: req.user._id,
        fulfillmentType: 'pickup',
        items: [
          {
            name: 'Basmati Rice 5kg',
            quantity: 1,
            price: 800,
            unit: '5 kg',
          },
          {
            name: 'Coconut Oil 1L',
            quantity: 1,
            price: 1200,
            unit: '1 L',
          },
        ],
        subtotal: 2000,
        deliveryFee: 50,
        totalAmount: 2050,
        status: 'draft',
        deliveryAddress: defaultAddress ? defaultAddress._id : null,
        storeAddress: '203 Galle Road, Colombo 03',
        estimatedTime: '12:15 PM',
      });

      order = await Order.findById(order._id)
        .populate('slot')
        .populate('deliveryAddress');
    }

    res.status(200).json({
      success: true,
      data: order,
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
    const { slotId, fulfillmentType } = req.body;

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

    const newSlot = await Slot.findById(slotId);
    if (!newSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found.',
      });
    }

    // Check if new slot is full
    if (newSlot.isFull || newSlot.bookedCount >= newSlot.maxCapacity) {
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
    if (fulfillmentType) {
      order.fulfillmentType = fulfillmentType;
      // Adjust delivery fee if pickup vs delivery
      if (fulfillmentType === 'pickup') {
        order.deliveryFee = 0;
        order.totalAmount = order.subtotal;
      } else {
        order.deliveryFee = 50;
        order.totalAmount = order.subtotal + 50;
      }
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

// @desc    Update order status (for viva tracking simulation)
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

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

    order.status = status;
    await order.save();

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

// @desc    Cancel order (releases slot)
// @route   DELETE /api/orders/:id
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

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled.',
      });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivered orders cannot be cancelled.',
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

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order has been cancelled successfully.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active/pending delivery orders for delivery partner (Screen 21)
// @route   GET /api/orders/delivery/list
// @access  Private
const getDeliveryOrders = async (req, res, next) => {
  try {
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

    order.status = 'out_for_delivery';
    await order.save();

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

    order.status = 'delivered';
    await order.save();
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
  updateOrderSlot,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getDeliveryOrders,
  getDeliveryOrderById,
  startDelivery,
  completeDelivery,
};
