/**
 * SlotItem Component
 * Renders an individual time slot card matching Figma screens 07 & 08.
 * Handles available, selected, and disabled "Full" states.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const SlotItem = ({ slot, isSelected, onSelect }) => {
  const isFull = slot.isFull || slot.bookedCount >= slot.maxCapacity;
  const spotsLeft = slot.maxCapacity - slot.bookedCount;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isFull}
      onPress={() => onSelect(slot)}
      style={[
        styles.card,
        isFull && styles.cardDisabled,
        isSelected && styles.cardSelected,
      ]}
    >
      <View style={styles.leftRow}>
        <Ionicons
          name="time-outline"
          size={18}
          color={isFull ? colors.disabled : isSelected ? colors.primary : colors.textSecondary}
          style={styles.timeIcon}
        />
        <Text
          style={[
            styles.timeText,
            isFull && styles.textDisabled,
            isSelected && styles.textSelected,
          ]}
        >
          {slot.displayLabel}
        </Text>
      </View>

      <View style={styles.rightRow}>
        {isFull ? (
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>Full</Text>
          </View>
        ) : (
          <View style={styles.availableRow}>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>Available</Text>
            </View>
            {spotsLeft <= 2 && (
              <Text style={styles.spotsLeftText}>{spotsLeft} left</Text>
            )}
            <View
              style={[
                styles.radioCircle,
                isSelected && styles.radioCircleSelected,
              ]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={14} color={colors.textInverse} />
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardDisabled: {
    backgroundColor: colors.disabledSurface,
    borderColor: colors.borderLight,
    opacity: 0.65,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 10,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  textDisabled: {
    color: colors.disabled,
  },
  textSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fullBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.disabled,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  availableBadgeText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  spotsLeftText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent,
    marginRight: 8,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

export default SlotItem;
