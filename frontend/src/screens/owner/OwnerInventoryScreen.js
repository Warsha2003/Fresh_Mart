/**
 * OwnerInventoryScreen
 * Matches Figma 18_inventory-stock 1:
 * - Search bar ("Search inventory...")
 * - Filter pills: "All Items", "● Low Stock (count)", "● Out of Stock"
 * - Product list with product images, automatic stock badges, and "Edit" action
 * - Bottom button: "+ Add New Product"
 * - Add/Edit Product Modal with validation and delete action
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import client from '../../api/client';
import { getProductAsset } from '../../config/productAssets';

const OwnerInventoryScreen = ({ navigation }) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'low_stock' | 'out_of_stock'
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({ all: 0, low_stock: 0, out_of_stock: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = add mode, object = edit mode
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Vegetables');
  const [customCategory, setCustomCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formPackSize, setFormPackSize] = useState('1 unit');
  const [formThreshold, setFormThreshold] = useState('5');
  const [formImageKey, setFormImageKey] = useState('vegetables');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await client.get(
        `/owner/products?filter=${filter}&search=${encodeURIComponent(searchQuery)}`
      );
      if (response.data?.success) {
        setProducts(response.data.data || []);
        if (response.data.counts) {
          setCounts(response.data.counts);
        }
      }
    } catch (error) {
      console.warn('[Inventory] Failed to load products:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Vegetables');
    setCustomCategory('');
    setFormPrice('');
    setFormStock('');
    setFormPackSize('1 unit');
    setFormThreshold('5');
    setFormImageKey('vegetables');
    setFormImageUrl('');
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormName(product.name || '');
    setFormCategory(product.category || 'Vegetables');
    setCustomCategory('');
    setFormPrice(String(product.unitPrice || ''));
    setFormStock(String(product.stock !== undefined ? product.stock : ''));
    setFormPackSize(product.packSize || '1 unit');
    setFormThreshold(String(product.lowStockThreshold || 5));
    setFormImageKey(product.imageKey || 'vegetables');
    setFormImageUrl(product.imageUrl || '');
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    const category = customCategory.trim() || formCategory.trim();
    if (!formName.trim() || !category || !formPrice || formStock === '') {
      Alert.alert('Required Fields', 'Please enter product name, unit price, and stock count.');
      return;
    }
    if (formImageUrl.trim() && !/^https?:\/\/\S+$/i.test(formImageUrl.trim())) {
      Alert.alert('Invalid Image URL', 'Enter a valid HTTP or HTTPS image URL.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName.trim(),
        category,
        unitPrice: Number(formPrice),
        stock: Number(formStock),
        packSize: formPackSize.trim() || '1 unit',
        lowStockThreshold: Number(formThreshold) || 5,
        imageKey: formImageKey,
        imageUrl: formImageUrl.trim(),
      };

      if (editingProduct) {
        // UPDATE existing product
        await client.put(`/owner/products/${editingProduct.id || editingProduct._id}`, payload);
        Alert.alert('Updated', 'Product details saved successfully.');
      } else {
        // CREATE new product
        await client.post('/owner/products', payload);
        Alert.alert('Added', 'New product added to inventory catalogue.');
      }

      setModalVisible(false);
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!editingProduct) return;
    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${editingProduct.name}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await client.delete(`/owner/products/${editingProduct.id || editingProduct._id}`);
              Alert.alert('Deleted', 'Product removed successfully.');
              setModalVisible(false);
              fetchProducts();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete product.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Stock</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert('Inventory Options', 'Filter by category or export stock report.')}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Pills Row */}
      <View style={styles.filterPillsRow}>
        <TouchableOpacity
          style={[styles.pill, filter === 'all' && styles.pillActiveAll]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.pillText, filter === 'all' && styles.pillTextActiveAll]}>
            All Items
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, filter === 'low_stock' && styles.pillActive]}
          onPress={() => setFilter('low_stock')}
        >
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.pillText, filter === 'low_stock' && styles.pillTextActive]}>
            Low Stock ({counts.low_stock || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, filter === 'out_of_stock' && styles.pillActive]}
          onPress={() => setFilter('out_of_stock')}
        >
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.pillText, filter === 'out_of_stock' && styles.pillTextActive]}>
            Out of Stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or filter tags.</Text>
            </View>
          ) : (
            products.map((item) => {
              const itemId = item.id || item._id;
              const isOutOfStock = item.stock <= 0;
              const isLowStock = !isOutOfStock && item.stock <= (item.lowStockThreshold || 5);

              let badgeDotColor = '#16A34A';
              let badgeText = `In Stock • ${item.stock} available`;
              let badgeTextColor = '#166534';

              if (isOutOfStock) {
                badgeDotColor = '#EF4444';
                badgeText = 'Out of Stock • 0 left';
                badgeTextColor = '#DC2626';
              } else if (isLowStock) {
                badgeDotColor = '#F59E0B';
                badgeText = `Low Stock • ${item.stock} left`;
                badgeTextColor = '#B45309';
              }

              return (
                <View key={itemId} style={styles.productCard}>
                  {/* Thumbnail Image */}
                  <View style={styles.imageWrap}>
                    <Image
                      source={getProductAsset(item.imageKey, item.imageUrl)}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Details */}
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <View style={styles.stockStatusRow}>
                      <View style={[styles.dot, { backgroundColor: badgeDotColor }]} />
                      <Text style={[styles.stockStatusText, { color: badgeTextColor }]}>
                        {badgeText}
                      </Text>
                    </View>
                    <Text style={styles.priceText}>
                      Rs. {item.unitPrice} <Text style={styles.packText}>/ {item.packSize}</Text>
                    </Text>
                  </View>

                  {/* Edit Button */}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pencil" size={13} color={colors.text} />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Bottom Fixed Button: + Add New Product */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addNewButton}
          onPress={openAddModal}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addNewButtonText}>Add New Product</Text>
        </TouchableOpacity>
      </View>

      {/* Add / Edit Product Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Product Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Coconut Oil 1L"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryPills}>
                {['Vegetables', 'Grains', 'Oils', 'Dairy', 'Bundles'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      formCategory === cat && styles.categoryPillActive,
                    ]}
                    onPress={() => {
                      setFormCategory(cat);
                      setCustomCategory('');
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        formCategory === cat && styles.categoryPillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Or add a new category"
                value={customCategory}
                onChangeText={setCustomCategory}
                maxLength={40}
              />

              <Text style={styles.fieldLabel}>Product Image URL (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://example.com/product.jpg"
                value={formImageUrl}
                onChangeText={setFormImageUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              {formImageUrl.trim() ? (
                <Image
                  source={getProductAsset(formImageKey, formImageUrl.trim())}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              ) : null}

              <View style={styles.twoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabel}>Unit Price (Rs.)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 1200"
                    keyboardType="numeric"
                    value={formPrice}
                    onChangeText={setFormPrice}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabel}>Stock Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 24"
                    keyboardType="numeric"
                    value={formStock}
                    onChangeText={setFormStock}
                  />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabel}>Pack Size</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 1L bottle"
                    value={formPackSize}
                    onChangeText={setFormPackSize}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabel}>Low Threshold</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Default 5"
                    keyboardType="numeric"
                    value={formThreshold}
                    onChangeText={setFormThreshold}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProduct}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </Text>
                )}
              </TouchableOpacity>

              {editingProduct && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteProduct}
                  disabled={saving}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text style={styles.deleteButtonText}>Delete Product</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchBarContainer: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 6,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  pillActiveAll: {
    backgroundColor: '#16803C',
    borderColor: '#16803C',
  },
  pillActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  pillTextActiveAll: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillTextActive: {
    fontWeight: '700',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F8FAF8',
    overflow: 'hidden',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  packText: {
    fontWeight: '500',
    color: '#94A3B8',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addNewButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addNewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#F8FAF8',
  },
  imagePreview: {
    width: 96,
    height: 96,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#F1F5F9',
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  categoryPillActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: colors.primary,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  colHalf: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
    gap: 6,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default OwnerInventoryScreen;
