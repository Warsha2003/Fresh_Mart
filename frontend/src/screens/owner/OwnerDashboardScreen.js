/**
 * OwnerDashboardScreen
 * Placeholder dashboard screen for Shop Owner role.
 * Shows welcome message with user's name and role, and a Logout button.
 */
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import theme from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const OwnerDashboardScreen = () => {
  const { user, logout } = useAuth();
  const userName = user?.name || 'Shop Owner';
  const userRole = user?.role || 'owner';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.roleChip}>
            <Ionicons name="storefront-outline" size={16} color={colors.primary} />
            <Text style={styles.roleChipText}>Shop Owner Portal</Text>
          </View>
        </View>

        {/* Welcome Card */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="storefront" size={40} color={colors.primary} />
          </View>

          <Text style={styles.welcomeTitle}>
            Welcome, {userName} ({userRole})
          </Text>
          <Text style={styles.subtitle}>
            Logged in as {user?.email || 'owner@freshmart.lk'}
          </Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Your shop management features (products catalog, incoming orders, and store analytics) will appear here.
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Account Role</Text>
              <Text style={styles.detailValue}>{userRole.toUpperCase()}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Mobile</Text>
              <Text style={styles.detailValue}>{user?.phone || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Action Button: Logout */}
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={logout}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F5EA',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleChipText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5F5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9F3',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  detailsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  detailDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    height: '100%',
  },
  logoutButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
});

export default OwnerDashboardScreen;
