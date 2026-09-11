import { Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { PurchaseOrderItem, UnitOfMeasure } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PurchaseOrderModalProps {
  onClose: () => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ onClose }) => {
  const { suppliers, ingredients, addPurchaseOrder, settings } = useRestaurant();

  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || 'sup-1');
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('Standard weekly replenishment');

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      ingredientId: ingredients[0]?.id || 'ing-1',
      ingredientName: ingredients[0]?.name || 'Coffee Beans',
      orderedQuantity: 10,
      unit: ingredients[0]?.unit || 'kg',
      unitPrice: ingredients[0]?.costPerUnit || 950,
      totalAmount: (ingredients[0]?.costPerUnit || 950) * 10,
    },
  ]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const handleItemChange = (index: number, ingId: string, qty: number, price: number) => {
    const ing = ingredients.find((i) => i.id === ingId);
    if (!ing) return;

    const updated = [...items];
    updated[index] = {
      ingredientId: ing.id,
      ingredientName: ing.name,
      orderedQuantity: qty,
      unit: ing.unit,
      unitPrice: price,
      totalAmount: qty * price,
    };
    setItems(updated);
  };

  const handleAddRow = () => {
    const ing = ingredients[0];
    if (!ing) return;
    setItems([
      ...items,
      {
        ingredientId: ing.id,
        ingredientName: ing.name,
        orderedQuantity: 5,
        unit: ing.unit,
        unitPrice: ing.costPerUnit,
        totalAmount: 5 * ing.costPerUnit,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    addPurchaseOrder({
      poNumber: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      status: 'pending',
      items,
      totalAmount,
      orderDate: new Date().toISOString(),
      expectedDate,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Create Supplier Purchase Order (PO)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contactPerson} - {s.phone})
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
                required
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Ordered Ingredients & Stock Items
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-amber-600 font-bold text-xs flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((row, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2"
                >
                  <select
                    value={row.ingredientId}
                    onChange={(e) =>
                      handleItemChange(idx, e.target.value, row.orderedQuantity, row.unitPrice)
                    }
                    className="flex-1 min-w-[150px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold"
                  >
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>

                  <div className="w-24">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="Qty"
                      value={row.orderedQuantity}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          row.ingredientId,
                          parseFloat(e.target.value) || 0,
                          row.unitPrice
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      placeholder="Price"
                      value={row.unitPrice}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          row.ingredientId,
                          row.orderedQuantity,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
                    />
                  </div>

                  <div className="w-24 text-right font-extrabold text-slate-800 dark:text-slate-200">
                    {formatCurrency(row.totalAmount)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 flex justify-between items-center">
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Total Purchase Value
            </span>
            <span className="font-extrabold text-base text-amber-950 dark:text-amber-100">
              {formatCurrency(totalAmount, settings.currencySymbol)}
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Purchase Order Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Submit Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
