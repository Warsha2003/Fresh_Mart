/**
 * DeliveryTabs Navigator
 * Matches Figma bottom tab bar for delivery partner portal: Dashboard, Deliveries, Map, Profile.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import DeliveryDashboardScreen from '../screens/delivery/DeliveryDashboardScreen';
import DeliveryAlertScreen from '../screens/delivery/DeliveryAlertScreen';
import DeliveryMapScreen from '../screens/delivery/DeliveryMapScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const DeliveryTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Deliveries') {
            iconName = focused ? 'bicycle' : 'bicycle-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'navigate' : 'navigate-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={focused ? styles.activeIconContainer : null}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DeliveryDashboardScreen} />
      <Tab.Screen name="Deliveries" component={DeliveryAlertScreen} />
      <Tab.Screen name="Map" component={DeliveryMapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
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
  activeIconContainer: {
    transform: [{ scale: 1.05 }],
  },
});

export default DeliveryTabs;
