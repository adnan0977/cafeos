import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Edit3,
  Flame,
  Layers,
  Percent,
  Plus,
  Power,
  Search,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  Utensils,
  Zap,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Coupon, DiscountType, OrderType } from '../../types';

interface CouponFormData {
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountCap?: number;
  minOrderValue: number;
  validFrom: string;
  validUntil: string;
  usageLimitTotal?: number;
  usageLimitPerCustomer?: number;
  isActive: boolean;
  isAutoApply: boolean;
  tag?: string;
  orderTypeRestrictions: OrderType[];
  applicableCategoryIds: string[];
  applicableMenuItemIds: string[];
  bogoTriggerItemId?: string;
  bogoFreeItemId?: string;
  freeMenuItemId?: string;
  enableTimeRestrictions: boolean;
  startHour: number;
  endHour: number;
  daysOfWeek: number[];
}

const DEFAULT_FORM: CouponFormData = {
  code: '',
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: 15,
  maxDiscountCap: 150,
  minOrderValue: 300,
  validFrom: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  usageLimitTotal: 500,
  usageLimitPerCustomer: 1,
  isActive: true,
  isAutoApply: false,
  tag: 'Special Offer',
  orderTypeRestrictions: [],
  applicableCategoryIds: [],
  applicableMenuItemIds: [],
  enableTimeRestrictions: false,
  startHour: 14,
  endHour: 18,
  daysOfWeek: [],
};

const DAYS_NAME = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CouponsManagement: React.FC = () => {
  const {
    coupons,
    categories,
    menuItems,
    settings,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(DEFAULT_FORM);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Simulation state
  const [testAmount, setTestAmount] = useState<number>(500);
  const [simulatedResult, setSimulatedResult] = useState<{ code: string; discount: number; final: number } | null>(null);

  // Analytics Metrics
  const totalActive = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const totalDiscountGiven = coupons.reduce((sum, c) => sum + (c.totalDiscountGiven || 0), 0);
  const totalRevenueGenerated = coupons.reduce((sum, c) => sum + (c.totalRevenueGenerated || 0), 0);

  const topPerforming = [...coupons].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = (preset?: Partial<CouponFormData>) => {
    setEditingCouponId(null);
    setFormData({
      ...DEFAULT_FORM,
      ...(preset || {}),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountCap: coupon.maxDiscountCap,
      minOrderValue: coupon.minOrderValue,
      validFrom: coupon.validFrom || new Date().toISOString().split('T')[0],
      validUntil: coupon.validUntil || '',
      usageLimitTotal: coupon.usageLimitTotal,
      usageLimitPerCustomer: coupon.usageLimitPerCustomer,
      isActive: coupon.isActive,
      isAutoApply: !!coupon.isAutoApply,
      tag: coupon.tag || 'Special Offer',
      orderTypeRestrictions: coupon.orderTypeRestrictions || [],
      applicableCategoryIds: coupon.applicableCategoryIds || [],
      applicableMenuItemIds: coupon.applicableMenuItemIds || [],
      bogoTriggerItemId: coupon.bogoTriggerItemId,
      bogoFreeItemId: coupon.bogoFreeItemId,
      freeMenuItemId: coupon.freeMenuItemId,
      enableTimeRestrictions: !!coupon.timeRestrictions,
      startHour: coupon.timeRestrictions?.startHour ?? 14,
      endHour: coupon.timeRestrictions?.endHour ?? 18,
      daysOfWeek: coupon.timeRestrictions?.daysOfWeek ?? [],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('Offer title is required.');
      return;
    }
    if (formData.discountValue <= 0 && formData.discountType !== 'bogo' && formData.discountType !== 'free_item') {
      setFormError('Discount value must be greater than 0.');
      return;
    }

    const payload: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'totalDiscountGiven' | 'totalRevenueGenerated'> = {
      code: formData.code.trim().toUpperCase(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue) || 0,
      maxDiscountCap: formData.maxDiscountCap ? Number(formData.maxDiscountCap) : undefined,
      minOrderValue: Number(formData.minOrderValue) || 0,
      validFrom: formData.validFrom || undefined,
      validUntil: formData.validUntil || undefined,
      usageLimitTotal: formData.usageLimitTotal ? Number(formData.usageLimitTotal) : undefined,
      usageLimitPerCustomer: formData.usageLimitPerCustomer ? Number(formData.usageLimitPerCustomer) : undefined,
      isActive: formData.isActive,
      isAutoApply: formData.isAutoApply,
      tag: formData.tag?.trim() || undefined,
      orderTypeRestrictions: formData.orderTypeRestrictions.length > 0 ? formData.orderTypeRestrictions : undefined,
      applicableCategoryIds: formData.applicableCategoryIds.length > 0 ? formData.applicableCategoryIds : undefined,
      applicableMenuItemIds: formData.applicableMenuItemIds.length > 0 ? formData.applicableMenuItemIds : undefined,
      bogoTriggerItemId: formData.bogoTriggerItemId || undefined,
      bogoFreeItemId: formData.bogoFreeItemId || undefined,
      freeMenuItemId: formData.freeMenuItemId || undefined,
      timeRestrictions: formData.enableTimeRestrictions
        ? {
            startHour: Number(formData.startHour),
            endHour: Number(formData.endHour),
            daysOfWeek: formData.daysOfWeek.length > 0 ? formData.daysOfWeek : undefined,
          }
        : undefined,
    };

    if (editingCouponId) {
      updateCoupon(editingCouponId, payload);
    } else {
      addCoupon(payload);
    }

    setIsModalOpen(false);
  };

  const handleDuplicate = (coupon: Coupon) => {
    handleOpenCreateModal({
      code: `${coupon.code}_COPY`,
      title: `${coupon.title} (Copy)`,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountCap: coupon.maxDiscountCap,
      minOrderValue: coupon.minOrderValue,
      tag: coupon.tag,
      isActive: true,
      isAutoApply: false,
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coupon.tag && coupon.tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      selectedTypeFilter === 'all' || coupon.discountType === selectedTypeFilter;

    let matchesStatus = true;
    const isExpired = coupon.validUntil && coupon.validUntil < todayStr;

    if (selectedStatusFilter === 'active') {
      matchesStatus = coupon.isActive && !isExpired;
    } else if (selectedStatusFilter === 'inactive') {
      matchesStatus = !coupon.isActive;
    } else if (selectedStatusFilter === 'expired') {
      matchesStatus = !!isExpired;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const getDiscountBadge = (coupon: Coupon) => {
    switch (coupon.discountType) {
      case 'percentage':
        return `${coupon.discountValue}% OFF`;
      case 'flat':
        return `${settings.currencySymbol}${coupon.discountValue} FLAT OFF`;
      case 'bogo':
        return 'BUY 1 GET 1 FREE';
      case 'free_item':
        return 'FREE ITEM';
      default:
        return `${coupon.discountValue} OFF`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Offers & Coupon Campaigns
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Design discount promotions, happy hour vouchers, BOGO deals & track sales uplift
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Offer</span>
          </button>
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Active Offers</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-3">
            {totalActive}
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400 ml-1.5">
              / {coupons.length} total
            </span>
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Live on POS & checkout</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Redemptions</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-3">
            {totalRedemptions.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Orders discounted</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Discounts Given</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-3">
            {settings.currencySymbol}
            {totalDiscountGiven.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
            <Tag className="w-3.5 h-3.5" />
            <span>Customer savings disbursed</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Revenue Driven</span>
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-3">
            {settings.currencySymbol}
            {totalRevenueGenerated.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium truncate">
            <Flame className="w-3.5 h-3.5" />
            <span>Top: {topPerforming?.code || 'WELCOME20'} ({topPerforming?.usageCount || 0} uses)</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Preset Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-neutral-800 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              Popular Campaign Templates:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                handleOpenCreateModal({
                  code: 'HAPPYHOUR',
                  title: 'Happy Hour Afternoon Boost',
                  description: 'Flat ₹75 off coffee and artisan bites from 2 PM to 6 PM',
                  discountType: 'flat',
                  discountValue: 75,
                  minOrderValue: 300,
                  enableTimeRestrictions: true,
                  startHour: 14,
                  endHour: 18,
                  tag: 'Happy Hour',
                })
              }
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 hover:text-amber-600 transition-colors shadow-2xs"
            >
              ☕ Happy Hour 2-6 PM
            </button>
            <button
              onClick={() =>
                handleOpenCreateModal({
                  code: 'BOGO2026',
                  title: 'Buy 1 Beverage Get 1 Free',
                  description: 'Buy any signature roast or beverage and get the second one on the house',
                  discountType: 'bogo',
                  discountValue: 100,
                  minOrderValue: 180,
                  tag: 'BOGO Deal',
                })
              }
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 hover:text-amber-600 transition-colors shadow-2xs"
            >
              🎁 BOGO Buy 1 Get 1
            </button>
            <button
              onClick={() =>
                handleOpenCreateModal({
                  code: 'WEEKEND20',
                  title: 'Weekend Feast 20% Off',
                  description: '20% off on all dine-in food orders on Saturday and Sunday (Max ₹200)',
                  discountType: 'percentage',
                  discountValue: 20,
                  maxDiscountCap: 200,
                  minOrderValue: 500,
                  enableTimeRestrictions: true,
                  daysOfWeek: [0, 6],
                  tag: 'Weekend Special',
                })
              }
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 hover:text-amber-600 transition-colors shadow-2xs"
            >
              🎉 Weekend 20% OFF
            </button>
            <button
              onClick={() =>
                handleOpenCreateModal({
                  code: 'DELIVERY50',
                  title: 'Free Delivery Special',
                  description: 'Flat ₹50 rebate on online direct deliveries over ₹350',
                  discountType: 'flat',
                  discountValue: 50,
                  minOrderValue: 350,
                  orderTypeRestrictions: ['delivery'],
                  tag: 'Delivery Special',
                })
              }
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 hover:text-amber-600 transition-colors shadow-2xs"
            >
              🛵 Delivery Exclusive
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search code (e.g. WELCOME20), title, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>

          {/* Type filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Discount Types</option>
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat Amount (₹)</option>
            <option value="bogo">Buy 1 Get 1 (BOGO)</option>
            <option value="free_item">Free Menu Item</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-700/60 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Grid Cards"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <Tag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 p-12 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Tag className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No promotional coupons found</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1 mb-4">
            {searchQuery
              ? `No coupons match "${searchQuery}". Try clearing search filters.`
              : 'Create your first marketing offer or choose from popular templates above.'}
          </p>
          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Coupon</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Voucher Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoupons.map((coupon) => {
            const isExpired = coupon.validUntil && coupon.validUntil < todayStr;
            const isCurrentlyActive = coupon.isActive && !isExpired;

            return (
              <div
                key={coupon.id}
                className={`relative flex flex-col justify-between bg-white dark:bg-neutral-800 rounded-2xl border transition-all overflow-hidden shadow-xs hover:shadow-md ${
                  !coupon.isActive
                    ? 'opacity-70 border-neutral-200 dark:border-neutral-700'
                    : isExpired
                    ? 'border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10'
                    : 'border-neutral-200/80 dark:border-neutral-700/80 hover:border-amber-300 dark:hover:border-amber-700'
                }`}
              >
                {/* Decorative Top Accent Bar */}
                <div
                  className={`h-1.5 w-full ${
                    !coupon.isActive
                      ? 'bg-neutral-300 dark:bg-neutral-600'
                      : isExpired
                      ? 'bg-red-400'
                      : coupon.discountType === 'percentage'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : coupon.discountType === 'flat'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : coupon.discountType === 'bogo'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                />

                <div className="p-5 space-y-4">
                  {/* Top Tags & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-lg border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {coupon.tag || 'Promotion'}
                    </span>

                    <div className="flex items-center gap-2">
                      {coupon.isAutoApply && (
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium rounded-md border border-blue-200/60 dark:border-blue-800/40">
                          Auto-Apply
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isExpired
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                            : coupon.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Coupon Code Voucher Badge */}
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-base font-black tracking-wider text-amber-600 dark:text-amber-400">
                        {coupon.code}
                      </div>
                      <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-bold rounded">
                        {getDiscountBadge(coupon)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                      title="Copy Code"
                    >
                      {copiedCode === coupon.code ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="font-bold text-neutral-900 dark:text-white text-base leading-tight">
                      {coupon.title}
                    </h4>
                    {coupon.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {coupon.description}
                      </p>
                    )}
                  </div>

                  {/* Restriction Badges */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {coupon.minOrderValue > 0 && (
                      <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300 rounded">
                        Min spend: {settings.currencySymbol}
                        {coupon.minOrderValue}
                      </span>
                    )}

                    {coupon.maxDiscountCap && (
                      <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300 rounded">
                        Max cap: {settings.currencySymbol}
                        {coupon.maxDiscountCap}
                      </span>
                    )}

                    {coupon.timeRestrictions && (
                      <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded border border-purple-200/50 dark:border-purple-800/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {coupon.timeRestrictions.startHour}:00 - {coupon.timeRestrictions.endHour}:00
                      </span>
                    )}

                    {coupon.orderTypeRestrictions && coupon.orderTypeRestrictions.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200/50 dark:border-blue-800/40">
                        {coupon.orderTypeRestrictions.join(', ').replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* Expiry & Usage Summary */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {coupon.validUntil ? `Expires: ${coupon.validUntil}` : 'No expiration date'}
                      </span>
                    </div>

                    <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {coupon.usageCount || 0}
                      {coupon.usageLimitTotal ? ` / ${coupon.usageLimitTotal}` : ''} used
                    </div>
                  </div>

                  {/* Performance stats mini bar */}
                  {(coupon.totalDiscountGiven || 0) > 0 && (
                    <div className="p-2 bg-neutral-50 dark:bg-neutral-900/40 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-neutral-500 dark:text-neutral-400">Total Saved / Driven:</span>
                      <div className="font-medium text-neutral-900 dark:text-white">
                        <span className="text-amber-600 dark:text-amber-400">
                          {settings.currencySymbol}
                          {coupon.totalDiscountGiven?.toLocaleString()}
                        </span>
                        <span className="text-neutral-400 mx-1">/</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {settings.currencySymbol}
                          {coupon.totalRevenueGenerated?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-neutral-50/80 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between">
                  <button
                    onClick={() => toggleCouponStatus(coupon.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                      coupon.isActive
                        ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40'
                        : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    title="Toggle active status"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{coupon.isActive ? 'Active' : 'Disabled'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(coupon)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      title="Duplicate Offer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(coupon)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      title="Edit Offer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete coupon code "${coupon.code}"?`)) {
                          deleteCoupon(coupon.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-xs font-semibold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-5 py-3.5">Code & Title</th>
                  <th className="px-5 py-3.5">Discount Offer</th>
                  <th className="px-5 py-3.5">Conditions</th>
                  <th className="px-5 py-3.5">Valid Range</th>
                  <th className="px-5 py-3.5">Usage / Revenue</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.validUntil && coupon.validUntil < todayStr;
                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-700/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                            {coupon.code}
                          </span>
                          {coupon.isAutoApply && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-medium px-1.5 py-0.5 rounded">
                              Auto
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-neutral-900 dark:text-white mt-1">
                          {coupon.title}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {getDiscountBadge(coupon)}
                        </span>
                        {coupon.maxDiscountCap && (
                          <p className="text-xs text-neutral-500">
                            Max {settings.currencySymbol}
                            {coupon.maxDiscountCap}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                        <div>
                          Min: {settings.currencySymbol}
                          {coupon.minOrderValue}
                        </div>
                        {coupon.timeRestrictions && (
                          <div className="text-purple-600 dark:text-purple-400 font-medium">
                            {coupon.timeRestrictions.startHour}:00 - {coupon.timeRestrictions.endHour}:00
                          </div>
                        )}
                        {coupon.orderTypeRestrictions && (
                          <div className="text-blue-600 dark:text-blue-400">
                            {coupon.orderTypeRestrictions.join(', ')}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-neutral-500 dark:text-neutral-400">
                        <div>From: {coupon.validFrom || 'Anytime'}</div>
                        <div>To: {coupon.validUntil || 'No Expiry'}</div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {coupon.usageCount || 0} redemptions
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {settings.currencySymbol}
                          {coupon.totalRevenueGenerated?.toLocaleString()} sales
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleCouponStatus(coupon.id)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                            isExpired
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                              : coupon.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete coupon "${coupon.code}"?`)) {
                                deleteCoupon(coupon.id);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create & Edit Offer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-800 w-full max-w-2xl rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                    {editingCouponId ? 'Edit Promotional Coupon' : 'Create New Promotional Offer'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Configure discount rules, spending thresholds & schedule
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Code & Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Coupon Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME20, HAPPYHOUR"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm font-mono font-bold text-amber-600 dark:text-amber-400 uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-neutral-400">Customer enters this at checkout</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Campaign Tag / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Happy Hour, First Order, Weekend Special"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20% Off Welcome Treat on Orders above ₹300"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Offer Description / Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain terms, max discount caps, or item inclusions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Discount Type & Values */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                      <option value="bogo">Buy 1 Get 1 (BOGO)</option>
                      <option value="free_item">Free Menu Item</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      {formData.discountType === 'percentage'
                        ? 'Discount Percent (%) *'
                        : formData.discountType === 'flat'
                        ? `Flat Amount (${settings.currencySymbol}) *`
                        : 'Discount Value'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.discountType === 'percentage' ? 100 : 99999}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Min Order Spend ({settings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Max Discount Cap ({settings.currencySymbol}) (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 150 (Leave blank for uncapped discount)"
                      value={formData.maxDiscountCap || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscountCap: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                {/* BOGO Item Selectors */}
                {formData.discountType === 'bogo' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Buy Item (Trigger)
                      </label>
                      <select
                        value={formData.bogoTriggerItemId || ''}
                        onChange={(e) => setFormData({ ...formData, bogoTriggerItemId: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-medium text-neutral-900 dark:text-white"
                      >
                        <option value="">Any eligible menu item</option>
                        {menuItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({settings.currencySymbol}{item.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Get Item (Free Reward)
                      </label>
                      <select
                        value={formData.bogoFreeItemId || ''}
                        onChange={(e) => setFormData({ ...formData, bogoFreeItemId: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-medium text-neutral-900 dark:text-white"
                      >
                        <option value="">Same item as purchased</option>
                        {menuItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({settings.currencySymbol}{item.price})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Free Item Selector */}
                {formData.discountType === 'free_item' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Free Reward Item
                    </label>
                    <select
                      value={formData.freeMenuItemId || ''}
                      onChange={(e) => setFormData({ ...formData, freeMenuItemId: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-medium text-neutral-900 dark:text-white"
                    >
                      <option value="">Select promotional gift item...</option>
                      {menuItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({settings.currencySymbol}{item.price})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Date Validity Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Valid From Date
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Valid Until Date (Expiry)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Happy Hour / Time-based restrictions */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableTimeRestrictions}
                      onChange={(e) => setFormData({ ...formData, enableTimeRestrictions: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded border-neutral-300 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Enable Happy Hour / Time Window Restriction
                    </span>
                  </label>
                </div>

                {formData.enableTimeRestrictions && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          Start Time (Hour: 0 - 23)
                        </label>
                        <select
                          value={formData.startHour}
                          onChange={(e) => setFormData({ ...formData, startHour: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-xs font-medium"
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <option key={h} value={h}>
                              {h % 12 || 12}:00 {h >= 12 ? 'PM' : 'AM'} ({h}:00)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          End Time (Hour: 0 - 23)
                        </label>
                        <select
                          value={formData.endHour}
                          onChange={(e) => setFormData({ ...formData, endHour: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-xs font-medium"
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <option key={h} value={h}>
                              {h % 12 || 12}:00 {h >= 12 ? 'PM' : 'AM'} ({h}:00)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Active Days of Week (Leave empty for all days)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_NAME.map((dayName, dayIndex) => {
                          const isSelected = formData.daysOfWeek.includes(dayIndex);
                          return (
                            <button
                              type="button"
                              key={dayIndex}
                              onClick={() => {
                                const newDays = isSelected
                                  ? formData.daysOfWeek.filter((d) => d !== dayIndex)
                                  : [...formData.daysOfWeek, dayIndex];
                                setFormData({ ...formData, daysOfWeek: newDays });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600'
                              }`}
                            >
                              {dayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Type Restrictions & Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Order Channel Restrictions
                  </label>
                  <div className="space-y-1.5">
                    {(['dine_in', 'takeaway', 'delivery', 'drive_thru'] as OrderType[]).map((type) => {
                      const isChecked = formData.orderTypeRestrictions.includes(type);
                      return (
                        <label key={type} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...formData.orderTypeRestrictions, type]
                                : formData.orderTypeRestrictions.filter((t) => t !== type);
                              setFormData({ ...formData, orderTypeRestrictions: updated });
                            }}
                            className="w-3.5 h-3.5 text-amber-600 rounded border-neutral-300 focus:ring-amber-500"
                          />
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-neutral-400">Leave unchecked to allow all channels</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Total Campaign Redemptions Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 500 (Blank for unlimited)"
                      value={formData.usageLimitTotal || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usageLimitTotal: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs text-neutral-900 dark:text-white"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded border-neutral-300 focus:ring-amber-500"
                      />
                      <span>Active & Available for Redemption</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAutoApply}
                        onChange={(e) => setFormData({ ...formData, isAutoApply: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded border-neutral-300 focus:ring-amber-500"
                      />
                      <span>Auto-apply to eligible orders automatically</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {editingCouponId ? 'Save Changes' : 'Publish Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
