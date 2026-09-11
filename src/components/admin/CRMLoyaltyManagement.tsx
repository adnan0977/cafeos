import React, { useState } from 'react';
import {
  Heart,
  Users,
  Award,
  Gift,
  Search,
  Plus,
  Edit2,
  Phone,
  MessageSquare,
  Download,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Share2,
  Calendar,
  Wallet,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Customer } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Aarav Sharma',
    phone: '+91 98111 22334',
    email: 'aarav.sharma@example.com',
    totalOrders: 14,
    ordersCount: 14,
    totalSpend: 8450,
    totalSpent: 8450,
    loyaltyPoints: 320,
    tags: ['VIP', 'Weekend Regular'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-09T18:30:00Z',
    isActive: true,
  },
  {
    id: 'cust-2',
    name: 'Pooja Verma',
    phone: '+91 98222 33445',
    email: 'pooja.v@example.com',
    totalOrders: 8,
    ordersCount: 8,
    totalSpend: 4320,
    totalSpent: 4320,
    loyaltyPoints: 180,
    tags: ['Coffee Lover'],
    createdAt: '2024-02-01T12:00:00Z',
    updatedAt: '2024-03-08T15:20:00Z',
    isActive: true,
  },
  {
    id: 'cust-3',
    name: 'Vikram Malhotra',
    phone: '+91 98333 44556',
    email: 'vikram.m@example.com',
    totalOrders: 22,
    ordersCount: 22,
    totalSpend: 16800,
    totalSpent: 16800,
    loyaltyPoints: 640,
    tags: ['Platinum', 'Corporate Dining'],
    createdAt: '2023-11-10T09:00:00Z',
    updatedAt: '2024-03-10T14:10:00Z',
    isActive: true,
  },
  {
    id: 'cust-4',
    name: 'Ananya Roy',
    phone: '+91 98444 55667',
    email: 'ananya.roy@example.com',
    totalOrders: 4,
    ordersCount: 4,
    totalSpend: 2150,
    totalSpent: 2150,
    loyaltyPoints: 90,
    tags: ['New Guest'],
    createdAt: '2024-02-20T16:00:00Z',
    updatedAt: '2024-03-02T19:40:00Z',
    isActive: true,
  },
];

export const CRMLoyaltyManagement: React.FC = () => {
  const { settings, customers = [] } = useRestaurant();

  const [customerList, setCustomerList] = useState<Customer[]>(() => {
    if (customers && customers.length > 0) return customers;
    const saved = localStorage.getItem('royalpos_crm_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_CUSTOMERS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pointsAdjustModal, setPointsAdjustModal] = useState(false);
  const [pointsDelta, setPointsDelta] = useState(50);
  const [pointsReason, setPointsReason] = useState('Birthday Special Bonus');
  const [actionBanner, setActionBanner] = useState('');

  // Loyalty Program Rules State
  const [earnSpendThreshold, setEarnSpendThreshold] = useState(100);
  const [pointRupeeValue, setPointRupeeValue] = useState(1.0);
  const [minRedeemPoints, setMinRedeemPoints] = useState(50);

  const getTier = (spent: number) => {
    if (spent >= 15000) return { name: 'Platinum', color: 'bg-indigo-500/15 text-indigo-600 border-indigo-300' };
    if (spent >= 6000) return { name: 'Gold', color: 'bg-amber-500/15 text-amber-600 border-amber-300' };
    if (spent >= 2500) return { name: 'Silver', color: 'bg-slate-200 text-slate-700 border-slate-300' };
    return { name: 'Bronze', color: 'bg-amber-800/10 text-amber-800 border-amber-200' };
  };

  const handleAdjustPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setCustomerList((prev) =>
      prev.map((c) =>
        c.id === selectedCustomer.id
          ? { ...c, loyaltyPoints: Math.max(0, c.loyaltyPoints + pointsDelta) }
          : c
      )
    );

    setActionBanner(
      `Updated loyalty points for ${selectedCustomer.name}: ${pointsDelta > 0 ? '+' : ''}${pointsDelta} pts (${pointsReason})`
    );
    setPointsAdjustModal(false);
    setTimeout(() => setActionBanner(''), 4000);
  };

  const handleExportCustomersCSV = () => {
    const csvRows = customerList.map((c) => ({
      'Customer Name': c.name,
      Phone: c.phone,
      Email: c.email || '',
      'Total Orders': c.ordersCount,
      'Lifetime Spend (INR)': c.totalSpent,
      'Loyalty Points Balance': c.loyaltyPoints,
      'Loyalty Tier': getTier(c.totalSpent).name,
      Tags: (c.tags || []).join('; '),
      'Last Visit': c.updatedAt ? formatDateTime(c.updatedAt) : 'N/A',
    }));
    exportToCSV(`RoyalPOS_CRM_Customers_${new Date().toISOString().split('T')[0]}`, csvRows);
  };

  const filteredCustomers = customerList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPointsInCirculation = customerList.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  const totalLifetimeGuestSpend = customerList.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Customer CRM &amp; Loyalty Rewards Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                RoyalPOS Loyalty 3.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track repeat guests, reward points on every rupee spent, redeem discounts at checkout, and run targeted WhatsApp/SMS engagement campaigns.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCustomersCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-rose-600" />
          <span>Export CRM Contacts (CSV)</span>
        </button>
      </div>

      {actionBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionBanner}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered Guests</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {customerList.length} Patrons
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Verified phone numbers</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Points in Circulation</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {totalPointsInCirculation.toLocaleString()} Pts
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Worth {formatCurrency(totalPointsInCirculation * pointRupeeValue)} in rewards
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Guest Lifetime Spend</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalLifetimeGuestSpend)}
          </div>
          <div className="text-[11px] text-rose-600 font-bold mt-1">Direct repeat dining revenue</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Earning Rate Rule</div>
          <div className="text-sm font-black text-slate-900 dark:text-white mt-1.5">
            1 Point per ₹{earnSpendThreshold} spent
          </div>
          <div className="text-[11px] text-slate-500 mt-1">1 Point = ₹{pointRupeeValue.toFixed(2)} bill redemption</div>
        </div>
      </div>

      {/* Program Settings Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="font-extrabold text-slate-900 dark:text-white">Loyalty Rules:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300">
          <label className="flex items-center gap-1.5">
            <span>Earn 1 pt per ₹</span>
            <input
              type="number"
              value={earnSpendThreshold}
              onChange={(e) => setEarnSpendThreshold(parseInt(e.target.value) || 100)}
              className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
            />
          </label>

          <label className="flex items-center gap-1.5">
            <span>1 pt = ₹</span>
            <input
              type="number"
              step="0.1"
              value={pointRupeeValue}
              onChange={(e) => setPointRupeeValue(parseFloat(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold text-amber-600"
            />
          </label>

          <label className="flex items-center gap-1.5">
            <span>Min pts to redeem:</span>
            <input
              type="number"
              value={minRedeemPoints}
              onChange={(e) => setMinRedeemPoints(parseInt(e.target.value) || 50)}
              className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
            />
          </label>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Customer Directory ({filteredCustomers.length})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any customer to manage points or send promotional WhatsApp offers.
            </p>
          </div>
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Loyalty Tier</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Points Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((cust) => {
                const tier = getTier(cust.totalSpent);

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{cust.name}</div>
                      <div className="text-[10px] text-slate-400">{cust.email || 'No email registered'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {cust.phone}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${tier.color}`}
                      >
                        {tier.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {cust.ordersCount} Visits
                    </td>
                    <td className="py-3 px-4 font-black text-amber-600">
                      {formatCurrency(cust.totalSpent)}
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600 text-sm">
                      {cust.loyaltyPoints} Pts
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setPointsDelta(50);
                          setPointsAdjustModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold hover:bg-amber-100 cursor-pointer"
                      >
                        Adjust Pts
                      </button>
                      <a
                        href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${cust.name}! You have ${cust.loyaltyPoints} loyalty points at ${settings.name}. Visit us today and enjoy delicious handcrafted coffee & food!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 inline-flex items-center gap-1"
                        title="Send WhatsApp Promotion"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Points Modal */}
      {pointsAdjustModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Adjust Loyalty Points: {selectedCustomer.name}
              </h3>
              <button
                type="button"
                onClick={() => setPointsAdjustModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-900 dark:text-amber-200">
                <div className="font-bold">Current Balance: {selectedCustomer.loyaltyPoints} Points</div>
                <div className="text-[11px] mt-0.5">
                  Enter positive value to credit points (e.g. +100) or negative value to debit (e.g. -50).
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Points Adjustment Value
                </label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-base text-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Birthday gift, Customer appreciation, Service apology"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPointsAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-md"
                >
                  Apply Points Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
