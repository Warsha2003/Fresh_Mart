/**
 * Screen 09: Payment Screen
 * Matches Figma design 09_payme...
 * 
 * SECURITY COMPLIANCE NOTE:
 * Full credit card number and CVV are NEVER stored in any database or logged.
 * Input validation includes Luhn check, expiry date verification, and CVV checks.
 * 
 * CRUD OPERATIONS:
 * 1. CREATE: Posts simulated payment receipt (POST /api/payments)
 * 2. UPDATE: Order status transitions to 'placed'
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import ScreenHeader from '../../components/ScreenHeader';
import AppButton from '../../components/AppButton';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

// Luhn Algorithm validation for credit card numbers
const isValidLuhn = (numStr) => {
  const clean = numStr.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let doubleUp = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (doubleUp) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleUp = !doubleUp;
  }
  return sum % 10 === 0;
};

// Expiry date validation (MM/YY)
const isValidExpiry = (expiryStr) => {
  const parts = expiryStr.split('/');
  if (parts.length !== 2) return false;

  const month = parseInt(parts[0], 10);
  const year = parseInt(`20${parts[1]}`, 10);

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false; // Expired
  }
  return true;
};

const PaymentScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { orderId, slot, fulfillmentType } = route.params || {};

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'cash_on_pickup'
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('05/27');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardHolder, setCardHolder] = useState(user?.name || 'Kamal Perera');
  const [showCvv, setShowCvv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const isDeliveryOrder = fulfillmentType === 'delivery' || order?.fulfillmentType === 'delivery';

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      if (orderId) {
        const res = await client.get(`/orders/${orderId}`);
        if (res.data?.data) {
          setOrder(res.data.data);
        }
      } else {
        const res = await client.get('/orders/current');
        if (res.data?.data) {
          setOrder(res.data.data);
        }
      }
    } catch (e) {
      console.warn('Error fetching order for payment:', e.message);
    }
  };

  // Card Number auto-formatter (adds spaces every 4 digits)
  const handleCardNumberChange = (text) => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Expiry date auto-formatter (MM/YY)
  const handleExpiryChange = (text) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  // Detect card brand for live card preview
  const getCardBrand = () => {
    const clean = cardNumber.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    return 'Card';
  };

  // CRUD Operation: Process Payment
  const handlePayment = async () => {
    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (!isValidLuhn(cleanNum)) {
        Alert.alert('Invalid Card Number', 'Please enter a valid credit or debit card number (Luhn verified).');
        return;
      }
      if (!isValidExpiry(cardExpiry)) {
        Alert.alert('Invalid Expiry Date', 'Please enter a valid future expiration date in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3 || cardCvv.length > 4) {
        Alert.alert('Invalid CVV', 'CVV code must be 3 or 4 digits.');
        return;
      }
    }

    try {
      setLoading(true);
      const activeOrderId = order?._id || orderId;

      const res = await client.post('/payments', {
        orderId: activeOrderId,
        method: paymentMethod,
        cardNumber: paymentMethod === 'card' ? cardNumber : null,
        cardExpiry: paymentMethod === 'card' ? cardExpiry : null,
        cardCvv: paymentMethod === 'card' ? cardCvv : null,
        cardHolderName: cardHolder,
      });

      if (res.data?.success) {
        // Clear sensitive card states immediately after submission
        setCardNumber('');
        setCardCvv('');

        navigation.replace('PaymentSuccess', {
          orderId: activeOrderId,
          orderNumber: order?.orderNumber || '#FM-98432',
          amount: order?.totalAmount || 2050,
          method: paymentMethod === 'card'
            ? `Card (**** ${res.data.data.payment.last4 || '4242'})`
            : isDeliveryOrder
              ? 'Cash on delivery'
              : 'Cash on pickup',
          slotLabel: slot?.displayLabel || order?.slot?.displayLabel || '09:00 AM - 10:00 AM',
        });
      }
    } catch (error) {
      Alert.alert('Payment Error', error.message || 'Payment simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = order?.totalAmount || 2050;
  const currentSlotLabel = slot?.displayLabel || order?.slot?.displayLabel || 'Today, 09:00 AM - 10:00 AM';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScreenHeader title="Payment" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Selected Slot Summary Strip with Change Button */}
        <View style={styles.slotStrip}>
          <View style={styles.slotStripLeft}>
            <Ionicons name="time" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.slotStripTitle}>
                {fulfillmentType === 'delivery' || order?.fulfillmentType === 'delivery' ? 'Delivery Slot' : 'Pickup Slot'}
              </Text>
              <Text style={styles.slotStripSubtitle}>{currentSlotLabel}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.changeBtn}
            onPress={() => navigation.navigate('TimeSlot')}
          >
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method Toggle */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.methodToggleRow}>
          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardActive]}
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="card-outline"
              size={22}
              color={paymentMethod === 'card' ? colors.primaryDark : colors.textSecondary}
            />
            <Text
              style={[
                styles.methodCardText,
                paymentMethod === 'card' && styles.methodCardTextActive,
              ]}
            >
              Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodCard,
              paymentMethod === (isDeliveryOrder ? 'cash_on_delivery' : 'cash_on_pickup') &&
                styles.methodCardActive,
            ]}
            onPress={() => setPaymentMethod(isDeliveryOrder ? 'cash_on_delivery' : 'cash_on_pickup')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cash-outline"
              size={22}
              color={
                paymentMethod === (isDeliveryOrder ? 'cash_on_delivery' : 'cash_on_pickup')
                  ? colors.primaryDark
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.methodCardText,
                paymentMethod === (isDeliveryOrder ? 'cash_on_delivery' : 'cash_on_pickup') &&
                  styles.methodCardTextActive,
              ]}
            >
              {isDeliveryOrder ? 'Cash on delivery' : 'Cash on pickup'}
            </Text>
          </TouchableOpacity>
        </View>

        {paymentMethod === 'card' ? (
          <>
            {/* Credit Card Visual Preview */}
            <View style={styles.creditCardPreview}>
              <View style={styles.cardTopRow}>
                <View style={styles.chipGraphic} />
                <Text style={styles.cardBrandText}>{getCardBrand()}</Text>
              </View>

              <Text style={styles.cardDigitsPreview}>
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardHolderLabel}>CARDHOLDER</Text>
                  <Text style={styles.cardHolderName}>{cardHolder || 'KAMAL PERERA'}</Text>
                </View>
                <View>
                  <Text style={styles.cardHolderLabel}>EXPIRES</Text>
                  <Text style={styles.cardExpiryDate}>{cardExpiry || 'MM/YY'}</Text>
                </View>
              </View>
            </View>

            {/* Card Inputs Form */}
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="4242 4242 4242 4242"
                  placeholderTextColor={colors.textLight}
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textLight}
                      value={cardExpiry}
                      onChangeText={handleExpiryChange}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor={colors.textLight}
                      value={cardCvv}
                      onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      secureTextEntry={!showCvv}
                    />
                    <TouchableOpacity onPress={() => setShowCvv(!showCvv)}>
                      <Ionicons
                        name={showCvv ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Kamal Perera"
                  placeholderTextColor={colors.textLight}
                  value={cardHolder}
                  onChangeText={setCardHolder}
                />
              </View>
            </View>
          </>
        ) : (
          /* Cash On Pickup Info Box */
          <View style={styles.cashInfoBox}>
            <Ionicons name="information-circle-outline" size={28} color={colors.primary} />
            <Text style={styles.cashInfoTitle}>
              {isDeliveryOrder ? 'Pay when your order arrives' : 'Pay at the Counter'}
            </Text>
            <Text style={styles.cashInfoSubtitle}>
              {isDeliveryOrder
                ? `Please prepare Rs. ${totalAmount} to pay the delivery partner when your order arrives.`
                : `Please prepare exact cash of Rs. ${totalAmount} upon collection at 203 Galle Road, Colombo 03.`}
            </Text>
          </View>
        )}

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text style={styles.securityText}>
            Your transaction is secured with 256-bit encryption. (Simulated)
          </Text>
        </View>
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={styles.bottomBar}>
        <AppButton
          title={`Pay Rs. ${totalAmount}`}
          onPress={handlePayment}
          loading={loading}
          icon={<Ionicons name="lock-closed" size={18} color={colors.textInverse} />}
        />
      </View>
    </KeyboardAvoidingView>
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
  slotStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotStripTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  slotStripSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  changeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  methodToggleRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  methodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.card,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  methodCardTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  creditCardPreview: {
    height: 190,
    borderRadius: 18,
    backgroundColor: '#0F5C2A',
    padding: 22,
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#0F5C2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipGraphic: {
    width: 40,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E5C158',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  cardBrandText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textInverse,
    fontStyle: 'italic',
  },
  cardDigitsPreview: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHolderLabel: {
    fontSize: 9,
    color: '#A7F3D0',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardHolderName: {
    fontSize: 14,
    color: colors.textInverse,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  cardExpiryDate: {
    fontSize: 14,
    color: colors.textInverse,
    fontWeight: '700',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
    backgroundColor: '#FAFBFB',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  cashInfoBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  cashInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  cashInfoSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  securityText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
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

export default PaymentScreen;
