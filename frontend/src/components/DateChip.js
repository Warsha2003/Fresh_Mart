/**
 * DateChip Component
 * Horizontal selectable date pill matching Figma screen 07 & 08.
 * Displays day number, month, and day-of-week tag (e.g. "14 Mar Today").
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

const DateChip = ({ dateString, label, subLabel, isSelected, onSelect }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSelect(dateString)}
      style={[
        styles.chip,
        isSelected ? styles.chipSelected : styles.chipUnselected,
      ]}
    >
      <Text
        style={[
          styles.subLabel,
          isSelected ? styles.textSelected : styles.textSecondary,
        ]}
      >
        {subLabel}
      </Text>
      <Text
        style={[
          styles.label,
          isSelected ? styles.textSelectedBold : styles.textPrimary,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    marginRight: 10,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  chipUnselected: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  textSelected: {
    color: '#D1FAE5', // Light tint
  },
  textSelectedBold: {
    color: colors.textInverse,
  },
  textPrimary: {
    color: colors.text,
  },
  textSecondary: {
    color: colors.textSecondary,
  },
});

export default DateChip;
