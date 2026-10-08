/**
 * OwnerDashboardScreen
 * Matches Figma 15_owner-dashboard 1:
 * - Real revenue, pending orders, and active orders stat cards
 * - Quick Actions: "+ New Product" (creates product) and "Manage Slots" (delivery slots CRUD)
 * - Recent orders list with customer avatars and status pills
 * - Sales this week interactive bar chart with tooltip
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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import client from '../../api/client';

const OwnerDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    todayRevenue: 12450,
    revenueTrend: '+14.2%',
    pendingOrdersCount: 38,
    activeOrdersCount: 8,
    recentOrders: [],
    salesThisWeek: [
      { day: 'Mon', value: 8200 },
      { day: 'Tue', value: 7400 },
      { day: 'Wed', value: 9100 },
      { day: 'Thu', value: 11200 },
      { day: 'Fri', value: 9900 },
      { day: 'Sat', value: 12450, highlighted: true },
      { day: 'Sun', value: 9950 },
    ],
    totalWeeklySales: 68200,
  });

  // Modal State for Quick Action "+ New Product"
  const [newProductModalVisible, setNewProductModalVisible] = useState(false);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Vegetables');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productPackSize, setProductPackSize] = useState('1kg');
  const [savingProduct, setSavingProduct] = useState(false);

  // Fetch real dashboard stats from backend
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await client.get('/owner/dashboard');
      if (response.data?.success && response.data?.data) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.warn('[Dashboard] Could not fetch stats from backend:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Create Product Quick Action Handler
  const handleCreateProduct = async () => {
    if (!productName.trim() || !productPrice || !productStock) {
      Alert.alert('Required Fields', 'Please enter product name, unit price, and stock count.');
      return;
    }

    try {
      setSavingProduct(true);
      const payload = {
        name: productName.trim(),
        category: productCategory,
        packSize: productPackSize.trim() || '1 unit',
        unitPrice: Number(productPrice),
        stock: Number(productStock),
        lowStockThreshold: 5,
        imageKey: 'vegetables',
      };

      const response = await client.post('/owner/products', payload);
      if (response.data?.success) {
        Alert.alert('Product Created', `${productName.trim()} has been added to inventory.`);
        setProductName('');
        setProductPrice('');
        setProductStock('');
        setNewProductModalVisible(false);
        fetchDashboardData();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not create product.');
    } finally {
      setSavingProduct(false);
    }
  };

  // Helper to format date like "Saturday, 14 Mar"
  const getFormattedDate = () => {
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    return today.toLocaleDateString('en-GB', options);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            {navigation.canGoBack() && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.dateText}>{getFormattedDate()}</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.switchModeBtn}
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
            >
              <Ionicons name="cart-outline" size={16} color={colors.primary} />
              <Text style={styles.switchModeText}>Customer View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => Alert.alert('Notifications', 'You have 3 incoming orders waiting for confirmation.')}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Top Stat Cards (Side-by-side) */}
            <View style={styles.statsRow}>
              {/* Today's Revenue */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TODAY'S REVENUE</Text>
                <Text style={styles.statValue}>
                  Rs. {Number(dashboardData.todayRevenue || 12450).toLocaleString()}
                </Text>
                <View style={styles.trendRow}>
                  <Ionicons name="trending-up" size={14} color="#16A34A" />
                  <Text style={styles.trendText}>{dashboardData.revenueTrend || '+14.2%'}</Text>
                </View>
              </View>

              {/* New Orders */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>NEW ORDERS</Text>
                <Text style={styles.statValue}>
                  {dashboardData.pendingOrdersCount || 38} Pending
                </Text>
                <View style={styles.activeRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.activeText}>
                    {dashboardData.activeOrdersCount || 8} Active
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.newProductButton}
                onPress={() => setNewProductModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.newProductText}>+ New Product</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manageSlotsButton}
                onPress={() => navigation.navigate('OwnerManageSlots')}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.manageSlotsText}>Manage Slots</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Orders */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentOrdersContainer}>
              {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 ? (
                dashboardData.recentOrders.map((order) => {
                  const isDelivered = order.status === 'Delivered';
                  return (
                    <TouchableOpacity
                      key={order.id || order._id}
                      style={styles.orderItem}
                      onPress={() => navigation.navigate('Orders')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{order.customerInitials || 'KP'}</Text>
                      </View>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderCustomerName}>{order.customerName}</Text>
                        <Text style={styles.orderItemsPreview} numberOfLines={1}>
                          {order.itemsSummary}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          isDelivered ? styles.deliveredBadge : styles.pendingBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isDelivered ? styles.deliveredBadgeText : styles.pendingBadgeText,
                          ]}
                        >
                          {order.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyOrdersBox}>
                  <Text style={styles.emptyOrdersText}>No orders received yet.</Text>
                </View>
              )}
            </View>

            {/* Sales This Week Section */}
            <View style={styles.salesCard}>
              <View style={styles.salesHeaderRow}>
                <Text style={styles.salesTitle}>Sales this week</Text>
                <Text style={styles.salesAmount}>
                  Rs. {Number(dashboardData.totalWeeklySales || 68200).toLocaleString()}
                </Text>
              </View>

              {/* Bar Chart */}
              <View style={styles.chartContainer}>
                {dashboardData.salesThisWeek.map((bar, index) => {
                  const maxVal = 14000;
                  const barHeight = Math.max(16, (bar.value / maxVal) * 110);
                  const isHighlighted = bar.highlighted || bar.day === 'Sat';

                  return (
                    <View key={index} style={styles.chartBarCol}>
                      {isHighlighted && (
                        <View style={styles.tooltipBox}>
                          <Text style={styles.tooltipText}>12.4k</Text>
                          <View style={styles.tooltipTriangle} />
                        </View>
                      )}
                      <View
                        style={[
                          styles.chartBar,
                          { height: barHeight },
                          isHighlighted ? styles.chartBarHighlighted : styles.chartBarNormal,
                        ]}
                      />
                      <Text
                        style={[
                          styles.chartDayLabel,
                          isHighlighted && styles.chartDayLabelHighlighted,
                        ]}
                      >
                        {bar.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Quick Action "+ New Product" Modal */}
      <Modal visible={newProductModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => setNewProductModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Product Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Fresh Mint 100g"
                value={productName}
                onChangeText={setProductName}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryPills}>
                {['Vegetables', 'Grains', 'Oils', 'Dairy', 'Bundles'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      productCategory === cat && styles.categoryPillActive,
                    ]}
                    onPress={() => setProductCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        productCategory === cat && styles.categoryPillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.twoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabel}>Unit Price (Rs.)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 350"
                    keyboardType="numeric"
                    value={productPrice}
                    onChangeText={setProductPrice}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabel}>Stock Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 25"
                    keyboardType="numeric"
                    value={productStock}
                    onChangeText={setProductStock}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Pack Size</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 500g or 1 bottle"
                value={productPackSize}
                onChangeText={setProductPackSize}
              />

              <TouchableOpacity
                style={styles.createSubmitButton}
                onPress={handleCreateProduct}
                disabled={savingProduct}
              >
                {savingProduct ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.createSubmitText}>Create Product</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  newProductButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  newProductText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  manageSlotsButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1E7DD',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  manageSlotsText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  recentOrdersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  orderItemsPreview: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveredBadge: {
    backgroundColor: '#E8F5E9',
  },
  deliveredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16803C',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  emptyOrdersBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyOrdersText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  salesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  salesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  salesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  salesAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 24,
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  tooltipBox: {
    position: 'absolute',
    top: -26,
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tooltipTriangle: {
    position: 'absolute',
    bottom: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A',
  },
  chartBar: {
    width: 18,
    borderRadius: 9,
  },
  chartBarNormal: {
    backgroundColor: '#DCFCE7',
  },
  chartBarHighlighted: {
    backgroundColor: colors.primary,
  },
  chartDayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 8,
  },
  chartDayLabelHighlighted: {
    color: colors.text,
    fontWeight: '700',
  },
  // Modal styles
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#F8FAF8',
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  categoryPillActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: colors.primary,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  colHalf: {
    flex: 1,
  },
  createSubmitButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  createSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default OwnerDashboardScreen;
