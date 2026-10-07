export const DELIVERY_CHARGE = 250;
export const FREE_DELIVERY_THRESHOLD = 1500;
export const PROMO_CODES = {
  FRESH10: { discountPercent: 10 },
  FARM15: { discountPercent: 15 },
};

export const calculatePromoDiscount = (code, subtotal) => {
  const promotion = PROMO_CODES[code];
  return promotion ? Math.round((subtotal * promotion.discountPercent) / 100) : 0;
};
