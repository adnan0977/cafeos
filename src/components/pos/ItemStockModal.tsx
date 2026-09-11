import { Check, Package, PackageCheck, PackageX, Search, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ItemStockModalProps {
  onClose: () => void;
}

export const ItemStockModal: React.FC<ItemStockModalProps> = ({ onClose }) => {
  const { menuItems, updateMenuItem, settings } = useRestaurant();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...Array.from(new Set(menuItems.map((m) => m.category)))];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const toggleAvailability = (item: MenuItem) => {
    updateMenuItem(item.id, { isAvailable: !item.isAvailable });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-600 text-white">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Live Menu Stock (Cloud-Sync 86 List)</h3>
              <p className="text-xs text-slate-400">Toggle items In-Stock or 86 (Sold Out) in real time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dish or beverage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List of Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                item.isAvailable
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{item.name}</h4>
                  <div className="text-[11px] text-slate-500 font-semibold">
                    {formatCurrency(item.basePrice, settings.currencySymbol)} • <span className="capitalize">{item.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAvailability(item)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all ${
                    item.isAvailable
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-rose-100 hover:text-rose-700'
                      : 'bg-rose-600 text-white hover:bg-emerald-600'
                  }`}
                >
                  {item.isAvailable ? (
                    <>
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>In Stock</span>
                    </>
                  ) : (
                    <>
                      <PackageX className="w-3.5 h-3.5" />
                      <span>86 (Sold Out)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 font-bold text-xs rounded-xl">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
