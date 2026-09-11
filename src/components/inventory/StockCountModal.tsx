import { AlertTriangle, CheckCircle, ClipboardCheck, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { StockCountItem } from '../../types';

interface StockCountModalProps {
  onClose: () => void;
}

export const StockCountModal: React.FC<StockCountModalProps> = ({ onClose }) => {
  const { ingredients, submitStockCount } = useRestaurant();
  const { currentUser } = useAuth();

  const [countType, setCountType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [items, setItems] = useState<StockCountItem[]>(
    ingredients.map((ing) => ({
      ingredientId: ing.id,
      ingredientName: ing.name,
      systemStock: ing.currentStock,
      physicalStock: ing.currentStock,
      variance: 0,
      unit: ing.unit,
    }))
  );
  const [notes, setNotes] = useState('');

  const handlePhysicalChange = (index: number, physicalVal: number) => {
    const updated = [...items];
    const item = updated[index];
    item.physicalStock = physicalVal;
    item.variance = physicalVal - item.systemStock;
    setItems(updated);
  };

  const totalVariances = items.filter((i) => Math.abs(i.variance) > 0.01).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitStockCount({
      type: countType,
      performedBy: currentUser?.name || 'Staff',
      items,
      status: 'submitted',
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Physical Inventory Audit & Variance Reconciliation
              </h3>
              <p className="text-xs text-slate-500">
                Count actual physical store stocks and verify against live system book balances
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Audit Type:</span>
              <select
                value={countType}
                onChange={(e) => setCountType(e.target.value as any)}
                className="px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
              >
                <option value="daily">Daily Opening/Closing Count</option>
                <option value="weekly">Weekly Store Audit</option>
                <option value="monthly">Monthly Full Stock Audit</option>
              </select>
            </div>

            <div className="text-xs font-bold text-amber-600">
              {totalVariances} Discrepancies / Variances Detected
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 uppercase font-bold text-[10px] text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Ingredient</th>
                  <th className="py-2.5 px-3">System Stock</th>
                  <th className="py-2.5 px-3">Physical Count</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, idx) => (
                  <tr key={item.ingredientId}>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.ingredientName}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-500">
                      {item.systemStock.toFixed(2)} {item.unit}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 w-28">
                        <input
                          type="number"
                          step="any"
                          value={item.physicalStock}
                          onChange={(e) =>
                            handlePhysicalChange(idx, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs"
                        />
                        <span className="text-[11px] text-slate-400">{item.unit}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-bold">
                      <span
                        className={`${
                          Math.abs(item.variance) < 0.001
                            ? 'text-emerald-600'
                            : item.variance > 0
                            ? 'text-blue-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {item.variance >= 0 ? `+${item.variance.toFixed(2)}` : item.variance.toFixed(2)} {item.unit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Audit Findings & Manager Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Conducted by store manager Rahul. Small variance on whole milk due to froth wastage."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
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
              Submit Count for Reconciliation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
