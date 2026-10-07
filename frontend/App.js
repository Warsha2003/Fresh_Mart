/**
 * FreshMart Mobile App Entrypoint
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CustomerProvider } from './src/context/CustomerContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CustomerProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </CustomerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
