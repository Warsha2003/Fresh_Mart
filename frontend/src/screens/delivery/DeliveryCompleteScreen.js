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
  const rootNavigation = navigation.getParent()?.getParent();

  const navigateRoot = (routeName, params = {}) => {
    if (rootNavigation) {
      rootNavigation.navigate(routeName, params);
      return;
    }
    navigation.navigate(routeName, params);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Delivery Complete"
        onBack={() => navigateRoot('DeliveryTabs', { screen: 'Dashboard' })}
        rightAction={
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Celebration */}
        <View style={styles.celebrationContainer}>
          <View style={styles.celebrationGlow} />
          <View style={styles.successRing}>
            <Ionicons name="checkmark" size={58} color={colors.textInverse} />
          </View>
          <View style={styles.successBadge}>
            <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
            <Text style={styles.successBadgeText}>DELIVERY COMPLETE</Text>
          </View>
        </View>

        {/* Success Headings */}
        <Text style={styles.title}>Delivery Successful</Text>
        <Text style={styles.subtitle}>
          Great job! Order {orderNumber} has been delivered safely and on time.
        </Text>

        {/* Completion Summary */}
        <View style={styles.completionSummary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="time-outline" size={20} color="#10B981" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Delivered at</Text>
            <Text style={styles.summaryValue}>{timeDelivered}</Text>
          </View>
          <Text style={styles.summaryCheck}>✓</Text>
        </View>

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
            onPress={() => navigateRoot('DeliveryTabs', { screen: 'Dashboard' })}
            icon={<Ionicons name="speedometer-outline" size={18} color={colors.textInverse} />}
          />

          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => navigateRoot('ReportIssue', { orderNumber })}
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
    backgroundColor: '#F1F9F4',
    paddingTop: 44,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
  },
  celebrationGlow: {
    position: 'absolute',
    top: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#D1FAE5',
    opacity: 0.7,
  },
  successRing: {
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderColor: '#D1FAE5',
    borderRadius: 75,
    borderWidth: 9,
    height: 150,
    justifyContent: 'center',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    width: 150,
  },
  successBadge: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 14,
    flexDirection: 'row',
    marginTop: 16,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  successBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginLeft: 6,
  },
  title: {
    color: '#064E3B',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    marginTop: 7,
    textAlign: 'center',
  },
  completionSummary: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#B7EBCF',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 14,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  summaryContent: {
    flex: 1,
    marginLeft: 12,
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryCheck: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 18,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  receiptCard: {
    backgroundColor: colors.card,
    borderColor: '#DCEBE3',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    marginBottom: 22,
    padding: 18,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  receiptValue: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  receiptValueBold: {
    color: '#064E3B',
    fontSize: 14,
    fontWeight: '800',
  },
  receiptAmount: {
    color: '#047857',
    fontSize: 18,
    fontWeight: '800',
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
