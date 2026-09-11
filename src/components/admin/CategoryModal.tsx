import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hash,
  Smile,
} from 'lucide-react';
import { Category } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  category?: Category | null;
  onClose: () => void;
  onSave: (catData: Omit<Category, 'id'>) => void;
  totalCategoriesCount?: number;
}

const PRESET_ICONS = [
  { emoji: '☕', label: 'Coffee' },
  { emoji: '🍵', label: 'Tea & Chai' },
  { emoji: '🥤', label: 'Beverages' },
  { emoji: '🥐', label: 'Bakery' },
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '🍔', label: 'Burgers' },
  { emoji: '🥪', label: 'Sandwiches' },
  { emoji: '🥗', label: 'Salads' },
  { emoji: '🍝', label: 'Pasta' },
  { emoji: '🍜', label: 'Noodles & Asian' },
  { emoji: '🍚', label: 'Rice & Bowls' },
  { emoji: '🍟', label: 'Starters & Sides' },
  { emoji: '🌮', label: 'Mexican / Tacos' },
  { emoji: '🍲', label: 'Soups' },
  { emoji: '🍳', label: 'Breakfast' },
  { emoji: '🍰', label: 'Desserts & Cakes' },
  { emoji: '🍦', label: 'Ice Cream' },
  { emoji: '🍩', label: 'Donuts & Sweets' },
  { emoji: '🥑', label: 'Healthy & Vegan' },
  { emoji: '🌶️', label: 'Spicy Specials' },
  { emoji: '🥩', label: 'Grills & Meat' },
  { emoji: '🍱', label: 'Combos & Meals' },
  { emoji: '🍹', label: 'Mocktails & Juices' },
  { emoji: '✨', label: 'Chef Specials' },
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
  totalCategoriesCount = 0,
}) => {
  const isEditing = Boolean(category);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('☕');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(totalCategoriesCount + 1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setIcon(category.icon || '☕');
      setDescription(category.description || '');
      setSortOrder(category.sortOrder ?? 1);
      setIsActive(category.isActive ?? true);
    } else {
      setName('');
      setIcon('☕');
      setDescription('');
      setSortOrder(totalCategoriesCount + 1);
      setIsActive(true);
    }
    setError('');
  }, [category, isOpen, totalCategoriesCount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    onSave({
      name: name.trim(),
      icon: icon.trim() || '🍽️',
      description: description.trim(),
      sortOrder: Number(sortOrder) || 1,
      isActive,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-xl shadow-xs">
              {icon || <Layers className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {isEditing ? 'Edit Category' : 'Add New Category'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Update category name, icon badge, and ordering' : 'Create a new food or beverage classification'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Name */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Specialty Coffee, Gourmet Pizzas, Artisan Desserts"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Icon / Emoji Picker */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Icon / Emoji Badge
            </label>
            <div className="flex items-center gap-2 mb-2.5">
              <input
                type="text"
                placeholder="Emoji or short icon text (e.g., ☕, 🍕, 🥗)"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-24 px-3 py-2 text-center text-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400">
                Click a preset below or type any custom emoji
              </span>
            </div>

            {/* Presets Grid */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 max-h-36 overflow-y-auto grid grid-cols-6 sm:grid-cols-8 gap-1.5">
              {PRESET_ICONS.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setIcon(p.emoji)}
                  title={p.label}
                  className={`p-2 rounded-xl text-base flex flex-col items-center justify-center transition-all ${
                    icon === p.emoji
                      ? 'bg-amber-600 text-white shadow-xs scale-105'
                      : 'hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>{p.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief description for customer menus & staff POS guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Sort Order & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Display Sort Order
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-[10px] text-slate-400">Lower numbers appear first</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Category Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-full py-2 px-3 rounded-xl border font-bold flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{isActive ? 'Active on Menu & POS' : 'Hidden / Inactive'}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
