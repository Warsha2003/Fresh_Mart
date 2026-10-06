/**
 * RootNavigator
 * Controls application routing between Authentication stack, Customer Main stack,
 * and Delivery Partner stack.
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

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Checkout Scope Screens (Screens 07 - 10)
import TimeSlotScreen from '../screens/checkout/TimeSlotScreen';
import PaymentScreen from '../screens/checkout/PaymentScreen';
import PaymentSuccessScreen from '../screens/checkout/PaymentSuccessScreen';

// Orders Scope Screen (Screen 11)
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';

// Delivery Partner Scope Screens (Screens 21 - 25)
import DeliveryDashboardScreen from '../screens/delivery/DeliveryDashboardScreen';
import DeliveryAlertScreen from '../screens/delivery/DeliveryAlertScreen';
import DeliveryOrderDetailsScreen from '../screens/delivery/DeliveryOrderDetailsScreen';
import DeliveryMapScreen from '../screens/delivery/DeliveryMapScreen';
import DeliveryCompleteScreen from '../screens/delivery/DeliveryCompleteScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main Application Stack
          <>
            {/* Customer Flow */}
            <Stack.Screen name="MainTabs" component={BottomTabs} />
            <Stack.Screen name="TimeSlot" component={TimeSlotScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen
              name="PaymentSuccess"
              component={PaymentSuccessScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />

            {/* Delivery Partner Flow (Screens 21 to 25) */}
            <Stack.Screen name="DeliveryTabs" component={DeliveryTabs} />
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
