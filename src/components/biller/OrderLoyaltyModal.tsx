import {
  Award,
  Check,
  CheckCircle,
  Crown,
  Gift,
  HelpCircle,
  History,
  Percent,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Customer, Order } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  calculateCustomPointDiscount,
  calculatePointsToEarn,
  getCustomerTierInfo,
  normalizePhone,
  STANDARD_LOYALTY_REWARDS,
} from '../../utils/loyaltyUtils';

interface OrderLoyaltyModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderLoyaltyModal: React.FC<OrderLoyaltyModalProps> = ({ order, onClose }) => {
  const {
    customers,
    coupons,
    linkOrderCustomer,
    applyLoyaltyDiscountToOrder,
    removeOrderLoyaltyDiscount,
    addCustomer,
    settings,
  } = useRestaurant();
  const { currentUser } = useAuth();

  // Search & Link state
  const [searchPhoneQuery, setSearchPhoneQuery] = useState(order.customerPhone || '');
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState(order.customerPhone || '');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Custom Points Redemption state
  const [customPointsToRedeem, setCustomPointsToRedeem] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'rewards' | 'coupons' | 'history'>('rewards');

  // Find linked customer
  const linkedCustomer = useMemo(() => {
    if (order.customerId) {
      return customers.find((c) => c.id === order.customerId);
    }
    if (order.customerPhone) {
      return customers.find((c) => c.phone === order.customerPhone);
    }
    return undefined;
  }, [customers, order.customerId, order.customerPhone]);

  // Filtered customer search suggestions
  const searchResults = useMemo(() => {
    if (!searchPhoneQuery.trim()) return [];
    const q = searchPhoneQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.phone.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, searchPhoneQuery]);

  // Tier info for linked customer
  const tierInfo = useMemo(() => {
    const pts = linkedCustomer?.loyaltyPoints || 0;
    return getCustomerTierInfo(pts);
  }, [linkedCustomer?.loyaltyPoints]);

  // Points that will be earned on this order upon bill completion
  const pointsToEarn = useMemo(() => {
    const netBill = order.grandTotal || (order.subtotal + order.taxAmount + (order.deliveryCharge || 0) - (order.discountAmount || 0));
    return calculatePointsToEarn(netBill, tierInfo.tier);
  }, [order.grandTotal, order.subtotal, order.taxAmount, order.deliveryCharge, order.discountAmount, tierInfo.tier]);

  // Handle linking an existing customer
  const handleLinkCustomer = (customer: Customer) => {
    linkOrderCustomer(order.id, {
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    });
    setSearchPhoneQuery(customer.phone);
  };

  // Handle registering a new customer and linking immediately
  const handleRegisterAndLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Please provide customer name and phone number.');
      return;
    }

    const created = addCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || undefined,
      isActive: true,
      initialPoints: 50, // 50 Welcome bonus points!
    });

    linkOrderCustomer(order.id, {
      customerId: created.id,
      name: created.name,
      phone: created.phone,
      email: created.email,
      address: created.address,
    });

    setIsRegisteringNew(false);
    setSearchPhoneQuery(created.phone);
  };

  // Handle applying a standard loyalty reward coupon
  const handleApplyReward = (reward: typeof STANDARD_LOYALTY_REWARDS[0]) => {
    if (!linkedCustomer) return;
    if (linkedCustomer.loyaltyPoints < reward.pointsCost) {
      alert(`Customer needs at least ${reward.pointsCost} points to redeem this reward.`);
      return;
    }
    if (reward.minSpend && order.subtotal < reward.minSpend) {
      alert(`Minimum bill subtotal for this reward is ₹${reward.minSpend}.`);
      return;
    }

    applyLoyaltyDiscountToOrder(
      order.id,
      reward.pointsCost,
      reward.discountAmount,
      reward.couponCode,
      reward.title
    );
  };

  // Handle applying a regular promo / earned coupon
  const handleApplyPromoCoupon = (couponCode: string) => {
    const targetCoupon = coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase());
    if (!targetCoupon) {
      alert(`Coupon code ${couponCode} not found in promotions catalog.`);
      return;
    }

    let discount = 0;
    if (targetCoupon.discountType === 'flat') {
      discount = targetCoupon.discountValue;
    } else if (targetCoupon.discountType === 'percentage') {
      discount = Math.round((order.subtotal * targetCoupon.discountValue) / 100);
      if (targetCoupon.maxDiscountCap) {
        discount = Math.min(discount, targetCoupon.maxDiscountCap);
      }
    } else {
      discount = targetCoupon.discountValue || 50;
    }

    applyLoyaltyDiscountToOrder(
      order.id,
      0, // 0 loyalty points required for standard earned coupon
      discount,
      targetCoupon.code,
      targetCoupon.title
    );
  };

  // Handle Custom Points Redemption
  const handleApplyCustomPoints = () => {
    if (!linkedCustomer) return;
    if (customPointsToRedeem <= 0) return;
    if (customPointsToRedeem > linkedCustomer.loyaltyPoints) {
      alert('Points to redeem cannot exceed customer balance.');
      return;
    }

    const { pointsUsed, discountAmount } = calculateCustomPointDiscount(
      customPointsToRedeem,
      order.subtotal
    );

    if (discountAmount <= 0) {
      alert('Points to redeem must equate to at least ₹1 discount (minimum 2 points).');
      return;
    }

    applyLoyaltyDiscountToOrder(
      order.id,
      pointsUsed,
      discountAmount,
      `PTS-${pointsUsed}`,
      `Redeemed ${pointsUsed} Loyalty Points`
    );
  };

  // Handle removing applied discount
  const handleRemoveDiscount = () => {
    removeOrderLoyaltyDiscount(order.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                Customer Loyalty & Rewards
                <span className="text-xs font-semibold px-2 py-0.5 bg-white/20 rounded-full">
                  Order #{order.orderNumber}
                </span>
              </h3>
              <p className="text-xs text-amber-100">
                Track loyalty points, link customer phone & redeem earned reward coupons
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section 1: Customer Link / Search Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Customer Phone Number / Search
              </label>

              {!isRegisteringNew && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisteringNew(true);
                    setNewPhone(searchPhoneQuery);
                  }}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Register New Customer
                </button>
              )}
            </div>

            {isRegisteringNew ? (
              /* Inline Registration Form */
              <form onSubmit={handleRegisterAndLink} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aditi Roy"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98200 00000"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="aditi@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Address / Delivery Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="Building, Street, Landmark"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" />
                    +50 Welcome Loyalty Points awarded automatically!
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRegisteringNew(false)}
                      className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Save & Link to Order
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Customer Search Input + Dropdown */
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Type customer phone number or name to search..."
                    value={searchPhoneQuery}
                    onChange={(e) => setSearchPhoneQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                {/* Autocomplete Dropdown List */}
                {searchPhoneQuery && searchResults.length > 0 && !linkedCustomer && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {searchResults.map((cust) => {
                      const tInfo = getCustomerTierInfo(cust.loyaltyPoints);
                      return (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => handleLinkCustomer(cust)}
                          className="w-full p-2.5 text-left hover:bg-amber-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{cust.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${tInfo.badgeBg} ${tInfo.badgeText}`}>
                                {tInfo.label}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">{cust.phone}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                              ⭐ {cust.loyaltyPoints} pts
                            </span>
                            <div className="text-[10px] text-slate-400">{cust.totalOrders} visits</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Linked Customer Profile Card */}
          {linkedCustomer ? (
            <div className={`p-4 rounded-2xl border ${tierInfo.borderColor} ${tierInfo.badgeBg} relative overflow-hidden transition-all shadow-xs`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    {tierInfo.tier === 'platinum' ? (
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    ) : tierInfo.tier === 'gold' ? (
                      <Crown className="w-6 h-6 text-yellow-600" />
                    ) : tierInfo.tier === 'silver' ? (
                      <ShieldCheck className="w-6 h-6 text-slate-600" />
                    ) : (
                      <Award className="w-6 h-6 text-amber-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {linkedCustomer.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${tierInfo.borderColor} ${tierInfo.badgeBg} ${tierInfo.badgeText}`}>
                        {tierInfo.label} ({tierInfo.multiplier}x)
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{linkedCustomer.phone}</span>
                      {linkedCustomer.email && <span>• {linkedCustomer.email}</span>}
                    </div>
                  </div>
                </div>

                {/* Points Metric Pill */}
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Points Balance</div>
                    <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                      ⭐ {linkedCustomer.loyaltyPoints} <span className="text-xs font-normal text-slate-500">pts</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Earning from Bill</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      +{pointsToEarn} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress to next tier */}
              {tierInfo.nextTier && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    <span>Progress to {tierInfo.nextTier.label}</span>
                    <span>{tierInfo.nextTier.pointsNeeded} more points needed</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((linkedCustomer.loyaltyPoints / (linkedCustomer.loyaltyPoints + tierInfo.nextTier.pointsNeeded)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-dashed border-amber-300 dark:border-amber-900/60 text-center space-y-1">
              <Star className="w-6 h-6 text-amber-500 mx-auto" />
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                No Customer Linked to this Order
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                Enter customer phone number above or register a new customer to unlock loyalty reward coupons!
              </p>
            </div>
          )}

          {/* Section 3: Active Applied Discount / Coupon Summary */}
          {order.discountAmount > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 dark:border-emerald-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl text-emerald-700 dark:text-emerald-300">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                    <span>Applied: {order.couponCode || 'Loyalty Discount'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded font-semibold">
                      -₹{order.discountAmount}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {order.discountReason || 'Reward discount deducted from bill total'}
                    {order.pointsRedeemed ? ` (${order.pointsRedeemed} points will be deducted)` : ''}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveDiscount}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          )}

          {/* Section 4: Reward Options Tabs */}
          {linkedCustomer && (
            <div className="space-y-3">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('rewards')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'rewards'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  Loyalty Points Vouchers
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('coupons')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'coupons'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  Earned Promo Coupons
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Points History
                </button>
              </div>

              {/* Tab 1: Loyalty Points Catalog & Custom Slider */}
              {activeTab === 'rewards' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STANDARD_LOYALTY_REWARDS.map((reward) => {
                      const hasEnoughPoints = linkedCustomer.loyaltyPoints >= reward.pointsCost;
                      const meetsSubtotal = !reward.minSpend || order.subtotal >= reward.minSpend;
                      const isApplied = order.couponCode === reward.couponCode;

                      return (
                        <div
                          key={reward.id}
                          className={`p-3 rounded-2xl border transition-all ${
                            isApplied
                              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                              : hasEnoughPoints && meetsSubtotal
                              ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-400 shadow-2xs'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{reward.title}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{reward.description}</div>
                              {reward.minSpend && (
                                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                                  Min Subtotal: ₹{reward.minSpend}
                                </div>
                              )}
                            </div>

                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900 shrink-0">
                              {reward.pointsCost} pts
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Code: <span className="font-mono text-amber-600">{reward.couponCode}</span>
                            </span>

                            {isApplied ? (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Applied
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={!hasEnoughPoints || !meetsSubtotal}
                                onClick={() => handleApplyReward(reward)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                                  hasEnoughPoints && meetsSubtotal
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Redeem Voucher
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Flexible Custom Points Redemption */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Custom Flexible Points Redemption (2 pts = ₹1 Discount)
                      </label>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        Max Usable: {Math.min(linkedCustomer.loyaltyPoints, Math.floor(order.subtotal * 0.5) * 2)} pts
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={linkedCustomer.loyaltyPoints}
                        step="2"
                        placeholder="Enter points (e.g. 100)"
                        value={customPointsToRedeem || ''}
                        onChange={(e) => setCustomPointsToRedeem(parseInt(e.target.value) || 0)}
                        className="w-32 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold"
                      />

                      <button
                        type="button"
                        onClick={handleApplyCustomPoints}
                        disabled={customPointsToRedeem <= 0 || customPointsToRedeem > linkedCustomer.loyaltyPoints}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-colors ${
                          customPointsToRedeem > 0 && customPointsToRedeem <= linkedCustomer.loyaltyPoints
                            ? 'bg-amber-600 hover:bg-amber-700 shadow-xs'
                            : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                        }`}
                      >
                        Apply Points Discount (-₹{Math.floor(customPointsToRedeem / 2)})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Earned Promo Coupons */}
              {activeTab === 'coupons' && (
                <div className="space-y-2.5">
                  <div className="text-xs text-slate-500">
                    Active promotional coupons and earned member discounts available for this order:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {coupons
                      .filter((c) => c.isActive)
                      .map((coupon) => {
                        const isApplied = order.couponCode === coupon.code;
                        const meetsMin = !coupon.minOrderValue || order.subtotal >= coupon.minOrderValue;

                        return (
                          <div
                            key={coupon.id}
                            className={`p-3 rounded-2xl border transition-all ${
                              isApplied
                                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                                : meetsMin
                                ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                : 'border-slate-200 dark:border-slate-800 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-md font-mono text-[11px] font-bold">
                                  {coupon.code}
                                </span>
                                <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1">
                                  {coupon.title}
                                </h5>
                                <p className="text-[11px] text-slate-500">{coupon.description}</p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {coupon.discountType === 'percentage'
                                  ? `${coupon.discountValue}% OFF`
                                  : `Flat ₹${coupon.discountValue} OFF`}
                              </span>

                              {isApplied ? (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Applied
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!meetsMin}
                                  onClick={() => handleApplyPromoCoupon(coupon.code)}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold ${
                                    meetsMin
                                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  Apply Coupon
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Tab 3: Points History Log */}
              {activeTab === 'history' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">
                    Recent loyalty transactions and point activity for {linkedCustomer.name}:
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-56 overflow-y-auto">
                    {(!linkedCustomer.loyaltyHistory || linkedCustomer.loyaltyHistory.length === 0) ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No previous point transactions recorded yet.
                      </div>
                    ) : (
                      linkedCustomer.loyaltyHistory.map((txn) => (
                        <div key={txn.id} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {txn.description}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {formatDateTime(txn.date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-black text-xs ${
                                txn.points > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {txn.points > 0 ? `+${txn.points}` : txn.points} pts
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Bal: {txn.balanceAfter} pts
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Summary */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span>Bill Subtotal: <strong className="text-slate-900 dark:text-white">{formatCurrency(order.subtotal)}</strong></span>
            {order.discountAmount > 0 && (
              <span className="ml-3 text-rose-600 font-bold">
                Discount: -{formatCurrency(order.discountAmount)}
              </span>
            )}
            <span className="ml-3 font-extrabold text-amber-700 dark:text-amber-400">
              Payable: {formatCurrency(order.grandTotal, settings.currencySymbol)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-extrabold text-xs rounded-xl shadow-xs transition-colors"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
