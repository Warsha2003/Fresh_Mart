/**
 * Screen 23: Delivery Order Details
 * Matches Figma design 23_delivery-ord...
 * 
 * CRUD OPERATIONS:
 * 1. READ: Loads detailed customer, address, items & payment breakdown (GET /api/orders/delivery/:id)
 * 2. UPDATE: Starts package delivery (PATCH /api/orders/:id/start-delivery)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import ScreenHeader from '../../components/ScreenHeader';
import AppButton from '../../components/AppButton';
import client from '../../api/client';
import { getOrderItemAsset } from '../../config/productAssets';

const DeliveryOrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [startingDelivery, setStartingDelivery] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setLoadError('No delivery order was selected.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError('');
      const response = await client.get(`/orders/delivery/${orderId}`);
      setOrder(response.data?.data || null);
    } catch (error) {
      setLoadError(error.message || 'Could not load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const customerPhone = order?.user?.phone || '';
  const address = order?.deliveryAddress;
  const paymentMethod =
    order?.payment?.method === 'cash_on_delivery'
      ? 'Cash on Delivery'
      : order?.payment?.method === 'card'
        ? 'Paid Online'
        : 'Payment details unavailable';
  const featuredItem = order?.items?.[0];
  const featuredImage = getOrderItemAsset(featuredItem);

  const handleCallCustomer = () => {
    if (!customerPhone) {
      Alert.alert('Phone unavailable', 'No phone number is available for this customer.');
      return;
    }
    Alert.alert(
      'Call Customer',
      `Would you like to dial ${customerPhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () =>
            Linking.openURL(`tel:${customerPhone}`).catch((error) =>
              Alert.alert('Unable to call', error.message)
            ),
        },
      ]
    );
  };

  const handleStartDelivery = async () => {
    if (!order?._id) return;

    if (order.status === 'out_for_delivery') {
      navigation.navigate('DeliveryMap', { orderId: order._id });
      return;
    }

    try {
      setStartingDelivery(true);
      await client.patch(`/orders/${order._id}/start-delivery`);
      setOrder((currentOrder) => ({
        ...currentOrder,
        status: 'out_for_delivery',
      }));
      navigation.navigate('DeliveryMap', { orderId: order._id });
    } catch (error) {
      Alert.alert('Could not start delivery', error.message);
    } finally {
      setStartingDelivery(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Order Details"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.stateIndicator} />
      ) : loadError ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Order unavailable</Text>
          <Text style={styles.stateMessage}>{loadError}</Text>
          <TouchableOpacity onPress={loadOrder}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : order ? (
      <>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.photoHero}>
          <View style={styles.featuredImageContainer}>
            <Image source={featuredImage} style={styles.featuredImage} resizeMode="cover" />
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCountText}>
                {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroLabel}>ORDER DETAILS</Text>
            <Text style={styles.heroOrderNumber}>
              {order.orderNumber || 'Order'}
            </Text>
            <Text style={styles.heroStatus}>
              {order.status === 'out_for_delivery' ? 'ACTIVE' : 'READY'}
            </Text>
            <View style={styles.heroBottomRow}>
              <Text style={styles.heroTotalLabel}>Order total</Text>
              <Text style={styles.heroTotal}>Rs. {order.totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Customer Card with Call Button */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>CUSTOMER</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.user?.name || 'Customer'}</Text>
              <Text style={styles.customerPhone}>{customerPhone || 'Phone unavailable'}</Text>
            </View>
            <TouchableOpacity
              style={styles.callCircleBtn}
              onPress={handleCallCustomer}
              activeOpacity={0.8}
              accessibilityLabel="Call customer"
            >
              <Ionicons name="call" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address Card with Map Thumbnail */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>DELIVERY ADDRESS</Text>
          <View style={styles.addressRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.addressTitle}>
                {address
                  ? [address.addressLine, address.city].filter(Boolean).join(', ')
                  : 'Delivery address not provided'}
              </Text>
              <Text style={styles.addressDetails}>{address?.label || 'Delivery address'}</Text>
            </View>
            <View style={styles.miniMapGraphic}>
              <Ionicons name="location" size={22} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Items Checklist Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>
            ORDER PHOTOS ({order.items?.length || 0} ITEMS)
          </Text>

          <View style={styles.photoGrid}>
            {(order.items || []).map((item, index) => (
              <View style={styles.photoItemCard} key={`${item._id || item.name}-${index}`}>
                <View style={styles.itemImageContainer}>
                  <Image source={getOrderItemAsset(item)} style={styles.itemImage} resizeMode="cover" />
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>×{item.quantity}</Text>
                  </View>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>Rs. {item.price * item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>Rs. {order.totalAmount}</Text>
          </View>
        </View>

        {/* Payment Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>PAYMENT INFORMATION</Text>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons name="cash-outline" size={20} color="#D97706" style={{ marginRight: 8 }} />
              <Text style={styles.paymentMethod}>{paymentMethod}</Text>
            </View>
            <Text style={styles.paymentAmount}>Rs. {order.totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          title={order.status === 'out_for_delivery' ? 'Continue Delivery' : 'Start Delivery'}
          onPress={handleStartDelivery}
          loading={startingDelivery}
          icon={<Ionicons name="bicycle" size={20} color={colors.textInverse} />}
          style={styles.footerButton}
        />
      </View>
      </>
      ) : (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Delivery not found</Text>
          <Text style={styles.stateMessage}>This order is no longer available for delivery.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F8F4',
    paddingTop: 44,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopColor: '#D6E9DF',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  footerButton: {
    marginVertical: 0,
  },
  photoHero: {
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 18,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  featuredImageContainer: {
    backgroundColor: '#D1FAE5',
    borderRadius: 18,
    height: 132,
    overflow: 'hidden',
    position: 'relative',
    width: 132,
  },
  featuredImage: {
    height: '100%',
    width: '100%',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(7, 62, 31, 0.82)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  heroInfo: {
    flex: 1,
    marginLeft: 14,
  },
  heroLabel: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroOrderNumber: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 3,
  },
  heroStatus: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    color: '#064E3B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  heroBottomRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.16)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
  },
  heroTotalLabel: {
    color: '#C9F2DE',
    fontSize: 12,
  },
  heroTotal: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: '#C7EAD8',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSectionLabel: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  customerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    color: '#17241F',
    fontSize: 17,
    fontWeight: '800',
  },
  customerPhone: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 3,
  },
  callCircleBtn: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 22,
    height: 46,
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: 46,
  },
  addressRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  addressTitle: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
  },
  addressDetails: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 3,
  },
  miniMapGraphic: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#A7F3D0',
    borderRadius: 14,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 64,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItemCard: {
    backgroundColor: '#F6FBF8',
    borderColor: '#DCEDE5',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    width: '48%',
  },
  itemImageContainer: {
    alignItems: 'center',
    backgroundColor: '#E8F7EF',
    height: 124,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  itemImage: {
    height: '100%',
    width: '100%',
  },
  quantityBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(7, 62, 31, 0.86)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  itemDetails: {
    padding: 10,
  },
  itemName: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  itemPrice: {
    color: '#064E3B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  divider: {
    backgroundColor: '#DDEBE4',
    height: 1,
    marginVertical: 11,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
  totalPrice: {
    color: '#047857',
    fontSize: 19,
    fontWeight: '800',
  },
  paymentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  paymentMethod: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  paymentAmount: {
    color: '#064E3B',
    fontSize: 15,
    fontWeight: '800',
  },
  stateIndicator: {
    marginTop: 80,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 24,
    margin: 20,
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
});

export default DeliveryOrderDetailsScreen;
