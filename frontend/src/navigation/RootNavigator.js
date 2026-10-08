/**
 * RootNavigator
 * Controls application routing between Authentication stack, Customer Main stack,
 * Delivery Partner stack, and Shop Owner dashboard.
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

// Navigation Components
import BottomTabs from './BottomTabs';
import DeliveryTabs from './DeliveryTabs';
import OwnerTabs from './OwnerTabs';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';

// Owner Screens
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import OwnerOrderPrepScreen from '../screens/owner/OwnerOrderPrepScreen';
import OwnerManageSlotsScreen from '../screens/owner/OwnerManageSlotsScreen';

// Checkout Scope Screens (Screens 07 - 10)
import TimeSlotScreen from '../screens/checkout/TimeSlotScreen';
import PaymentScreen from '../screens/checkout/PaymentScreen';
import PaymentSuccessScreen from '../screens/checkout/PaymentSuccessScreen';

// Orders Scope Screen (Screen 11)
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ProductDetailsScreen from '../screens/products/ProductDetailsScreen';
import FavouritesScreen from '../screens/profile/FavouritesScreen';
import AddressesScreen from '../screens/profile/AddressesScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';

// Delivery Partner Scope Screens (Screens 21 - 25)
import DeliveryDashboardScreen from '../screens/delivery/DeliveryDashboardScreen';
import DeliveryAlertScreen from '../screens/delivery/DeliveryAlertScreen';
import DeliveryOrderDetailsScreen from '../screens/delivery/DeliveryOrderDetailsScreen';
import DeliveryMapScreen from '../screens/delivery/DeliveryMapScreen';
import DeliveryCompleteScreen from '../screens/delivery/DeliveryCompleteScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const role = user?.role || 'customer';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen
              name="SplashB"
              component={SplashScreen}
              initialParams={{ variant: 'B' }}
            />
            <Stack.Screen
              name="SplashA"
              component={SplashScreen}
              initialParams={{ variant: 'A' }}
            />
            <Stack.Screen
              name="SplashC"
              component={SplashScreen}
              initialParams={{ variant: 'C' }}
            />
            <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              initialParams={{ role: 'customer' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              initialParams={{ role: 'customer' }}
            />
            <Stack.Screen
              name="DeliveryLogin"
              component={LoginScreen}
              initialParams={{ role: 'delivery' }}
            />
            <Stack.Screen
              name="DeliveryRegister"
              component={RegisterScreen}
              initialParams={{ role: 'delivery' }}
            />
            <Stack.Screen
              name="OwnerLogin"
              component={LoginScreen}
              initialParams={{ role: 'owner' }}
            />
            <Stack.Screen
              name="OwnerRegister"
              component={RegisterScreen}
              initialParams={{ role: 'owner' }}
            />
          </>
        ) : (
          // Main Application Stack - Routes directly to role-specific entry point
          <>
            {role === 'delivery' ? (
              <Stack.Screen name="DeliveryTabs" component={DeliveryTabs} />
            ) : role === 'owner' ? (
              <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
            ) : (
              <Stack.Screen name="MainTabs" component={BottomTabs} />
            )}
            <Stack.Screen name="TimeSlot" component={TimeSlotScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen
              name="PaymentSuccess"
              component={PaymentSuccessScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Favourites" component={FavouritesScreen} />
            <Stack.Screen name="Addresses" component={AddressesScreen} />
            {/* Owner Screens */}
<Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
<Stack.Screen name="OwnerOrderPrep" component={OwnerOrderPrepScreen} />
<Stack.Screen name="OwnerManageSlots" component={OwnerManageSlotsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />

            {/* Delivery Partner Flow (Screens 21 to 25) */}
            <Stack.Screen name="DeliveryDashboard" component={DeliveryDashboardScreen} />
            <Stack.Screen name="DeliveryAlert" component={DeliveryAlertScreen} />
            <Stack.Screen name="DeliveryOrderDetails" component={DeliveryOrderDetailsScreen} />
            <Stack.Screen name="DeliveryMap" component={DeliveryMapScreen} />
            <Stack.Screen name="DeliveryComplete" component={DeliveryCompleteScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default RootNavigator;
