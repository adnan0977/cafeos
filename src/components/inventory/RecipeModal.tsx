import { Check, DollarSign, Plus, Sparkles, Trash2, Utensils, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Recipe, RecipeIngredient, UnitOfMeasure } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  const { menuItems, ingredients, saveRecipe, settings } = useRestaurant();

  const [menuItemId, setMenuItemId] = useState<string>(recipe?.menuItemId || menuItems[0]?.id || 'item-1');
  const [servingSize, setServingSize] = useState<number>(recipe?.servingSize || 1);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(recipe?.prepTimeMinutes || 5);
  const [instructions, setInstructions] = useState<string>(
    recipe?.instructions?.join('\n') || '1. Grind fresh coffee beans\n2. Extract double shot espresso\n3. Steam milk to 65C\n4. Pour latte art'
  );

  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>(
    recipe?.ingredients || [
      {
        ingredientId: ingredients[0]?.id || 'ing-1',
        ingredientName: ingredients[0]?.name || 'Coffee Beans',
        quantity: 0.018,
        unit: 'kg',
        cost: (ingredients[0]?.costPerUnit || 950) * 0.018,
      },
    ]
  );

  const selectedMenuItem = menuItems.find((m) => m.id === menuItemId);

  // Recalculate cost when quantities change
  const handleIngredientChange = (index: number, ingId: string, qty: number, unit: UnitOfMeasure) => {
    const ing = ingredients.find((i) => i.id === ingId);
    if (!ing) return;

    // Convert units roughly if needed (kg vs g, ltr vs ml)
    let unitCostRatio = ing.costPerUnit;
    if (ing.unit === 'kg' && unit === 'g') unitCostRatio = ing.costPerUnit / 1000;
    else if (ing.unit === 'ltr' && unit === 'ml') unitCostRatio = ing.costPerUnit / 1000;

    const cost = unitCostRatio * qty;

    const updated = [...recipeIngredients];
    updated[index] = {
      ingredientId: ing.id,
      ingredientName: ing.name,
      quantity: qty,
      unit,
      cost,
    };
    setRecipeIngredients(updated);
  };

  const handleAddIngredientRow = () => {
    const firstIng = ingredients[0];
    if (!firstIng) return;
    setRecipeIngredients([
      ...recipeIngredients,
      {
        ingredientId: firstIng.id,
        ingredientName: firstIng.name,
        quantity: 1,
        unit: firstIng.unit,
        cost: firstIng.costPerUnit,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const totalRecipeCost = recipeIngredients.reduce((sum, item) => sum + item.cost, 0);
  const sellingPrice = selectedMenuItem?.basePrice || 100;
  const foodCostPercent = sellingPrice > 0 ? (totalRecipeCost / sellingPrice) * 100 : 0;
  const profitMarginPercent = 100 - foodCostPercent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItem) return;

    const recipeData = {
      id: recipe?.id,
      menuItemId: selectedMenuItem.id,
      menuItemName: selectedMenuItem.name,
      servingSize,
      prepTimeMinutes,
      ingredients: recipeIngredients,
      totalCost: totalRecipeCost,
      instructions: instructions.split('\n').filter((l) => l.trim()),
    };

    saveRecipe(recipeData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Recipe & BOM (Bill of Materials) Builder
              </h3>
              <p className="text-xs text-slate-500">
                Link raw ingredients for automatic inventory consumption on billing
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
          {/* Target Dish & Pricing Margin Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Menu Item
              </label>
              <select
                value={menuItemId}
                onChange={(e) => setMenuItemId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              >
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({formatCurrency(item.basePrice)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Serving Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={servingSize}
                  onChange={(e) => setServingSize(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Prep Time (Mins)
                </label>
                <input
                  type="number"
                  min="1"
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>

          {/* Cost & Profit Margin Analysis Card */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">
                Menu Selling Price
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(sellingPrice, settings.currencySymbol)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300">
                Calculated Recipe Cost
              </div>
              <div className="text-base font-extrabold text-rose-600 mt-0.5">
                {formatCurrency(totalRecipeCost, settings.currencySymbol)}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                Food Cost: {foodCostPercent.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                Gross Profit Margin
              </div>
              <div className="text-base font-extrabold text-emerald-600 mt-0.5">
                {profitMarginPercent.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                Margin: {formatCurrency(sellingPrice - totalRecipeCost)}
              </div>
            </div>
          </div>

          {/* Recipe Ingredients / BOM Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Raw Ingredient Breakdown ({recipeIngredients.length})
              </label>
              <button
                type="button"
                onClick={handleAddIngredientRow}
                className="text-amber-600 font-bold text-xs flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-2">
              {recipeIngredients.map((row, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2"
                >
                  <select
                    value={row.ingredientId}
                    onChange={(e) =>
                      handleIngredientChange(
                        idx,
                        e.target.value,
                        row.quantity,
                        row.unit
                      )
                    }
                    className="flex-1 min-w-[150px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold"
                  >
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} (Stock: {ing.currentStock} {ing.unit})
                      </option>
                    ))}
                  </select>

                  <div className="w-24">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) =>
                        handleIngredientChange(
                          idx,
                          row.ingredientId,
                          parseFloat(e.target.value) || 0,
                          row.unit
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
                    />
                  </div>

                  <select
                    value={row.unit}
                    onChange={(e) =>
                      handleIngredientChange(
                        idx,
                        row.ingredientId,
                        row.quantity,
                        e.target.value as UnitOfMeasure
                      )
                    }
                    className="w-20 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="ltr">ltr</option>
                    <option value="pcs">pcs</option>
                    <option value="portion">portion</option>
                  </select>

                  <div className="w-20 text-right font-extrabold text-slate-800 dark:text-slate-200">
                    {formatCurrency(row.cost)}
                  </div>

                  {recipeIngredients.length > 1 && (
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

          {/* Preparation Instructions */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chef / Barista SOP Instructions (Step by step)
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
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
              Save Recipe & BOM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
