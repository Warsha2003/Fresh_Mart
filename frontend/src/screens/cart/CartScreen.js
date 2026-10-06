/**
 * CartScreen (Cart Entrypoint leading directly to Scope Screens 07-12)
 * Matches Figma 06_cart 1 layout and initiates checkout.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AppButton from '../../components/AppButton';
import client from '../../api/client';

const CartScreen = ({ navigation }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentOrder();
  }, []);

  const fetchCurrentOrder = async () => {
    try {
      setLoading(true);
      const res = await client.get('/orders/current');
      if (res.data?.data) {
        setOrder(res.data.data);
      }
    } catch (error) {
      console.warn('Error fetching draft cart order:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <TouchableOpacity onPress={fetchCurrentOrder} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Cart Items List */}
          <View style={styles.itemsSection}>
            {order?.items?.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemIconBox}>
                  <Ionicons name="nutrition-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>{item.unit} • Qty {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>Rs. {item.price}</Text>
              </View>
            ))}
          </View>

          {/* Delivery perk promo bar */}
          <View style={styles.promoBar}>
            <Ionicons name="gift-outline" size={18} color={colors.primary} />
            <Text style={styles.promoText}>You've earned free pickup on this order!</Text>
          </View>

          {/* Price Breakdown */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs. {order?.subtotal || 2000}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Est. Delivery</Text>
              <Text style={styles.summaryValue}>Rs. {order?.deliveryFee || 50}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs. {order?.totalAmount || 2050}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom Floating Checkout Bar */}
      <View style={styles.bottomBar}>
        <AppButton
          title="Select Delivery / Pickup Slot"
          onPress={() => navigation.navigate('TimeSlot')}
          icon={<Ionicons name="calendar-outline" size={20} color={colors.textInverse} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemQty: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  promoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  promoText: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '500',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
});

export default CartScreen;
