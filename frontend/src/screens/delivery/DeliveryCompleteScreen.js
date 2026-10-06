/**
 * Screen 25: Delivery Complete / Successful
 * Matches Figma design 25_delivery-com...
 * 
 * CRUD OPERATIONS:
 * 1. READ: Final delivery summary receipt (GET /api/orders/delivery/:id)
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AppButton from '../../components/AppButton';
import ScreenHeader from '../../components/ScreenHeader';

const DeliveryCompleteScreen = ({ navigation, route }) => {
  const {
    orderNumber = '—',
    amount = 0,
    paymentMethod,
    deliveredAt,
  } = route.params || {};
  const timeDelivered = deliveredAt
    ? new Date(deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
  const paymentLabel =
    paymentMethod === 'cash_on_delivery'
      ? 'Cash Collected'
      : paymentMethod === 'card'
        ? 'Paid Online'
        : 'Not available';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Delivery Complete"
        onBack={() => navigation.navigate('DeliveryDashboard')}
        rightAction={
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Confetti & Checkmark Graphic */}
        <View style={styles.celebrationContainer}>
          <View style={styles.confettiRing}>
            <View style={[styles.confettiDot, { top: 0, left: 25, backgroundColor: '#34D399' }]} />
            <View style={[styles.confettiDot, { top: 15, right: 25, backgroundColor: '#FBBF24' }]} />
            <View style={[styles.confettiDot, { bottom: 10, left: 15, backgroundColor: '#60A5FA' }]} />
            <View style={[styles.confettiDot, { bottom: 20, right: 30, backgroundColor: '#F472B6' }]} />

            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                <Ionicons name="checkmark" size={44} color={colors.textInverse} />
              </View>
            </View>
          </View>
        </View>

        {/* Success Headings */}
        <Text style={styles.title}>Delivery Successful</Text>
        <Text style={styles.subtitle}>
          Great job! Order {orderNumber} has been delivered.
        </Text>

        {/* Receipt Table Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Order Number</Text>
            <Text style={styles.receiptValueBold}>{orderNumber}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Time Delivered</Text>
            <Text style={styles.receiptValue}>{timeDelivered}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Payment Mode</Text>
            <Text style={styles.receiptValue}>{paymentLabel}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>
              {paymentMethod === 'cash_on_delivery' ? 'Amount Received' : 'Order Total'}
            </Text>
            <Text style={styles.receiptAmount}>Rs. {amount}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <AppButton
            title="Back to Dashboard"
            onPress={() => navigation.navigate('DeliveryDashboard')}
            icon={<Ionicons name="speedometer-outline" size={18} color={colors.textInverse} />}
          />

          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => Alert.alert('Report Issue', 'Issue reporting form opened for order ' + orderNumber)}
          >
            <Ionicons name="flag-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.reportBtnText}>Report an Issue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confettiRing: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  circleOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  receiptCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 28,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  receiptLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  receiptValueBold: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  receiptAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  actionsContainer: {
    marginTop: 4,
  },
  reportBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  reportBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default DeliveryCompleteScreen;
