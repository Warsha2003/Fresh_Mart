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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import ScreenHeader from '../../components/ScreenHeader';
import AppButton from '../../components/AppButton';
import client from '../../api/client';

const DeliveryOrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params || {};
  const [starting, setStarting] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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

  const handleStartPackageDelivery = async () => {
    if (!order?._id) return;
    try {
      setStarting(true);
      if (order.status !== 'out_for_delivery') {
        await client.patch(`/orders/${order._id}/start-delivery`);
      }
      navigation.navigate('DeliveryMap', { orderId: order._id });
    } catch (error) {
      Alert.alert('Could not start delivery', error.message);
    } finally {
      setStarting(false);
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
        {/* Customer Card with Call Button */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>CUSTOMER</Text>
          <View style={styles.customerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{order.user?.name || 'Customer'}</Text>
              <Text style={styles.customerPhone}>{customerPhone || 'Phone unavailable'}</Text>
            </View>
            <TouchableOpacity
              style={styles.callCircleBtn}
              onPress={handleCallCustomer}
              activeOpacity={0.8}
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
            ITEMS CHECKLIST ({order.items?.length || 0} ITEMS)
          </Text>

          {(order.items || []).map((item, index) => (
            <View style={styles.itemRow} key={`${item._id || item.name}-${index}`}>
              <View style={[styles.itemIcon, { backgroundColor: index % 2 ? '#FEE2E2' : '#FEF3C7' }]}>
                <Ionicons
                  name={index % 2 ? 'basket-outline' : 'nutrition'}
                  size={18}
                  color={index % 2 ? '#DC2626' : '#D97706'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.unit || 'Unit'} · Qty: {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemPrice}>Rs. {item.price * item.quantity}</Text>
            </View>
          ))}

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

      {/* Bottom Sticky Action Button */}
      <View style={styles.bottomBar}>
        <AppButton
          title="Start Package Delivery"
          onPress={handleStartPackageDelivery}
          loading={starting}
          disabled={order.status === 'delivered'}
          icon={<Ionicons name="navigate" size={18} color={colors.textInverse} />}
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
    backgroundColor: colors.background,
    paddingTop: 44,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  customerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  addressDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  miniMapGraphic: {
    width: 60,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
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
