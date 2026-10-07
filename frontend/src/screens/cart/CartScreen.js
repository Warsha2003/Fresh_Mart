import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import { useCustomer } from '../../context/CustomerContext';
import {
  calculatePromoDiscount,
  DELIVERY_CHARGE,
  FREE_DELIVERY_THRESHOLD,
  PROMO_CODES,
} from '../../config/customerConstants';
import { getProductAsset } from '../../config/productAssets';
import { colors } from '../../theme/colors';

const CartScreen = ({ navigation }) => {
  const {
    cart,
    cartSubtotal,
    addresses,
    selectedAddress,
    refreshCart,
    refreshAddresses,
    updateCartItem,
    removeCartItem,
    selectAddress,
  } = useCustomer();
  const [fulfillmentType, setFulfillmentType] = useState('pickup');
  const [loading, setLoading] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    const refresh = async () => {
      try {
        setLoading(true);
        await Promise.all([refreshCart(), refreshAddresses()]);
      } catch (error) {
        if (active) Alert.alert('Unable to load your cart', error.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    refresh();
    return () => { active = false; };
  }, [refreshAddresses, refreshCart]));

  const changeQuantity = async (item, quantity) => {
    const productId = item.productId || item.id;
    try {
      setUpdatingProduct(productId);
      if (quantity <= 0) {
        await removeCartItem(productId);
      } else {
        await updateCartItem(productId, quantity);
      }
    } catch (error) {
      Alert.alert('Could not update cart', error.message);
    } finally {
      setUpdatingProduct(null);
    }
  };

  const chooseAddress = async (addressId) => {
    try {
      await selectAddress(addressId);
    } catch (error) {
      Alert.alert('Could not select address', error.message);
    }
  };

  const beginCheckout = () => {
    if (!cart.items?.length) return;
    if (fulfillmentType === 'delivery' && !selectedAddress) {
      Alert.alert('Delivery address required', 'Select or add a saved address before choosing delivery.');
      return;
    }
    navigation.navigate('TimeSlot', { fulfillmentType, promoCode });
  };

  const freeDeliveryThreshold = cart.freeDeliveryThreshold ?? FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = cart.deliveryCharge ?? DELIVERY_CHARGE;
  const deliveryFee = fulfillmentType === 'delivery' && cartSubtotal < freeDeliveryThreshold
    ? deliveryCharge || DELIVERY_CHARGE
    : 0;
  const discountAmount = calculatePromoDiscount(promoCode, cartSubtotal);
  const total = cartSubtotal - discountAmount + deliveryFee;

  const applyPromoCode = () => {
    const normalizedCode = promoInput.trim().toUpperCase();
    if (!PROMO_CODES[normalizedCode]) {
      setPromoError('Invalid promo code. Try FRESH10 or FARM15.');
      return;
    }
    setPromoCode(normalizedCode);
    setPromoInput(normalizedCode);
    setPromoError('');
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoInput('');
    setPromoError('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSubtitle}>{cart.itemCount || 0} items</Text>
        </View>
        <TouchableOpacity onPress={refreshCart} accessibilityLabel="Refresh cart" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh-outline" size={21} color={colors.text} />
        </TouchableOpacity>
      </View>
      {loading && !cart.items?.length ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : !cart.items?.length ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="cart-outline" size={32} color={colors.primary} /></View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyMessage}>Add fresh groceries and they’ll show up here.</Text>
          <AppButton title="Explore products" onPress={() => navigation.navigate('Products')} style={styles.shopButton} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {cart.items.map((item) => {
              const productId = item.productId || item.id;
              const itemLoading = updatingProduct === productId;
              return (
                <View key={productId} style={styles.itemCard}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.productImageBox}
                    onPress={() => navigation.navigate('ProductDetails', { productId })}
                  >
                    <Image source={getProductAsset(item.imageKey)} style={styles.productImage} resizeMode="contain" />
                  </TouchableOpacity>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemPack}>{item.packSize}</Text>
                    <Text style={styles.itemPrice}>Rs. {item.unitPrice}</Text>
                    <View style={styles.quantityRow}>
                      <TouchableOpacity
                        accessibilityLabel={`Decrease ${item.name} quantity`}
                        style={styles.quantityButton}
                        onPress={() => changeQuantity(item, item.quantity - 1)}
                        disabled={itemLoading}
                      >
                        <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={item.quantity === 1 ? colors.danger : colors.text} />
                      </TouchableOpacity>
                      {itemLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.quantity}>{item.quantity}</Text>}
                      <TouchableOpacity
                        accessibilityLabel={`Increase ${item.name} quantity`}
                        style={styles.quantityButton}
                        onPress={() => changeQuantity(item, item.quantity + 1)}
                        disabled={itemLoading || item.quantity >= item.stock}
                      >
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.lineTotal}>Rs. {item.lineTotal}</Text>
                </View>
              );
            })}

            <Text style={styles.sectionTitle}>Fulfilment</Text>
            <View style={styles.fulfilmentToggle}>
              {['pickup', 'delivery'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.fulfilmentOption, fulfillmentType === type && styles.fulfilmentActive]}
                  onPress={() => setFulfillmentType(type)}
                >
                  <Ionicons
                    name={type === 'pickup' ? 'storefront-outline' : 'bicycle-outline'}
                    size={18}
                    color={fulfillmentType === type ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.fulfilmentText, fulfillmentType === type && styles.fulfilmentTextActive]}>
                    {type === 'pickup'
                      ? 'Pickup · Free'
                      : deliveryFee === 0
                        ? 'Delivery · Free'
                        : `Delivery · Rs. ${deliveryFee}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {fulfillmentType === 'delivery' && (
              <View style={styles.addressSection}>
                <View style={styles.addressHeading}>
                  <Text style={styles.sectionTitle}>Delivery address</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Addresses')}>
                    <Text style={styles.manageText}>Manage</Text>
                  </TouchableOpacity>
                </View>
                {addresses.length === 0 ? (
                  <TouchableOpacity style={styles.addAddress} onPress={() => navigation.navigate('Addresses')}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={styles.addAddressText}>Add a delivery address</Text>
                  </TouchableOpacity>
                ) : (
                  addresses.map((address) => {
                    const isSelected = (selectedAddress?._id || selectedAddress?.id) === address._id;
                    return (
                      <TouchableOpacity
                        key={address._id}
                        style={[styles.addressOption, isSelected && styles.addressSelected]}
                        onPress={() => chooseAddress(address._id)}
                      >
                        <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={19} color={isSelected ? colors.primary : colors.textSecondary} />
                        <View style={styles.addressText}>
                          <Text style={styles.addressLabel}>{address.label}{address.isDefault ? ' · Default' : ''}</Text>
                          <Text style={styles.addressLine} numberOfLines={2}>{address.addressLine}, {address.city}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            <View style={styles.promoCard}>
              <Text style={styles.sectionTitle}>Promo code</Text>
              {promoCode ? (
                <View style={styles.appliedPromo}>
                  <View style={styles.appliedPromoText}>
                    <Ionicons name="pricetag" size={17} color={colors.primary} />
                    <Text style={styles.appliedPromoLabel}>
                      {promoCode} · {PROMO_CODES[promoCode].discountPercent}% off
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.removePromo} onPress={removePromoCode}>
                    <Text style={styles.removePromoText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.promoEntryRow}>
                  <TextInput
                    accessibilityLabel="Promo code"
                    autoCapitalize="characters"
                    placeholder="Enter promo code"
                    placeholderTextColor={colors.textLight}
                    style={styles.promoInput}
                    value={promoInput}
                    onChangeText={(value) => {
                      setPromoInput(value);
                      setPromoError('');
                    }}
                  />
                  <TouchableOpacity style={styles.applyPromoButton} onPress={applyPromoCode}>
                    <Text style={styles.applyPromoText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              )}
              {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
            </View>

            <View style={styles.promoBanner}>
              <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
              <Text style={styles.promoText}>
                {fulfillmentType === 'pickup'
                  ? 'Pickup is always free.'
                  : cartSubtotal >= freeDeliveryThreshold
                    ? "You've unlocked free delivery on this order."
                    : `Add Rs. ${(freeDeliveryThreshold - cartSubtotal).toLocaleString()} more for free delivery.`}
              </Text>
            </View>

            <View style={styles.summary}>
              <Text style={styles.sectionTitle}>Price details</Text>
              <SummaryRow label="Subtotal" value={cartSubtotal} />
              {promoCode ? <SummaryRow label={`Discount (${promoCode})`} value={-discountAmount} discount /> : null}
              <SummaryRow label="Delivery charge" value={deliveryFee} />
              <View style={styles.divider} />
              <SummaryRow label="Total" value={total} total />
            </View>
          </ScrollView>
          <View style={styles.bottomBar}>
            <AppButton
              title="Choose a time slot"
              onPress={beginCheckout}
              disabled={cart.items.length === 0 || (fulfillmentType === 'delivery' && !selectedAddress)}
              icon={<Ionicons name="arrow-forward" size={19} color={colors.textInverse} />}
            />
          </View>
        </>
      )}
    </View>
  );
};

const SummaryRow = ({ label, value, total: isTotal, discount }) => (
  <View style={styles.summaryRow}>
    <Text style={[styles.summaryLabel, isTotal && styles.totalLabel, discount && styles.discountText]}>{label}</Text>
    <Text style={[styles.summaryValue, isTotal && styles.totalValue, discount && styles.discountText]}>
      {value < 0 ? `- Rs. ${Math.abs(value)}` : `Rs. ${value}`}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 14 },
  headerTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 180 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 14 },
  emptyMessage: { color: colors.textSecondary, fontSize: 13, marginTop: 5, textAlign: 'center' },
  shopButton: { marginTop: 16, minWidth: 210 },
  itemCard: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: 15, borderWidth: 1, flexDirection: 'row', marginBottom: 10, padding: 12 },
  productImageBox: { alignItems: 'center', backgroundColor: colors.primarySurface, borderRadius: 12, height: 76, justifyContent: 'center', width: 76 },
  productImage: { height: 64, width: 64 },
  itemInfo: { flex: 1, marginLeft: 11 },
  itemName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  itemPack: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  itemPrice: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', marginTop: 5 },
  lineTotal: { alignSelf: 'flex-start', color: colors.text, fontSize: 13, fontWeight: '800', marginLeft: 5, marginTop: 3 },
  quantityRow: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 7 },
  quantityButton: { alignItems: 'center', backgroundColor: colors.background, borderRadius: 10, height: 28, justifyContent: 'center', width: 30 },
  quantity: { color: colors.text, fontSize: 13, fontWeight: '700', minWidth: 12, textAlign: 'center' },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  fulfilmentToggle: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 13, borderWidth: 1, flexDirection: 'row', marginTop: 10, padding: 4 },
  fulfilmentOption: { alignItems: 'center', borderRadius: 10, flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 42 },
  fulfilmentActive: { backgroundColor: colors.primaryLight },
  fulfilmentText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  fulfilmentTextActive: { color: colors.primaryDark, fontWeight: '800' },
  addressSection: { marginTop: 20 },
  addressHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  manageText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  addressOption: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', marginBottom: 8, padding: 12 },
  addressSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  addressText: { flex: 1, marginLeft: 9 },
  addressLabel: { color: colors.text, fontSize: 12, fontWeight: '700' },
  addressLine: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  addAddress: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, flexDirection: 'row', gap: 8, padding: 14 },
  addAddressText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  promoCard: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 15, borderWidth: 1, marginTop: 16, padding: 14 },
  promoEntryRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  promoInput: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.text, flex: 1, height: 46, paddingHorizontal: 12 },
  applyPromoButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10, justifyContent: 'center', minHeight: 46, minWidth: 76, paddingHorizontal: 14 },
  applyPromoText: { color: colors.textInverse, fontSize: 13, fontWeight: '700' },
  appliedPromo: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  appliedPromoText: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  appliedPromoLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
  removePromo: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  removePromoText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  promoError: { color: colors.danger, fontSize: 12, marginTop: 8 },
  promoBanner: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 12, flexDirection: 'row', gap: 8, marginTop: 18, padding: 12 },
  promoText: { color: colors.primaryDark, flex: 1, fontSize: 12, fontWeight: '600' },
  summary: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 15, borderWidth: 1, marginTop: 16, padding: 16 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  summaryLabel: { color: colors.textSecondary, fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 13, fontWeight: '700' },
  discountText: { color: colors.primaryDark },
  divider: { backgroundColor: colors.borderLight, height: 1, marginTop: 13 },
  totalLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  totalValue: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  bottomBar: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, bottom: 72, left: 0, paddingHorizontal: 18, paddingVertical: 8, position: 'absolute', right: 0 },
});

export default CartScreen;
