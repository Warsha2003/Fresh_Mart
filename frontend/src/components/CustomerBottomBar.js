import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const tabs = [
  { name: 'Home', icon: 'home-outline' },
  { name: 'Products', icon: 'grid-outline' },
  { name: 'Cart', icon: 'cart-outline' },
  { name: 'Profile', icon: 'person-outline' },
];

export const CUSTOMER_BOTTOM_BAR_HEIGHT = 64;

const CustomerBottomBar = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { height: CUSTOMER_BOTTOM_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          accessibilityRole="button"
          accessibilityLabel={tab.name}
          style={styles.tab}
          onPress={() => navigation.navigate('MainTabs', { screen: tab.name })}
        >
          <Ionicons name={tab.icon} size={21} color={colors.textSecondary} />
          <Text style={styles.label}>{tab.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default CustomerBottomBar;
