/**
 * Screen 07 / 08: Select Pickup / Delivery Slot
 * Matches Figma designs 07_time-sl... and 08_time-sl...
 * 
 * CRUD OPERATIONS:
 * 1. READ: Fetches available slots filtered by date & type (GET /api/slots)
 * 2. UPDATE: Assigns the selected slot to current order (PUT /api/orders/:id/slot)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { calculatePromoDiscount, DELIVERY_CHARGE, FREE_DELIVERY_THRESHOLD } from '../../config/customerConstants';
import ScreenHeader from '../../components/ScreenHeader';
import DateChip from '../../components/DateChip';
import SlotItem from '../../components/SlotItem';
import AppButton from '../../components/AppButton';
import client from '../../api/client';
import CustomerBottomBar, { CUSTOMER_BOTTOM_BAR_HEIGHT } from '../../components/CustomerBottomBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TimeSlotScreen = ({ navigation, route }) => {
  const isChangingExistingOrder = Boolean(route.params?.changeExistingOrder && route.params?.orderId);
  const initialFulfillmentType = route.params?.fulfillmentType || 'pickup';
  const [fulfillmentType, setFulfillmentType] = useState(initialFulfillmentType);
  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [order, setOrder] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();
  const promoCode = route.params?.promoCode || order?.promoCode || '';
  const subtotal = Number(order?.subtotal) || 0;
  const discountAmount = calculatePromoDiscount(promoCode, subtotal);
  const deliveryFee = fulfillmentType === 'delivery' && subtotal < FREE_DELIVERY_THRESHOLD
    ? DELIVERY_CHARGE
    : 0;
  const totalAmount = subtotal - discountAmount + deliveryFee;

  // Initialize 3 date chips starting from today
  useEffect(() => {
    generateDateChips();
    fetchCurrentOrder();
  }, []);

  // Fetch slots whenever selectedDate or fulfillmentType changes
  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate, fulfillmentType);
    }
  }, [selectedDate, fulfillmentType]);

  const generateDateChips = () => {
    const dates = [];
    const today = new Date();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${monthStr}-${dayStr}`;

      const dayNum = d.getDate();
      const monthName = months[d.getMonth()];
      const dayName = daysOfWeek[d.getDay()];

      let subLabel = i === 0 ? 'Today' : dayName;
      let label = `${dayNum} ${monthName}`;

      dates.push({
        dateString,
        label,
        subLabel,
      });
    }

    setDateList(dates);
    if (dates.length > 0) {
      setSelectedDate(dates[0].dateString);
    }
  };

  const fetchCurrentOrder = async () => {
    try {
      const res = route.params?.orderId
        ? await client.get(`/orders/${route.params.orderId}`)
        : await client.get('/orders/current');
      if (res.data?.data) {
        setOrder(res.data.data);
        if (!route.params?.fulfillmentType && res.data.data.fulfillmentType) {
          setFulfillmentType(res.data.data.fulfillmentType);
        }
      }
    } catch (error) {
      console.warn('Failed to load current order:', error.message);
    }
  };

  // CRUD Operation 1: READ Slots
  const fetchSlots = async (date, type) => {
    try {
      setLoadingSlots(true);
      setSlots([]);
      const res = await client.get(`/slots?date=${date}&type=${type}`);
      if (res.data?.data) {
        setSlots(res.data.data);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Unable to fetch available time slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // CRUD Operation 2: UPDATE Order's Slot
  const handleContinue = async () => {
    if (!selectedSlot) {
      Alert.alert('Slot Required', 'Please select a time slot to continue.');
      return;
    }

    if (!order) {
      Alert.alert('Order Missing', 'Could not locate current order.');
      return;
    }

    try {
      setSubmitting(true);
      const updatePayload = {
        slotId: selectedSlot._id,
        fulfillmentType,
      };
      if (!isChangingExistingOrder) updatePayload.promoCode = promoCode;
      const res = await client.put(`/orders/${order._id}/slot`, updatePayload);

      if (res.data?.success) {
        if (isChangingExistingOrder) {
          Alert.alert('Time slot updated', 'Your order now has the new delivery or pickup slot.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          navigation.navigate('Payment', {
            orderId: res.data.data._id,
            slot: selectedSlot,
            fulfillmentType,
            promoCode,
          });
        }
      }
    } catch (error) {
      Alert.alert('Reservation Failed', error.message || 'Slot could not be reserved.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={fulfillmentType === 'pickup' ? 'Select Pickup Slot' : 'Select Delivery Slot'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Checkout selects fulfillment; placed orders may only change their time slot. */}
        {!isChangingExistingOrder ? <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, fulfillmentType === 'pickup' && styles.toggleBtnActive]}
            onPress={() => {
              setFulfillmentType('pickup');
              setSelectedSlot(null);
              setSlots([]);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="storefront-outline"
              size={18}
              color={fulfillmentType === 'pickup' ? colors.primaryDark : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.toggleText,
                fulfillmentType === 'pickup' && styles.toggleTextActive,
              ]}
            >
              Pickup
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, fulfillmentType === 'delivery' && styles.toggleBtnActive]}
            onPress={() => {
              setFulfillmentType('delivery');
              setSelectedSlot(null);
              setSlots([]);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="bicycle-outline"
              size={18}
              color={fulfillmentType === 'delivery' ? colors.primaryDark : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.toggleText,
                fulfillmentType === 'delivery' && styles.toggleTextActive,
              ]}
            >
              Delivery
            </Text>
          </TouchableOpacity>
        </View> : null}

        {order ? (
          <>
            <View style={styles.deliveryMessage}>
              <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
              <Text style={styles.deliveryMessageText}>
                {fulfillmentType === 'pickup'
                  ? 'Pickup is always free.'
                  : subtotal >= FREE_DELIVERY_THRESHOLD
                    ? "You've unlocked free delivery on this order."
                    : `Add Rs. ${(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString()} more for free delivery.`}
              </Text>
            </View>
            <View style={styles.priceSummary}>
              <Text style={styles.priceSummaryTitle}>Price details</Text>
              <PriceRow label="Subtotal" amount={subtotal} />
              {promoCode ? <PriceRow label={`Discount (${promoCode})`} amount={-discountAmount} discount /> : null}
              <PriceRow label="Delivery charge" amount={deliveryFee} />
              <View style={styles.priceDivider} />
              <PriceRow label="Total" amount={totalAmount} total />
            </View>
          </>
        ) : null}

        {/* Date Selector Row */}
        <View style={styles.dateSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {dateList.map((item) => (
              <DateChip
                key={item.dateString}
                dateString={item.dateString}
                label={item.label}
                subLabel={item.subLabel}
                isSelected={selectedDate === item.dateString}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                  setSlots([]);
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Available Slots Section */}
        <View style={styles.slotsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Slots</Text>
            <Text style={styles.sectionSubtitle}>Select a convenient 1-hour window</Text>
          </View>

          {loadingSlots ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Finding available slots...</Text>
            </View>
          ) : slots.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={36} color={colors.disabled} />
              <Text style={styles.emptyText}>No slots scheduled for this date.</Text>
            </View>
          ) : (
            slots.map((slot) => (
              <SlotItem
                key={slot._id}
                slot={slot}
                isSelected={selectedSlot?._id === slot._id}
                onSelect={(s) => setSelectedSlot(s)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={[styles.bottomBar, { bottom: CUSTOMER_BOTTOM_BAR_HEIGHT + insets.bottom }]}>
        <AppButton
          title={isChangingExistingOrder ? 'Save new slot' : 'Continue to Payment'}
          onPress={handleContinue}
          loading={submitting}
          disabled={!selectedSlot || submitting || loadingSlots}
          icon={<Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
        />
      </View>
      <CustomerBottomBar navigation={navigation} />
    </View>
  );
};

const PriceRow = ({ label, amount, discount, total }) => (
  <View style={styles.priceRow}>
    <Text style={[styles.priceLabel, total && styles.priceTotalLabel, discount && styles.discountValue]}>
      {label}
    </Text>
    <Text style={[styles.priceAmount, total && styles.priceTotalAmount, discount && styles.discountValue]}>
      {amount < 0 ? `- Rs. ${Math.abs(amount)}` : `Rs. ${amount}`}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 44,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 190,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF3EF',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  deliveryMessage: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    padding: 12,
  },
  deliveryMessageText: { color: colors.primaryDark, flex: 1, fontSize: 12, fontWeight: '600' },
  priceSummary: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 15, borderWidth: 1, marginBottom: 18, padding: 16 },
  priceSummaryTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  priceLabel: { color: colors.textSecondary, fontSize: 13 },
  priceAmount: { color: colors.text, fontSize: 13, fontWeight: '700' },
  priceTotalLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  priceTotalAmount: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  discountValue: { color: colors.primaryDark },
  priceDivider: { backgroundColor: colors.borderLight, height: 1, marginTop: 12 },
  dateSection: {
    marginBottom: 20,
  },
  dateScroll: {
    paddingVertical: 4,
  },
  slotsSection: {
    marginTop: 6,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default TimeSlotScreen;
