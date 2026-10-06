/**
 * Screen 10: Payment Successful
 * Matches Figma design 10_payme...
 * 
 * CRUD OPERATIONS:
 * 1. READ: Loads order and payment receipt summary (GET /api/orders/:id or route params)
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AppButton from '../../components/AppButton';
import client from '../../api/client';

const PaymentSuccessScreen = ({ navigation, route }) => {
  const { orderId, orderNumber, amount, method, slotLabel } = route.params || {};

  const [receipt, setReceipt] = useState({
    orderId: orderId || '',
    orderNumber: orderNumber || '#FM-98432',
    amount: amount || 2050,
    method: method || 'Card (**** 4242)',
    slotLabel: slotLabel || 'Today, 09:00 - 10:00 AM',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchReceiptDetails();
    }
  }, [orderId]);

  // CRUD Operation: READ Payment & Order details
  const fetchReceiptDetails = async () => {
    try {
      setLoading(true);
      const [orderRes, payRes] = await Promise.allSettled([
        client.get(`/orders/${orderId}`),
        client.get(`/payments/order/${orderId}`),
      ]);

      let updatedData = { ...receipt };

      if (orderRes.status === 'fulfilled' && orderRes.value.data?.data) {
        const orderData = orderRes.value.data.data;
        updatedData.orderNumber = orderData.orderNumber || updatedData.orderNumber;
        updatedData.amount = orderData.totalAmount || updatedData.amount;
        if (orderData.slot?.displayLabel) {
          updatedData.slotLabel = `Today, ${orderData.slot.displayLabel}`;
        }
      }

      if (payRes.status === 'fulfilled' && payRes.value.data?.data) {
        const payData = payRes.value.data.data;
        if (payData.method === 'card') {
          updatedData.method = `Card (**** ${payData.last4 || '4242'})`;
        } else if (payData.method === 'cash_on_delivery') {
          updatedData.method = 'Cash on delivery';
        } else {
          updatedData.method = 'Cash on pickup';
        }
      }

      setReceipt(updatedData);
    } catch (e) {
      console.warn('Error refreshing receipt data:', e.message);
    } finally {
      setLoading(false);
    }
  };

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
          {receipt.method === 'Cash on delivery' ? 'Order Confirmed' : 'Payment Successful'}
        </Text>
        <Text style={styles.subtitle}>
          {receipt.method === 'Cash on delivery'
            ? 'Your delivery order is confirmed. Please pay the delivery partner when it arrives.'
            : 'Your payment has been processed successfully. We will send a confirmation email shortly.'}
        </Text>

        {/* Receipt Summary Card */}
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Amount</Text>
              <Text style={styles.receiptValueBold}>Rs. {receipt.amount}</Text>
            </View>
            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Payment Method</Text>
              <Text style={styles.receiptValue}>{receipt.method}</Text>
            </View>
            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Fulfillment Slot</Text>
              <Text style={styles.receiptValue}>{receipt.slotLabel}</Text>
            </View>
            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Order ID</Text>
              <Text style={styles.receiptOrderId}>{receipt.orderNumber}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsGroup}>
          <AppButton
            title="Track Order"
            onPress={() =>
              navigation.navigate('OrderTracking', {
                orderId: receipt.orderId,
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
