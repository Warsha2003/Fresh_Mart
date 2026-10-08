/**
 * Screen 21: Delivery Partner Dashboard
 * Matches Figma 21_delivery-dashboard
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
import { useAuth } from '../../context/AuthContext';

const DeliveryDashboardScreen = ({ navigation }) => {
  const { logout } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationCount = deliveries.length;
  const rootNavigation = navigation.getParent()?.getParent();

  const navigateRoot = (routeName, params = {}) => {
    if (rootNavigation) {
      rootNavigation.navigate(routeName, params);
      return;
    }

    navigation.navigate(routeName, params);
  };

  // Back button - keep team navigation behaviour
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  // Delivery partner logout
  const handleBackToLogin = async () => {
    await logout();

    if (rootNavigation) {
      rootNavigation.reset({
        index: 0,
        routes: [{ name: 'DeliveryLogin' }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'DeliveryLogin' }],
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchDeliveries = async () => {
        try {
          setLoading(true);
          setLoadError('');

          const res = await client.get('/orders/delivery/list');

          if (isActive) {
            setDeliveries(
              Array.isArray(res.data?.data) ? res.data.data : []
            );
          }
        } catch (error) {
          if (isActive) {
            setLoadError(
              error.message || 'Could not load delivery orders.'
            );
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
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

    if (!address) {
      return 'Delivery address not provided';
    }

    return [address.addressLine, address.city]
      .filter(Boolean)
      .join(', ');
  };

  const getPaymentSummary = (order) => {
    if (order.payment?.method === 'cash_on_delivery') {
      return `COD: Rs. ${order.totalAmount}`;
    }

    if (order.payment?.method === 'card') {
      return 'Paid online';
    }

    return 'Payment details unavailable';
  };

  const getStatusLabel = (status) => {
    if (status === 'out_for_delivery') {
      return 'OUT FOR DELIVERY';
    }

    if (status === 'packed') {
      return 'READY FOR PICKUP';
    }

    return 'NEW DELIVERY';
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Back to previous screen"
          >
            <Ionicons
              name="arrow-back"
              size={19}
              color={colors.textInverse}
            />
          </TouchableOpacity>

          <View>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />

              <Text style={styles.onlineText}>
                You're online
              </Text>
            </View>

            <Text style={styles.headerTitle}>
              Delivery Dashboard
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityLabel="Open delivery notifications"
            accessibilityRole="button"
            style={styles.notificationButton}
            onPress={() =>
              setShowNotifications((visible) => !visible)
            }
          >
            <Ionicons
              name="notifications-outline"
              size={18}
              color="#FFFFFF"
            />

            {notificationCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount > 99
                    ? '99+'
                    : notificationCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={() => navigateRoot('MainTabs')}
          >
            <Ionicons
              name="cart-outline"
              size={16}
              color={colors.primaryDark}
            />

            <Text style={styles.switchModeText}>
              Customer View
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Panel */}
      {showNotifications ? (
        <View style={styles.notificationsPanel}>
          <View style={styles.notificationsHeader}>
            <View>
              <Text style={styles.notificationsTitle}>
                Delivery notifications
              </Text>

              <Text style={styles.notificationsSubtitle}>
                {notificationCount} new order
                {notificationCount === 1 ? '' : 's'}
              </Text>
            </View>

            <TouchableOpacity
              accessibilityLabel="Close notifications"
              onPress={() => setShowNotifications(false)}
              style={styles.closeNotificationButton}
            >
              <Ionicons
                name="close-outline"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {deliveries.length === 0 ? (
            <View style={styles.notificationEmpty}>
              <Ionicons
                name="notifications-off-outline"
                size={24}
                color={colors.textSecondary}
              />

              <Text style={styles.notificationEmptyText}>
                No new delivery notifications.
              </Text>
            </View>
          ) : (
            deliveries.map((order) => {
              const isActive =
                order.status === 'out_for_delivery';

              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={order._id}
                  onPress={() =>
                    navigateRoot(
                      isActive
                        ? 'DeliveryMap'
                        : 'DeliveryAlert',
                      {
                        orderId: order._id,
                      }
                    )
                  }
                  style={styles.notificationItem}
                >
                  <View style={styles.notificationIcon}>
                    <Ionicons
                      name={
                        isActive
                          ? 'bicycle-outline'
                          : 'storefront-outline'
                      }
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.notificationDetails}>
                    <Text
                      style={styles.notificationOrderNumber}
                    >
                      {order.orderNumber}
                    </Text>

                    <Text
                      style={styles.notificationCustomer}
                    >
                      {order.user?.name || 'Customer'} needs delivery
                    </Text>

                    <Text style={styles.notificationStatus}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward-outline"
                    size={18}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryEyebrow}>
                TODAY'S ACTIVITY
              </Text>

              <Text style={styles.summaryTitle}>
                Ready for the next delivery
              </Text>

              <Text style={styles.summarySubtitle}>
                Keep your route moving and deliver fresh food on time.
              </Text>
            </View>

            <View style={styles.summaryIcon}>
              <Ionicons
                name="bicycle-outline"
                size={26}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {deliveries.length}
              </Text>

              <Text style={styles.statLabel}>
                Assignments
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {
                  deliveries.filter(
                    (order) =>
                      order.status === 'out_for_delivery'
                  ).length
                }
              </Text>

              <Text style={styles.statLabel}>
                In progress
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {
                  deliveries.filter(
                    (order) =>
                      order.status !== 'out_for_delivery'
                  ).length
                }
              </Text>

              <Text style={styles.statLabel}>
                New
              </Text>
            </View>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionTitle}>
              Your deliveries
            </Text>

            <Text style={styles.sectionSubtitle}>
              {deliveries.length} available assignment
              {deliveries.length === 1 ? '' : 's'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewMapLink}
            onPress={() => {
              if (!deliveries.length) {
                Alert.alert(
                  'No deliveries',
                  'There are no delivery orders to show on the map.'
                );
                return;
              }

              const activeOrder = deliveries.find(
                (order) =>
                  order.status === 'out_for_delivery'
              );

              if (!activeOrder) {
                Alert.alert(
                  'No active route',
                  'Accept a delivery before opening the route map.'
                );
                return;
              }

              navigateRoot('DeliveryMap', {
                orderId: activeOrder._id,
              });
            }}
          >
            <Ionicons
              name="map-outline"
              size={14}
              color={colors.primary}
            />

            <Text style={styles.viewMapText}>
              View Map
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading / Error / Empty / Delivery List */}
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginVertical: 30 }}
          />
        ) : loadError ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={colors.textSecondary}
            />

            <Text style={styles.emptyTitle}>
              Deliveries unavailable
            </Text>

            <Text style={styles.emptyMessage}>
              {loadError}
            </Text>

            <TouchableOpacity
              onPress={() =>
                setRefreshKey((key) => key + 1)
              }
            >
              <Text style={styles.retryText}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : deliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="bicycle-outline"
              size={34}
              color={colors.primary}
            />

            <Text style={styles.emptyTitle}>
              No deliveries right now
            </Text>

            <Text style={styles.emptyMessage}>
              New delivery orders will appear here.
            </Text>
          </View>
        ) : (
          deliveries.map((order) => {
            const isActive =
              order.status === 'out_for_delivery';

            return (
              <View
                key={order._id}
                style={styles.deliveryCard}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumberText}>
                      {order.orderNumber}
                    </Text>

                    <Text style={styles.statusTag}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>

                  <View style={styles.distanceBadge}>
                    <Ionicons
                      name={
                        isActive
                          ? 'bicycle-outline'
                          : 'time-outline'
                      }
                      size={12}
                      color={
                        isActive
                          ? colors.primary
                          : '#0284C7'
                      }
                    />

                    <Text style={styles.distanceText}>
                      {isActive
                        ? 'IN PROGRESS'
                        : 'NEW ORDER'}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeBox}>
                  <View style={styles.routeStop}>
                    <View
                      style={[
                        styles.stopIcon,
                        {
                          backgroundColor:
                            colors.primaryLight,
                        },
                      ]}
                    >
                      <Ionicons
                        name="storefront-outline"
                        size={14}
                        color={colors.primaryDark}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopLabel}>
                        Pickup
                      </Text>

                      <Text style={styles.stopName}>
                        {order.storeAddress || 'FreshMart'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeDivider} />

                  <View style={styles.routeStop}>
                    <View
                      style={[
                        styles.stopIcon,
                        {
                          backgroundColor: '#FEE2E2',
                        },
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.danger}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopLabel}>
                        Dropoff
                      </Text>

                      <Text style={styles.stopName}>
                        {getDeliveryAddress(order)}
                      </Text>

                      <Text style={styles.stopSubtitle}>
                        {order.user?.name || 'Customer'} ·{' '}
                        {getPaymentSummary(order)}
                      </Text>
                    </View>
                  </View>
                </View>

                <AppButton
                  title={
                    isActive
                      ? 'Continue Delivery'
                      : 'Accept Assignment'
                  }
                  onPress={() =>
                    navigateRoot(
                      isActive
                        ? 'DeliveryMap'
                        : 'DeliveryAlert',
                      {
                        orderId: order._id,
                      }
                    )
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
    backgroundColor: '#F2F8F4',
    paddingTop: 48,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 4,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },

  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  notificationButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },

  notificationBadge: {
    alignItems: 'center',
    backgroundColor: '#F97316',
    borderColor: '#064E3B',
    borderRadius: 10,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    position: 'absolute',
    right: -4,
    top: -4,
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 3,
  },

  notificationsPanel: {
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    marginHorizontal: 14,
    marginTop: 8,
    padding: 14,
    borderRadius: 18,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  notificationsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  notificationsTitle: {
    color: '#16352A',
    fontSize: 16,
    fontWeight: '800',
  },

  notificationsSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  closeNotificationButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },

  notificationItem: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 10,
  },

  notificationIcon: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },

  notificationDetails: {
    flex: 1,
  },

  notificationOrderNumber: {
    color: '#16352A',
    fontSize: 13,
    fontWeight: '800',
  },

  notificationCustomer: {
    color: '#475569',
    fontSize: 11,
    marginTop: 2,
  },

  notificationStatus: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },

  notificationEmpty: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    padding: 18,
  },

  notificationEmptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },

  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    marginRight: 11,
    width: 40,
  },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: '#D1FAE5',
    marginRight: 7,
  },

  onlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D1FAE5',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },

  switchModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#064E3B',
    marginLeft: 5,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 34,
  },

  summaryCard: {
    backgroundColor: '#064E3B',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 18,
    padding: 20,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },

  summaryTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  summaryEyebrow: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },

  summarySubtitle: {
    color: '#C9F2DE',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  summaryIcon: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    marginLeft: 14,
    width: 54,
  },

  statsRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 18,
    paddingVertical: 13,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  statLabel: {
    color: '#C9F2DE',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  statDivider: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    height: 30,
    width: 1,
  },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#064E3B',
    fontSize: 18,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  viewMapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
  },

  viewMapText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
    marginLeft: 5,
  },

  deliveryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7EAD8',
    borderTopWidth: 5,
    borderTopColor: '#10B981',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 13,
    elevation: 5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  orderNumberText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#16352A',
  },

  statusTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 5,
  },

  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },

  distanceText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    marginLeft: 4,
  },

  routeBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },

  routeStop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stopIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  stopLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },

  stopName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },

  stopSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  routeDivider: {
    height: 28,
    width: 2,
    backgroundColor: '#86EFAC',
    marginLeft: 14,
    marginVertical: 3,
  },

  acceptBtn: {
    marginVertical: 0,
    height: 48,
    borderRadius: 14,
  },

  emptyState: {
    alignItems: 'center',
    backgroundColor: '#E9F9F0',
    borderRadius: 20,
    padding: 32,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#B7EBCF',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#064E3B',
    marginTop: 12,
  },

  emptyMessage: {
    color: '#4B6477',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 7,
  },

  retryText: {
    color: '#047857',
    fontWeight: '800',
    marginTop: 14,
  },
});

export default DeliveryDashboardScreen;