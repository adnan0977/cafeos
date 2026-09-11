import {
  Check,
  CheckCircle2,
  FileCheck,
  Package,
  Plus,
  Printer,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { PurchaseOrder, Supplier } from '../../types';
import { AlertInventoryItemData } from '../../utils/hoinPrinterUtils';
import { formatCurrency } from '../../utils/formatters';

interface QuickPurchaseListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AlertInventoryItemData[];
  onOpenPrintPurchaseList: (selectedItems: AlertInventoryItemData[]) => void;
}

export const QuickPurchaseListModal: React.FC<QuickPurchaseListModalProps> = ({
  isOpen,
  onClose,
  items: initialItems,
  onOpenPrintPurchaseList,
}) => {
  const { suppliers, addPurchaseOrder, settings } = useRestaurant();
  const { currentUser } = useAuth();

  const [purchaseItems, setPurchaseItems] = useState<AlertInventoryItemData[]>(initialItems);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || ''
  );
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('Auto-generated from Low Stock Alert replenishment list.');
  const [isCreated, setIsCreated] = useState(false);

  // Sync state if initial items change
  React.useEffect(() => {
    setPurchaseItems(initialItems);
    setIsCreated(false);
  }, [initialItems]);

  if (!isOpen) return null;

  const handleUpdateQty = (id: string, newQty: number) => {
    setPurchaseItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, suggestedPurchaseQty: Math.max(0.1, newQty) } : it))
    );
  };

  const handleRemoveItem = (id: string) => {
    setPurchaseItems((prev) => prev.filter((it) => it.id !== id));
  };

  const totalPOAmount = purchaseItems.reduce(
    (sum, it) => sum + it.suggestedPurchaseQty * it.costPerUnit,
    0
  );

  const handleGeneratePO = () => {
    if (purchaseItems.length === 0) return;

    const supplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

    const poData: Omit<PurchaseOrder, 'id'> = {
      supplierId: supplier?.id || 'SUP-0001',
      supplierName: supplier?.name || 'Primary Supplier',
      invoiceNumber: `REQ-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      paymentStatus: 'pending',
      items: purchaseItems.map((it) => ({
        ingredientId: it.id,
        ingredientName: it.name,
        quantity: it.suggestedPurchaseQty,
        orderedQuantity: it.suggestedPurchaseQty,
        unit: it.unit as any,
        unitCost: it.costPerUnit,
        totalCost: Number((it.suggestedPurchaseQty * it.costPerUnit).toFixed(2)),
      })),
      subtotal: Number(totalPOAmount.toFixed(2)),
      tax: Number((totalPOAmount * 0.05).toFixed(2)),
      grandTotal: Number((totalPOAmount * 1.05).toFixed(2)),
      notes: `${notes.trim()} (Expected Delivery: ${expectedDate})`,
    };

    addPurchaseOrder(poData);
    setIsCreated(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Create Replenishment Purchase Order
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate formal PO or HOIN thermal purchase list from low-stock items
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm max-h-[70vh] overflow-y-auto">
          {/* Supplier & Delivery Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Primary Supplier / Vendor
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.category || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                Selected Low Stock Items ({purchaseItems.length})
              </span>
              <span className="text-xs font-bold text-slate-500">
                Est. Subtotal: {formatCurrency(totalPOAmount, settings.currencySymbol)}
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {purchaseItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No items selected. Add items from the Alert Inventory tab.
                </div>
              ) : (
                purchaseItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>SKU: {item.sku}</span>
                        <span>•</span>
                        <span>Cur Stock: {item.currentStock} {item.unit}</span>
                        <span>•</span>
                        <span>Rate: {formatCurrency(item.costPerUnit, settings.currencySymbol)}/{item.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={item.suggestedPurchaseQty}
                          onChange={(e) => handleUpdateQty(item.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-right focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                        <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 dark:text-white w-20 text-right">
                        {formatCurrency(item.suggestedPurchaseQty * item.costPerUnit, settings.currencySymbol)}
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              PO Notes & Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPrintPurchaseList(purchaseItems);
            }}
            disabled={purchaseItems.length === 0}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Print HOIN Thermal Slip</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGeneratePO}
              disabled={purchaseItems.length === 0 || isCreated}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isCreated ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>PO Created & Queued!</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Generate Purchase Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
