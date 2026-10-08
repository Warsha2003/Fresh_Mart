/**
 * OwnerTabs Navigator
 * Matches Figma bottom tab bar for Shop Owner portal:
 * 1. Dashboard (pulse/activity icon)
 * 2. Products (cube/inventory icon)
 * 3. Orders (receipt/incoming orders icon)
 * 4. Settings (gear/profile settings icon)
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import OwnerInventoryScreen from '../screens/owner/OwnerInventoryScreen';
import OwnerIncomingOrdersScreen from '../screens/owner/OwnerIncomingOrdersScreen';
import OwnerProfileScreen from '../screens/owner/OwnerProfileScreen';

const Tab = createBottomTabNavigator();

const OwnerTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 62 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'pulse' : 'pulse-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return (
            <View style={focused ? styles.activeIconContainer : null}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="Products" component={OwnerInventoryScreen} />
      <Tab.Screen name="Orders" component={OwnerIncomingOrdersScreen} />
      <Tab.Screen name="Settings" component={OwnerProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 6,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBarItem: {
    minHeight: 56,
    paddingVertical: 4,
  },
  activeIconContainer: {
    transform: [{ scale: 1.05 }],
  },
});

export default OwnerTabs;
