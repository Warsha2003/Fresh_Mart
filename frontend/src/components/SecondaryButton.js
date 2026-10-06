import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme/theme';

const SecondaryButton = ({ title, onPress, icon, style }) => (
  <TouchableOpacity
    accessibilityRole="button"
    activeOpacity={0.78}
    onPress={onPress}
    style={[styles.button, style]}
  >
    <View style={styles.content}>
      {icon}
      <Text style={styles.title}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#EDF8F0',
    borderColor: '#D9F0E1',
    borderRadius: theme.radius.small,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SecondaryButton;
