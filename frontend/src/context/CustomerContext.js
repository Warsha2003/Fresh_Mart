/**
 * Customer Context
 * Keeps product, cart, selected address, and favourites state in one place.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';

const emptyCart = {
  items: [],
  itemCount: 0,
  uniqueItemCount: 0,
  subtotal: 0,
  selectedAddress: null,
};

const getCategoriesFromProducts = (items) => {
  const uniqueCategories = items
    .map((product) => product.category)
    .filter(Boolean)
    .filter((category, index, list) => list.indexOf(category) === index)
    .sort();

  return ['All', ...uniqueCategories];
};

const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [cart, setCart] = useState(emptyCart);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddressState] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const favouriteProductIds = useMemo(
    () => favourites.map((product) => product.id || product._id),
    [favourites]
  );

  const applyCart = useCallback((nextCart) => {
    const normalized = nextCart || emptyCart;
    setCart(normalized);
    setSelectedAddressState(normalized.selectedAddress || null);
    return normalized;
  }, []);

  const fetchProducts = useCallback(async ({ search = '', category = 'All' } = {}) => {
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'All') params.category = category;

    const response = await client.get('/products', { params });
    const nextProducts = response.data?.data || [];
    if (!search && (!category || category === 'All')) {
      setProducts(nextProducts);
    }
    return nextProducts;
  }, []);

  const refreshCart = useCallback(async () => {
    const response = await client.get('/cart');
    return applyCart(response.data?.data);
  }, [applyCart]);

  const refreshFavourites = useCallback(async () => {
    const response = await client.get('/favourites');
    const nextFavourites = response.data?.data || [];
    setFavourites(nextFavourites);
    return nextFavourites;
  }, []);

  const refreshAddresses = useCallback(async () => {
    const response = await client.get('/profile/addresses');
    const nextAddresses = response.data?.data || [];
    setAddresses(nextAddresses);
    return nextAddresses;
  }, []);

  const addAddress = useCallback(async (address) => {
    const response = await client.post('/profile/addresses', address);
    const createdAddress = response.data?.data;
    if (createdAddress) {
      setAddresses((current) => [createdAddress, ...current]);
      if (createdAddress.isDefault) {
        await refreshCart();
      }
    }
    return createdAddress;
  }, [refreshCart]);

  const updateAddress = useCallback(async (addressId, address) => {
    const response = await client.put(`/profile/addresses/${addressId}`, address);
    const updatedAddress = response.data?.data;
    if (updatedAddress) {
      setAddresses((current) =>
        current.map((item) => (item._id === addressId ? updatedAddress : {
          ...item,
          isDefault: updatedAddress.isDefault ? false : item.isDefault,
        }))
      );
    }
    return updatedAddress;
  }, []);

  const deleteAddress = useCallback(async (addressId) => {
    await client.delete(`/profile/addresses/${addressId}`);
    setAddresses((current) => current.filter((address) => address._id !== addressId));
    await Promise.all([refreshAddresses(), refreshCart()]);
  }, [refreshAddresses, refreshCart]);

  const refreshCustomerState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const productsResult = await client.get('/products', { suppressErrorLog: true });
      const nextProducts = productsResult.data?.data || [];
      setProducts(nextProducts);

      try {
        const categoriesResult = await client.get('/products/meta/categories', {
          suppressErrorLog: true,
        });
        setCategories(categoriesResult.data?.data || getCategoriesFromProducts(nextProducts));
      } catch {
        setCategories(getCategoriesFromProducts(nextProducts));
      }

      if (isAuthenticated) {
        const [cartResult, favouritesResult, addressesResult] = await Promise.all([
          client.get('/cart', { suppressErrorLog: true }),
          client.get('/favourites', { suppressErrorLog: true }),
          client.get('/profile/addresses', { suppressErrorLog: true }),
        ]);

        applyCart(cartResult.data?.data);
        setFavourites(favouritesResult.data?.data || []);
        setAddresses(addressesResult.data?.data || []);
      } else {
        applyCart(emptyCart);
        setFavourites([]);
        setAddresses([]);
      }
    } catch (err) {
      setError(err.message || 'Unable to load customer data.');
    } finally {
      setIsLoading(false);
    }
  }, [applyCart, isAuthenticated]);

  useEffect(() => {
    refreshCustomerState();
  }, [refreshCustomerState]);

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      const response = await client.post('/cart/items', { productId, quantity });
      return applyCart(response.data?.data);
    },
    [applyCart]
  );

  const updateCartItem = useCallback(
    async (productId, quantity) => {
      const response = await client.put(`/cart/items/${productId}`, { quantity });
      return applyCart(response.data?.data);
    },
    [applyCart]
  );

  const removeCartItem = useCallback(
    async (productId) => {
      const response = await client.delete(`/cart/items/${productId}`);
      return applyCart(response.data?.data);
    },
    [applyCart]
  );

  const clearCart = useCallback(async () => {
    const response = await client.delete('/cart/clear');
    return applyCart(response.data?.data);
  }, [applyCart]);

  const selectAddress = useCallback(
    async (addressId) => {
      const response = await client.put('/cart/address', { addressId });
      return applyCart(response.data?.data);
    },
    [applyCart]
  );

  const addFavourite = useCallback(async (productId) => {
    const response = await client.post(`/favourites/${productId}`);
    setFavourites((prev) => {
      const nextProduct = response.data?.data;
      if (!nextProduct) return prev;
      const nextId = nextProduct.id || nextProduct._id;
      if (prev.some((product) => (product.id || product._id) === nextId)) return prev;
      return [nextProduct, ...prev];
    });
    return response.data?.data;
  }, []);

  const removeFavourite = useCallback(async (productId) => {
    await client.delete(`/favourites/${productId}`);
    setFavourites((prev) => prev.filter((product) => (product.id || product._id) !== productId));
  }, []);

  const toggleFavourite = useCallback(
    async (productId) => {
      if (favouriteProductIds.includes(productId)) {
        await removeFavourite(productId);
        return false;
      }
      await addFavourite(productId);
      return true;
    },
    [addFavourite, favouriteProductIds, removeFavourite]
  );

  const isFavourite = useCallback(
    (productId) => favouriteProductIds.includes(productId),
    [favouriteProductIds]
  );

  const value = useMemo(
    () => ({
      products,
      categories,
      cart,
      cartCount: cart.itemCount || 0,
      cartSubtotal: cart.subtotal || 0,
      addresses,
      selectedAddress,
      favourites,
      favouriteProductIds,
      isLoading,
      error,
      fetchProducts,
      refreshCustomerState,
      refreshCart,
      refreshFavourites,
      refreshAddresses,
      addAddress,
      updateAddress,
      deleteAddress,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      selectAddress,
      addFavourite,
      removeFavourite,
      toggleFavourite,
      isFavourite,
    }),
    [
      products,
      categories,
      cart,
      addresses,
      selectedAddress,
      favourites,
      favouriteProductIds,
      isLoading,
      error,
      fetchProducts,
      refreshCustomerState,
      refreshCart,
      refreshFavourites,
      refreshAddresses,
      addAddress,
      updateAddress,
      deleteAddress,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      selectAddress,
      addFavourite,
      removeFavourite,
      toggleFavourite,
      isFavourite,
    ]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
};

export const useCustomer = () => useContext(CustomerContext);
