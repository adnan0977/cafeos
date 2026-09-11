import { Ingredient, RestaurantSettings, Supplier } from '../types';
import { formatCurrency, formatDate, formatDateTime } from './formatters';

export interface AlertInventoryItemData {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  targetStock: number;
  suggestedPurchaseQty: number;
  costPerUnit: number;
  supplierId: string;
  supplierName: string;
  storageLocation: string;
  lastPurchaseDate?: string;
  status: 'OUT OF STOCK' | 'CRITICAL' | 'LOW STOCK';
}

/**
 * Calculates stock status based on current stock, minimum stock, and threshold
 */
export const calculateStockStatus = (
  currentStock: number,
  minStock: number,
  threshold: number = 10
): 'OUT OF STOCK' | 'CRITICAL' | 'LOW STOCK' => {
  if (currentStock <= 0) {
    return 'OUT OF STOCK';
  }
  // Critical stock: current_stock <= minimum_stock * 0.25 (or <= 2 when minStock is small)
  const criticalThreshold = Math.max(1, minStock * 0.25);
  if (currentStock <= criticalThreshold) {
    return 'CRITICAL';
  }
  return 'LOW STOCK';
};

/**
 * Calculates default suggested purchase quantity
 * Target Stock Level - Current Stock
 */
export const calculateSuggestedPurchaseQty = (
  currentStock: number,
  minStock: number,
  maxStock?: number,
  threshold: number = 10
): number => {
  const targetStock = maxStock && maxStock > minStock ? maxStock : Math.max(minStock * 2, threshold * 2);
  const qtyNeeded = Math.max(0, targetStock - currentStock);
  // Round to 1 decimal place or whole integer
  return Number(qtyNeeded.toFixed(1));
};

/**
 * Transforms an ingredient into an AlertInventoryItemData
 */
export const mapIngredientToAlertItem = (
  ingredient: Ingredient,
  suppliers: Supplier[],
  threshold: number = 10,
  manualSuggestedQty?: number
): AlertInventoryItemData => {
  const supplier = suppliers.find((s) => s.id === ingredient.supplierId);
  const targetStock = ingredient.maxStock && ingredient.maxStock > ingredient.minStock
    ? ingredient.maxStock
    : Math.max(ingredient.minStock * 2, threshold * 2);

  const status = calculateStockStatus(ingredient.currentStock, ingredient.minStock, threshold);
  const suggestedPurchaseQty =
    manualSuggestedQty !== undefined
      ? manualSuggestedQty
      : calculateSuggestedPurchaseQty(ingredient.currentStock, ingredient.minStock, ingredient.maxStock, threshold);

  // Generate clean SKU from ingredient ID or name abbreviation
  const sku = (ingredient as any).sku || ingredient.id.replace('ing-', 'SKU-').toUpperCase();

  return {
    id: ingredient.id,
    sku,
    name: ingredient.name,
    category: ingredient.category || 'General',
    unit: ingredient.unit || 'units',
    currentStock: ingredient.currentStock,
    minStock: ingredient.minStock,
    targetStock,
    suggestedPurchaseQty,
    costPerUnit: ingredient.costPerUnit || 0,
    supplierId: ingredient.supplierId,
    supplierName: supplier?.name || (ingredient as any).supplierName || 'Primary Supplier',
    storageLocation: ingredient.storageLocation || 'Main Store',
    lastPurchaseDate: (ingredient as any).lastPurchaseDate || 'Recent',
    status,
  };
};

/**
 * Generates formatted HTML for HOIN 58mm / 80mm Thermal Printer - Low Stock Alert
 */
export const generateHoinAlertInventoryReceiptHTML = (
  items: AlertInventoryItemData[],
  settings: RestaurantSettings,
  options: {
    paperWidth?: '58mm' | '80mm';
    printedBy?: string;
    storeName?: string;
    threshold?: number;
    title?: string;
  } = {}
): string => {
  const width = options.paperWidth || settings.hoinPrinter?.paperWidth || settings.billPrinterWidth || '80mm';
  const is58 = width === '58mm';
  const widthPx = is58 ? '210px' : '290px';
  const printedBy = options.printedBy || 'Store Manager';
  const storeName = options.storeName || 'Main Store / Pantry';
  const threshold = options.threshold || settings.lowStockThreshold || 10;
  const printTitle = options.title || 'LOW STOCK ALERT';

  const totalEstCost = items.reduce(
    (sum, it) => sum + it.suggestedPurchaseQty * it.costPerUnit,
    0
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>HOIN Thermal Print - Low Stock Alert</title>
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace, 'Lucida Console', Monaco;
            width: ${widthPx};
            max-width: ${widthPx};
            margin: 0 auto;
            padding: 8px 6px;
            font-size: ${is58 ? '10px' : '11px'};
            line-height: 1.25;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .text-lg { font-size: 1.2em; }
          .text-xl { font-size: 1.35em; }
          .text-sm { font-size: 0.9em; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          .thick-divider { border-top: 3px double #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; align-items: baseline; }
          .item-block { margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dotted #555; }
          .badge {
            display: inline-block;
            font-size: 0.85em;
            font-weight: bold;
            padding: 1px 3px;
            border: 1px solid #000;
          }
          @media print {
            body {
              width: ${is58 ? '58mm' : '80mm'};
              padding: 2mm;
            }
          }
        </style>
      </head>
      <body onload="window.print()">
        <div class="text-center font-bold">
          ================================<br/>
          <span class="text-xl">${settings.name.toUpperCase()}</span><br/>
          <span class="text-lg">${printTitle}</span><br/>
          ================================
        </div>

        <div style="margin-top: 4px;">
          <div class="row">
            <span>Date:</span>
            <span class="font-bold">${formatDate(new Date().toISOString())}</span>
          </div>
          <div class="row">
            <span>Time:</span>
            <span>${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="row">
            <span>Store:</span>
            <span class="font-bold">${storeName}</span>
          </div>
          <div class="row">
            <span>Alert Rule:</span>
            <span>Current Stock &lt; ${threshold} units</span>
          </div>
        </div>

        <div class="thick-divider"></div>
        <div class="text-center font-bold text-sm" style="letter-spacing: 1px;">
          --- LOW STOCK ITEMS LIST ---
        </div>
        <div class="divider"></div>

        ${items.length === 0 ? `
          <div class="text-center" style="padding: 10px 0;">
            *** NO ITEMS BELOW THRESHOLD ***<br/>
            All inventory levels healthy.
          </div>
        ` : items.map((item, idx) => `
          <div class="item-block">
            <div class="row font-bold">
              <span>${idx + 1}. ${item.name}</span>
              <span class="badge">${item.status}</span>
            </div>
            <div class="row text-sm">
              <span>SKU: ${item.sku}</span>
              <span>Loc: ${item.storageLocation}</span>
            </div>
            <div class="row font-bold">
              <span>Stock: ${item.currentStock} ${item.unit}</span>
              <span>Min: ${item.minStock} ${item.unit}</span>
            </div>
            <div class="row font-bold" style="color: #000;">
              <span>Purchase Req:</span>
              <span>+${item.suggestedPurchaseQty} ${item.unit}</span>
            </div>
            <div class="row text-sm" style="color: #333;">
              <span>Supplier:</span>
              <span>${item.supplierName}</span>
            </div>
          </div>
        `).join('')}

        <div class="thick-divider"></div>
        <div class="text-center font-bold text-lg">
          PURCHASE REQUIRED
        </div>
        <div class="divider"></div>

        <div class="row font-bold text-sm">
          <span>TOTAL ALERT ITEMS:</span>
          <span>${items.length}</span>
        </div>
        <div class="row font-bold text-sm">
          <span>OUT OF STOCK:</span>
          <span>${items.filter((i) => i.status === 'OUT OF STOCK').length}</span>
        </div>
        <div class="row font-bold text-sm">
          <span>CRITICAL ITEMS:</span>
          <span>${items.filter((i) => i.status === 'CRITICAL').length}</span>
        </div>
        <div class="row font-bold text-sm">
          <span>ESTIMATED PO COST:</span>
          <span>${formatCurrency(totalEstCost, settings.currencySymbol)}</span>
        </div>

        <div class="double-divider"></div>
        <div class="row text-sm">
          <span>Printed By:</span>
          <span>${printedBy}</span>
        </div>
        <div class="row text-sm">
          <span>Printed At:</span>
          <span>${formatDateTime(new Date().toISOString())}</span>
        </div>
        <div class="text-center text-sm" style="margin-top: 4px;">
          ** HOIN Thermal POS Integration **
        </div>
        <div class="text-center font-bold">
          ================================
        </div>
      </body>
    </html>
  `;
};

/**
 * Generates formatted HTML for HOIN 58mm / 80mm Thermal Printer - Purchase Order / Purchase List
 */
export const generateHoinPurchaseListReceiptHTML = (
  items: AlertInventoryItemData[],
  settings: RestaurantSettings,
  options: {
    paperWidth?: '58mm' | '80mm';
    printedBy?: string;
    storeName?: string;
    supplierFilter?: string;
    title?: string;
  } = {}
): string => {
  const width = options.paperWidth || settings.hoinPrinter?.paperWidth || settings.billPrinterWidth || '80mm';
  const is58 = width === '58mm';
  const widthPx = is58 ? '210px' : '290px';
  const printedBy = options.printedBy || 'Inventory Manager';
  const storeName = options.storeName || 'Main Store';
  const supplierFilter = options.supplierFilter || 'All Assigned Suppliers';
  const printTitle = options.title || 'PURCHASE ORDER LIST';

  const totalEstCost = items.reduce(
    (sum, it) => sum + it.suggestedPurchaseQty * it.costPerUnit,
    0
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>HOIN Thermal Print - Purchase List</title>
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace, 'Lucida Console', Monaco;
            width: ${widthPx};
            max-width: ${widthPx};
            margin: 0 auto;
            padding: 8px 6px;
            font-size: ${is58 ? '10px' : '11px'};
            line-height: 1.25;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .text-lg { font-size: 1.2em; }
          .text-xl { font-size: 1.35em; }
          .text-sm { font-size: 0.9em; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          .thick-divider { border-top: 3px double #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; align-items: baseline; }
          .item-block { margin-bottom: 5px; padding-bottom: 4px; border-bottom: 1px dotted #555; }
          @media print {
            body {
              width: ${is58 ? '58mm' : '80mm'};
              padding: 2mm;
            }
          }
        </style>
      </head>
      <body onload="window.print()">
        <div class="text-center font-bold">
          ================================<br/>
          <span class="text-xl">${settings.name.toUpperCase()}</span><br/>
          <span class="text-lg">${printTitle}</span><br/>
          ================================
        </div>

        <div style="margin-top: 4px;">
          <div class="row">
            <span>Date:</span>
            <span class="font-bold">${formatDate(new Date().toISOString())}</span>
          </div>
          <div class="row">
            <span>Store:</span>
            <span class="font-bold">${storeName}</span>
          </div>
          <div class="row">
            <span>Vendor:</span>
            <span class="font-bold">${supplierFilter}</span>
          </div>
        </div>

        <div class="thick-divider"></div>
        <div class="text-center font-bold text-sm" style="letter-spacing: 1px;">
          --- ITEMS TO PURCHASE ---
        </div>
        <div class="divider"></div>

        ${items.map((item, idx) => {
          const itemTotal = item.suggestedPurchaseQty * item.costPerUnit;
          return `
            <div class="item-block">
              <div class="row font-bold">
                <span>${idx + 1}. ${item.name}</span>
                <span>${item.suggestedPurchaseQty} ${item.unit}</span>
              </div>
              <div class="row text-sm">
                <span>SKU: ${item.sku}</span>
                <span>Cur Stock: ${item.currentStock} ${item.unit}</span>
              </div>
              <div class="row text-sm">
                <span>Rate: ${formatCurrency(item.costPerUnit, settings.currencySymbol)}/${item.unit}</span>
                <span class="font-bold">Total: ${formatCurrency(itemTotal, settings.currencySymbol)}</span>
              </div>
              <div class="row text-sm" style="color: #444;">
                <span>Supplier:</span>
                <span>${item.supplierName}</span>
              </div>
            </div>
          `;
        }).join('')}

        <div class="thick-divider"></div>

        <div class="row font-bold text-sm">
          <span>TOTAL PURCHASE ITEMS:</span>
          <span>${items.length}</span>
        </div>
        <div class="row font-bold text-lg">
          <span>ESTIMATED AMOUNT:</span>
          <span>${formatCurrency(totalEstCost, settings.currencySymbol)}</span>
        </div>

        <div class="double-divider"></div>

        <div style="margin-top: 12px; margin-bottom: 6px;">
          <div class="row text-sm">
            <span>Authorized By:</span>
            <span>_________________</span>
          </div>
          <div style="height: 10px;"></div>
          <div class="row text-sm">
            <span>Vendor/Delivery Sign:</span>
            <span>_________________</span>
          </div>
        </div>

        <div class="divider"></div>
        <div class="row text-sm">
          <span>Printed By:</span>
          <span>${printedBy}</span>
        </div>
        <div class="row text-sm">
          <span>Printed At:</span>
          <span>${formatDateTime(new Date().toISOString())}</span>
        </div>
        <div class="text-center font-bold" style="margin-top: 4px;">
          ================================
        </div>
      </body>
    </html>
  `;
};

/**
 * Formats plain text for clipboard or ESC/POS output
 */
export const formatAlertInventoryPlainText = (
  items: AlertInventoryItemData[],
  settings: RestaurantSettings,
  threshold: number = 10,
  storeName: string = 'Main Store'
): string => {
  const separator = '================================';
  const subSeparator = '--------------------------------';
  const totalEstCost = items.reduce((sum, it) => sum + it.suggestedPurchaseQty * it.costPerUnit, 0);

  const lines = [
    separator,
    `        ${settings.name.toUpperCase()}`,
    `       LOW STOCK ALERT REPORT`,
    separator,
    `Date: ${formatDate(new Date().toISOString())}`,
    `Store: ${storeName}`,
    `Alert Threshold: < ${threshold} units`,
    subSeparator,
    `LOW STOCK ITEMS (${items.length}):`,
    subSeparator,
    ...items.map((item, idx) => [
      `${idx + 1}. ${item.name}`,
      `   SKU: ${item.sku} | Loc: ${item.storageLocation}`,
      `   Stock: ${item.currentStock} ${item.unit} | Min: ${item.minStock} ${item.unit}`,
      `   Purchase Req: +${item.suggestedPurchaseQty} ${item.unit}`,
      `   Supplier: ${item.supplierName} | Status: ${item.status}`,
      subSeparator,
    ].join('\n')),
    `TOTAL ITEMS: ${items.length}`,
    `ESTIMATED PO COST: ${formatCurrency(totalEstCost, settings.currencySymbol)}`,
    separator,
    `Printed At: ${formatDateTime(new Date().toISOString())}`,
    separator,
  ];

  return lines.join('\n');
};
