/**
 * Customer-module constants shared by cart and checkout calculations.
 */
const DELIVERY_CHARGE = 250;
const FREE_DELIVERY_THRESHOLD = 1500;
const LOW_STOCK_THRESHOLD = 5;
const PROMO_CODES = {
  FRESH10: { discountPercent: 10 },
  FARM15: { discountPercent: 15 },
};

const calculatePromoDiscount = (code, subtotal) => {
  const promotion = PROMO_CODES[code];
  return promotion ? Math.round((subtotal * promotion.discountPercent) / 100) : 0;
};

module.exports = {
  DELIVERY_CHARGE,
  FREE_DELIVERY_THRESHOLD,
  LOW_STOCK_THRESHOLD,
  PROMO_CODES,
  calculatePromoDiscount,
};
