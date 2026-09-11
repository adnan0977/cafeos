import {
  Check,
  Copy,
  Download,
  FileText,
  Printer,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  AlertInventoryItemData,
  formatAlertInventoryPlainText,
  generateHoinAlertInventoryReceiptHTML,
  generateHoinPurchaseListReceiptHTML,
} from '../../utils/hoinPrinterUtils';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

interface HoinPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AlertInventoryItemData[];
  mode?: 'alert_inventory' | 'purchase_list';
  threshold?: number;
  onOpenSettings?: () => void;
}

export const HoinPrintModal: React.FC<HoinPrintModalProps> = ({
  isOpen,
  onClose,
  items,
  mode = 'alert_inventory',
  threshold = 10,
  onOpenSettings,
}) => {
  const { settings, updateSettings } = useRestaurant();
  const { currentUser } = useAuth();
  const [printMode, setPrintMode] = useState<'alert_inventory' | 'purchase_list'>(mode);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    settings.hoinPrinter?.paperWidth || '80mm'
  );
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const printerConfig = settings.hoinPrinter || {
    printerName: 'HOIN HOP-H58 / HOP-E801 Thermal Printer',
    printerType: 'hoin_thermal',
    connectionType: 'browser',
    paperWidth: '80mm',
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const html =
      printMode === 'alert_inventory'
        ? generateHoinAlertInventoryReceiptHTML(items, settings, {
            paperWidth,
            printedBy: currentUser?.name || 'Inventory Manager',
            threshold,
            storeName: 'Main Store & Kitchen',
          })
        : generateHoinPurchaseListReceiptHTML(items, settings, {
            paperWidth,
            printedBy: currentUser?.name || 'Inventory Manager',
            storeName: 'Main Store & Kitchen',
          });

    const printWin = window.open('', '_blank', 'width=450,height=650');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    }
    setTimeout(() => setIsPrinting(false), 500);
  };

  const handleCopyPlainText = () => {
    const text = formatAlertInventoryPlainText(
      items,
      settings,
      threshold,
      'Main Store & Kitchen'
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEstCost = items.reduce(
    (sum, it) => sum + it.suggestedPurchaseQty * it.costPerUnit,
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                HOIN Thermal Receipt Print
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {printerConfig.printerName} ({paperWidth})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                title="Printer Settings"
                className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Configuration Controls Bar */}
        <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Mode Selector: Low Stock vs Purchase List */}
          <div className="flex rounded-xl bg-slate-200 dark:bg-slate-800 p-0.5 font-bold">
            <button
              onClick={() => setPrintMode('alert_inventory')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                printMode === 'alert_inventory'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Low Stock Alert
            </button>
            <button
              onClick={() => setPrintMode('purchase_list')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                printMode === 'purchase_list'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Purchase List
            </button>
          </div>

          {/* Paper Width Selector: 58mm vs 80mm */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Width:</span>
            <div className="flex rounded-xl bg-slate-200 dark:bg-slate-800 p-0.5 font-bold">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  paperWidth === '58mm'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                58mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  paperWidth === '80mm'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                80mm
              </button>
            </div>
          </div>
        </div>

        {/* Thermal Receipt Visual Preview */}
        <div className="p-4 sm:p-6 bg-slate-200 dark:bg-slate-950 flex justify-center max-h-[50vh] overflow-y-auto">
          <div
            className={`bg-white text-slate-900 font-mono shadow-lg border border-dashed border-slate-400 p-4 transition-all duration-200 rounded-sm select-text ${
              paperWidth === '58mm'
                ? 'w-[230px] text-[10px] leading-tight'
                : 'w-[290px] text-[11px] leading-normal'
            }`}
          >
            {/* Header */}
            <div className="text-center space-y-0.5 mb-2">
              <div className="font-black text-sm tracking-tight">{settings.name.toUpperCase()}</div>
              <div className="font-extrabold text-xs">
                {printMode === 'alert_inventory' ? 'LOW STOCK ALERT' : 'PURCHASE ORDER LIST'}
              </div>
              <div className="text-[10px] text-slate-600">================================</div>
            </div>

            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-bold">{formatDate(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span>Store:</span>
                <span className="font-bold">Main Store</span>
              </div>
              {printMode === 'alert_inventory' ? (
                <div className="flex justify-between">
                  <span>Threshold:</span>
                  <span>&lt; {threshold} units</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span>Target Vendor:</span>
                  <span className="font-semibold">All Suppliers</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-slate-900 my-2" />
            <div className="text-center font-bold text-[10px] uppercase">
              {printMode === 'alert_inventory' ? '--- LOW STOCK ITEMS ---' : '--- PURCHASE ITEMS ---'}
            </div>
            <div className="border-t border-dashed border-slate-500 my-1.5" />

            {/* Items List */}
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-[10px]">
                  No items selected to print.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={item.id} className="border-b border-dotted border-slate-400 pb-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="truncate max-w-[170px]">
                        {idx + 1}. {item.name}
                      </span>
                      {printMode === 'alert_inventory' ? (
                        <span className="text-[9px] px-1 bg-slate-100 border border-slate-400 rounded-xs">
                          {item.status}
                        </span>
                      ) : (
                        <span>+{item.suggestedPurchaseQty} {item.unit}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-600">
                      <span>SKU: {item.sku}</span>
                      <span>Loc: {item.storageLocation}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span>Stock: {item.currentStock} {item.unit}</span>
                      <span>Min: {item.minStock} {item.unit}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[10px]">
                      <span>Purchase Req:</span>
                      <span>+{item.suggestedPurchaseQty} {item.unit}</span>
                    </div>
                    <div className="text-[9px] text-slate-600 truncate">
                      Supplier: {item.supplierName}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t-2 border-slate-900 my-2" />

            {/* Summary */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between font-bold">
                <span>TOTAL ITEMS:</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>ESTIMATED PO COST:</span>
                <span>{formatCurrency(totalEstCost, settings.currencySymbol)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-500 my-2" />
            <div className="text-[9px] text-slate-600 space-y-0.5">
              <div className="flex justify-between">
                <span>Printed By:</span>
                <span>{currentUser?.name || 'Manager'}</span>
              </div>
              <div className="flex justify-between">
                <span>Printed At:</span>
                <span>{formatDateTime(new Date().toISOString())}</span>
              </div>
            </div>
            <div className="text-center font-bold text-[9px] mt-2">
              ================================
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPlainText}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={items.length === 0 || isPrinting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Opening...' : `Print (${items.length} Items)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
