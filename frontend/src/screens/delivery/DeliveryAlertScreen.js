/**
 * Screen 22: Order Ready for Pickup / Delivery Alert
 * Matches Figma design 22_delivery-ord...
 * 
 * READ: Loads the assigned delivery order from the backend.
 * The order is started from its details screen.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AppButton from '../../components/AppButton';
import client from '../../api/client';

const DeliveryAlertScreen = ({ navigation, route }) => {
  const { orderId } = route.params || {};
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
        const nextOrder = (response.data?.data || []).find((item) =>
          ['placed', 'packed', 'out_for_delivery'].includes(item.status)
        );
        setOrder(nextOrder || null);
      }
    } catch (error) {
      setLoadError(error.message || 'Could not load this delivery.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStartDelivery = () => {
    if (!order?._id) return;
    navigation.navigate(
      order.status === 'out_for_delivery' ? 'DeliveryMap' : 'DeliveryOrderDetails',
      { orderId: order._id }
    );
  };

  const address = order?.deliveryAddress
    ? [order.deliveryAddress.addressLine, order.deliveryAddress.city].filter(Boolean).join(', ')
    : 'Delivery address not provided';

  return (
    <View style={styles.container}>
      {/* Dark Forest Green Curved Top Banner */}
      <View style={styles.topBanner}>
        <View style={styles.notificationBadge}>
          <Ionicons name="notifications" size={14} color="#A7F3D0" style={{ marginRight: 4 }} />
          <Text style={styles.notificationBadgeText}>NEW NOTIFICATION</Text>
        </View>

        <Text style={styles.bannerTitle}>Order Ready</Text>
        <Text style={styles.bannerSubtitle}>
          {order
            ? `${order.orderNumber} is ${order.status === 'packed' ? 'packed and ready to pick up.' : 'ready for delivery.'}`
            : 'Review the assigned order before starting delivery.'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.stateIndicator} />
        ) : loadError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Delivery unavailable</Text>
            <Text style={styles.stateMessage}>{loadError}</Text>
            <TouchableOpacity onPress={loadOrder}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : !order ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No delivery assigned</Text>
            <Text style={styles.stateMessage}>There are no active delivery orders to accept.</Text>
          </View>
        ) : (
          <>
        {/* Package Graphic Card */}
        <View style={styles.illustrationCard}>
          <View style={styles.packageGraphicContainer}>
            <View style={styles.boxGraphic}>
              <Ionicons name="cube" size={64} color="#D97706" />
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={16} color={colors.textInverse} />
              </View>
            </View>

            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {order.status === 'out_for_delivery' ? 'OUT FOR DELIVERY' : 'READY FOR PICKUP'}
              </Text>
            </View>
          </View>

          <Text style={styles.orderTotalLabel}>
            Order total: <Text style={styles.orderTotalValue}>Rs. {order.totalAmount}</Text>
          </Text>
          <Text style={styles.orderItemsMeta}>
            {order.items?.length || 0} items · {order.deliveryAddress?.city || 'Delivery order'}
          </Text>
        </View>

        {/* Store Pickup Info Card */}
        <View style={styles.pickupStoreCard}>
          <View style={styles.storeIconBox}>
            <Ionicons name="storefront" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeLabel}>Pick up from</Text>
            <Text style={styles.storeName}>{order.storeAddress || 'FreshMart'}</Text>
          </View>
          <View style={styles.packedTimeBadge}>
            <Text style={styles.packedTimeText}>{order.user?.name || 'Customer'}</Text>
          </View>
        </View>
        <View style={styles.destinationCard}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text style={styles.destinationText}>{address}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <AppButton
            title={order.status === 'out_for_delivery' ? 'Continue Delivery' : 'Start Delivery'}
            onPress={handleStartDelivery}
            icon={<Ionicons name="bicycle" size={20} color={colors.textInverse} />}
            style={styles.startBtn}
          />

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.dismissText}>Dismiss Alert</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBanner: {
    backgroundColor: '#0F5C2A',
    paddingTop: 54,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textInverse,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#D1FAE5',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  illustrationCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  packageGraphicContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  boxGraphic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 2,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  statusPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  orderTotalLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  orderTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  orderItemsMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pickupStoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  storeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  packedTimeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packedTimeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 6,
  },
  startBtn: {
    marginVertical: 0,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stateIndicator: {
    marginTop: 60,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 24,
    marginTop: 20,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  stateMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 14,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: -10,
    marginBottom: 18,
  },
  destinationText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default DeliveryAlertScreen;
