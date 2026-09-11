import {
  Award,
  Banknote,
  CheckCircle,
  CreditCard,
  DollarSign,
  Gift,
  Plus,
  Printer,
  QrCode,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Coupon, Order, PaymentAllocation, PaymentMethod } from '../../types';
import { CouponValidationContext, validateAndCalculateCoupon } from '../../utils/couponUtils';
import { formatCurrency } from '../../utils/formatters';
import { calculatePointsToEarn, getCustomerTierInfo, STANDARD_LOYALTY_REWARDS } from '../../utils/loyaltyUtils';
import { OrderLoyaltyModal } from '../biller/OrderLoyaltyModal';

interface PaymentModalProps {
  order: Order;
  onClose: () => void;
  onPaymentComplete: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  onClose,
  onPaymentComplete,
}) => {
  const { coupons, customers, processPayment, setReceiptModalOrder, settings } = useRestaurant();
  const { currentUser } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>(String(order.grandTotal));
  const [upiRef, setUpiRef] = useState<string>(`UPI-${Date.now().toString().slice(-6)}`);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState<boolean>(false);

  // Discount / Coupon state
  const [discountMode, setDiscountMode] = useState<'coupon' | 'manual'>(
    order.couponCode ? 'coupon' : 'manual'
  );
  const [selectedCouponCode, setSelectedCouponCode] = useState<string>(order.couponCode || '');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>(order.discountReason || '');

  // Matched customer for loyalty
  const matchedCustomer = customers.find(
    (c) =>
      (order.customerId && c.id === order.customerId) ||
      (order.customerPhone && c.phone === order.customerPhone)
  );
  const tierInfo = getCustomerTierInfo(matchedCustomer?.loyaltyPoints || 0);
  const pointsToEarn = calculatePointsToEarn(order.grandTotal, tierInfo.tier);

  // Split payment state
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splitAllocations, setSplitAllocations] = useState<PaymentAllocation[]>([
    { method: 'cash', amount: Math.floor(order.grandTotal / 2) },
    { method: 'upi', amount: Math.ceil(order.grandTotal / 2) },
  ]);

  const maxDiscountAllowed = currentUser?.maxDiscountPercent || 10;

  // Calculate discount based on active mode
  let effectiveDiscountAmount = order.discountAmount || 0;
  let activeCouponFound: Coupon | undefined;

  if (discountMode === 'coupon' && selectedCouponCode) {
    activeCouponFound = coupons.find(
      (c) => c.code.toUpperCase() === selectedCouponCode.toUpperCase()
    );
    if (activeCouponFound) {
      const validation = validateAndCalculateCoupon(activeCouponFound, {
        subtotal: order.subtotal,
        items: order.items,
        orderType: order.orderType,
        customerPhone: order.customerPhone,
      });
      if (validation.isValid) {
        effectiveDiscountAmount = validation.calculatedDiscount;
      }
    }
  } else if (discountMode === 'manual' && discountPercent > 0) {
    effectiveDiscountAmount = (order.subtotal * discountPercent) / 100;
  }

  // Base raw total before any settlement adjustments
  const basePreDiscountTotal = order.subtotal + order.taxAmount + (order.deliveryCharge || 0);
  const payableTotal = Math.max(0, Math.round(basePreDiscountTotal - effectiveDiscountAmount));

  // Change calculation
  const tendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tendered - payableTotal);

  const handleSplitAmountChange = (index: number, val: number) => {
    const updated = [...splitAllocations];
    updated[index].amount = val;
    setSplitAllocations(updated);
  };

  const handleAddSplitRow = () => {
    setSplitAllocations([...splitAllocations, { method: 'upi', amount: 0 }]);
  };

  const handleRemoveSplitRow = (index: number) => {
    setSplitAllocations(splitAllocations.filter((_, i) => i !== index));
  };

  const splitTotal = splitAllocations.reduce((sum, a) => sum + (a.amount || 0), 0);
  const isSplitBalanced = Math.abs(splitTotal - payableTotal) < 0.01;

  const handleSettle = () => {
    let finalPayments: PaymentAllocation[] = [];

    if (isSplitMode) {
      if (!isSplitBalanced) {
        alert(`Split total (₹${splitTotal}) must equal payable total (₹${payableTotal})`);
        return;
      }
      finalPayments = splitAllocations;
    } else {
      finalPayments = [
        {
          method: paymentMethod,
          amount: payableTotal,
          transactionRef: paymentMethod === 'upi' ? upiRef : undefined,
        },
      ];
    }

    const finalReason =
      discountMode === 'coupon' && activeCouponFound
        ? `Coupon: ${activeCouponFound.code} (${activeCouponFound.title})`
        : discountReason || (discountPercent > 0 ? `${discountPercent}% manual discount` : undefined);

    const updatedOrder = processPayment(
      order.id,
      finalPayments,
      effectiveDiscountAmount,
      finalReason
    );

    if (updatedOrder) {
      onPaymentComplete(updatedOrder);
      setReceiptModalOrder(updatedOrder);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              Settle Bill: #{order.orderNumber}
            </h3>
            <p className="text-xs text-slate-500">
              {order.orderType.toUpperCase()} • {order.tableName || order.customerName || 'Direct Billing'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Customer Loyalty Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{order.customerName || 'Walk-in Guest'}</span>
                  {matchedCustomer && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${tierInfo.badgeBg} ${tierInfo.badgeText} border ${tierInfo.borderColor}`}>
                      {tierInfo.label}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  {order.customerPhone ? (
                    <span>Phone: {order.customerPhone}</span>
                  ) : (
                    <span>No phone linked</span>
                  )}
                  {matchedCustomer && (
                    <span className="ml-2 font-bold text-amber-600 dark:text-amber-400">
                      • {matchedCustomer.loyaltyPoints} pts balance (+{pointsToEarn} on pay)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLoyaltyModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition-colors"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{matchedCustomer ? 'Loyalty Rewards' : '+ Link Member'}</span>
            </button>
          </div>

          {/* Bill Summary Banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Total Payable Amount
              </div>
              <div className="text-2xl font-black text-amber-950 dark:text-amber-100">
                {formatCurrency(payableTotal, settings.currencySymbol)}
              </div>
              <div className="text-[11px] text-amber-700/80 dark:text-amber-400">
                Includes Taxes & Delivery
              </div>
            </div>

            <div className="text-right text-xs space-y-0.5 text-slate-600 dark:text-slate-400">
              <div>Subtotal: {formatCurrency(order.subtotal)}</div>
              <div>GST 5%: {formatCurrency(order.taxAmount)}</div>
              {order.deliveryCharge > 0 && <div>Delivery: {formatCurrency(order.deliveryCharge)}</div>}
            </div>
          </div>

          {/* Discount & Coupon Section */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountMode('coupon')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    discountMode === 'coupon'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Coupon / Offer
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountMode('manual')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    discountMode === 'manual'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Manual Auth (Max {maxDiscountAllowed}%)
                </button>
              </div>

              {effectiveDiscountAmount > 0 && (
                <span className="font-extrabold text-rose-600 dark:text-rose-400">
                  -{formatCurrency(effectiveDiscountAmount, settings.currencySymbol)}
                </span>
              )}
            </div>

            {discountMode === 'coupon' ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCouponCode}
                    onChange={(e) => setSelectedCouponCode(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Select or Clear Coupon --</option>
                    {coupons
                      .filter((c) => c.isActive)
                      .map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.code} — {c.title}
                        </option>
                      ))}
                  </select>
                </div>
                {activeCouponFound && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ {activeCouponFound.title} applied
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  {[0, 5, 10, 15, 20, 25].map((pct) => {
                    if (pct > maxDiscountAllowed) return null;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(pct)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                          discountPercent === pct
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    );
                  })}
                </div>

                {discountPercent > 0 && (
                  <input
                    type="text"
                    placeholder="Discount Reason (e.g. Loyalty/VIP)"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                )}
              </div>
            )}
          </div>

          {/* Payment Method Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Payment Mode
              </label>
              <button
                type="button"
                onClick={() => setIsSplitMode(!isSplitMode)}
                className={`text-xs font-bold px-2 py-0.5 rounded-md border transition-colors ${
                  isSplitMode
                    ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isSplitMode ? '✓ Split Payment Active' : '+ Split Payment'}
              </button>
            </div>

            {!isSplitMode ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                  { id: 'credit_card', label: 'Card (EDC)', icon: CreditCard },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMethod === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id as PaymentMethod)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-amber-600" />
                      <span className="text-xs">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Split Payment Rows */
              <div className="space-y-2">
                {splitAllocations.map((alloc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700"
                  >
                    <select
                      value={alloc.method}
                      onChange={(e) => {
                        const updated = [...splitAllocations];
                        updated[idx].method = e.target.value as PaymentMethod;
                        setSplitAllocations(updated);
                      }}
                      className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="credit_card">Card</option>
                    </select>

                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        value={alloc.amount || ''}
                        onChange={(e) => handleSplitAmountChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
                      />
                    </div>

                    {splitAllocations.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSplitRow(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddSplitRow}
                    className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Payment Row
                  </button>
                  <div
                    className={`text-xs font-bold ${
                      isSplitBalanced ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    Split Total: {formatCurrency(splitTotal)} / {formatCurrency(payableTotal)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cash Tendered & Change Due (If single Cash mode) */}
          {!isSplitMode && paymentMethod === 'cash' && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Cash Tendered from Guest
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Change Due: {formatCurrency(changeDue)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-sm text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-sm font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Quick denomination chips */}
                <div className="flex items-center gap-1">
                  {[payableTotal, 500, 1000, 2000].map((denom) => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => setCashTendered(String(denom))}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                    >
                      ₹{denom}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* UPI Simulator (If UPI mode) */}
          {!isSplitMode && paymentMethod === 'upi' && (
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900/40 flex items-center gap-3">
              <div className="w-16 h-16 bg-white p-1 rounded-lg border border-indigo-200 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Scan QR via any UPI App (GPay / PhonePe / Paytm)
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Ref #:</span>
                  <input
                    type="text"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    className="px-2 py-0.5 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-md font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSettle}
            disabled={isSplitMode && !isSplitBalanced}
            className={`px-6 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-lg transition-all flex items-center gap-2 ${
              isSplitMode && !isSplitBalanced
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Complete Settlement & Print Receipt</span>
          </button>
        </div>
      </div>

      {isLoyaltyModalOpen && (
        <OrderLoyaltyModal
          order={order}
          onClose={() => setIsLoyaltyModalOpen(false)}
        />
      )}
    </div>
  );
};
