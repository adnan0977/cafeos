import { Check, Plus, Utensils, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, MenuModifier, MenuVariant, OrderItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ModifierSelectorModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (orderItem: OrderItem) => void;
}

export const ModifierSelectorModal: React.FC<ModifierSelectorModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const { modifiers, settings } = useRestaurant();

  if (!item) return null;

  // Selected variant (default to first variant if exists)
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | null>(
    item.variants && item.variants.length > 0 ? item.variants[0] : null
  );

  // Selected modifiers
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Available modifiers for this item
  const availableModifiers = modifiers.filter((m) =>
    item.modifierIds.includes(m.id)
  );

  const toggleModifier = (modId: string) => {
    if (selectedModifierIds.includes(modId)) {
      setSelectedModifierIds(selectedModifierIds.filter((id) => id !== modId));
    } else {
      setSelectedModifierIds([...selectedModifierIds, modId]);
    }
  };

  // Base unit price calculation
  const basePrice = selectedVariant ? selectedVariant.price : item.basePrice;
  const modifiersPrice = selectedModifierIds.reduce((sum, modId) => {
    const mod = modifiers.find((m) => m.id === modId);
    return sum + (mod ? mod.price : 0);
  }, 0);

  const unitPrice = basePrice + modifiersPrice;
  const subtotal = unitPrice * quantity;
  const taxAmount = (subtotal * item.taxPercent) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleAdd = () => {
    const chosenModifiers = selectedModifierIds
      .map((id) => modifiers.find((m) => m.id === id))
      .filter((m): m is MenuModifier => Boolean(m))
      .map((m) => ({
        modifierId: m.id,
        name: m.name,
        price: m.price,
      }));

    const orderItem: OrderItem = {
      id: `ord-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      menuItemId: item.id,
      name: item.name,
      foodType: item.foodType,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      basePrice: basePrice,
      unitPrice: unitPrice,
      quantity: quantity,
      modifiers: chosenModifiers,
      notes: notes.trim() || undefined,
      taxPercent: item.taxPercent,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
    };

    onAddToCart(orderItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8">
        {/* Header with image */}
        <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-3 h-3 rounded-full border-2 border-white ${
                  item.foodType === 'veg'
                    ? 'bg-emerald-500'
                    : item.foodType === 'vegan'
                    ? 'bg-teal-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-200">
                {item.foodType}
              </span>
            </div>
            <h3 className="font-extrabold text-lg sm:text-xl leading-tight">
              {item.name}
            </h3>
            <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
              {item.description}
            </p>
          </div>
        </div>

        {/* Configuration Body */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-5">
          {/* Variants Selection */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Choose Size / Portion
              </label>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{v.name}</div>
                      <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                        {formatCurrency(v.price, settings.currencySymbol)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons & Modifiers Selection */}
          {availableModifiers.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Add-ons & Customizations
              </label>
              <div className="space-y-1.5">
                {availableModifiers.map((mod) => {
                  const isChecked = selectedModifierIds.includes(mod.id);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => toggleModifier(mod.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-semibold">{mod.name}</span>
                      </div>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        +{formatCurrency(mod.price, settings.currencySymbol)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen / Bar Preparation Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Special Instructions / Allergy Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Less spicy, oat milk hot, no garlic"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Quantity:
            </span>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center hover:bg-slate-200 shadow-xs"
              >
                -
              </button>
              <span className="w-6 text-center font-extrabold text-sm text-slate-900 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center hover:bg-slate-200 shadow-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer Add button */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total with Taxes</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(totalAmount, settings.currencySymbol)}
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Order Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
