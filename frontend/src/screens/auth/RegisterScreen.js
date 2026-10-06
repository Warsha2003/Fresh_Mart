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

const RegisterScreen = ({ navigation, route }) => {
  const role = route.params?.role || 'customer';
  const isOwner = role === 'owner';
  const isDelivery = role === 'delivery';
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const loginRoute = isOwner ? 'OwnerLogin' : isDelivery ? 'DeliveryLogin' : 'Login';

  const clearFieldError = (field) => {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!phone) nextErrors.phone = 'Mobile number is required.';
    else if (!/^\d{9}$/.test(phone)) nextErrors.phone = 'Enter a 9-digit Sri Lankan mobile number.';
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Password is required.';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password, `+94 ${phone}`, role);
    } catch (error) {
      setErrors({ form: error.message || 'Could not create your account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const title = isOwner
    ? 'Register your shop'
    : isDelivery
      ? 'Become a delivery partner'
      : 'Create your account';
  const subtitle = isOwner
    ? 'Manage inventory, orders & statistics.'
    : isDelivery
      ? 'Join FreshMart and start earning.'
      : 'Order fresh groceries in a few taps.';

  return (
    <AuthScreenLayout>
      {(isOwner || isDelivery) && (
        <RoleChip
          icon={isOwner ? 'storefront-outline' : 'bicycle-outline'}
          label={isOwner ? 'Shop Owner' : 'Delivery Partner'}
        />
      )}
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <InputField
        error={errors.name}
        icon="person-outline"
        label="Name"
        onChangeText={(value) => {
          setName(value);
          clearFieldError('name');
        }}
        placeholder="Full name"
        value={name}
      />
      <InputField
        error={errors.phone}
        icon="call-outline"
        keyboardType="number-pad"
        label="Mobile Number"
        maxLength={9}
        onChangeText={(value) => {
          setPhone(value.replace(/\D/g, '').slice(0, 9));
          clearFieldError('phone');
        }}
        placeholder="77 xxx xxxx"
        prefix="+94"
        value={phone}
      />
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
        placeholder="At least 6 characters"
        secureTextEntry
        value={password}
      />
      <InputField
        error={errors.confirmPassword}
        icon="lock-closed-outline"
        label="Confirm Password"
        onChangeText={(value) => {
          setConfirmPassword(value);
          clearFieldError('confirmPassword');
        }}
        placeholder="Re-enter your password"
        secureTextEntry
        value={confirmPassword}
      />

      <PrimaryButton
        loading={loading}
        onPress={handleRegister}
        title={isOwner ? 'Register Shop' : isDelivery ? 'Join as Delivery Partner' : 'Create Account'}
        style={styles.primaryButton}
      />

      {!!errors.form && (
        <View accessibilityRole="alert" style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={17} color={theme.colors.danger} />
          <Text style={styles.errorText}>{errors.form}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate(loginRoute, { role })}
        >
          <Text style={styles.footerLink}>Login</Text>
        </TouchableOpacity>
      </View>
      {(isOwner || isDelivery) && (
        <Text style={styles.apiNote}>
          {isOwner
            ? 'Shop registration is connected to the FreshMart Owner account system.'
            : 'Delivery partner registration is connected to the FreshMart Delivery system.'}
        </Text>
      )}
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  heading: {
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 2,
  },
  errorBox: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.dangerSurface,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
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
    marginTop: 13,
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
  apiNote: {
    color: theme.colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default RegisterScreen;
