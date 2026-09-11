import {
  Award,
  CheckCircle,
  Crown,
  Edit2,
  Gift,
  History,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Customer, LoyaltyTier, Order } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  getCustomerTierInfo,
  LOYALTY_TIERS,
  STANDARD_LOYALTY_REWARDS,
} from '../../utils/loyaltyUtils';

interface CustomerLoyaltyDirectoryProps {
  onSelectOrderForCustomer?: (customer: Customer) => void;
}

export const CustomerLoyaltyDirectory: React.FC<CustomerLoyaltyDirectoryProps> = ({
  onSelectOrderForCustomer,
}) => {
  const { customers, orders, addCustomer, adjustCustomerPoints, linkOrderCustomer, settings } =
    useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [adjustingCustomer, setAdjustingCustomer] = useState<Customer | null>(null);
  const [viewHistoryCustomer, setViewHistoryCustomer] = useState<Customer | null>(null);
  const [attachingCustomer, setAttachingCustomer] = useState<Customer | null>(null);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [initialBonusPoints, setInitialBonusPoints] = useState(50);

  // Points adjustment form state
  const [pointsDelta, setPointsDelta] = useState<number>(50);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Customer Loyalty Bonus');

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedTier !== 'all') {
        const t = c.tier || getCustomerTierInfo(c.loyaltyPoints).tier;
        if (t !== selectedTier) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customers, selectedTier, searchQuery]);

  // Open pending orders that can be linked
  const openOrders = useMemo(() => {
    return orders.filter((o) => o.paymentStatus === 'pending' && o.status !== 'cancelled');
  }, [orders]);

  // Total loyalty points in circulation
  const totalCirculatingPoints = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  }, [customers]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Please provide name and phone number.');
      return;
    }

    addCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || undefined,
      isActive: true,
      initialPoints: initialBonusPoints,
    });

    setIsRegisterModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
  };

  const handleAdjustPointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingCustomer) return;

    adjustCustomerPoints(adjustingCustomer.id, pointsDelta, adjustmentReason);
    setAdjustingCustomer(null);
  };

  const handleAttachToOrder = (orderId: string) => {
    if (!attachingCustomer) return;

    linkOrderCustomer(orderId, {
      customerId: attachingCustomer.id,
      name: attachingCustomer.name,
      phone: attachingCustomer.phone,
      email: attachingCustomer.email,
      address: attachingCustomer.address,
    });

    setAttachingCustomer(null);
    alert(`Successfully linked ${attachingCustomer.name} to Order #${orderId.slice(-4)}`);
  };

  return (
    <div className="space-y-4">
      {/* Top Loyalty Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">
            Enrolled Members
          </div>
          <div className="text-xl font-extrabold text-amber-950 dark:text-amber-100 mt-0.5">
            {customers.length} Customers
          </div>
          <div className="text-[10px] text-amber-700/80 dark:text-amber-400">
            Active Loyalty Database
          </div>
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/50">
          <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase">
            Points in Circulation
          </div>
          <div className="text-xl font-extrabold text-purple-950 dark:text-purple-100 mt-0.5">
            ⭐ {totalCirculatingPoints.toLocaleString()}
          </div>
          <div className="text-[10px] text-purple-700/80 dark:text-purple-400">
            Est. Value: ₹{Math.floor(totalCirculatingPoints / 2).toLocaleString()}
          </div>
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
            VIP Members (Gold/Plat)
          </div>
          <div className="text-xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-0.5">
            {
              customers.filter((c) => {
                const t = c.tier || getCustomerTierInfo(c.loyaltyPoints).tier;
                return t === 'gold' || t === 'platinum';
              }).length
            }{' '}
            VIPs
          </div>
          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
            High Lifetime Value Guests
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/50">
          <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase">
            Earned Reward Catalog
          </div>
          <div className="text-xl font-extrabold text-blue-950 dark:text-blue-100 mt-0.5">
            {STANDARD_LOYALTY_REWARDS.length} Tiers
          </div>
          <div className="text-[10px] text-blue-700/80 dark:text-blue-400">
            ₹50 to ₹850 Instant Vouchers
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Tier Filters + Add Customer Button */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search member by name, phone number, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tier Filter Chips */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            {['all', 'bronze', 'silver', 'gold', 'platinum'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  selectedTier === tier
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Add New Member Button */}
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Member</span>
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Member Name & Contact</th>
                <th className="py-3 px-4">Loyalty Tier & Multiplier</th>
                <th className="py-3 px-4">Points Balance</th>
                <th className="py-3 px-4">Orders & Lifetime Spend</th>
                <th className="py-3 px-4">Earned Reward Coupons</th>
                <th className="py-3 px-4">Last Visit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching search query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const tInfo = getCustomerTierInfo(cust.loyaltyPoints);

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{cust.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">{cust.phone}</div>
                        {cust.email && (
                          <div className="text-[10px] text-slate-400">{cust.email}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${tInfo.borderColor} ${tInfo.badgeBg} ${tInfo.badgeText}`}
                        >
                          {tInfo.tier === 'platinum' ? (
                            <Sparkles className="w-3 h-3 text-purple-600" />
                          ) : tInfo.tier === 'gold' ? (
                            <Crown className="w-3 h-3 text-yellow-600" />
                          ) : tInfo.tier === 'silver' ? (
                            <ShieldCheck className="w-3 h-3 text-slate-600" />
                          ) : (
                            <Award className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{tInfo.label}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {tInfo.multiplier}x Points Multiplier
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-black text-sm text-amber-600 dark:text-amber-400">
                          ⭐ {cust.loyaltyPoints}{' '}
                          <span className="text-xs font-semibold text-slate-400">pts</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Worth: ₹{Math.floor(cust.loyaltyPoints / 2)} instant discount
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(cust.totalSpend, settings.currencySymbol)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {cust.totalOrders} total completed orders
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {cust.earnedCouponCodes && cust.earnedCouponCodes.length > 0 ? (
                            cust.earnedCouponCodes.slice(0, 3).map((code) => (
                              <span
                                key={code}
                                className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-[10px] font-mono font-bold border border-amber-200 dark:border-amber-800"
                              >
                                {code}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400">Welcome coupon</span>
                          )}
                          {cust.earnedCouponCodes && cust.earnedCouponCodes.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              +{cust.earnedCouponCodes.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        <div>{cust.lastOrderDate || 'Recent'}</div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Attach to Active Bill */}
                          {openOrders.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setAttachingCustomer(cust)}
                              className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              title="Attach to Open Table/Order"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span>Attach to Order</span>
                            </button>
                          )}

                          {/* Adjust Points */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingCustomer(cust);
                              setPointsDelta(50);
                              setAdjustmentReason('Special Customer Loyalty Reward');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Adjust Loyalty Points"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* View History Log */}
                          <button
                            type="button"
                            onClick={() => setViewHistoryCustomer(cust)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Points History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Register New Customer */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Register New Loyalty Member
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditi Roy"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold mt-1 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Phone Number (Unique ID) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98200 12345"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold mt-1 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="aditi@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold mt-1 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Address / Notes
                </label>
                <input
                  type="text"
                  placeholder="Building, Landmark, Area"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold mt-1 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center justify-between">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Welcome Bonus Points
                </div>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={initialBonusPoints}
                  onChange={(e) => setInitialBonusPoints(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-amber-300 rounded-lg text-xs font-bold text-right"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-xs"
                >
                  Enroll Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Adjust Points */}
      {adjustingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  Adjust Loyalty Points: {adjustingCustomer.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Current Balance: ⭐ {adjustingCustomer.loyaltyPoints} points
                </p>
              </div>
              <button
                onClick={() => setAdjustingCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Points Adjustment (Positive to Add, Negative to Deduct)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    step="5"
                    required
                    value={pointsDelta}
                    onChange={(e) => setPointsDelta(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-extrabold focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex items-center gap-1">
                    {[+50, +100, -50].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setPointsDelta(d)}
                        className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold hover:bg-amber-100"
                      >
                        {d > 0 ? `+${d}` : d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold mt-1"
                >
                  <option value="Customer Birthday Gift Bonus">🎂 Customer Birthday Gift (+Bonus)</option>
                  <option value="Special VIP Goodwill Reward">👑 Special VIP Goodwill Reward</option>
                  <option value="Service Recovery Compensation">🛡️ Service Recovery / Food Delay</option>
                  <option value="Festival & Promotional Campaign">🎉 Festival Campaign Reward</option>
                  <option value="Manual Point Correction">✏️ Manual Point Correction</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-xs font-bold text-amber-900 dark:text-amber-200">
                New Balance After Adjustment:{' '}
                {Math.max(0, adjustingCustomer.loyaltyPoints + pointsDelta)} points
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingCustomer(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-xs"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: View Points History */}
      {viewHistoryCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  Points History: {viewHistoryCustomer.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {viewHistoryCustomer.phone} • Balance: ⭐ {viewHistoryCustomer.loyaltyPoints} pts
                </p>
              </div>
              <button
                onClick={() => setViewHistoryCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {(!viewHistoryCustomer.loyaltyHistory || viewHistoryCustomer.loyaltyHistory.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No previous transactions recorded.
                </div>
              ) : (
                viewHistoryCustomer.loyaltyHistory.map((txn) => (
                  <div key={txn.id} className="py-3 flex items-center justify-between text-xs">
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
                        Balance: {txn.balanceAfter} pts
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setViewHistoryCustomer(null)}
                className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Attach Customer to Open Order */}
      {attachingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  Attach {attachingCustomer.name} to Bill
                </h3>
                <p className="text-xs text-amber-100">
                  Select an active pending order to link this customer's profile:
                </p>
              </div>
              <button
                onClick={() => setAttachingCustomer(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {openOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Order #{ord.orderNumber} ({ord.orderType.toUpperCase()})
                    </div>
                    <div className="text-[11px] text-amber-600 font-semibold">
                      {ord.tableName || ord.customerName || 'Direct'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Total: {formatCurrency(ord.grandTotal, settings.currencySymbol)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAttachToOrder(ord.id)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Link Member</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setAttachingCustomer(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
