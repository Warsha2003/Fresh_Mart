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
import ScreenHeader from '../../components/ScreenHeader';
import DateChip from '../../components/DateChip';
import SlotItem from '../../components/SlotItem';
import AppButton from '../../components/AppButton';
import client from '../../api/client';

const TimeSlotScreen = ({ navigation }) => {
  const [fulfillmentType, setFulfillmentType] = useState('pickup'); // 'pickup' | 'delivery'
  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [order, setOrder] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      const res = await client.get('/orders/current');
      if (res.data?.data) {
        setOrder(res.data.data);
        if (res.data.data.fulfillmentType) {
          setFulfillmentType(res.data.data.fulfillmentType);
        }
        if (res.data.data.slot) {
          setSelectedSlot(res.data.data.slot);
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
      const res = await client.put(`/orders/${order._id}/slot`, {
        slotId: selectedSlot._id,
        fulfillmentType,
      });

      if (res.data?.success) {
        navigation.navigate('Payment', {
          orderId: order._id,
          slot: selectedSlot,
          fulfillmentType,
        });
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
        {/* Toggle Fulfillment Switch */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, fulfillmentType === 'pickup' && styles.toggleBtnActive]}
            onPress={() => {
              setFulfillmentType('pickup');
              setSelectedSlot(null);
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
        </View>

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
      <View style={styles.bottomBar}>
        <AppButton
          title="Continue to Payment"
          onPress={handleContinue}
          loading={submitting}
          disabled={!selectedSlot}
          icon={<Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
        />
      </View>
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
});

export default TimeSlotScreen;
