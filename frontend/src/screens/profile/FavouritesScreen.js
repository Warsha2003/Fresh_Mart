import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import ScreenHeader from '../../components/ScreenHeader';
import { useCustomer } from '../../context/CustomerContext';
import { colors } from '../../theme/colors';

const FavouritesScreen = ({ navigation }) => {
  const { favourites } = useCustomer();

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Favourites" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {favourites.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="heart-outline" size={30} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>No saved products yet</Text>
            <Text style={styles.emptyMessage}>Tap the heart on a product to keep it here.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}>
              <Text style={styles.shopLink}>Browse products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {favourites.map((product) => (
              <ProductCard key={product.id || product._id} product={product} navigation={navigation} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, paddingTop: 42 },
  content: { padding: 18, paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  empty: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 18, marginTop: 54, padding: 28 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptyMessage: { color: colors.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center' },
  shopLink: { color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: 16 },
});

export default FavouritesScreen;
