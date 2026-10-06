import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import RoleChip from '../../components/RoleChip';
import theme from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation, route }) => {
  const role = route.params?.role || 'customer';
  const isOwner = role === 'owner';
  const isDelivery = role === 'delivery';
  const { login } = useAuth();
  const [email, setEmail] = useState(
    role === 'customer' ? 'kamal.perera@gmail.com' : ''
  );
  const [password, setPassword] = useState(role === 'customer' ? 'password123' : '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const title = isOwner ? 'Owner Portal' : isDelivery ? 'Ready to deliver?' : 'Welcome back';
  const subtitle = isOwner
    ? 'Manage inventory, orders & statistics'
    : isDelivery
      ? 'Log in with your email to start.'
      : 'Log in with your email to continue.';
  const registerRoute = isOwner ? 'OwnerRegister' : isDelivery ? 'DeliveryRegister' : 'Register';

  const handleLogin = async () => {
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) nextErrors.password = 'Password is required.';
    else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);
      await login(email.trim(), password, role);
    } catch (error) {
      setErrors({ form: error.message || 'Unable to sign in. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field) => {
    setErrors((current) => {
      const next = { ...current, [field]: undefined, form: undefined };
      return next;
    });
  };

  return (
    <AuthScreenLayout>
      {(isOwner || isDelivery) && (
        <RoleChip
          icon={isOwner ? 'storefront-outline' : 'bicycle-outline'}
          label={isOwner ? 'Shop Owner' : 'Delivery Partner'}
        />
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <InputField
        autoCapitalize="none"
        error={errors.email}
        icon="mail-outline"
        keyboardType="email-address"
        label={isOwner ? 'Owner Email' : 'Email'}
        onChangeText={(value) => {
          setEmail(value);
          clearFieldError('email');
        }}
        placeholder="you@example.com"
        value={email}
      />
      <InputField
        error={errors.password}
        icon="lock-closed-outline"
        label="Password"
        onChangeText={(value) => {
          setPassword(value);
          clearFieldError('password');
        }}
        placeholder="Enter your password"
        secureTextEntry
        value={password}
      />

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() =>
          setErrors({
            form: 'Password reset is not available yet. Please contact FreshMart support.',
          })
        }
        style={styles.forgotLink}
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <PrimaryButton
        loading={loading}
        onPress={handleLogin}
        title={isOwner ? 'Sign In to Dashboard' : 'Log In'}
        style={styles.primaryButton}
      />

      {!!errors.form && (
        <View accessibilityRole="alert" style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={17} color={theme.colors.danger} />
          <Text style={styles.errorText}>{errors.form}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{isOwner ? 'Not an owner? ' : 'New here? '}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate(registerRoute, { role })}
        >
          <Text style={styles.footerLink}>{isOwner ? 'Sign up' : 'Create account'}</Text>
        </TouchableOpacity>
      </View>

      {!isOwner && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate('RoleSelect')}
          style={styles.switchRole}
        >
          <Text style={styles.switchRoleText}>Choose a different FreshMart experience</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.legalFooter}>
        By continuing you agree to our Terms &amp; Privacy Policy
      </Text>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    marginBottom: 15,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -3,
    paddingVertical: 3,
  },
  forgotText: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 13,
  },
  errorBox: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.dangerSurface,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
    padding: 10,
  },
  errorText: {
    color: theme.colors.danger,
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  footerText: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  footerLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  switchRole: {
    alignSelf: 'center',
    marginTop: 12,
    padding: 5,
  },
  switchRoleText: {
    color: theme.colors.muted,
    fontSize: 11,
  },
  legalFooter: {
    color: '#9AA9A0',
    fontSize: 9,
    marginTop: 18,
    textAlign: 'center',
  },
});

export default LoginScreen;
