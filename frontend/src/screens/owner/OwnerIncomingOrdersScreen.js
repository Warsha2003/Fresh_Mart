/**
 * OwnerIncomingOrdersScreen
 * Matches Figma 16_incoming-orders 1:
 * - Segmented tabs: New (count), Preparing, Done
 * - Order cards with order number, time elapsed badge, customer avatar & slot info, items summary, total
 * - Action buttons: View Details, Accept order (starts preparation), Reject/Cancel order
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import client from '../../api/client';

const OwnerIncomingOrdersScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'preparing' | 'done'
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({ new: 0, preparing: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Selected Order for "View Details" Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await client.get(`/owner/orders?tab=${activeTab}`);
      if (response.data?.success) {
        setOrders(response.data.data || []);
        if (response.data.counts) {
          setCounts(response.data.counts);
        }
      }
    } catch (error) {
      console.warn('[Orders] Error fetching orders:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Accept Order Handler: transitions order to prep and navigates to Order Prep checklist
  const handleAcceptOrder = async (order) => {
    try {
      setActionLoadingId(order.id || order._id);
      const response = await client.patch(`/owner/orders/${order.id || order._id}/accept`);
      if (response.data?.success) {
        Alert.alert(
          'Order Accepted',
          `Order ${order.orderNumber} is ready for item preparation.`,
          [
            {
              text: 'Start Prep Checklist',
              onPress: () => {
                navigation.navigate('OwnerOrderPrep', { orderId: order.id || order._id });
              },
            },
            {
              text: 'OK',
              onPress: () => fetchOrders(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not accept order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject / Cancel Order Handler
  const handleRejectOrder = (order) => {
    Alert.alert(
      'Reject Order',
      `Are you sure you want to cancel order ${order.orderNumber}? This will release customer slot.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Order',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(order.id || order._id);
              await client.patch(`/owner/orders/${order.id || order._id}/reject`);
              Alert.alert('Order Rejected', `Order ${order.orderNumber} was cancelled.`);
              fetchOrders();
            } catch (error) {
              Alert.alert('Error', error.message || 'Could not reject order.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incoming Orders</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => Alert.alert('Options', 'Filter orders or export CSV summary.')}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Segmented Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'new' && styles.tabButtonActive]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'new' && styles.tabButtonTextActive]}>
            New ({counts.new || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'preparing' && styles.tabButtonActive]}
          onPress={() => setActiveTab('preparing')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'preparing' && styles.tabButtonTextActive]}>
            Preparing ({counts.preparing || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'done' && styles.tabButtonActive]}
          onPress={() => setActiveTab('done')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'done' && styles.tabButtonTextActive]}>
            Done ({counts.done || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No orders in this tab</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'new'
                  ? 'Incoming grocery orders from customers will appear here.'
                  : activeTab === 'preparing'
                  ? 'Orders currently being packed will appear here.'
                  : 'Completed or handed over orders will appear here.'}
              </Text>
            </View>
          ) : (
            orders.map((order) => {
              const orderId = order.id || order._id;
              const isActionLoading = actionLoadingId === orderId;

              return (
                <View key={orderId} style={styles.orderCard}>
                  {/* Card Header: Order Number & Time Ago */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderNumberText}>Order {order.orderNumber}</Text>
                    <View style={styles.timeBadge}>
                      <Ionicons name="time-outline" size={12} color="#EA580C" />
                      <Text style={styles.timeBadgeText}>{order.timeAgo || '12 mins ago'}</Text>
                    </View>
                  </View>

                  {/* Customer Info */}
                  <View style={styles.customerRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{order.customerInitials || 'KP'}</Text>
                    </View>
                    <View style={styles.customerDetails}>
                      <Text style={styles.customerName}>{order.customerName}</Text>
                      <Text style={styles.slotText}>{order.slotLabel}</Text>
                    </View>
                  </View>

                  {/* Items Summary & Total */}
                  <View style={styles.itemsSummaryBox}>
                    <View style={styles.itemsColumn}>
                      <Text style={styles.itemsCountLabel}>{order.itemsCount || 1} ITEMS</Text>
                      <Text style={styles.itemsPreviewText} numberOfLines={2}>
                        {order.itemsPreview}
                      </Text>
                    </View>
                    <View style={styles.totalColumn}>
                      <Text style={styles.totalLabel}>TOTAL</Text>
                      <Text style={styles.totalAmount}>Rs. {Number(order.totalAmount).toLocaleString()}</Text>
                    </View>
                  </View>

                  {/* Action Buttons Row */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => {
                        setSelectedOrder(order);
                        setDetailsModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>

                    {activeTab === 'new' && (
                      <>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleRejectOrder(order)}
                          disabled={isActionLoading}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="close" size={16} color="#DC2626" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => handleAcceptOrder(order)}
                          disabled={isActionLoading}
                          activeOpacity={0.8}
                        >
                          {isActionLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                              <Text style={styles.acceptButtonText}>Accept</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}

                    {activeTab === 'preparing' && (
                      <TouchableOpacity
                        style={styles.prepButton}
                        onPress={() => navigation.navigate('OwnerOrderPrep', { orderId })}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="clipboard-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.acceptButtonText}>Continue Prep</Text>
                      </TouchableOpacity>
                    )}

                    {activeTab === 'done' && (
                      <View style={styles.doneBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#16803C" />
                        <Text style={styles.doneBadgeText}>
                          {order.status === 'cancelled' ? 'Cancelled' : 'Handed Over'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Order Details Modal */}
      <Modal visible={detailsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details ({selectedOrder?.orderNumber})</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Customer Information</Text>
                  <Text style={styles.detailValueBold}>{selectedOrder.customerName}</Text>
                  <Text style={styles.detailValueMuted}>Mobile: {selectedOrder.customerPhone}</Text>
                  <Text style={styles.detailValueMuted}>Slot: {selectedOrder.slotLabel}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Itemized List</Text>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQty}>Qty: {item.quantity} ({item.unit || 'unit'})</Text>
                      </View>
                      <Text style={styles.itemPrice}>Rs. {item.price * item.quantity}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.totalSummaryRow}>
                  <Text style={styles.totalSummaryLabel}>Total Bill Amount</Text>
                  <Text style={styles.totalSummaryValue}>Rs. {Number(selectedOrder.totalAmount).toLocaleString()}</Text>
                </View>

                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Text style={styles.closeModalText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 18,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EA580C',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  slotText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  itemsSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  itemsColumn: {
    flex: 1,
    marginRight: 10,
  },
  itemsCountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  itemsPreviewText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  totalColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  rejectButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    flex: 1.5,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prepButton: {
    flex: 1.5,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  doneBadge: {
    flex: 1.5,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  doneBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16803C',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  detailSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  detailValueBold: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  detailValueMuted: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  itemQty: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  totalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  totalSummaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  totalSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  closeModalButton: {
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});

export default OwnerIncomingOrdersScreen;
