export const PURCHASE_UNITS = [
  'Kg',
  'Gram',
  'Litre',
  'ml',
  'Packet',
  'Box',
  'Bag',
  'Bottle',
  'Tray',
  'Piece',
  'Dozen',
  'Pouch',
  'Can',
  'Jar',
] as const;

export const STOCK_UNITS = [
  'Kg',
  'Gram',
  'Litre',
  'ml',
  'Piece',
] as const;

export type PurchaseUnitName = typeof PURCHASE_UNITS[number] | string;
export type StockUnitName = typeof STOCK_UNITS[number] | string;

/**
 * Normalizes any unit string to one of the standard stock units
 */
export const normalizeStockUnit = (unit?: string): string => {
  if (!unit) return 'Piece';
  const u = unit.toLowerCase().trim();
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return 'Kg';
  if (u === 'g' || u === 'gram' || u === 'grams' || u === 'gm') return 'Gram';
  if (u === 'l' || u === 'ltr' || u === 'litre' || u === 'litres' || u === 'liter' || u === 'liters') return 'Litre';
  if (u === 'ml' || u === 'millilitre' || u === 'millilitres' || u === 'milliliter') return 'ml';
  if (u === 'piece' || u === 'pieces' || u === 'pcs' || u === 'pc' || u === 'portion' || u === 'portions') return 'Piece';
  return unit.charAt(0).toUpperCase() + unit.slice(1);
};

/**
 * Normalizes any unit string to one of the standard purchase units
 */
export const normalizePurchaseUnit = (unit?: string): string => {
  if (!unit) return 'Packet';
  const u = unit.toLowerCase().trim();
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return 'Kg';
  if (u === 'g' || u === 'gram' || u === 'grams' || u === 'gm') return 'Gram';
  if (u === 'l' || u === 'ltr' || u === 'litre' || u === 'litres' || u === 'liter' || u === 'liters') return 'Litre';
  if (u === 'ml' || u === 'millilitre' || u === 'millilitres') return 'ml';
  if (u === 'packet' || u === 'packets' || u === 'pack' || u === 'packs' || u === 'pkt') return 'Packet';
  if (u === 'box' || u === 'boxes') return 'Box';
  if (u === 'bag' || u === 'bags') return 'Bag';
  if (u === 'bottle' || u === 'bottles') return 'Bottle';
  if (u === 'tray' || u === 'trays') return 'Tray';
  if (u === 'piece' || u === 'pieces' || u === 'pcs' || u === 'pc') return 'Piece';
  if (u === 'dozen' || u === 'dozens' || u === 'doz') return 'Dozen';
  if (u === 'pouch' || u === 'pouches') return 'Pouch';
  if (u === 'can' || u === 'cans') return 'Can';
  if (u === 'jar' || u === 'jars') return 'Jar';
  return unit.charAt(0).toUpperCase() + unit.slice(1);
};

/**
 * Provides intelligent default conversion factors based on unit pairs
 */
export const getDefaultConversion = (purchaseUnit: string, stockUnit: string): number => {
  const p = normalizePurchaseUnit(purchaseUnit);
  const s = normalizeStockUnit(stockUnit);
  if (p === s) return 1;
  if (p === 'Kg' && s === 'Gram') return 1000;
  if (p === 'Litre' && s === 'ml') return 1000;
  if (p === 'Dozen' && s === 'Piece') return 12;
  if (p === 'Tray' && s === 'Piece') return 30;
  if (p === 'Bag' && s === 'Kg') return 25;
  if (p === 'Packet' && s === 'Piece') return 20;
  if (p === 'Packet' && s === 'Gram') return 1000;
  if (p === 'Box' && s === 'Piece') return 12;
  if (p === 'Bottle' && s === 'ml') return 750;
  if (p === 'Pouch' && s === 'Gram') return 500;
  if (p === 'Can' && s === 'ml') return 330;
  if (p === 'Jar' && s === 'Gram') return 500;
  return 1;
};

/**
 * Format stock quantity with its unit cleanly
 */
export const formatStockWithUnit = (quantity: number, unit: string): string => {
  const numStr = Number.isInteger(quantity)
    ? quantity.toString()
    : quantity.toFixed(quantity < 10 ? 2 : 1).replace(/\.?0+$/, '');
  return `${numStr} ${normalizeStockUnit(unit)}`;
};

/**
 * Format purchase quantity with conversion description
 * e.g. "5 Trays (= 150 Pieces)"
 */
export const formatPurchaseWithConversion = (
  purchaseQty: number,
  purchaseUnit: string,
  conversionFactor: number,
  stockUnit: string
): string => {
  const pUnit = normalizePurchaseUnit(purchaseUnit);
  const sUnit = normalizeStockUnit(stockUnit);
  if (pUnit === sUnit || conversionFactor === 1) {
    return `${purchaseQty} ${pUnit}`;
  }
  const stockQty = purchaseQty * conversionFactor;
  return `${purchaseQty} ${pUnit} (= ${formatStockWithUnit(stockQty, sUnit)})`;
};
