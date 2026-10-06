/**
 * AppButton Component
 * Rounded primary button with loading indicator and disabled state matching Figma styling.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors } from '../theme/colors';

const AppButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  loading = false,
  disabled = false,
  icon = null,
  style = null,
  textStyle = null,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.disabledSurface;
    if (variant === 'primary') return colors.primary;
    if (variant === 'secondary') return colors.primaryLight;
    if (variant === 'danger') return colors.dangerLight;
    if (variant === 'outline') return 'transparent';
    return colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return colors.disabled;
    if (variant === 'primary') return colors.textInverse;
    if (variant === 'secondary') return colors.primary;
    if (variant === 'danger') return colors.danger;
    if (variant === 'outline') return colors.primary;
    return colors.textInverse;
  };

  const getBorderColor = () => {
    if (disabled) return colors.border;
    if (variant === 'outline') return colors.primary;
    if (variant === 'danger') return colors.dangerLight;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textInverse : colors.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default AppButton;
