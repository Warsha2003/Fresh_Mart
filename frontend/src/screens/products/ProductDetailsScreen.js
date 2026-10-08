import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import { useCustomer } from '../../context/CustomerContext';
import client from '../../api/client';
import { getProductAsset } from '../../config/productAssets';
import { colors } from '../../theme/colors';

const ProductDetailsScreen = ({ navigation, route }) => {
  const { productId } = route.params || {};
  const { addToCart, toggleFavourite, isFavourite } = useCustomer();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await client.get(`/products/${productId}`);
        if (mounted) setProduct(response.data?.data || null);
      } catch (error) {
        Alert.alert('Unable to load product', error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProduct();
    return () => { mounted = false; };
  }, [productId]);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToCart(product.id || product._id);
      Alert.alert('Added to cart', `${product.name} was added to your cart.`);
    } catch (error) {
      Alert.alert('Could not add product', error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleFavourite = async () => {
    try {
      await toggleFavourite(product.id || product._id);
    } catch (error) {
      Alert.alert('Could not update favourites', error.message);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>This product is unavailable.</Text>
        <AppButton title="Go back" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const productIdValue = product.id || product._id;
  const saved = isFavourite(productIdValue);
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product details</Text>
          <TouchableOpacity style={styles.iconButton} onPress={handleFavourite} accessibilityLabel={saved ? 'Remove from favourites' : 'Add to favourites'}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? colors.danger : colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.imageBox}>
          <Image source={getProductAsset(product.imageKey, product.imageUrl)} style={styles.image} resizeMode="cover" />
        </View>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.packSize}>{product.packSize}</Text>
        <Text style={styles.price}>Rs. {product.unitPrice}</Text>
        <View style={styles.infoRow}>
          <View style={styles.info}>
            <Ionicons name="leaf-outline" size={19} color={colors.primary} />
            <Text style={styles.infoText}>{product.origin || 'Locally sourced'}</Text>
          </View>
          <View style={styles.info}>
            <Ionicons name="time-outline" size={19} color={colors.primary} />
            <Text style={styles.infoText}>{product.deliveryEta || 'Fresh delivery'}</Text>
          </View>
        </View>
        {product.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>About this product</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        ) : null}
        <View style={styles.stockRow}>
          <Ionicons
            name={product.isOutOfStock ? 'close-circle-outline' : 'checkmark-circle-outline'}
            size={18}
            color={product.isOutOfStock ? colors.danger : colors.primary}
          />
          <Text style={[styles.stockText, product.isOutOfStock && styles.outOfStock]}>
            {product.isOutOfStock ? 'Currently out of stock' : `${product.stock} available`}
          </Text>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <AppButton
          title={product.isOutOfStock ? 'Out of stock' : 'Add to cart'}
          onPress={handleAddToCart}
          loading={adding}
          disabled={product.isOutOfStock}
          icon={<Ionicons name="cart-outline" size={20} color={colors.textInverse} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, paddingTop: 42 },
  content: { padding: 18, paddingBottom: 110 },
  center: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  imageBox: { alignItems: 'center', backgroundColor: colors.primarySurface, borderRadius: 20, height: 270, justifyContent: 'center', marginTop: 18, overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
  category: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 20, textTransform: 'uppercase' },
  name: { color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 5 },
  packSize: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  price: { color: colors.primaryDark, fontSize: 23, fontWeight: '800', marginTop: 12 },
  infoRow: { borderBottomColor: colors.border, borderBottomWidth: 1, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingVertical: 16 },
  info: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  infoText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  descriptionCard: { backgroundColor: colors.card, borderRadius: 14, marginTop: 18, padding: 16 },
  descriptionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  stockRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 18 },
  stockText: { color: colors.primaryDark, fontSize: 13, fontWeight: '600' },
  outOfStock: { color: colors.danger },
  errorText: { color: colors.textSecondary, fontSize: 15, marginBottom: 10 },
  bottomBar: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, bottom: 0, left: 0, paddingHorizontal: 18, paddingVertical: 8, position: 'absolute', right: 0 },
});

export default ProductDetailsScreen;
