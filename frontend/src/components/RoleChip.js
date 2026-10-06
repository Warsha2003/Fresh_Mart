import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme/theme';

const RoleChip = ({ label, icon }) => (
  <View style={styles.chip}>
    <Ionicons name={icon} size={14} color={theme.colors.primary} />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DDF3E5',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 5,
    marginBottom: 11,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  label: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default RoleChip;
