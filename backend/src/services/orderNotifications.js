const Notification = require('../models/Notification');

const STATUS_MESSAGES = {
  placed: 'has been placed',
  packed: 'has been packed',
  out_for_delivery: 'is out for delivery',
  delivered: 'has been delivered',
  cancelled: 'has been cancelled',
};

const notifyOrderStatusChange = async (order, previousStatus) => {
  if (!order || order.status === previousStatus || !STATUS_MESSAGES[order.status]) {
    return null;
  }

  const userId = order.user?._id || order.user;
  return Notification.create({
    user: userId,
    title: 'Order update',
    message: `Your order ${order.orderNumber} ${STATUS_MESSAGES[order.status]}.`,
    type: 'order_status',
    orderId: order._id,
  });
};

module.exports = { notifyOrderStatusChange };
