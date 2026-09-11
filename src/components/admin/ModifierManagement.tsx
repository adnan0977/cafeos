import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Coffee,
  Sparkles,
  Search,
  Check,
  Tag,
  Eye,
  Sliders,
  AlertCircle,
  Utensils,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ModifierGroup, ModifierOption } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const DEFAULT_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: 'mg-1',
    name: 'Milk & Dairy Alternatives',
    description: 'Choice of fresh dairy or plant-based milks for espresso drinks',
    minSelection: 1,
    maxSelection: 1,
    isMultiSelect: false,
    applicableCategoryIds: ['cat-1'],
    options: [
      { id: 'opt-1-1', name: 'Whole Dairy Milk', price: 0, isDefault: true, inStock: true },
      { id: 'opt-1-2', name: 'Almond Milk (Plant)', price: 45, isDefault: false, inStock: true },
      { id: 'opt-1-3', name: 'Oat Milk (Barista Blend)', price: 50, isDefault: false, inStock: true },
      { id: 'opt-1-4', name: 'Soy Milk', price: 40, isDefault: false, inStock: true },
    ],
  },
  {
    id: 'mg-2',
    name: 'Espresso Shots & Strength',
    description: 'Customize caffeine intensity',
    minSelection: 0,
    maxSelection: 2,
    isMultiSelect: true,
    applicableCategoryIds: ['cat-1'],
    options: [
      { id: 'opt-2-1', name: 'Extra Espresso Shot', price: 60, isDefault: false, inStock: true },
      { id: 'opt-2-2', name: 'Decaf Roast', price: 20, isDefault: false, inStock: true },
      { id: 'opt-2-3', name: 'Vanilla Bean Syrup Shot', price: 35, isDefault: false, inStock: true },
      { id: 'opt-2-4', name: 'Caramel Drizzle', price: 30, isDefault: false, inStock: true },
    ],
  },
  {
    id: 'mg-3',
    name: 'Cheese & Crust Selection',
    description: 'Pizza base crust style and extra mozzarella portions',
    minSelection: 1,
    maxSelection: 1,
    isMultiSelect: false,
    applicableCategoryIds: ['cat-2'],
    options: [
      { id: 'opt-3-1', name: 'Classic Sourdough Hand-Tossed', price: 0, isDefault: true, inStock: true },
      { id: 'opt-3-2', name: 'Cheese Burst Crust (+Mozzarella)', price: 85, isDefault: false, inStock: true },
      { id: 'opt-3-3', name: 'Thin & Crispy Roman Crust', price: 30, isDefault: false, inStock: true },
    ],
  },
  {
    id: 'mg-4',
    name: 'Cooking Style & Spice Level',
    description: 'Chef preparation heat preference',
    minSelection: 1,
    maxSelection: 1,
    isMultiSelect: false,
    applicableCategoryIds: ['cat-2', 'cat-3'],
    options: [
      { id: 'opt-4-1', name: 'Mild (Child Friendly)', price: 0, isDefault: false, inStock: true },
      { id: 'opt-4-2', name: 'Medium Spicy (Chef Recommended)', price: 0, isDefault: true, inStock: true },
      { id: 'opt-4-3', name: 'Extra Hot & Fire Chilli', price: 0, isDefault: false, inStock: true },
    ],
  },
];

export const ModifierManagement: React.FC = () => {
  const { categories = [], menuItems = [] } = useRestaurant();

  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(() => {
    const saved = localStorage.getItem('royalpos_modifier_groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_MODIFIER_GROUPS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ModifierGroup>(modifierGroups[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Simulator state
  const [simSelectedOptions, setSimSelectedOptions] = useState<{ [groupId: string]: string[] }>({
    'mg-1': ['opt-1-1'],
    'mg-2': ['opt-2-1'],
    'mg-3': ['opt-3-1'],
    'mg-4': ['opt-4-2'],
  });

  // Modal Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formMin, setFormMin] = useState(0);
  const [formMax, setFormMax] = useState(1);
  const [formMulti, setFormMulti] = useState(false);
  const [formOptions, setFormOptions] = useState<ModifierOption[]>([
    { id: 'opt-new-1', name: '', price: 0, inStock: true },
  ]);
  const [formCategories, setFormCategories] = useState<string[]>([]);

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setFormName('');
    setFormDesc('');
    setFormMin(0);
    setFormMax(1);
    setFormMulti(false);
    setFormOptions([
      { id: `opt-${Date.now()}-1`, name: 'Regular Choice', price: 0, inStock: true, isDefault: true },
      { id: `opt-${Date.now()}-2`, name: 'Large / Premium', price: 50, inStock: true },
    ]);
    setFormCategories(categories.slice(0, 1).map((c) => c.id));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: ModifierGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormDesc(group.description || '');
    setFormMin(group.minSelection);
    setFormMax(group.maxSelection);
    setFormMulti(group.isMultiSelect);
    setFormOptions(group.options);
    setFormCategories(group.applicableCategoryIds);
    setIsModalOpen(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const validOptions = formOptions.filter((o) => o.name.trim().length > 0);

    if (editingGroup) {
      const updated: ModifierGroup = {
        ...editingGroup,
        name: formName,
        description: formDesc,
        minSelection: formMin,
        maxSelection: formMax,
        isMultiSelect: formMulti,
        options: validOptions,
        applicableCategoryIds: formCategories,
      };
      setModifierGroups((prev) => prev.map((g) => (g.id === editingGroup.id ? updated : g)));
      setSelectedGroup(updated);
      setStatusMessage(`Modifier group "${formName}" updated successfully!`);
    } else {
      const newGroup: ModifierGroup = {
        id: `mg-${Date.now()}`,
        name: formName,
        description: formDesc,
        minSelection: formMin,
        maxSelection: formMax,
        isMultiSelect: formMulti,
        options: validOptions,
        applicableCategoryIds: formCategories,
      };
      setModifierGroups((prev) => [...prev, newGroup]);
      setSelectedGroup(newGroup);
      setStatusMessage(`New modifier group "${formName}" created!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm('Are you sure you want to delete this modifier group?')) {
      const next = modifierGroups.filter((g) => g.id !== id);
      setModifierGroups(next);
      if (selectedGroup.id === id && next.length > 0) {
        setSelectedGroup(next[0]);
      }
      setStatusMessage('Modifier group removed.');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Toggle option in live simulator
  const handleSimToggleOption = (group: ModifierGroup, optId: string) => {
    setSimSelectedOptions((prev) => {
      const current = prev[group.id] || [];
      if (!group.isMultiSelect) {
        return { ...prev, [group.id]: [optId] };
      } else {
        if (current.includes(optId)) {
          return { ...prev, [group.id]: current.filter((id) => id !== optId) };
        } else {
          if (current.length >= group.maxSelection) {
            return prev;
          }
          return { ...prev, [group.id]: [...current, optId] };
        }
      }
    });
  };

  const filteredGroups = modifierGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate live simulator price for sample dish (Base ₹220)
  const baseDishPrice = 220;
  let modifierExtraPrice = 0;
  modifierGroups.forEach((group) => {
    const selectedIds = simSelectedOptions[group.id] || [];
    selectedIds.forEach((id) => {
      const opt = group.options.find((o) => o.id === id);
      if (opt) modifierExtraPrice += opt.price;
    });
  });

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Item Modifiers, Add-ons &amp; Recipe Variations
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                RoyalPOS Add-on Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure modifier groups, extra cheese/toppings, size variations, cooking instructions, and add-on pricing across menu categories.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-600/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Modifier Group</span>
        </button>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {/* Main Split Grid: Modifier Groups List & Live POS Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Groups List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Active Modifier Groups ({filteredGroups.length})
            </h4>
            <div className="w-56 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search modifiers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredGroups.map((group) => {
              const isCurrent = selectedGroup?.id === group.id;

              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {group.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            group.isMultiSelect
                              ? 'bg-sky-500/15 text-sky-600'
                              : 'bg-indigo-500/15 text-indigo-600'
                          }`}
                        >
                          {group.isMultiSelect ? 'Multi-Select (Checkbox)' : 'Single-Select (Radio)'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Min: {group.minSelection} | Max: {group.maxSelection}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(group)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Modifier Group"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Modifier Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options Pills */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {group.options.map((opt) => (
                      <span
                        key={opt.id}
                        className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <span>{opt.name}</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {opt.price > 0 ? `+${formatCurrency(opt.price)}` : 'Free'}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live POS Interactive Modifier Preview */}
        <div className="lg:col-span-5 space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-500" />
            <span>Live POS Terminal Simulator</span>
          </h4>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  ☕
                </div>
                <div>
                  <div className="font-black text-xs text-slate-900 dark:text-white">
                    Sample Item: Caffe Latte
                  </div>
                  <div className="text-[11px] text-slate-500">Base Price: {formatCurrency(baseDishPrice)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total with Add-ons</div>
                <div className="text-base font-black text-amber-600">
                  {formatCurrency(baseDishPrice + modifierExtraPrice)}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Cashiers and online customers click these options when ringing up an order:
            </p>

            {/* Render interactive groups */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {modifierGroups.map((group) => {
                const selectedIds = simSelectedOptions[group.id] || [];

                return (
                  <div
                    key={group.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {group.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {group.isMultiSelect ? 'Pick multiple' : 'Choose 1'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {group.options.map((opt) => {
                        const isChosen = selectedIds.includes(opt.id);

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSimToggleOption(group, opt.id)}
                            className={`p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between border cursor-pointer ${
                              isChosen
                                ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className={`w-3.5 h-3.5 rounded-${
                                  group.isMultiSelect ? 'md' : 'full'
                                } border flex items-center justify-center ${
                                  isChosen
                                    ? 'bg-white text-amber-600 border-white'
                                    : 'border-slate-400'
                                }`}
                              >
                                {isChosen && <Check className="w-2.5 h-2.5" />}
                              </span>
                              <span className="truncate">{opt.name}</span>
                            </div>
                            <span
                              className={`text-[11px] font-black shrink-0 ml-1 ${
                                isChosen ? 'text-white' : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {opt.price > 0 ? `+₹${opt.price}` : 'Free'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modifier Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {editingGroup ? 'Edit Modifier Group' : 'Create Modifier Group'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cheese &amp; Crust Options"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Guidance shown on cashier terminal and digital menu"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selection Style
                  </label>
                  <select
                    value={formMulti ? 'multi' : 'single'}
                    onChange={(e) => setFormMulti(e.target.value === 'multi')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="single">Single-Choice (Radio)</option>
                    <option value="multi">Multiple-Choice (Checkbox)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Min Pick</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formMin}
                      onChange={(e) => setFormMin(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Pick</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formMax}
                      onChange={(e) => setFormMax(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Options Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Modifier Choice Options
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormOptions([
                        ...formOptions,
                        { id: `opt-${Date.now()}`, name: '', price: 0, inStock: true },
                      ])
                    }
                    className="text-amber-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Choice
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Option Name (e.g. Extra Mozzarella)"
                        value={opt.name}
                        onChange={(e) => {
                          const copy = [...formOptions];
                          copy[idx].name = e.target.value;
                          setFormOptions(copy);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                      />
                      <div className="w-28 flex items-center gap-1">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          placeholder="Price"
                          value={opt.price}
                          onChange={(e) => {
                            const copy = [...formOptions];
                            copy[idx].price = parseFloat(e.target.value) || 0;
                            setFormOptions(copy);
                          }}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-amber-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormOptions(formOptions.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-md"
                >
                  Save Modifier Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
