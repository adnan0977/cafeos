import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coffee,
  Info,
  KeyRound,
  Lock,
  LogOut,
  Menu,
  Moon,
  Monitor,
  Search,
  Shield,
  ShieldCheck,
  Store,
  Sun,
  UserCheck,
  Users,
  Wallet,
  Wifi,
  WifiOff,
  ArrowDownUp,
  RotateCw,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import { formatCurrency, formatTime, getRoleDetails } from '../../utils/formatters';
import { ChangePinModal } from './ChangePinModal';
import { StoreSwitcher } from './StoreSwitcher';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, quickLoginAs, switchUser, allUsers, logout, canAccessModule } = useAuth();
  const {
    settings,
    activeOrganization,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    shifts,
    setIsShiftModalOpen,
    setIsSearchModalOpen,
    isOnline,
    isSimulatedOffline,
    syncStats,
    setIsSyncModalOpen,
    isHamburgerOpen,
    setIsHamburgerOpen,
    ingredients,
  } = useRestaurant();
  const { theme, isDark, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const activeShift = shifts.find((s) => s.status === 'open');

  const alertThreshold = settings.lowStockThreshold !== undefined ? settings.lowStockThreshold : 10;
  const alertItemsCount = ingredients ? ingredients.filter((i) => i.currentStock < alertThreshold).length : 0;

  const roleInfo = currentUser ? getRoleDetails(currentUser.role) : { label: 'Guest', bg: 'bg-gray-100', text: 'text-gray-700' };

  // All available portals in the system
  const allPortals = [
    { id: 'admin', label: 'Admin Dashboard', allowedRoles: ['super_admin', 'admin'], badge: 'Manager' },
    { id: 'windows_cashier', label: '💻 Windows Cashier POS', allowedRoles: ['super_admin', 'admin', 'cashier', 'biller'], badge: 'Windows App' },
    { id: 'reports', label: 'Reports & Analytics', allowedRoles: ['super_admin', 'admin'], badge: 'Reports' },
    { id: 'pos', label: 'POS Terminal', allowedRoles: ['super_admin', 'admin', 'cashier', 'biller'], badge: 'Touch' },
    { id: 'kds', label: 'Kitchen KDS', allowedRoles: ['super_admin', 'admin', 'kitchen_staff'], badge: 'Live' },
    { id: 'biller', label: 'Billing Counter', allowedRoles: ['super_admin', 'admin', 'biller', 'cashier'], badge: 'Invoices' },
    { id: 'inventory', label: 'Inventory & Store', allowedRoles: ['super_admin', 'admin', 'inventory_staff'], badge: 'Stock' },
    { id: 'rider', label: 'Rider Delivery', allowedRoles: ['super_admin', 'admin', 'delivery_rider'], badge: 'Mobile' },
    { id: 'sop', label: 'SOP & Operations', allowedRoles: ['super_admin', 'admin', 'cashier', 'biller', 'kitchen_staff', 'delivery_rider', 'inventory_staff', 'employee'], badge: 'Tasks' },
    { id: 'customer_menu', label: 'Digital QR Menu', allowedRoles: ['super_admin', 'admin', 'cashier', 'biller', 'kitchen_staff', 'delivery_rider', 'inventory_staff', 'employee'], badge: 'Self-Order' },
    { id: 'login', label: '🔐 Admin Login', allowedRoles: ['*'], badge: 'Admin Only' },
  ];

  // Dynamic role-filtered portals (Active operational portals for logged in user)
  const visiblePortals = currentUser
    ? allPortals.filter((p) => {
        if (p.id === 'login') return false;
        // Strict guard: Admin portal is exclusively for Super Admin and Store Managers
        if (p.id === 'admin') {
          return currentUser.role === 'super_admin' || currentUser.role === 'admin';
        }
        if (currentUser.role === 'super_admin' || currentUser.role === 'admin') return true;
        if (canAccessModule) return canAccessModule(p.id);
        return p.allowedRoles.includes(currentUser.role);
      })
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Ambient Internet Outage Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 animate-pulse shrink-0" />
            <span>
              {isSimulatedOffline ? 'Simulated Offline Mode Active' : 'Temporary Internet Outage'} — POS & KDS active. Transactions queued in IndexedDB.
            </span>
          </div>
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-2 py-0.5 rounded-md bg-slate-950 text-amber-300 text-[10px] font-black uppercase tracking-wider hover:bg-slate-900 transition-colors flex items-center gap-1"
          >
            <span>View Queue ({syncStats.queuedCount})</span>
          </button>
        </div>
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer"
              onClick={() => {
                if (currentUser) {
                  if (currentUser.role === 'super_admin' || currentUser.role === 'admin') setCurrentTab('admin');
                  else if (currentUser.role === 'cashier') setCurrentTab('pos');
                  else if (currentUser.role === 'biller') setCurrentTab('biller');
                  else if (currentUser.role === 'kitchen_staff') setCurrentTab('kds');
                  else if (currentUser.role === 'inventory_staff') setCurrentTab('inventory');
                  else if (currentUser.role === 'delivery_rider') setCurrentTab('rider');
                  else setCurrentTab('sop');
                } else {
                  setCurrentTab('login');
                }
              }}
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-slate-900/10 shrink-0 overflow-hidden text-center transition-transform group-hover:scale-105"
                style={{ backgroundColor: activeOrganization?.brandColor || '#d97706' }}
              >
                {activeOrganization?.logo && (activeOrganization.logo.startsWith('http') || activeOrganization.logo.startsWith('/') || activeOrganization.logo.startsWith('data:')) ? (
                  <img src={activeOrganization.logo} alt={activeOrganization.name} className="w-full h-full object-cover" />
                ) : activeOrganization?.logo ? (
                  <span className="text-xl sm:text-2xl leading-none select-none">{activeOrganization.logo}</span>
                ) : (
                  <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px] md:max-w-[240px]">
                    {activeOrganization?.name || settings.name || 'CaféOS'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                    {activeOrganization?.tier ? activeOrganization.tier.toUpperCase() : 'POS'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-medium truncate max-w-[90px] sm:max-w-[130px]">
                    {activeOrganization?.tagline || settings.tagline || 'Billing System'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
                    {activeOrganization?.poweredByText || 'Powered by CafeOS'}
                  </span>
                </div>
              </div>
            </div>

            {/* Multi-Store Switcher (Single user managing multiple stores) */}
            {currentUser && (
              <div className="ml-1 sm:ml-3">
                <StoreSwitcher
                  onNavigateToOutlets={() => {
                    setCurrentTab('admin');
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Action Icons & User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Offline Sync Pill */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                !isOnline
                  ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30'
                  : syncStats.isSyncing
                  ? 'border-blue-400 bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : syncStats.queuedCount > 0
                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
              title="IndexedDB Background Sync & Outage Monitor"
            >
              {syncStats.isSyncing ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
              ) : isOnline ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="hidden sm:inline">
                {syncStats.isSyncing
                  ? 'Syncing...'
                  : !isOnline
                  ? `Offline (${syncStats.queuedCount})`
                  : syncStats.queuedCount > 0
                  ? `Sync (${syncStats.queuedCount})`
                  : 'Online'}
              </span>
            </button>
            {currentUser ? (
              <>
                {/* Global Search Button */}
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-xs"
                  title="Quick Search (Orders, Items, Stock, SOPs)"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <span className="hidden md:inline font-medium text-slate-500">Quick Search</span>
                  <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-mono">
                    ⌘K
                  </kbd>
                </button>

                {/* Windows POS Terminal Quick Launcher */}
                <button
                  onClick={() => setCurrentTab('windows_cashier')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-xs transition-colors ${
                    currentTab === 'windows_cashier'
                      ? 'bg-sky-600 text-white ring-2 ring-sky-400/50'
                      : 'bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 hover:border-sky-500/50 dark:bg-sky-950/60 dark:text-sky-300'
                  }`}
                  title="Launch Windows Cashier Billing Terminal"
                >
                  <Monitor className="w-3.5 h-3.5 text-sky-400" />
                  <span>Windows POS</span>
                </button>

                {/* Register Shift Status */}
                <button
                  onClick={() => setIsShiftModalOpen(true)}
                  className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    activeShift
                      ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                  }`}
                  title="Cash Drawer Shift Status"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{activeShift ? `Shift: ${formatCurrency(activeShift.openingCash + activeShift.cashSales)}` : 'Shift Closed'}</span>
                </button>

                {/* Global Theme Toggle Button (Light/Dark Mode) */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                  title={isDark ? 'Switch to Light Theme (Day Shift)' : 'Switch to Dark Theme (Night Shift)'}
                  aria-label="Toggle Theme"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
                      <span className="hidden xl:inline text-xs font-semibold text-slate-300">Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
                      <span className="hidden xl:inline text-xs font-semibold text-slate-700">Dark</span>
                    </>
                  )}
                </button>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-500" />
                          <span>Notifications ({notifications.length})</span>
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                !n.isRead ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                                {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                                {n.type === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                                {n.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                                <div className="flex-1">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</div>
                                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</div>
                                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(n.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Role / User Profile Switcher */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={currentUser?.name || 'User'}
                      className="w-7 h-7 rounded-full object-cover border border-amber-500/40"
                    />
                    <div className="hidden md:block">
                      <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[110px]">
                        {currentUser?.name || 'Guest'}
                      </div>
                      <div className={`text-[10px] font-medium ${roleInfo.text} leading-tight`}>
                        {roleInfo.label}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* User Switcher Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500">Currently logged in as</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser?.name}</p>
                        <p className="text-xs text-amber-600 font-medium">{currentUser?.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${roleInfo.bg} ${roleInfo.text}`}>
                          {roleInfo.label}
                        </span>
                      </div>

                      {/* Switch Role Quick Selection */}
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Quick Switch Test Role
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(
                            [
                              { role: 'super_admin', label: 'Owner' },
                              { role: 'admin', label: 'Manager' },
                              { role: 'cashier', label: 'Cashier' },
                              { role: 'biller', label: 'Biller' },
                              { role: 'kitchen_staff', label: 'Kitchen' },
                              { role: 'delivery_rider', label: 'Rider' },
                              { role: 'inventory_staff', label: 'Store' },
                              { role: 'employee', label: 'Staff' },
                            ] as { role: UserRole; label: string }[]
                          ).map((r) => (
                            <button
                              key={r.role}
                              onClick={() => {
                                quickLoginAs(r.role);
                                setShowUserMenu(false);
                                // Auto navigate to role primary portal
                                if (r.role === 'super_admin' || r.role === 'admin') setCurrentTab('admin');
                                else if (r.role === 'cashier') setCurrentTab('pos');
                                else if (r.role === 'biller') setCurrentTab('biller');
                                else if (r.role === 'kitchen_staff') setCurrentTab('kds');
                                else if (r.role === 'delivery_rider') setCurrentTab('rider');
                                else if (r.role === 'inventory_staff') setCurrentTab('inventory');
                                else if (r.role === 'employee') setCurrentTab('sop');
                              }}
                              className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                currentUser?.role === r.role
                                  ? 'bg-amber-500 text-white font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        {/* Theme Switcher in Dropdown */}
                        <button
                          onClick={toggleTheme}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isDark ? (
                              <Sun className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Moon className="w-4 h-4 text-indigo-500" />
                            )}
                            <span>{isDark ? 'Day Shift (Light Mode)' : 'Night Shift (Dark Mode)'}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isDark
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isDark ? 'Dark Active' : 'Light Active'}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setIsChangePinModalOpen(true);
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Lock className="w-4 h-4 text-amber-500" />
                          <span>Change My PIN</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentTab('login');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                          <span>Role Login Terminal</span>
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setCurrentTab('login');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Lock & Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* When front page (logged out), show theme toggle and clean login status pill */
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                  title={isDark ? 'Switch to Light Theme (Day Shift)' : 'Switch to Dark Theme (Night Shift)'}
                  aria-label="Toggle Theme"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-300">Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-slate-700" />
                      <span className="text-xs font-semibold text-slate-700">Dark</span>
                    </>
                  )}
                </button>
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black tracking-wide flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Terminal Login Station</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Unified Horizontal Portal Navigation Bar (For all screen sizes with smooth scrolling) */}
        {currentUser && visiblePortals.length > 0 && (
          <div className="flex overflow-x-auto py-2 gap-1.5 border-t border-slate-100 dark:border-slate-800/80 no-scrollbar">
            {visiblePortals.map((p) => {
              const isActive = currentTab === p.id;
              const hasAlert = p.id === 'inventory' && alertItemsCount > 0;

              return (
                <button
                  key={p.id}
                  onClick={() => setCurrentTab(p.id)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25 ring-1 ring-amber-400'
                      : hasAlert
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-300 dark:border-rose-800/60'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700/80 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {hasAlert && <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />}
                  <span>{p.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : hasAlert
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {hasAlert ? `${alertItemsCount} Alert` : p.badge}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Self-Service Change PIN Modal */}
      <ChangePinModal
        isOpen={isChangePinModalOpen}
        onClose={() => setIsChangePinModalOpen(false)}
      />
    </header>
  );
};
