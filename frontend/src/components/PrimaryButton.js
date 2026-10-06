import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import theme from '../theme/theme';

const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    activeOpacity={0.82}
    disabled={disabled || loading}
    onPress={onPress}
    style={[styles.button, (disabled || loading) && styles.disabled, style]}
  >
    {loading ? (
      <ActivityIndicator color="#FFFFFF" />
    ) : (
      <View style={styles.content}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.small,
    elevation: 4,
    height: 50,
    justifyContent: 'center',
    shadowColor: theme.colors.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
  },
  disabled: {
    opacity: 0.68,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PrimaryButton;
