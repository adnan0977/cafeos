import React, { useState } from 'react';
import { Utensils, Search, Plus, Minus, ShoppingBag, Sparkles, CheckCircle2, ChevronRight, Star, Heart, Flame, Leaf } from 'lucide-react';
import { MenuItem, Category, Order } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CustomerDigitalMenuProps {
  menuItems: MenuItem[];
  categories: Category[];
  currencySymbol: string;
  onPlaceOrder?: (orderData: Partial<Order>) => void;
  tableNumber?: string;
}

export const CustomerDigitalMenu: React.FC<CustomerDigitalMenuProps> = ({
  menuItems = [],
  categories = [],
  currencySymbol = '₹',
  onPlaceOrder,
  tableNumber = 'Table 4',
}) => {
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const filteredItems = safeMenuItems.filter((item) => {
    if (!item.isAvailable) return false;
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
    if (vegOnly && item.foodType !== 'veg' && item.foodType !== 'vegan') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const cartItemCount = (Object.values(cart) as number[]).reduce((sum: number, qty: number) => sum + qty, 0);
  const cartSubtotal = (Object.entries(cart) as [string, number][]).reduce((sum: number, [itemId, qty]: [string, number]) => {
    const item = safeMenuItems.find((m) => m.id === itemId);
    return sum + (item ? item.finalPrice * qty : 0);
  }, 0);

  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: ((prev[itemId] as number) || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      const current = (next[itemId] as number) || 0;
      if (current > 1) {
        next[itemId] = current - 1;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const handleCheckout = () => {
    if (cartItemCount === 0) return;
    const orderItems = (Object.entries(cart) as [string, number][]).map(([itemId, qty]) => {
      const item = safeMenuItems.find((m) => m.id === itemId)!;
      const quantity = qty as number;
      return {
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        menuItemId: item.id,
        name: item.name,
        foodType: item.foodType,
        basePrice: item.finalPrice,
        unitPrice: item.finalPrice,
        quantity,
        modifiers: [],
        taxPercent: item.taxPercent || 5,
        taxAmount: (item.finalPrice * (item.taxPercent || 5) * quantity) / 100,
        totalAmount: item.finalPrice * quantity,
      };
    });

    const subtotal = cartSubtotal;
    const taxAmount = (subtotal * 5) / 100;
    const grandTotal = subtotal + taxAmount;

    if (onPlaceOrder) {
      onPlaceOrder({
        orderType: 'dine_in',
        tableName: tableNumber,
        customerName: customerName || 'QR Guest',
        customerPhone: customerPhone || undefined,
        items: orderItems,
        subtotal,
        taxAmount,
        grandTotal,
        paymentStatus: 'pending',
        status: 'kot_generated',
      });
    }

    setOrderSuccess(true);
    setCart({});
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital QR Self-Ordering • {tableNumber}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome to the Interactive Dining Menu
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-1">
            Browse handcrafted specialties, authentic stone-baked pizzas, and beverages with instant KOT kitchen dispatch!
          </p>
        </div>
      </div>

      {orderSuccess && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <div className="font-bold text-sm">Order sent directly to Kitchen Display!</div>
              <div className="text-xs text-emerald-100">Our chefs are preparing your delicious food for {tableNumber}.</div>
            </div>
          </div>
          <button
            onClick={() => setOrderSuccess(false)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold"
          >
            Order More
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Delicacies
          </button>
          {safeCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              vegOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-500" />
            <span>Veg Only</span>
          </button>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search dish or beverage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const qty = cart[item.id] || 0;
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                          item.foodType === 'veg' || item.foodType === 'vegan'
                            ? 'border-emerald-600'
                            : 'border-rose-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.foodType === 'veg' || item.foodType === 'vegan'
                              ? 'bg-emerald-600'
                              : 'bg-rose-600'
                          }`}
                        />
                      </span>
                      {item.isPopular && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                          ⭐ Chef Special
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {item.name}
                    </h3>
                  </div>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400 shrink-0">
                    {formatCurrency(item.finalPrice, currencySymbol)}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.description}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Prep ~{item.prepTimeMinutes || 12} mins
                </span>

                {qty > 0 ? (
                  <div className="flex items-center gap-2 bg-amber-600 text-white rounded-xl p-1 shadow-xs">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-amber-700 rounded-lg"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-xs px-2">{qty}</span>
                    <button
                      onClick={() => addToCart(item.id)}
                      className="p-1 hover:bg-amber-700 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item.id)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div className="sticky bottom-4 z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm">
                {cartItemCount} items selected for {tableNumber}
              </div>
              <div className="text-xs text-amber-400 font-bold">
                Total: {formatCurrency(cartSubtotal, currencySymbol)} (+5% GST)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Your Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            />
            <button
              onClick={handleCheckout}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg whitespace-nowrap"
            >
              <span>Confirm & Dispatch KOT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
