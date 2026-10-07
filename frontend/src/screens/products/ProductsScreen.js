import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import { useCustomer } from '../../context/CustomerContext';
import { colors } from '../../theme/colors';

const ProductsScreen = ({ navigation, route }) => {
  const { categories, fetchProducts, products: cachedProducts } = useCustomer();
  const [category, setCategory] = useState(route.params?.category || 'All');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (route.params?.category) setCategory(route.params.category);
  }, [route.params?.category]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const results = await fetchProducts({ search: search.trim(), category });
      setProducts(results);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, [category, fetchProducts, search]);

  useEffect(() => {
    const timeout = setTimeout(loadProducts, search ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [loadProducts]);

  useEffect(() => {
    if (!products.length && !search && category === 'All' && cachedProducts.length) {
      setProducts(cachedProducts);
      setLoading(false);
    }
  }, [cachedProducts, category, products.length, search]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Text style={styles.subtitle}>Find something fresh today</Text>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color={colors.textSecondary} />
        <TextInput
          accessibilityLabel="Search products"
          placeholder="Search groceries"
          placeholderTextColor={colors.textLight}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filter, category === item && styles.filterActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultCount}>{products.length} products</Text>
          <TouchableOpacity style={styles.favoritesLink} onPress={() => navigation.navigate('Favourites')}>
            <Ionicons name="heart-outline" size={16} color={colors.primary} />
            <Text style={styles.favoritesText}>Saved</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={loadProducts}><Text style={styles.retry}>Try again</Text></TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={38} color={colors.disabled} />
            <Text style={styles.emptyText}>No products match this search.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id || product._id} product={product} navigation={navigation} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, paddingTop: 48 },
  header: { paddingHorizontal: 18, paddingBottom: 14 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  searchBox: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 10, height: 48, marginHorizontal: 18, paddingHorizontal: 14 },
  searchInput: { color: colors.text, flex: 1, fontSize: 14 },
  filters: { gap: 8, paddingHorizontal: 18, paddingVertical: 14 },
  filter: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 18, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 8 },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: colors.textInverse },
  list: { paddingHorizontal: 18, paddingBottom: 24 },
  resultHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resultCount: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  favoritesLink: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  favoritesText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  loader: { marginTop: 36 },
  emptyState: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 28 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 9, textAlign: 'center' },
  retry: { color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: 10 },
});

export default ProductsScreen;
