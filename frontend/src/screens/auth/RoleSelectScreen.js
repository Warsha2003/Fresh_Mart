import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from '../../components/AppLogo';
import theme from '../../theme/theme';

const roles = [
  {
    title: 'Shop for groceries',
    description: 'Fresh picks delivered to your door',
    icon: 'basket-outline',
    route: 'Login',
  },
  {
    title: 'Manage your shop',
    description: 'Owner portal for inventory and orders',
    icon: 'storefront-outline',
    route: 'OwnerLogin',
  },
  {
    title: 'Deliver with FreshMart',
    description: 'Join the team and start earning',
    icon: 'bicycle-outline',
    route: 'DeliveryLogin',
  },
];

const RoleSelectScreen = ({ navigation }) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <AppLogo size="small" />
      <Text style={styles.title}>How would you like to continue?</Text>
      <Text style={styles.subtitle}>Choose your FreshMart experience</Text>
      <View style={styles.options}>
        {roles.map((role) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={role.route}
            onPress={() => navigation.navigate(role.route)}
            style={styles.option}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={role.icon} size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{role.title}</Text>
              <Text style={styles.optionDescription}>{role.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={theme.colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => navigation.navigate('SplashA')}
        style={styles.previewLink}
      >
        <Text style={styles.previewText}>Preview intro screen</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => navigation.navigate('SplashC')}
        style={styles.previewLink}
      >
        <Text style={styles.previewText}>Preview welcome back screen</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: theme.colors.darkGreen,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 13,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
  },
  options: {
    gap: 12,
    marginTop: 28,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 78,
    paddingHorizontal: 13,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#E5F5EA',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  optionText: {
    flex: 1,
    marginHorizontal: 12,
  },
  optionTitle: {
    color: theme.colors.darkGreen,
    fontSize: 14,
    fontWeight: '700',
  },
  optionDescription: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  previewLink: {
    alignSelf: 'center',
    marginTop: 23,
    padding: 7,
  },
  previewText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default RoleSelectScreen;
