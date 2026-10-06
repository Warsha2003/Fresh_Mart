/**
 * ProductsScreen (Placeholder for Team Member)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const ProductsScreen = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="grid-outline" size={48} color={colors.primary} />
      <Text style={styles.title}>FreshMart Products</Text>
      <Text style={styles.subtitle}>Reserved placeholder for Team Member (Products Scope)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});

export default ProductsScreen;
