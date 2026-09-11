import {
  AlertTriangle,
  Boxes,
  Building2,
  Calculator,
  Check,
  ChevronRight,
  DollarSign,
  HelpCircle,
  Info,
  Layers,
  Sparkles,
  Store,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Ingredient } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  PURCHASE_UNITS,
  STOCK_UNITS,
  getDefaultConversion,
  normalizePurchaseUnit,
  normalizeStockUnit,
} from '../../utils/unitConversionUtils';

interface IngredientModalProps {
  ingredient: Ingredient | null;
  onClose: () => void;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({ ingredient, onClose }) => {
  const { addIngredient, updateIngredient, suppliers, ingredients } = useRestaurant();

  // Basic Information
  const [name, setName] = useState(ingredient?.name || '');
  const [sku, setSku] = useState(
    (ingredient as any)?.sku ||
      (ingredient?.id ? ingredient.id.replace('ing-', 'SKU-').toUpperCase() : '')
  );
  const [category, setCategory] = useState(ingredient?.category || 'Dairy & Refrigerated');
  const [supplierId, setSupplierId] = useState(
    ingredient?.supplierId || suppliers[0]?.id || 'SUP-0001'
  );
  const [storageLocation, setStorageLocation] = useState(
    ingredient?.storageLocation || 'Main Store'
  );

  // Unit Management
  const initialPurchaseUnit = ingredient?.purchaseUnit
    ? normalizePurchaseUnit(ingredient.purchaseUnit)
    : 'Tray';
  const initialStockUnit = ingredient?.unit
    ? normalizeStockUnit(ingredient.unit)
    : 'Piece';

  const [purchaseUnit, setPurchaseUnit] = useState<string>(initialPurchaseUnit);
  const [stockUnit, setStockUnit] = useState<string>(initialStockUnit);
  const [conversionFactor, setConversionFactor] = useState<string>(
    ingredient?.conversionFactor?.toString() ||
      getDefaultConversion(initialPurchaseUnit, initialStockUnit).toString()
  );

  // Opening Stock (in Purchase Units for Add form)
  const [openingPurchaseQty, setOpeningPurchaseQty] = useState<string>('5');

  // For Edit: existing stock in Stock Units (preserved by default)
  const [currentStockUnits, setCurrentStockUnits] = useState<string>(
    ingredient?.currentStock !== undefined ? ingredient.currentStock.toString() : '0'
  );
  const [allowManualStockOverride, setAllowManualStockOverride] = useState<boolean>(false);

  // Stock Thresholds (in Stock / Consumption Units)
  const [minStock, setMinStock] = useState<string>(
    ingredient?.minStock !== undefined ? ingredient.minStock.toString() : '10'
  );
  const [targetStock, setTargetStock] = useState<string>(
    (ingredient?.targetStock ?? ingredient?.maxStock ?? 50).toString()
  );

  // Costing
  // Cost per purchase unit (e.g. ₹150 / Tray) or Cost per stock unit (e.g. ₹5 / Piece)
  const initialCostPerUnit = ingredient?.costPerUnit ?? 5;
  const initialConv = ingredient?.conversionFactor ?? 1;
  const initialPurchaseCost =
    (ingredient as any)?.purchaseCost ?? (initialCostPerUnit * initialConv);

  const [purchaseCost, setPurchaseCost] = useState<string>(initialPurchaseCost.toString());
  const [costPerStockUnit, setCostPerStockUnit] = useState<string>(initialCostPerUnit.toString());

  // Auto-generate SKU when name changes if SKU is empty
  useEffect(() => {
    if (!ingredient && name.trim() && !sku) {
      const cleanPrefix = name
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      setSku(`${cleanPrefix || 'ITM'}${randomNum}`);
    }
  }, [name, ingredient, sku]);

  // Handle Purchase Unit change
  const handlePurchaseUnitChange = (newPUnit: string) => {
    setPurchaseUnit(newPUnit);
    // Suggest default conversion factor
    const suggestedConv = getDefaultConversion(newPUnit, stockUnit);
    setConversionFactor(suggestedConv.toString());

    // Update stock unit cost if purchase cost exists
    const pCostNum = parseFloat(purchaseCost) || 0;
    if (pCostNum > 0 && suggestedConv > 0) {
      setCostPerStockUnit((pCostNum / suggestedConv).toFixed(2));
    }
  };

  // Handle Stock Unit change
  const handleStockUnitChange = (newSUnit: string) => {
    setStockUnit(newSUnit);
    const suggestedConv = getDefaultConversion(purchaseUnit, newSUnit);
    setConversionFactor(suggestedConv.toString());

    const pCostNum = parseFloat(purchaseCost) || 0;
    if (pCostNum > 0 && suggestedConv > 0) {
      setCostPerStockUnit((pCostNum / suggestedConv).toFixed(2));
    }
  };

  // Handle Conversion Factor change
  const handleConversionChange = (val: string) => {
    setConversionFactor(val);
    const convNum = parseFloat(val) || 1;
    const pCostNum = parseFloat(purchaseCost) || 0;
    if (pCostNum > 0 && convNum > 0) {
      setCostPerStockUnit((pCostNum / convNum).toFixed(2));
    }
  };

  // Handle Purchase Cost change -> auto calculate stock unit cost
  const handlePurchaseCostChange = (val: string) => {
    setPurchaseCost(val);
    const pCostNum = parseFloat(val) || 0;
    const convNum = parseFloat(conversionFactor) || 1;
    if (convNum > 0) {
      setCostPerStockUnit((pCostNum / convNum).toFixed(2));
    }
  };

  // Handle Stock Unit Cost change -> auto calculate purchase cost
  const handleStockCostChange = (val: string) => {
    setCostPerStockUnit(val);
    const sCostNum = parseFloat(val) || 0;
    const convNum = parseFloat(conversionFactor) || 1;
    setPurchaseCost((sCostNum * convNum).toFixed(2));
  };

  // Calculate opening stock in stock units for Add mode
  const convNum = parseFloat(conversionFactor) || 1;
  const openQtyNum = parseFloat(openingPurchaseQty) || 0;
  const calculatedOpeningStockInUnits = openQtyNum * convNum;

  // Check if conversion was modified in edit mode
  const isConversionChanged = useMemo(() => {
    if (!ingredient) return false;
    const originalConv = ingredient.conversionFactor || 1;
    const currentConv = parseFloat(conversionFactor) || 1;
    const originalPUnit = normalizePurchaseUnit(ingredient.purchaseUnit);
    const currentPUnit = normalizePurchaseUnit(purchaseUnit);
    const originalSUnit = normalizeStockUnit(ingredient.unit);
    const currentSUnit = normalizeStockUnit(stockUnit);

    return (
      originalConv !== currentConv ||
      originalPUnit !== currentPUnit ||
      originalSUnit !== currentSUnit
    );
  }, [ingredient, conversionFactor, purchaseUnit, stockUnit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === supplierId);
    const parsedConv = Math.max(0.0001, parseFloat(conversionFactor) || 1);
    const parsedMinStock = Math.max(0, parseFloat(minStock) || 0);
    const parsedTargetStock = Math.max(parsedMinStock, parseFloat(targetStock) || parsedMinStock * 2);
    const parsedCostPerStockUnit = parseFloat(costPerStockUnit) || 0;
    const parsedPurchaseCost = parseFloat(purchaseCost) || (parsedCostPerStockUnit * parsedConv);

    if (ingredient) {
      // EDIT MODE: Keep existing stock unless explicitly adjusted
      const finalStock = allowManualStockOverride
        ? Math.max(0, parseFloat(currentStockUnits) || 0)
        : ingredient.currentStock;

      const updatedIng: Partial<Ingredient> = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        category,
        unit: stockUnit, // Stock / Consumption Unit
        purchaseUnit, // Purchase Unit
        conversionFactor: parsedConv,
        supplierId,
        supplierName: sup?.name || ingredient.supplierName || 'Primary Supplier',
        costPerUnit: parsedCostPerStockUnit,
        purchaseCost: parsedPurchaseCost,
        currentStock: finalStock,
        minStock: parsedMinStock,
        reorderLevel: parsedMinStock,
        maxStock: parsedTargetStock,
        targetStock: parsedTargetStock,
        storageLocation: storageLocation.trim() || 'Main Store',
        isActive: true,
      };

      updateIngredient(ingredient.id, updatedIng);
    } else {
      // ADD MODE: Initialize current stock from opening stock calculation
      const finalOpeningStock = calculatedOpeningStockInUnits;

      const newIng: Omit<Ingredient, 'id'> = {
        name: name.trim(),
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        category,
        unit: stockUnit, // Stock / Consumption Unit
        purchaseUnit, // Purchase Unit
        conversionFactor: parsedConv,
        supplierId,
        supplierName: sup?.name || 'Primary Supplier',
        costPerUnit: parsedCostPerStockUnit,
        purchaseCost: parsedPurchaseCost,
        openingStock: finalOpeningStock,
        currentStock: finalOpeningStock,
        minStock: parsedMinStock,
        reorderLevel: parsedMinStock,
        maxStock: parsedTargetStock,
        targetStock: parsedTargetStock,
        storageLocation: storageLocation.trim() || 'Main Store',
        hasExpiry: false,
        isActive: true,
        branchId: 'branch-1',
      };

      addIngredient(newIng);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-500/10 via-slate-50 to-slate-50 dark:from-amber-950/20 dark:via-slate-800/80 dark:to-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                {ingredient ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ingredient
                  ? 'Update unit conversion, store location, and alert par levels'
                  : 'Configure purchase unit, consumption conversion, and opening stock'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* SECTION 1: Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Basic Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eggs, Sugar, French Fries, Nutella, Cheese Slices"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SKU / Item Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. EGG001, SUG001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white uppercase"
                  />
                  {!sku && (
                    <button
                      type="button"
                      onClick={() => {
                        const cleanPrefix = (name || 'ITM')
                          .trim()
                          .replace(/[^a-zA-Z0-9]/g, '')
                          .slice(0, 3)
                          .toUpperCase();
                        setSku(`${cleanPrefix || 'ITM'}${Math.floor(100 + Math.random() * 900)}`);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md hover:bg-amber-100"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Dairy & Refrigerated">Dairy & Refrigerated</option>
                  <option value="Sauces & Spices">Sauces & Spices</option>
                  <option value="Fresh Produce">Fresh Produce</option>
                  <option value="Dry Grocery">Dry Grocery</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Meat & Poultry">Meat & Poultry</option>
                  <option value="Beverages & Syrups">Beverages & Syrups</option>
                  <option value="Coffee & Beans">Coffee & Beans</option>
                  <option value="Frozen Food">Frozen Food</option>
                  <option value="Canned & Preserved">Canned & Preserved</option>
                  <option value="Packaging & Crockery">Packaging & Crockery</option>
                  <option value="General Store">General Store</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {sup.contactPerson ? `(${sup.contactPerson})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Store / Storage Location
                </label>
                <select
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Main Store">Main Store</option>
                  <option value="Kitchen Store">Kitchen Store</option>
                  <option value="Walk-in Chiller">Walk-in Chiller</option>
                  <option value="Deep Freezer">Deep Freezer</option>
                  <option value="Beverage Bar">Beverage Bar</option>
                  <option value="Bakery Pantry">Bakery Pantry</option>
                  <option value="Dry Storage Rack">Dry Storage Rack</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Unit Management & Conversion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Unit Management & Conversion</span>
              </div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg">
                Purchased in bulk → Consumed in units
              </span>
            </div>

            <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Purchase Unit */}
                <div>
                  <label className="block font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                    Purchase Unit (Supplier Unit)
                  </label>
                  <select
                    value={purchaseUnit}
                    onChange={(e) => handlePurchaseUnitChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-indigo-900 dark:text-indigo-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    {PURCHASE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400 mt-1">
                    Unit in which supplier delivers (e.g. Tray, Bag, Box, Packet)
                  </p>
                </div>

                {/* Stock / Consumption Unit */}
                <div>
                  <label className="block font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                    Stock / Consumption Unit (Internal)
                  </label>
                  <select
                    value={stockUnit}
                    onChange={(e) => handleStockUnitChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-indigo-900 dark:text-indigo-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    {STOCK_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400 mt-1">
                    Unit used in recipes, POS deductions & inventory counts
                  </p>
                </div>
              </div>

              {/* Conversion Rule Input Box */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                      <span>Conversion Rule:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        1 {purchaseUnit} =
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      How many {stockUnit}s are contained inside 1 {purchaseUnit}?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-black text-indigo-700 dark:text-indigo-300 text-sm">
                    1 {purchaseUnit} =
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    value={conversionFactor}
                    onChange={(e) => handleConversionChange(e.target.value)}
                    className="w-24 px-3 py-1.5 bg-indigo-50 dark:bg-slate-800 border-2 border-indigo-400 dark:border-indigo-600 rounded-lg text-center font-black text-sm text-indigo-900 dark:text-indigo-100 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="font-black text-slate-800 dark:text-slate-200 text-sm">
                    {stockUnit}s
                  </span>
                </div>
              </div>

              {/* Conversion changed warning (for Edit mode) */}
              {ingredient && isConversionChanged && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                    <strong>Notice:</strong> Changing the conversion may affect future stock purchases and consumption calculations. Existing stock will not be automatically changed.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Stock Management & Calculations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>{ingredient ? 'Current Stock Level' : 'Purchase / Opening Stock'}</span>
            </div>

            {!ingredient ? (
              /* ADD MODE: Opening Stock in Purchase Units -> Auto Calculates Stock Units */
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                  <div>
                    <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                      Opening Stock Purchase Quantity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={openingPurchaseQty}
                        onChange={(e) => setOpeningPurchaseQty(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl font-black text-sm text-emerald-900 dark:text-emerald-100 focus:ring-2 focus:ring-emerald-500 pr-16"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-emerald-700 dark:text-emerald-300">
                        {purchaseUnit}s
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                      Purchase Cost (₹ per {purchaseUnit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={purchaseCost}
                      onChange={(e) => handlePurchaseCostChange(e.target.value)}
                      placeholder={`e.g. 150`}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl font-bold text-emerald-900 dark:text-emerald-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Auto-Calculation Result Card */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    System Calculates:
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                      <span className="font-black text-emerald-700 dark:text-emerald-300">
                        {openingPurchaseQty || 0} {purchaseUnit}s
                      </span>{' '}
                      ×{' '}
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {conversionFactor} {stockUnit}s
                      </span>{' '}
                      ={' '}
                      <span className="font-black text-slate-900 dark:text-white">
                        {calculatedOpeningStockInUnits} {stockUnit}s
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-black text-xs shadow-xs">
                      Current Stock: {calculatedOpeningStockInUnits} {stockUnit}s
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Internal Cost Rate: <strong>₹{costPerStockUnit} / {stockUnit}</strong>
                    </span>
                    <span>
                      Total Opening Inventory Value:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(calculatedOpeningStockInUnits * (parseFloat(costPerStockUnit) || 0))}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* EDIT MODE: Existing Stock Display */
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Preserved Current Stock
                    </div>
                    <div className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{ingredient.currentStock} {stockUnit}s</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        (~{(ingredient.currentStock / (parseFloat(conversionFactor) || 1)).toFixed(1)} {purchaseUnit}s)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Existing stock is automatically maintained in {stockUnit}s and not reset.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAllowManualStockOverride(!allowManualStockOverride)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {allowManualStockOverride ? 'Cancel Adjustment' : 'Reconcile / Adjust Stock'}
                  </button>
                </div>

                {allowManualStockOverride && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 animate-in fade-in">
                    <label className="block font-bold text-rose-700 dark:text-rose-400 mb-1">
                      New Physical Stock Count ({stockUnit}s)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={currentStockUnits}
                        onChange={(e) => setCurrentStockUnits(e.target.value)}
                        className="w-40 px-3 py-2 bg-white dark:bg-slate-900 border-2 border-rose-400 rounded-xl font-bold text-rose-700 dark:text-rose-300"
                      />
                      <span className="font-bold text-slate-600 dark:text-slate-400">
                        {stockUnit}s
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cost Per Stock Unit (₹ / {stockUnit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={costPerStockUnit}
                      onChange={(e) => handleStockCostChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Cost (₹ / {purchaseUnit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={purchaseCost}
                      onChange={(e) => handlePurchaseCostChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Minimum Stock & Target Stock (Alert Configuration) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Minimum Stock & Par Alert Levels</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                Configured in {stockUnit}s
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Stock (Low Stock Alert Level)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl font-black text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500 pr-16"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-rose-600/80 dark:text-rose-400">
                    {stockUnit}s
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Triggers LOW STOCK warning when stock falls below this amount.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Stock (Ideal Par Level)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={targetStock}
                    onChange={(e) => setTargetStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 pr-16"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                    {stockUnit}s
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Target stock level used to auto-calculate purchase order quantities.
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{ingredient ? 'Update Inventory Item' : 'Save Inventory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
