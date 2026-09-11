import {
  AlertCircle,
  Award,
  BarChart3,
  Bike,
  Building2,
  Calculator,
  ChefHat,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Coffee,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Flame,
  Grid,
  Heart,
  Info,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Moon,
  Package,
  Percent,
  QrCode,
  Receipt,
  RotateCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Store,
  Sun,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import { formatCurrency, getRoleDetails } from '../../utils/formatters';

interface HamburgerMenuDrawerProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const HamburgerMenuDrawer: React.FC<HamburgerMenuDrawerProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const { isHamburgerOpen, setIsHamburgerOpen, adminSubTab, setAdminSubTab, coupons, expenses, shifts, settings, syncStats } =
    useRestaurant();
  const { currentUser, canAccessModule, quickLoginAs, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHamburgerOpen) {
        setIsHamburgerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHamburgerOpen, setIsHamburgerOpen]);

  if (!isHamburgerOpen) return null;

  const roleInfo = currentUser ? getRoleDetails(currentUser.role) : { label: 'Guest', bg: 'bg-gray-100', text: 'text-gray-700' };
  const activeShift = shifts.find((s) => s.status === 'open');

  // Handle navigation click
  const handleNavigatePortal = (portalId: string) => {
    setCurrentTab(portalId);
    setIsHamburgerOpen(false);
  };

  const handleNavigateAdminSubtab = (subTabId: 'analytics' | 'offers' | 'performance' | 'menu' | 'tables' | 'expenses' | 'staff' | 'settings' | 'audit') => {
    setAdminSubTab(subTabId);
    setCurrentTab('admin');
    setIsHamburgerOpen(false);
  };

  // Operational Portals List
  const operationalPortals = [
    {
      id: 'pos',
      label: 'POS Terminal',
      description: 'Touch Billing, Orders & Floor Table Management',
      icon: Store,
      badge: 'Touch POS',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      allowedRoles: ['super_admin', 'admin', 'cashier', 'biller'],
    },
    {
      id: 'kds',
      label: 'Kitchen KDS',
      description: 'Live Cooking Queue, Dish Timers & Ticket Expeditor',
      icon: ChefHat,
      badge: 'Live KDS',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      allowedRoles: ['super_admin', 'admin', 'kitchen_staff'],
    },
    {
      id: 'biller',
      label: 'Billing Counter',
      description: 'Invoice Settlement, Discounts & Guest Receipts',
      icon: Receipt,
      badge: 'Invoices',
      badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      allowedRoles: ['super_admin', 'admin', 'biller', 'cashier'],
    },
    {
      id: 'inventory',
      label: 'Inventory & Store',
      description: 'Ingredient Stock, Purchase Orders & Wastage',
      icon: Package,
      badge: 'Store',
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      allowedRoles: ['super_admin', 'admin', 'inventory_staff'],
    },
    {
      id: 'rider',
      label: 'Rider Delivery',
      description: 'Delivery Dispatch, GPS Route & Proof of Delivery',
      icon: Bike,
      badge: 'Dispatch',
      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      allowedRoles: ['super_admin', 'admin', 'delivery_rider'],
    },
    {
      id: 'sop',
      label: 'SOP & Operations',
      description: 'Opening/Closing Checklists & Sanitization Logs',
      icon: ClipboardCheck,
      badge: 'SOP',
      badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
      allowedRoles: ['super_admin', 'admin', 'cashier', 'biller', 'kitchen_staff', 'delivery_rider', 'inventory_staff', 'employee'],
    },
    {
      id: 'customer_menu',
      label: 'Digital QR Menu',
      description: 'Customer Self-Ordering Live Digital QR Experience',
      icon: QrCode,
      badge: 'Guest Menu',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      allowedRoles: ['super_admin', 'admin', 'cashier', 'biller', 'kitchen_staff', 'delivery_rider', 'inventory_staff', 'employee'],
    },
  ];

  // Admin Dashboard Management Menus List
  const adminSubMenus = [
    {
      id: 'analytics',
      label: 'Executive Analytics',
      description: 'Sales Revenue, Category Breakdown & P&L',
      icon: BarChart3,
    },
    {
      id: 'outlets',
      label: 'Multi-Branch & Outlets',
      description: 'Central Brand, Outlets & POS Terminals',
      icon: Building2,
    },
    {
      id: 'modifiers',
      label: 'Modifiers & Add-ons',
      description: 'Customizations, Flavors & Variations',
      icon: Sliders,
    },
    {
      id: 'bulk_upload',
      label: 'Bulk CSV Menu Upload',
      description: 'Import & Export Excel/CSV Catalog',
      icon: FileSpreadsheet,
    },
    {
      id: 'tax_gst',
      label: 'GST & Tax Master',
      description: 'CGST, SGST, IGST & GSTR-3B Reports',
      icon: Percent,
    },
    {
      id: 'aggregators',
      label: 'Swiggy & Zomato Hub',
      description: 'Aggregator Channels, Markups & Sync',
      icon: Bike,
    },
    {
      id: 'crm_loyalty',
      label: 'Customer Loyalty & CRM',
      description: 'Points, Rewards & WhatsApp Marketing',
      icon: Heart,
    },
    {
      id: 'day_end',
      label: 'Day-End Z-Report Audit',
      description: 'Cash Drawer Balancing & Z-Report',
      icon: Calculator,
    },
    {
      id: 'receipt_designer',
      label: 'Receipt & KOT Designer',
      description: 'Thermal Print Formatter & QR',
      icon: Receipt,
    },
    {
      id: 'offers',
      label: 'Offers & Coupons',
      description: 'Promo Codes, Flat/Percent Off & BOGO Rules',
      icon: Sparkles,
      countBadge: coupons.filter((c) => c.isActive).length,
    },
    {
      id: 'performance',
      label: 'Staff Performance',
      description: 'Cashier Sales Volume, Leaderboards & Tips',
      icon: TrendingUp,
    },
    {
      id: 'menu',
      label: 'Menu & Categories',
      description: 'Categories, Food Items, Modifiers & Recipes',
      icon: UtensilsCrossed,
    },
    {
      id: 'tables',
      label: 'Floor Layout & QR',
      description: 'Dining Room Tables, Zones & Printable QR Codes',
      icon: Layers,
    },
    {
      id: 'expenses',
      label: 'Petty Cash & Expenses',
      description: 'Direct Cash Outflows, Vendor Bills & Ledger',
      icon: Wallet,
      countBadge: expenses.length,
    },
    {
      id: 'staff',
      label: 'Staff & Roles',
      description: 'User Access PINs, Role Privileges & Crew Roster',
      icon: Users,
    },
    {
      id: 'settings',
      label: 'Store Settings',
      description: 'GST/Tax, Outlet Profile & Thermal Print Format',
      icon: Settings,
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      description: 'System Activity Logs, Cash Voids & Timestamped Audit',
      icon: FileText,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={() => setIsHamburgerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer */}
      <div
        role="dialog"
        aria-label="Navigation Menu Drawer"
        className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-300 overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Café<span className="text-amber-600">OS</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{settings.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsHamburgerOpen(false)}
            title="Close Menu (Esc)"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {currentUser && (
          <div className="px-5 py-3 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100/80 dark:border-amber-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  currentUser.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                }
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-amber-500/40 shadow-xs"
              />
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${roleInfo.bg} ${roleInfo.text}`}>
                    {roleInfo.label}
                  </span>
                  {activeShift ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Shift Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-medium">Shift Closed</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        )}

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* SECTION 1: Operational Portals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Operational Terminals</span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Live Portals</span>
            </div>

            <div className="space-y-1">
              {operationalPortals.map((portal) => {
                const Icon = portal.icon;
                const isSelected = currentTab === portal.id;
                const isAllowed =
                  currentUser?.role === 'super_admin' ||
                  currentUser?.role === 'admin' ||
                  (canAccessModule && canAccessModule(portal.id)) ||
                  portal.allowedRoles.includes(currentUser?.role || '');

                return (
                  <button
                    key={portal.id}
                    type="button"
                    onClick={() => handleNavigatePortal(portal.id)}
                    className={`w-full text-left p-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                        : isAllowed
                        ? 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                        : 'opacity-50 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black leading-tight flex items-center gap-2">
                          <span>{portal.label}</span>
                          {!isAllowed && <Lock className="w-3 h-3 text-slate-400" />}
                        </div>
                        <div
                          className={`text-[11px] leading-tight truncate max-w-[200px] mt-0.5 ${
                            isSelected ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {portal.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : portal.badgeColor
                        }`}
                      >
                        {portal.badge}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Executive & Administration Menus */}
          <div className="pt-5 space-y-2">
            <div className="flex items-center justify-between px-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Admin & Executive Management</span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Controls</span>
            </div>

            <div className="space-y-1">
              {/* Main Admin Dashboard Portal Link */}
              <button
                type="button"
                onClick={() => handleNavigatePortal('admin')}
                className={`w-full text-left p-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between group ${
                  currentTab === 'admin' && adminSubTab === 'analytics'
                    ? 'bg-amber-600 text-white shadow-md font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      currentTab === 'admin' && adminSubTab === 'analytics'
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black leading-tight">Admin Dashboard Hub</div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 ${
                        currentTab === 'admin' && adminSubTab === 'analytics'
                          ? 'text-white/80'
                          : 'text-slate-400'
                      }`}
                    >
                      Executive overview, P&L & core controls
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Sub-menus */}
              {adminSubMenus.map((sub) => {
                const Icon = sub.icon;
                const isSelected = currentTab === 'admin' && adminSubTab === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleNavigateAdminSubtab(sub.id as any)}
                    className={`w-full text-left p-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                          <span>{sub.label}</span>
                        </div>
                        <div
                          className={`text-[11px] leading-tight truncate max-w-[200px] mt-0.5 ${
                            isSelected ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {sub.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sub.countBadge !== undefined && sub.countBadge > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isSelected
                              ? 'bg-white text-amber-600'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {sub.countBadge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrentTab('login');
                setIsHamburgerOpen(false);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Login Terminal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                setCurrentTab('login');
                setIsHamburgerOpen(false);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
