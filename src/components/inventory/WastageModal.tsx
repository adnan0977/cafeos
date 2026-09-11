import { Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';

interface WastageModalProps {
  onClose: () => void;
}

export const WastageModal: React.FC<WastageModalProps> = ({ onClose }) => {
  const { ingredients, recordWastage } = useRestaurant();

  const [ingredientId, setIngredientId] = useState<string>(ingredients[0]?.id || 'ing-1');
  const [quantity, setQuantity] = useState<string>('0.5');
  const [reason, setReason] = useState<'expired' | 'spoilage' | 'burnt' | 'dropped' | 'overportioning' | 'other'>('spoilage');
  const [notes, setNotes] = useState<string>('');

  const selectedIng = ingredients.find((i) => i.id === ingredientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIng) return;

    recordWastage({
      ingredientId: selectedIng.id,
      ingredientName: selectedIng.name,
      quantity: parseFloat(quantity) || 0,
      unit: selectedIng.unit,
      reason,
      reportedBy: 'Staff',
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden my-8">
        <div className="px-6 py-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <Trash2 className="w-5 h-5" />
            <h3 className="font-bold text-base">Record Food / Stock Wastage</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Wasted Ingredient / Item
            </label>
            <select
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (Current Stock: {ing.currentStock} {ing.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Wasted Quantity ({selectedIng?.unit})
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-rose-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Wastage Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
              >
                <option value="spoilage">Milk/Food Spoilage</option>
                <option value="expired">Past Expiry Date</option>
                <option value="burnt">Burnt during Prep</option>
                <option value="dropped">Spilled / Dropped</option>
                <option value="overportioning">Over-portioning</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Investigation Notes / Comments
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Chiller temperature fluctuated during power failure."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Deduct & Log Wastage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
