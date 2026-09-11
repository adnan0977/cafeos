import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowUpDown,
  UtensilsCrossed,
  Sparkles,
  Hash,
  Filter,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Category } from '../../types';
import { CategoryModal } from './CategoryModal';

interface CategoryManagementProps {
  onSelectCategoryFilter?: (categoryId: string) => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  onSelectCategoryFilter,
}) => {
  const {
    categories = [],
    menuItems = [],
    addCategory,
    updateCategory,
    deleteCategory,
  } = useRestaurant();

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Count items per category
  const getDishCountForCategory = (catId: string) => {
    return safeMenuItems.filter((item) => item.categoryId === catId).length;
  };

  // Filtered categories
  const filteredCategories = safeCategories
    .filter((cat) => {
      if (statusFilter === 'active' && !cat.isActive) return false;
      if (statusFilter === 'inactive' && cat.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          cat.name.toLowerCase().includes(q) ||
          (cat.description && cat.description.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleSaveCategory = (catData: Omit<Category, 'id'>) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, catData);
    } else {
      addCategory(catData);
    }
  };

  const handleConfirmDelete = (cat: Category) => {
    deleteCategory(cat.id);
    setDeleteConfirmCat(null);
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const totalDishesCount = menuItems.length;

  return (
    <div className="space-y-5">
      {/* Top Banner with Stats & Add Button */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center text-2xl shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Menu Categories Manager
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                  {categories.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Organize menu items, configure POS navigation tags, icons, and display ordering
              </p>
            </div>
          </div>

          {/* Direct Add Category Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-[10px] font-bold uppercase text-slate-500">Active on POS & Menu</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {activeCount} / {categories.length}
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-[10px] font-bold uppercase text-slate-500">Total Linked Dishes</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {totalDishesCount} Items
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-[10px] font-bold uppercase text-slate-500">Avg Dishes per Category</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {categories.length > 0 ? (totalDishesCount / categories.length).toFixed(1) : 0}
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-[10px] font-bold uppercase text-slate-500">Sort Ordering</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-amber-500" />
              <span>Priority Sequential Order</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Filters + View Switcher */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search category name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              All ({categories.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'active'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Inactive ({categories.length - activeCount})
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Categories Cards / Table Display */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto text-2xl">
            🍽️
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            No categories found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No categories match "${searchQuery}". Try clearing your search query.`
              : 'Create your first menu category to classify dishes, drinks, and combos.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Category</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const dishCount = getDishCountForCategory(cat.id);
            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                        {cat.icon || '🍽️'}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">
                          {cat.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            #{cat.sortOrder ?? 1} Order
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              cat.isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-500'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                      {cat.description}
                    </p>
                  )}

                  <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                      <span>{dishCount} Linked Dishes</span>
                    </div>
                    {onSelectCategoryFilter && dishCount > 0 && (
                      <button
                        type="button"
                        onClick={() => onSelectCategoryFilter(cat.id)}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        View Items →
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => updateCategory(cat.id, { isActive: !cat.isActive })}
                    className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                      cat.isActive
                        ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                    title={cat.isActive ? 'Hide from POS & Menu' : 'Show on POS & Menu'}
                  >
                    {cat.isActive ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Enable</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Edit Category Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmCat(cat)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Category Name & Icon</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Linked Dishes</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCategories.map((cat) => {
                  const dishCount = getDishCountForCategory(cat.id);
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        #{cat.sortOrder ?? 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icon || '🍽️'}</span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {cat.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {cat.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {cat.description || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                          {dishCount} Dishes
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => updateCategory(cat.id, { isActive: !cat.isActive })}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                            cat.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{cat.isActive ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmCat(cat)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        category={editingCategory}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        totalCategoriesCount={categories.length}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Delete Category?
                </h4>
                <p className="text-xs text-slate-500">
                  Confirm removal of "{deleteConfirmCat.name}"
                </p>
              </div>
            </div>

            {getDishCountForCategory(deleteConfirmCat.id) > 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-xl text-xs">
                ⚠️ Warning: <strong>{getDishCountForCategory(deleteConfirmCat.id)} dish(es)</strong> are currently assigned to this category. Deleting it will leave those dishes unclassified until reassigned.
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to permanently delete category <strong>"{deleteConfirmCat.name}"</strong>?
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deleteConfirmCat)}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-colors"
              >
                Yes, Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
