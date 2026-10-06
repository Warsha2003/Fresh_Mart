/**
 * Screen 21: Delivery Partner Dashboard
 * Matches Figma 21_delivery-das...
 * Displays active & pending deliveries assigned to the partner.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AppButton from '../../components/AppButton';
import client from '../../api/client';

const DeliveryDashboardScreen = ({ navigation }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchDeliveries = async () => {
        try {
          setLoading(true);
          setLoadError('');
          const res = await client.get('/orders/delivery/list');
          if (isActive) {
            setDeliveries(Array.isArray(res.data?.data) ? res.data.data : []);
          }
        } catch (error) {
          if (isActive) {
            setLoadError(error.message || 'Could not load delivery orders.');
          }
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchDeliveries();
      return () => {
        isActive = false;
      };
    }, [refreshKey])
  );

  const getDeliveryAddress = (order) => {
    const address = order.deliveryAddress;
    if (!address) return 'Delivery address not provided';
    return [address.addressLine, address.city].filter(Boolean).join(', ');
  };

  const getPaymentSummary = (order) => {
    if (order.payment?.method === 'cash_on_delivery') {
      return `COD: Rs. ${order.totalAmount}`;
    }
    if (order.payment?.method === 'card') return 'Paid online';
    return 'Payment details unavailable';
  };

  const getStatusLabel = (status) => {
    if (status === 'out_for_delivery') return 'OUT FOR DELIVERY';
    if (status === 'packed') return 'READY FOR PICKUP';
    return 'NEW DELIVERY';
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>You're online</Text>
          </View>
          <Text style={styles.headerTitle}>Delivery Dashboard</Text>
        </View>

        <TouchableOpacity
          style={styles.switchModeBtn}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Ionicons name="cart-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.switchModeText}>Customer View</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section Heading */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            Deliveries ({deliveries.length})
          </Text>
          <TouchableOpacity
            style={styles.viewMapLink}
            onPress={() => {
              if (!deliveries.length) {
                Alert.alert('No deliveries', 'There are no delivery orders to show on the map.');
                return;
              }
              const activeOrder = deliveries.find((order) => order.status === 'out_for_delivery');
              if (!activeOrder) {
                Alert.alert('No active route', 'Accept a delivery before opening the route map.');
                return;
              }
              navigation.navigate('DeliveryMap', { orderId: activeOrder._id });
            }}
          >
            <Ionicons name="map-outline" size={14} color={colors.primary} />
            <Text style={styles.viewMapText}>View Map</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 30 }} />
        ) : loadError ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Deliveries unavailable</Text>
            <Text style={styles.emptyMessage}>{loadError}</Text>
            <TouchableOpacity onPress={() => setRefreshKey((key) => key + 1)}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : deliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={34} color={colors.primary} />
            <Text style={styles.emptyTitle}>No deliveries right now</Text>
            <Text style={styles.emptyMessage}>New delivery orders will appear here.</Text>
          </View>
        ) : (
          deliveries.map((order) => {
            const isActive = order.status === 'out_for_delivery';
            return (
              <View key={order._id} style={styles.deliveryCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
                    <Text style={styles.statusTag}>{getStatusLabel(order.status)}</Text>
                  </View>
                  <View style={styles.distanceBadge}>
                    <Ionicons
                      name={isActive ? 'bicycle-outline' : 'time-outline'}
                      size={12}
                      color={isActive ? colors.primary : '#0284C7'}
                    />
                    <Text style={styles.distanceText}>
                      {isActive ? 'IN PROGRESS' : 'NEW ORDER'}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeBox}>
                  <View style={styles.routeStop}>
                    <View style={[styles.stopIcon, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons name="storefront-outline" size={14} color={colors.primaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopLabel}>Pickup</Text>
                      <Text style={styles.stopName}>{order.storeAddress || 'FreshMart'}</Text>
                    </View>
                  </View>
                  <View style={styles.routeDivider} />
                  <View style={styles.routeStop}>
                    <View style={[styles.stopIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="location-outline" size={14} color={colors.danger} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopLabel}>Dropoff</Text>
                      <Text style={styles.stopName}>{getDeliveryAddress(order)}</Text>
                      <Text style={styles.stopSubtitle}>
                        {order.user?.name || 'Customer'} · {getPaymentSummary(order)}
                      </Text>
                    </View>
                  </View>
                </View>

                <AppButton
                  title={isActive ? 'Continue Delivery' : 'Accept Assignment'}
                  onPress={() =>
                    navigation.navigate(isActive ? 'DeliveryMap' : 'DeliveryAlert', {
                      orderId: order._id,
                    })
                  }
                  style={styles.acceptBtn}
                />
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  viewMapLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMapText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  deliveryCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    marginLeft: 4,
  },
  routeBox: {
    backgroundColor: '#FAFBFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 14,
  },
  routeStop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stopLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  stopName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  stopSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  routeDivider: {
    height: 12,
    width: 2,
    backgroundColor: colors.border,
    marginLeft: 13,
    marginVertical: 2,
  },
  acceptBtn: {
    marginVertical: 0,
    height: 46,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 28,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 12,
  },
});

export default DeliveryDashboardScreen;
