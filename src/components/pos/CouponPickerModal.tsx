import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Percent,
  Sparkles,
  Tag,
  X,
  Zap,
} from 'lucide-react';
import { Coupon, CouponValidationResult, OrderItem, OrderType } from '../../types';
import {
  CouponValidationContext,
  findCouponByCode,
  getEligibleCoupons,
  validateAndCalculateCoupon,
} from '../../utils/couponUtils';
import { formatCurrency } from '../../utils/formatters';

interface CouponPickerModalProps {
  coupons: Coupon[];
  items: OrderItem[];
  subtotal: number;
  orderType: OrderType;
  customerPhone?: string;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon, calculatedDiscount: number) => void;
  onRemoveCoupon: () => void;
  onClose: () => void;
  currencySymbol?: string;
}

export const CouponPickerModal: React.FC<CouponPickerModalProps> = ({
  coupons,
  items,
  subtotal,
  orderType,
  customerPhone,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onClose,
  currencySymbol = '₹',
}) => {
  const [customCode, setCustomCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const context: CouponValidationContext = {
    subtotal,
    items,
    orderType,
    customerPhone,
  };

  const evaluatedCoupons = getEligibleCoupons(coupons, context);
  const eligibleCoupons = evaluatedCoupons.filter((c) => c.validation.isValid);
  const ineligibleCoupons = evaluatedCoupons.filter((c) => !c.validation.isValid);

  const handleApplyCustomCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) {
      setInputError('Please enter a coupon code.');
      return;
    }

    const found = findCouponByCode(coupons, customCode);
    if (!found) {
      setInputError(`Coupon code "${customCode.toUpperCase()}" is invalid or does not exist.`);
      return;
    }

    const result = validateAndCalculateCoupon(found, context);
    if (!result.isValid) {
      setInputError(result.reason || 'This coupon cannot be applied to the current cart.');
      return;
    }

    setInputError(null);
    onApplyCoupon(found, result.calculatedDiscount);
    onClose();
  };

  const handleSelectCoupon = (coupon: Coupon, validation: CouponValidationResult) => {
    if (!validation.isValid) return;
    onApplyCoupon(coupon, validation.calculatedDiscount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Apply Coupon or Promo Offer
              </h3>
              <p className="text-xs text-slate-500">
                Cart Value: {formatCurrency(subtotal, currencySymbol)} • {items.length} items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Custom Promo Code Input Box */}
          <form onSubmit={handleApplyCustomCode} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Promo Code (e.g. WELCOME20)"
                  value={customCode}
                  onChange={(e) => {
                    setCustomCode(e.target.value.toUpperCase());
                    setInputError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
              >
                Apply Code
              </button>
            </div>

            {inputError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inputError}</span>
              </div>
            )}
          </form>

          {/* Currently Applied Coupon Bar */}
          {appliedCoupon && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="font-mono font-black text-xs text-emerald-800 dark:text-emerald-300">
                    {appliedCoupon.code} Applied
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {appliedCoupon.title}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onRemoveCoupon();
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          )}

          {/* Section 1: Eligible Offers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Available & Eligible Offers ({eligibleCoupons.length})</span>
            </h4>

            {eligibleCoupons.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                No automatic coupons are directly eligible for this exact cart total or channel. Check minimum requirements below.
              </div>
            ) : (
              <div className="space-y-2.5">
                {eligibleCoupons.map(({ coupon, validation }) => {
                  const isSelected = appliedCoupon?.id === coupon.id;

                  return (
                    <div
                      key={coupon.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                              {coupon.code}
                            </span>
                            {coupon.tag && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                                {coupon.tag}
                              </span>
                            )}
                          </div>

                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {coupon.title}
                          </p>

                          {coupon.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {coupon.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-0.5">
                            {coupon.minOrderValue > 0 && (
                              <span>Min spend: {formatCurrency(coupon.minOrderValue, currencySymbol)}</span>
                            )}
                            {coupon.maxDiscountCap && (
                              <span>• Max cap: {formatCurrency(coupon.maxDiscountCap, currencySymbol)}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                          <div className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                            Save {formatCurrency(validation.calculatedDiscount, currencySymbol)}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectCoupon(coupon, validation)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Applied</span>
                              </>
                            ) : (
                              <span>Apply</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Ineligible / Locked Offers */}
          {ineligibleCoupons.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Other Campaigns ({ineligibleCoupons.length})</span>
              </h4>

              <div className="space-y-2">
                {ineligibleCoupons.map(({ coupon, validation }) => (
                  <div
                    key={coupon.id}
                    className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-75"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {coupon.code}
                          </span>
                          <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                            {coupon.title}
                          </span>
                        </div>

                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{validation.reason}</span>
                        </p>
                      </div>

                      {coupon.minOrderValue > subtotal && (
                        <span className="text-[10px] text-slate-500 font-semibold shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          Add {formatCurrency(coupon.minOrderValue - subtotal, currencySymbol)} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
