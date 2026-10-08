import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomer } from '../context/CustomerContext';
import { colors } from '../theme/colors';
import { getProductAsset } from '../config/productAssets';

const ProductCard = ({ product, navigation }) => {
  const { addToCart, toggleFavourite, isFavourite } = useCustomer();
  const productId = product.id || product._id;
  const [adding, setAdding] = useState(false);
  const [togglingFavourite, setTogglingFavourite] = useState(false);

  const handleAdd = async () => {
    try {
      setAdding(true);
      await addToCart(productId);
    } catch (error) {
      Alert.alert('Could not add product', error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleFavourite = async () => {
    try {
      setTogglingFavourite(true);
      await toggleFavourite(productId);
    } catch (error) {
      Alert.alert('Could not update favourites', error.message);
    } finally {
      setTogglingFavourite(false);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => navigation.navigate('ProductDetails', { productId })}
        activeOpacity={0.86}
      >
        <View style={styles.imageWrap}>
          <Image source={getProductAsset(product.imageKey, product.imageUrl)} style={styles.image} resizeMode="cover" />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isFavourite(productId) ? 'Remove from favourites' : 'Add to favourites'}
            style={styles.favoriteButton}
            onPress={handleFavourite}
            disabled={togglingFavourite}
          >
            {togglingFavourite ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name={isFavourite(productId) ? 'heart' : 'heart-outline'}
                size={19}
                color={isFavourite(productId) ? colors.danger : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
          {product.isLowStock && (
            <Text style={styles.stockTag}>Low stock</Text>
          )}
        </View>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.packSize}>{product.packSize}</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.price}>Rs. {product.unitPrice}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to cart`}
          style={[styles.addButton, product.isOutOfStock && styles.disabledButton]}
          onPress={handleAdd}
          disabled={adding || product.isOutOfStock}
        >
          {adding ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Ionicons name="add" size={21} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  imageWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    height: 132,
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 34,
    zIndex: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  stockTag: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    color: '#92400E',
    fontSize: 10,
    fontWeight: '700',
    left: 7,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: 'absolute',
    top: 8,
    zIndex: 2,
    elevation: 2,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 38,
  },
  packSize: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  price: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 38,
  },
  disabledButton: {
    backgroundColor: colors.disabled,
  },
});

export default ProductCard;
