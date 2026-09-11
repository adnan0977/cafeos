import { Check, Plus, Tag, Utensils, X } from 'lucide-react';
import React, { useState } from 'react';

interface OpenItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOpenItem: (item: { name: string; price: number; quantity: number; notes?: string }) => void;
}

export const OpenItemModal: React.FC<OpenItemModalProps> = ({ isOpen, onClose, onAddOpenItem }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    const q = parseInt(quantity, 10);
    if (!name.trim() || isNaN(p) || p <= 0 || isNaN(q) || q <= 0) return;

    onAddOpenItem({
      name: name.trim(),
      price: p,
      quantity: q,
      notes: notes.trim() || undefined,
    });

    setName('');
    setPrice('');
    setQuantity('1');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm">Add Open / Custom Item [F8]</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Item Name / Description *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Special Chef Combo, Extra Pack"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="₹ 0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Kitchen Preparation Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Extra spicy, Pack separately"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel (ESC)
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Bill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
