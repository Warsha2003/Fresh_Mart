/**
 * StatusStep Component
 * Vertical timeline step indicator for Order Tracking screen (Screen 11).
 * Shows completed, active, and pending steps with timestamps.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const StatusStep = ({
  title,
  subtitle,
  status = 'pending', // 'completed' | 'active' | 'pending'
  isLast = false,
}) => {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  return (
    <View style={styles.container}>
      {/* Indicator Column */}
      <View style={styles.indicatorCol}>
        <View
          style={[
            styles.dot,
            isCompleted && styles.dotCompleted,
            isActive && styles.dotActive,
          ]}
        >
          {isCompleted ? (
            <Ionicons name="checkmark" size={14} color={colors.textInverse} />
          ) : isActive ? (
            <View style={styles.innerDotActive} />
          ) : (
            <View style={styles.innerDotPending} />
          )}
        </View>

        {!isLast && (
          <View
            style={[
              styles.line,
              isCompleted && styles.lineCompleted,
            ]}
          />
        )}
      </View>

      {/* Text Info Column */}
      <View style={styles.contentCol}>
        <Text
          style={[
            styles.title,
            (isCompleted || isActive) && styles.titleHighlighted,
          ]}
        >
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 56,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  dotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  innerDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  innerDotPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },
  contentCol: {
    flex: 1,
    paddingBottom: 16,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  titleHighlighted: {
    color: colors.text,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default StatusStep;
