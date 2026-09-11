import { Check, Flame, Percent, RefreshCw, RotateCw, Sparkles, Tag, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Coupon } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  currentDiscount: number;
  onApplyDiscount: (amount: number, reason: string) => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  currentDiscount,
  onApplyDiscount,
}) => {
  const { coupons, syncCatalogFromAdmin, isCatalogSyncing, catalogManifest } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'offers' | 'manual'>('offers');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [reason, setReason] = useState<string>('Manager Discretion / Promo');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const numVal = parseFloat(discountValue) || 0;
  const calculatedDiscount =
    discountType === 'percent'
      ? Math.min(subtotal, (subtotal * numVal) / 100)
      : Math.min(subtotal, numVal);

  const handleApplyManual = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyDiscount(calculatedDiscount, reason);
    onClose();
  };

  const handleApplyCoupon = (coupon: Coupon) => {
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    if (coupon.maxDiscountCap && coupon.maxDiscountCap > 0) {
      discount = Math.min(discount, coupon.maxDiscountCap);
    }

    discount = Math.min(subtotal, Math.round(discount));
    onApplyDiscount(discount, `Offer: ${coupon.code} (${coupon.title})`);
    onClose();
  };

  const handlePresetPercent = (pct: number) => {
    setDiscountType('percent');
    setDiscountValue(pct.toString());
  };

  const handleSyncOffers = async () => {
    try {
      const res = await syncCatalogFromAdmin(true);
      setSyncNotice(`Synced ${res.couponsCount} active offers from Admin!`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch {
      setSyncNotice('Sync failed.');
    }
  };

  const activeCoupons = coupons.filter((c) => c.isActive);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">Apply Bill Discount & Offers [F4]</h3>
              <span className="text-[10px] text-slate-400">
                Synced Admin Offers • Local Cache {catalogManifest.version}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtotal Banner */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">Bill Subtotal:</span>
          <span className="text-slate-900 dark:text-white text-base font-black">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'offers'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Admin Offers ({activeCoupons.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'manual'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Custom / Manual Discount</span>
          </button>

          <button
            type="button"
            onClick={handleSyncOffers}
            disabled={isCatalogSyncing}
            className="ml-auto text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 pb-2 cursor-pointer disabled:opacity-50"
            title="Fetch latest promotional offers from Admin"
          >
            <RotateCw className={`w-3 h-3 ${isCatalogSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Offers</span>
          </button>
        </div>

        {syncNotice && (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            {syncNotice}
          </div>
        )}

        {/* Tab 1: Synced Admin Offers */}
        {activeTab === 'offers' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {activeCoupons.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                <Tag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p>No active offers found on this terminal.</p>
                <button
                  type="button"
                  onClick={handleSyncOffers}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold"
                >
                  Sync from Admin
                </button>
              </div>
            ) : (
              activeCoupons.map((coupon) => {
                const isApplicable = subtotal >= (coupon.minOrderValue || 0);
                const discountEstimated =
                  coupon.discountType === 'percentage'
                    ? Math.min(
                        coupon.maxDiscountCap || Infinity,
                        (subtotal * coupon.discountValue) / 100
                      )
                    : coupon.discountValue;

                return (
                  <div
                    key={coupon.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isApplicable
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 hover:border-amber-400'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs tracking-wide bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700/60">
                          {coupon.code}
                        </span>
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} FLAT OFF`}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {coupon.title}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {coupon.minOrderValue ? `Min Bill: ₹${coupon.minOrderValue}` : 'No minimum'}
                        {coupon.maxDiscountCap ? ` • Max Cap: ₹${coupon.maxDiscountCap}` : ''}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isApplicable ? (
                        <div className="space-y-1">
                          <div className="text-[11px] font-black text-emerald-600">
                            Save ~{formatCurrency(discountEstimated)}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon(coupon)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Apply</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          Add ₹{(coupon.minOrderValue || 0) - subtotal} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Custom / Manual Form */}
        {activeTab === 'manual' && (
          <form onSubmit={handleApplyManual} className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`py-2 text-xs font-extrabold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  discountType === 'percent'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Percent className="w-4 h-4" />
                <span>Percentage (%)</span>
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('flat')}
                className={`py-2 text-xs font-extrabold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  discountType === 'flat'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>₹ Flat Cash Off</span>
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Quick Presets</label>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePresetPercent(pct)}
                    className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition-colors text-center cursor-pointer"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Discount Value {discountType === 'percent' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                min="0"
                max={discountType === 'percent' ? 100 : subtotal}
                step="any"
                autoFocus
                required
                placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 50'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-amber-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Reason / Remark
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-between text-xs font-bold">
              <span className="text-amber-800 dark:text-amber-300">Total Deducted:</span>
              <span className="text-amber-600 text-sm font-black">
                -{formatCurrency(calculatedDiscount)}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply Custom Discount</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          {currentDiscount > 0 ? (
            <button
              type="button"
              onClick={() => {
                onApplyDiscount(0, '');
                onClose();
              }}
              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Remove Discount
            </button>
          ) : (
            <span className="text-slate-400 text-[11px]">No active discount on bill</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Close (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
