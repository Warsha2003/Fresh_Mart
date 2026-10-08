/**
 * Product image registry.
 * Backend products store imageKey; screens resolve it through this map.
 */
export const productAssets = {
  rice: require('../../assets/customer/basmati.jpeg'),
  'coconut-oil': require('../../assets/customer/coconut oil.jpeg'),
  eggs: require('../../assets/customer/eggs.jpeg'),
  tomato: require('../../assets/customer/tomato.jpeg'),
  'red-onion': require('../../assets/customer/onion.jpeg'),
  carrot: require('../../assets/customer/carrot.jpeg'),
  'vegetable-basket': require('../../assets/customer/veg_basket.jpeg'),
  vegetables: require('../../assets/customer/veg.jpeg'),
  grains: require('../../assets/customer/grains.jpeg'),
  oils: require('../../assets/customer/olive oil.jpeg'),
  'olive-oil': require('../../assets/customer/olive oil.jpeg'),
  dairy: require('../../assets/customer/diary.jpeg'),
};

export const getProductAsset = (imageKey, imageUrl) => {
  if (imageUrl) return { uri: imageUrl };
  return productAssets[imageKey] || productAssets['vegetable-basket'];
};
