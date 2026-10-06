/**
 * Screen 24: Navigation Map & Active Delivery
 * Matches Figma design 24_delivery-cust...
 * 
 * READ: Loads the active order and destination from the backend.
 * UPDATE: Completes delivery (PATCH /api/orders/:id/complete-delivery)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AppButton from '../../components/AppButton';
import client from '../../api/client';

const DeliveryMapScreen = ({ navigation, route }) => {
  const { orderId } = route.params || {};
  const [completing, setCompleting] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      if (orderId) {
        const response = await client.get(`/orders/delivery/${orderId}`);
        setOrder(response.data?.data || null);
      } else {
        const response = await client.get('/orders/delivery/list');
        const activeOrder = (response.data?.data || []).find(
          (item) => item.status === 'out_for_delivery'
        );
        setOrder(activeOrder || null);
      }
    } catch (error) {
      setLoadError(error.message || 'Could not load the delivery route.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const customerPhone = order?.user?.phone || '';
  const customerInitials = (order?.user?.name || 'Customer')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase())
    .join('');
  const deliveryAddress = order?.deliveryAddress
    ? [order.deliveryAddress.addressLine, order.deliveryAddress.city].filter(Boolean).join(', ')
    : '';
  const paymentSummary =
    order?.payment?.method === 'cash_on_delivery'
      ? `COD: Rs. ${order.totalAmount}`
      : order?.payment?.method === 'card'
        ? 'Paid online'
        : `Rs. ${order?.totalAmount || 0}`;

  const handleCallCustomer = () => {
    if (!customerPhone) {
      Alert.alert('Phone unavailable', 'No phone number is available for this customer.');
      return;
    }
    Alert.alert('Call Customer', `Dial ${customerPhone}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call',
        onPress: () =>
          Linking.openURL(`tel:${customerPhone}`).catch((error) =>
            Alert.alert('Unable to call', error.message)
          ),
      },
    ]);
  };

  const handleNavigateApp = () => {
    if (!deliveryAddress) {
      Alert.alert('Address unavailable', 'This order does not have a delivery address.');
      return;
    }
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(deliveryAddress)}`;
    Linking.openURL(mapsUrl).catch((error) =>
      Alert.alert('Unable to open navigation', error.message)
    );
  };

  // CRUD Operation: Mark as Delivered
  const handleMarkDelivered = async () => {
    if (!order?._id || order.status !== 'out_for_delivery') return;
    try {
      setCompleting(true);
      const response = await client.patch(`/orders/${order._id}/complete-delivery`);
      const completedOrder = response.data?.data || order;
      navigation.replace('DeliveryComplete', {
        orderId: order._id,
        orderNumber: completedOrder.orderNumber,
        amount: completedOrder.totalAmount,
        paymentMethod: completedOrder.payment?.method,
        deliveredAt: completedOrder.updatedAt,
      });
    } catch (error) {
      Alert.alert('Could not complete delivery', error.message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Stylized Interactive Vector Map Graphic */}
      <View style={styles.mapCanvas}>
        {/* City Blocks Simulation */}
        <View style={styles.gridContainer}>
          <View style={[styles.block, { top: 60, left: 30, width: 90, height: 110 }]} />
          <View style={[styles.block, { top: 60, left: 140, width: 100, height: 110 }]} />
          <View style={[styles.block, { top: 60, left: 260, width: 80, height: 110 }]} />

          <View style={[styles.block, { top: 190, left: 30, width: 90, height: 130 }]} />
          <View style={[styles.block, { top: 190, left: 140, width: 100, height: 130 }]} />
          <View style={[styles.block, { top: 190, left: 260, width: 80, height: 130 }]} />

          {/* Street Name Labels */}
          <Text style={[styles.streetLabel, { top: 175, left: 130 }]}>Lake Road</Text>
          <Text style={[styles.streetLabel, { top: 90, left: 5, transform: [{ rotate: '-90deg' }] }]}>
            Galle Rd
          </Text>

          {/* Blue Route Polyline Simulation */}
          <View style={styles.routeVertical} />
          <View style={styles.routeHorizontal} />

          {/* Rider Current Position Pin */}
          <View style={styles.riderPin}>
            <View style={styles.riderInner}>
              <Ionicons name="navigate" size={16} color={colors.textInverse} />
            </View>
          </View>

          {/* Customer Destination Pin */}
          <View style={styles.destinationPin}>
            <Ionicons name="home" size={16} color={colors.textInverse} />
          </View>
        </View>

        {/* Floating Top Navigation Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backCircleBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.titlePill}>
            <Text style={styles.titlePillText}>Navigation Map</Text>
          </View>

          <TouchableOpacity
            style={styles.zoomCircleBtn}
            onPress={() => Alert.alert('Zoom', 'Map scale adjusted.')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Bottom Sheet Card */}
      <View style={styles.bottomSheet}>
        {/* Header ETA Row */}
        <View style={styles.etaHeaderRow}>
          <View>
            <Text style={styles.etaTitle}>
              {order?.status === 'out_for_delivery' ? 'Delivery in progress' : 'Delivery route'}
            </Text>
            <Text style={styles.arriveTimeText}>
              {order?.estimatedTime ? `Arrive by ${order.estimatedTime} · ` : ''}
              {paymentSummary}
            </Text>
          </View>
          <View style={styles.kmLeftBadge}>
            <Text style={styles.kmLeftText}>{order ? 'ROUTE ACTIVE' : 'NO ROUTE'}</Text>
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>{customerInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.customerTopRow}>
              <Text style={styles.customerName}>{order?.user?.name || 'Customer'}</Text>
              <Text style={styles.customerOrderTag}>{order?.orderNumber || 'Delivery route'}</Text>
            </View>
            <Text style={styles.customerPhoneText}>{customerPhone || 'Phone unavailable'}</Text>
            <Text style={styles.customerAddressText}>
              {deliveryAddress || 'Delivery address unavailable'}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.statusMessage} />
        ) : loadError ? (
          <TouchableOpacity onPress={loadOrder} style={styles.statusMessage}>
            <Text style={styles.statusMessageText}>{loadError} · Tap to retry</Text>
          </TouchableOpacity>
        ) : !order ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.statusMessage}
          >
            <Text style={styles.statusMessageText}>No active delivery. View deliveries</Text>
          </TouchableOpacity>
        ) : null}

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.callOutlineBtn}
            onPress={handleCallCustomer}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.callBtnText}>Call Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={handleNavigateApp}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={18} color={colors.textInverse} style={{ marginRight: 6 }} />
            <Text style={styles.navigateBtnText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Mark as Delivered Button */}
        <AppButton
          title={
            order?.status === 'out_for_delivery'
              ? order?.payment?.method === 'cash_on_delivery'
                ? 'Mark Delivered & Collect Cash'
                : 'Mark as Delivered'
              : 'Delivery Not Started'
          }
          onPress={handleMarkDelivered}
          loading={completing}
          disabled={!order || order.status !== 'out_for_delivery' || loading || Boolean(loadError)}
          icon={<Ionicons name="checkmark-done" size={20} color={colors.textInverse} />}
          style={styles.completeBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  block: {
    position: 'absolute',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  streetLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  routeVertical: {
    position: 'absolute',
    top: 130,
    left: 175,
    width: 6,
    height: 140,
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  routeHorizontal: {
    position: 'absolute',
    top: 130,
    left: 175,
    width: 100,
    height: 6,
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  riderPin: {
    position: 'absolute',
    top: 260,
    left: 162,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  destinationPin: {
    position: 'absolute',
    top: 118,
    left: 265,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titlePill: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titlePillText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  zoomCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  etaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  etaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  arriveTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  kmLeftBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kmLeftText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  statusMessage: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusMessageText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
  },
  customerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  customerOrderTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customerPhoneText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  customerAddressText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  callOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  callBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
  completeBtn: {
    marginVertical: 0,
  },
});

export default DeliveryMapScreen;
