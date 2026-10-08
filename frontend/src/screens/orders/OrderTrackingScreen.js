/**
 * Screen 11: Order Tracking
 * Matches Figma design 11_order-tr...
 * 
 * Reads order status and details, and lets customers cancel placed orders or change
 * the fulfillment slot while the order is still placed.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import ScreenHeader from '../../components/ScreenHeader';
import StatusStep from '../../components/StatusStep';
import AppButton from '../../components/AppButton';
import client from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import CustomerBottomBar, { CUSTOMER_BOTTOM_BAR_HEIGHT } from '../../components/CustomerBottomBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const statusSequence = ['placed', 'packed', 'out_for_delivery', 'delivered'];

const OrderTrackingScreen = ({ navigation, route }) => {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const insets = useSafeAreaInsets();

  // CRUD Operation 1: READ Order Details & Status
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    try {
      setOrder(null);
      setLoading(true);
      const res = await client.get(`/orders/${orderId}`);
      if (res.data?.data) {
        setOrder(res.data.data);
      } else {
        setOrder(null);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not load order tracking details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(useCallback(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]));

  // Cancel a placed order by changing its status.
  const handleCancelOrder = () => {
    if (!order) return;
    if (order.status !== 'placed') {
      Alert.alert('Cannot Cancel', 'Only placed orders can be cancelled.');
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This will release your selected time slot.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const res = await client.patch(`/orders/${order._id}/cancel`);
              if (res.data?.success) {
                Alert.alert('Order Cancelled', 'Your order has been cancelled and slot released.');
                setOrder(res.data.data);
              }
            } catch (err) {
              Alert.alert('Cancellation Failed', err.message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleChangeSlot = () => navigation.navigate('TimeSlot', {
    orderId: order._id,
    changeExistingOrder: true,
    fulfillmentType: order.fulfillmentType,
  });

  const getStepStatus = (stepName) => {
    if (!order) return 'pending';
    if (order.status === 'cancelled') return 'pending';

    const currentIdx = statusSequence.indexOf(order.status);
    const stepIdx = statusSequence.indexOf(stepName);

    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'active';
    return 'pending';
  };

  const itemCount = order?.items?.reduce((count, item) => count + item.quantity, 0) || 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Order Tracking"
        onBack={() => navigation.navigate('MainTabs')}
        rightAction={
          <TouchableOpacity onPress={fetchOrderDetails} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh" size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching tracking status...</Text>
        </View>
      ) : !order ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.disabled} />
          <Text style={styles.emptyText}>
            {orderId ? 'No order found for this tracking link.' : 'An order ID is required to track an order.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: CUSTOMER_BOTTOM_BAR_HEIGHT + insets.bottom + 16 },
          ]}
        >
          {/* Green Status Banner */}
          <View
            style={[
              styles.bannerCard,
              order.status === 'cancelled' && styles.bannerCancelled,
            ]}
          >
            <View style={styles.bannerLeft}>
              <View style={styles.bannerIconCircle}>
                <Ionicons
                  name={order.status === 'cancelled' ? 'close' : 'checkmark'}
                  size={20}
                  color={order.status === 'cancelled' ? colors.danger : colors.primary}
                />
              </View>
              <View style={styles.bannerTextCol}>
                <Text style={styles.bannerTitle}>
                  {order.status === 'cancelled' ? 'Order Cancelled' : 'Order Success!'}
                </Text>
                <Text style={styles.bannerSubtitle}>{order.orderNumber}</Text>
              </View>
            </View>

            <View style={styles.bannerRight}>
              <Text style={styles.estimatedLabel}>Estimated</Text>
              <Text style={styles.estimatedTime}>{order.estimatedTime || '12:15 PM'}</Text>
            </View>
          </View>

          {/* Delivery Status Timeline Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>
              {order.fulfillmentType === 'delivery' ? 'Delivery Status' : 'Pickup Status'}
            </Text>

            <View style={styles.timelineContainer}>
              <StatusStep
                title="Order Placed"
                subtitle="Today, 9:20 AM"
                status={getStepStatus('placed')}
              />
              <StatusStep
                title="Packed"
                subtitle="Items packaged and ready"
                status={getStepStatus('packed')}
              />
              <StatusStep
                title={order.fulfillmentType === 'delivery' ? 'Out for Delivery' : 'Ready for Counter Pickup'}
                subtitle="Assigned to dispatch partner"
                status={getStepStatus('out_for_delivery')}
              />
              <StatusStep
                title="Delivered"
                subtitle={order.fulfillmentType === 'delivery' ? 'Delivered to your address' : 'Collected by customer'}
                status={getStepStatus('delivered')}
                isLast={true}
              />
            </View>

          </View>

          {/* Items Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Items Summary · {itemCount} items</Text>
            <View style={styles.itemsDivider} />

            {(order.items || []).map((item, idx) => (
              <View key={idx} style={styles.itemSummaryRow}>
                <Ionicons name="basket-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.itemSummaryName}>{item.name}</Text>
                <Text style={styles.itemSummaryQty}>x{item.quantity}</Text>
                <Text style={styles.itemSummaryPrice}>Rs. {item.price * item.quantity}</Text>
              </View>
            ))}
            <View style={styles.itemsDivider} />
            <OrderPriceRow label="Subtotal" amount={order.subtotal} />
            {order.promoCode ? (
              <OrderPriceRow label={`Discount (${order.promoCode})`} amount={-Number(order.discountAmount || 0)} discount />
            ) : null}
            <OrderPriceRow label="Delivery charge" amount={order.deliveryFee} />
            <View style={styles.itemsDivider} />
            <OrderPriceRow label="Total" amount={order.totalAmount} total />
          </View>

          {/* Address / Location Card */}
          <View style={styles.card}>
            <View style={styles.addressRow}>
              <View style={styles.addressIconCircle}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressType}>
                  {order.fulfillmentType === 'delivery' ? 'Delivery Destination' : 'Store Pickup Location'}
                </Text>
                <Text style={styles.addressText}>
                  {order.deliveryAddress?.addressLine
                    ? `${order.deliveryAddress.addressLine}, ${order.deliveryAddress.city}`
                    : order.storeAddress || '203 Galle Road, Colombo 03'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <AppButton
              title="Back to Home"
              onPress={() => navigation.navigate('MainTabs')}
            />

            {order.status === 'placed' ? (
              <AppButton
                title="Change delivery slot"
                variant="outline"
                onPress={handleChangeSlot}
                icon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
                style={styles.actionButton}
              />
            ) : null}
            {order.status === 'placed' ? (
              <AppButton
                title="Cancel Order"
                variant="danger"
                onPress={handleCancelOrder}
                loading={cancelling}
                icon={<Ionicons name="trash-outline" size={18} color={colors.danger} />}
              />
            ) : null}
          </View>
        </ScrollView>
      )}
      {order && !loading ? <CustomerBottomBar navigation={navigation} /> : null}
    </View>
  );
};

const OrderPriceRow = ({ label, amount, discount, total }) => (
  <View style={styles.orderPriceRow}>
    <Text style={[styles.orderPriceLabel, total && styles.orderPriceTotal, discount && styles.orderDiscount]}>
      {label}
    </Text>
    <Text style={[styles.orderPriceAmount, total && styles.orderPriceTotal, discount && styles.orderDiscount]}>
      {Number.isFinite(Number(amount))
        ? amount < 0
          ? `- Rs. ${Math.abs(amount)}`
          : `Rs. ${amount}`
        : 'Unavailable'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 44,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F5C2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerCancelled: {
    backgroundColor: colors.dangerLight,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextCol: {},
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#A7F3D0',
    fontWeight: '600',
    marginTop: 2,
  },
  bannerRight: {
    alignItems: 'flex-end',
  },
  estimatedLabel: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '500',
  },
  estimatedTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  timelineContainer: {
    paddingLeft: 4,
    paddingTop: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPriceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  orderPriceLabel: { color: colors.textSecondary, fontSize: 13 },
  orderPriceAmount: { color: colors.text, fontSize: 13, fontWeight: '700' },
  orderPriceTotal: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  orderDiscount: { color: colors.primaryDark },
  itemsDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 10,
  },
  itemSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemSummaryName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  itemSummaryQty: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 14,
  },
  itemSummaryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 10,
  },
});

export default OrderTrackingScreen;
