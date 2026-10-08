import React, { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { colors } from '../../theme/colors';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const {
    products,
    categories,
    isLoading,
    error,
    notificationUnreadCount,
    refreshNotificationCount,
    refreshCustomerState,
  } = useCustomer();

  useEffect(() => {
    if (products.length === 0) refreshCustomerState();
  }, [products.length, refreshCustomerState]);

  useFocusEffect(useCallback(() => {
    refreshNotificationCount().catch((requestError) => {
      console.warn('[HomeScreen] Unable to refresh notification count:', requestError.message);
    });
  }, [refreshNotificationCount]));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>FRESHMART GROCERY</Text>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'}!</Text>
            <Text style={styles.subtitle}>What would you like today?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              style={styles.headerAction}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              {notificationUnreadCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open favourites"
              style={styles.headerAction}
              onPress={() => navigation.navigate('Favourites')}
            >
              <Ionicons name="heart-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.searchBar}
          onPress={() => navigation.navigate('Products')}
          activeOpacity={0.85}
        >
          <Ionicons name="search-outline" size={19} color={colors.textSecondary} />
          <Text style={styles.searchHint}>Search fresh groceries</Text>
          <Ionicons name="options-outline" size={19} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.hero}
          onPress={() => navigation.navigate('Products')}
          activeOpacity={0.9}
        >
          <View style={styles.heroText}>
            <Text style={styles.heroEyebrow}>FRESH FROM LOCAL FARMS</Text>
            <Text style={styles.heroTitle}>Good food,{'\n'}delivered fresh.</Text>
            <Text style={styles.heroAction}>Shop groceries  ›</Text>
          </View>
          <Ionicons name="leaf" size={82} color="#B9E3C4" />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by category</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {categories.filter((category) => category !== 'All').map((category, index) => (
            <TouchableOpacity
              key={category}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Products', { category })}
              activeOpacity={0.85}
            >
              <View style={[styles.categoryIcon, index % 2 ? styles.categoryIconAlt : null]}>
                <Ionicons
                  name={category === 'Vegetables' ? 'leaf-outline' : category === 'Oils' ? 'water-outline' : 'basket-outline'}
                  size={23}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.categoryName}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Popular picks</Text>
            <Text style={styles.sectionSubtitle}>Fresh favourites for your kitchen</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {isLoading && products.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error && products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={refreshCustomerState}><Text style={styles.seeAll}>Try again</Text></TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No products are available right now.</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id || product._id} product={product} navigation={navigation} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 24 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 38 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  greeting: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 6 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 3 },
  headerAction: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  notificationBadge: { alignItems: 'center', backgroundColor: colors.danger, borderColor: colors.background, borderRadius: 9, borderWidth: 1, height: 18, justifyContent: 'center', minWidth: 18, paddingHorizontal: 3, position: 'absolute', right: -3, top: -3 },
  notificationBadgeText: { color: colors.textInverse, fontSize: 9, fontWeight: '800' },
  searchBar: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 10, height: 48, marginTop: 20, paddingHorizontal: 14 },
  searchHint: { color: colors.textSecondary, flex: 1, fontSize: 14 },
  hero: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, minHeight: 164, overflow: 'hidden', padding: 20 },
  heroText: { flex: 1 },
  heroEyebrow: { color: '#C6E8D0', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', lineHeight: 28, marginTop: 8 },
  heroAction: { color: '#E8F5E9', fontSize: 13, fontWeight: '700', marginTop: 10 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 24 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  categoryRow: { marginHorizontal: -18 },
  categoryCard: { alignItems: 'center', marginLeft: 18, width: 78 },
  categoryIcon: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 18, height: 58, justifyContent: 'center', width: 58 },
  categoryIconAlt: { backgroundColor: '#FFF3D6' },
  categoryName: { color: colors.text, fontSize: 11, fontWeight: '600', marginTop: 7, textAlign: 'center' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  loader: { marginVertical: 36 },
  emptyState: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 24 },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
});

export default HomeScreen;
