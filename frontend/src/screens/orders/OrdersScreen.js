import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import client from '../../api/client';
import { colors } from '../../theme/colors';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
};

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/orders/history');
      setOrders(response.data?.data || []);
    } catch (error) {
      Alert.alert('Unable to load orders', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadOrders();
  }, [loadOrders]));

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Orders" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={44} color={colors.disabled} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyMessage}>Your completed purchases will appear here.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}>
            <Text style={styles.browse}>Browse products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {orders.map((order) => (
            <TouchableOpacity
              key={order._id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderTracking', { orderId: order._id })}
              activeOpacity={0.85}
            >
              <View style={styles.orderTop}>
                <View style={styles.orderIcon}>
                  <Ionicons name="receipt-outline" size={19} color={colors.primary} />
                </View>
                <View style={styles.orderRef}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={[styles.status, order.status === 'cancelled' && styles.statusCancelled]}>
                  <Text style={[styles.statusText, order.status === 'cancelled' && styles.cancelledText]}>
                    {(order.status || '').replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemPreview} numberOfLines={1}>
                {order.items?.map((item) => `${item.name} ×${item.quantity}`).join(', ') || 'Order items'}
              </Text>
              <View style={styles.orderBottom}>
                <Text style={styles.itemCount}>{order.items?.reduce((count, item) => count + item.quantity, 0) || 0} items</Text>
                <Text style={styles.amount}>Rs. {order.totalAmount}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, paddingTop: 42 },
  list: { padding: 16 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  orderCard: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginBottom: 12, padding: 15 },
  orderTop: { alignItems: 'center', flexDirection: 'row' },
  orderIcon: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  orderRef: { flex: 1, marginLeft: 10 },
  orderNumber: { color: colors.text, fontSize: 14, fontWeight: '800' },
  orderDate: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  status: { backgroundColor: colors.primaryLight, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: colors.primaryDark, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  statusCancelled: { backgroundColor: colors.dangerLight },
  cancelledText: { color: colors.danger },
  itemPreview: { color: colors.textSecondary, fontSize: 12, marginTop: 14 },
  orderBottom: { alignItems: 'center', borderTopColor: colors.borderLight, borderTopWidth: 1, flexDirection: 'row', marginTop: 12, paddingTop: 11 },
  itemCount: { color: colors.textSecondary, flex: 1, fontSize: 12 },
  amount: { color: colors.text, fontSize: 14, fontWeight: '800', marginRight: 8 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptyMessage: { color: colors.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center' },
  browse: { color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: 15 },
});

export default OrdersScreen;
