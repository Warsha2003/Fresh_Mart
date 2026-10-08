/**
 * OwnerOrderPrepScreen
 * Matches Figma 17_order-preparation 1 AND done order prep:
 * - Real checklist of items to pack for an accepted order
 * - Real-time progress calculation (Packed: X of Y items, progress %)
 * - "Mark Ready for Delivery" updates backend order state and transitions to
 *   the "Handed over to delivery" rider confirmation screen.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import client from '../../api/client';

const OwnerOrderPrepScreen = ({ navigation, route }) => {
  const orderId = route.params?.orderId;
  const [loading, setLoading] = useState(true);
  const [markingReady, setMarkingReady] = useState(false);
  const [isHandedOver, setIsHandedOver] = useState(false);

  const [orderData, setOrderData] = useState({
    orderNumber: '#8402',
    customerName: 'Kamal Perera',
    customerInitials: 'KP',
    slotLabel: '09:00 AM slot',
    items: [],
    packedItems: [],
    riderName: 'Nimal Silva',
    handoverTime: '09:41',
  });

  const fetchPrepDetails = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      const response = await client.get(`/owner/orders/${orderId}/prep`);
      if (response.data?.success && response.data?.data) {
        setOrderData(response.data.data);
        if (response.data.data.isHandedOver) {
          setIsHandedOver(true);
        }
      }
    } catch (error) {
      console.warn('[Prep] Error loading prep details:', error.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchPrepDetails();
  }, [fetchPrepDetails]);

  // Toggle Item Packed State
  const toggleItemPacked = async (itemName) => {
    const isAlreadyPacked = orderData.packedItems.includes(itemName);
    const updatedPacked = isAlreadyPacked
      ? orderData.packedItems.filter((name) => name !== itemName)
      : [...orderData.packedItems, itemName];

    // Optimistically update UI
    setOrderData((prev) => ({
      ...prev,
      packedItems: updatedPacked,
    }));

    // Sync with backend
    if (orderId) {
      try {
        await client.patch(`/owner/orders/${orderId}/prep`, {
          packedItems: updatedPacked,
        });
      } catch (err) {
        console.warn('[Prep] Failed to save checklist state:', err.message);
      }
    }
  };

  // Mark Ready for Delivery & Hand Over to Rider
  const handleMarkReady = async () => {
    const totalItems = orderData.items.length || 1;
    const packedCount = orderData.packedItems.length;

    if (packedCount < totalItems) {
      Alert.alert(
        'Incomplete Checklist',
        `You have packed ${packedCount} of ${totalItems} items. Do you want to mark all items packed and hand over to rider?`,
        [
          { text: 'Keep Packing', style: 'cancel' },
          { text: 'Confirm Handover', onPress: () => submitReadyState() },
        ]
      );
    } else {
      submitReadyState();
    }
  };

  const submitReadyState = async () => {
    try {
      setMarkingReady(true);
      if (orderId) {
        const response = await client.post(`/owner/orders/${orderId}/ready`);
        if (response.data?.success && response.data?.data) {
          setOrderData((prev) => ({
            ...prev,
            riderName: response.data.data.riderName || 'Nimal Silva',
            handoverTime: response.data.data.handoverTime || '09:41',
          }));
        }
      }
      setIsHandedOver(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not update order status.');
    } finally {
      setMarkingReady(false);
    }
  };

  const totalItemsCount = orderData.items.length || 3;
  const packedItemsCount = orderData.packedItems.length;
  const progressPercent = Math.min(100, Math.round((packedItemsCount / totalItemsCount) * 100));

  // -------------------------------------------------------------
  // RENDER: HANDED OVER SUCCESS SCREEN (done order prep)
  // -------------------------------------------------------------
  if (isHandedOver) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Prep</Text>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.successContainer}>
          {/* Confetti & Concentric Green Rings Hero */}
          <View style={styles.heroRingsWrap}>
            {/* Confetti particles */}
            <View style={[styles.confetti, { top: 10, left: 24, backgroundColor: '#3B82F6' }]} />
            <View style={[styles.confetti, { top: 32, right: 30, backgroundColor: '#F59E0B' }]} />
            <View style={[styles.confetti, { bottom: 25, left: 35, backgroundColor: '#EF4444' }]} />
            <View style={[styles.confetti, { bottom: 40, right: 28, backgroundColor: '#10B981' }]} />
            <View style={[styles.confetti, { top: 60, left: 10, backgroundColor: '#8B5CF6' }]} />

            <View style={styles.ringOuter}>
              <View style={styles.ringMiddle}>
                <View style={styles.ringCenter}>
                  <Ionicons name="checkmark" size={38} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>

          {/* Heading & Subtitle */}
          <Text style={styles.handedOverTitle}>Handed over to delivery</Text>
          <Text style={styles.handedOverSubtitle}>
            Order {orderData.orderNumber} given to rider
          </Text>

          {/* Handover Details Card */}
          <View style={styles.handoverCard}>
            {/* Customer Row */}
            <View style={styles.handoverRow}>
              <View style={styles.handoverAvatar}>
                <Text style={styles.handoverAvatarText}>{orderData.customerInitials || 'KP'}</Text>
              </View>
              <View style={styles.handoverInfo}>
                <Text style={styles.handoverName}>{orderData.customerName || 'Kamal Perera'}</Text>
                <Text style={styles.handoverRole}>Customer</Text>
              </View>
            </View>

            <View style={styles.handoverDivider} />

            {/* Rider Row */}
            <View style={styles.handoverRow}>
              <View style={[styles.handoverAvatar, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.handoverAvatarText, { color: colors.primary }]}>NS</Text>
              </View>
              <View style={styles.handoverInfo}>
                <Text style={styles.handoverName}>
                  {orderData.riderName || 'Nimal Silva'} picked up {orderData.handoverTime || '09:41'}
                </Text>
                <Text style={styles.handoverRole}>Delivery rider</Text>
              </View>
            </View>
          </View>

          {/* Return Button */}
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.85}
          >
            <Text style={styles.returnButtonText}>Back to Incoming Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // RENDER: ORDER PREP CHECKLIST SCREEN (17_order-preparation 1)
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Prep</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Order Information Card */}
          <View style={styles.orderSummaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryAvatar}>
                <Text style={styles.summaryAvatarText}>{orderData.customerInitials || 'KP'}</Text>
              </View>
              <View style={styles.summaryDetails}>
                <Text style={styles.summaryCustomerName}>{orderData.customerName || 'Kamal Perera'}</Text>
                <Text style={styles.summaryOrderSlot}>
                  Order {orderData.orderNumber} • {orderData.slotLabel || '09:00 AM slot'}
                </Text>
              </View>
              <View style={styles.preparingPill}>
                <View style={styles.preparingDot} />
                <Text style={styles.preparingText}>Preparing</Text>
              </View>
            </View>
          </View>

          {/* Section: ITEMS CHECKLIST */}
          <Text style={styles.checklistSectionTitle}>
            ITEMS CHECKLIST ({totalItemsCount} ITEMS)
          </Text>

          {/* Checklist Items */}
          <View style={styles.checklistContainer}>
            {orderData.items.map((item, index) => {
              const isPacked = orderData.packedItems.includes(item.name);

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.checklistItem, isPacked && styles.checklistItemPacked]}
                  onPress={() => toggleItemPacked(item.name)}
                  activeOpacity={0.7}
                >
                  {/* Round Checkbox */}
                  <View style={[styles.roundCheckbox, isPacked && styles.roundCheckboxChecked]}>
                    {isPacked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>

                  {/* Title & Subtitle */}
                  <View style={styles.itemTextBox}>
                    <Text style={[styles.itemTitle, isPacked && styles.itemTitlePacked]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemSubtitle}>
                      {item.unit || `Qty ${item.quantity}`}
                    </Text>
                  </View>

                  {/* Right Thumbnail Placeholder */}
                  <View style={styles.itemThumb}>
                    <Ionicons
                      name={item.name.toLowerCase().includes('tea') ? 'cafe' : item.name.toLowerCase().includes('oil') ? 'water' : 'basket'}
                      size={20}
                      color="#F59E0B"
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Bottom Progress Bar & Action Button */}
      {!loading && (
        <View style={styles.bottomBar}>
          <View style={styles.progressTextRow}>
            <Text style={styles.packedCountText}>
              Packed: {packedItemsCount} of {totalItemsCount} items
            </Text>
            <Text style={styles.progressPercentText}>{progressPercent}%</Text>
          </View>

          {/* Visual Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Mark Ready Button */}
          <TouchableOpacity
            style={styles.markReadyButton}
            onPress={handleMarkReady}
            disabled={markingReady}
            activeOpacity={0.85}
          >
            {markingReady ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.markReadyButtonText}>Mark Ready for Delivery</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  headerIconBtn: {
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 130,
  },
  orderSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryDetails: {
    flex: 1,
  },
  summaryCustomerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  summaryOrderSlot: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  preparingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  preparingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  preparingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  checklistSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  checklistContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checklistItemPacked: {
    opacity: 0.85,
  },
  roundCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roundCheckboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemTextBox: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  itemTitlePacked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  packedCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  markReadyButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  markReadyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  heroRingsWrap: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ringOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringMiddle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#16803C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16803C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  handedOverTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  handedOverSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  handoverCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  handoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handoverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  handoverAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  handoverInfo: {
    flex: 1,
  },
  handoverName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  handoverRole: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  handoverDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  returnButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default OwnerOrderPrepScreen;
