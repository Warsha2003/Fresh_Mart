/**
 * Screen 10: Payment Successful
 * Matches Figma design 10_payme...
 * 
 * CRUD OPERATIONS:
 * 1. READ: Loads order and payment receipt summary (GET /api/orders/:id or route params)
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AppButton from '../../components/AppButton';

const PaymentSuccessScreen = ({ navigation, route }) => {
  const { orderId, order, payment, method, slotLabel } = route.params || {};
  const amountPaid = payment?.amount;
  const paymentMethod = method || (
    payment?.method === 'card'
      ? `Card (**** ${payment.last4})`
      : payment?.method === 'cash_on_delivery'
        ? 'Cash on delivery'
        : payment?.method === 'cash_on_pickup'
          ? 'Cash on pickup'
          : ''
  );
  const savedOrderId = order?._id || orderId;
  const savedOrderNumber = order?.orderNumber;
  const savedSlotLabel = slotLabel || order?.slot?.displayLabel;
  const isCashOnDelivery = paymentMethod === 'Cash on delivery';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Celebration Checkmark Graphic with Confetti */}
        <View style={styles.celebrationContainer}>
          <View style={styles.confettiRing}>
            <View style={[styles.confettiDot, { top: 0, left: 30, backgroundColor: '#34D399' }]} />
            <View style={[styles.confettiDot, { top: 20, right: 20, backgroundColor: '#FBBF24' }]} />
            <View style={[styles.confettiDot, { bottom: 10, left: 10, backgroundColor: '#60A5FA' }]} />
            <View style={[styles.confettiDot, { bottom: 20, right: 35, backgroundColor: '#F472B6' }]} />
            
            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                <Ionicons name="checkmark" size={48} color={colors.textInverse} />
              </View>
            </View>
          </View>
        </View>

        {/* Success Typography */}
        <Text style={styles.title}>
          {isCashOnDelivery ? 'Order Confirmed' : 'Payment Successful'}
        </Text>
        <Text style={styles.subtitle}>
          {isCashOnDelivery
            ? 'Your delivery order is confirmed. Please pay the delivery partner when it arrives.'
            : 'Your payment has been processed successfully. We will send a confirmation email shortly.'}
        </Text>

        {/* Receipt Summary Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Amount paid</Text>
            <Text style={styles.receiptValueBold}>
              {Number.isFinite(amountPaid) ? `Rs. ${amountPaid}` : 'Unavailable'}
            </Text>
          </View>
          <View style={styles.receiptDivider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Subtotal</Text>
            <Text style={styles.receiptValue}>
              {Number.isFinite(order?.subtotal) ? `Rs. ${order.subtotal}` : 'Unavailable'}
            </Text>
          </View>
          {order?.promoCode ? (
            <>
              <View style={styles.receiptDivider} />
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Discount ({order.promoCode})</Text>
                <Text style={styles.discountValue}>
                  - Rs. {Number(order.discountAmount) || 0}
                </Text>
              </View>
            </>
          ) : null}
          <View style={styles.receiptDivider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Delivery charge</Text>
            <Text style={styles.receiptValue}>
              {Number.isFinite(order?.deliveryFee) ? `Rs. ${order.deliveryFee}` : 'Unavailable'}
            </Text>
          </View>
          <View style={styles.receiptDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Payment Method</Text>
            <Text style={styles.receiptValue}>{paymentMethod || 'Unavailable'}</Text>
          </View>
          <View style={styles.receiptDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Fulfillment Slot</Text>
            <Text style={styles.receiptValue}>{savedSlotLabel || 'Unavailable'}</Text>
          </View>
          <View style={styles.receiptDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Order ID</Text>
            <Text style={styles.receiptOrderId}>{savedOrderNumber || 'Unavailable'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsGroup}>
          <AppButton
            title="Track Order"
            onPress={() =>
              navigation.navigate('OrderTracking', {
                orderId: savedOrderId,
              })
            }
            icon={<Ionicons name="location-outline" size={18} color={colors.textInverse} />}
          />

          <AppButton
            title="Back to Home"
            variant="outline"
            onPress={() => navigation.navigate('MainTabs')}
            style={styles.backHomeBtn}
          />
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
    marginBottom: 20,
  },
  confettiRing: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  confettiDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  circleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5', // Soft green ring
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
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
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 28,
  },
  receiptCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 28,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  receiptDivider: {
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
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  discountValue: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  receiptOrderId: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  buttonsGroup: {
    marginTop: 4,
  },
  backHomeBtn: {
    marginTop: 10,
  },
});

export default PaymentSuccessScreen;
