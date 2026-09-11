import {
  Banknote,
  Bell,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Database,
  DollarSign,
  FileSpreadsheet,
  FileText,
  HardDrive,
  HelpCircle,
  History,
  Layers,
  LogOut,
  Menu,
  MessageCircle,
  Monitor,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  Settings,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';

interface POSDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrders: (tab?: 'in_prep' | 'ready' | 'history') => void;
  onOpenIncome: () => void;
  onOpenExpense: () => void;
  onOpenBankDeposit: () => void;
  onOpenOnlineTransactions: () => void;
  onOpenNoticeboard: () => void;
  onOpenExecutiveSales: () => void;
  onOpenKOTHistory: () => void;
  onOpenItemStock: () => void;
  onOpenSync: () => void;
  onOpenEndDay: () => void;
  onOpenDeviceSummary: () => void;
  onNavigateAdmin: () => void;
  onNavigateSettings: () => void;
  onOpenCustomers: () => void;
  onLogout: () => void;
}

export const POSDrawerMenu: React.FC<POSDrawerMenuProps> = ({
  isOpen,
  onClose,
  onOpenOrders,
  onOpenIncome,
  onOpenExpense,
  onOpenBankDeposit,
  onOpenOnlineTransactions,
  onOpenNoticeboard,
  onOpenExecutiveSales,
  onOpenKOTHistory,
  onOpenItemStock,
  onOpenSync,
  onOpenEndDay,
  onOpenDeviceSummary,
  onNavigateAdmin,
  onNavigateSettings,
  onOpenCustomers,
  onLogout,
}) => {
  const { orders, tables, syncStats, isOnline, setIsHamburgerOpen } = useRestaurant();

  if (!isOpen) return null;

  const inPrepCount = orders.filter(
    (o) =>
      (o.status === 'in_prep' || o.status === 'kot_generated' || o.status === 'new') &&
      o.status !== 'cancelled'
  ).length;

  const readyCount = orders.filter(
    (o) => (o.status === 'ready' || o.status === 'bill_generated') && o.paymentStatus !== 'paid'
  ).length;

  const menuItems = [
    {
      id: 'income',
      label: 'INCOME',
      icon: DollarSign,
      action: onOpenIncome,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
      badge: 'Today',
    },
    {
      id: 'expense',
      label: 'EXPENSE',
      icon: Banknote,
      action: onOpenExpense,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40',
    },
    {
      id: 'bank_deposit',
      label: 'Bank Deposite',
      icon: TrendingUp,
      action: onOpenBankDeposit,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
    },
    {
      id: 'orders',
      label: 'ORDERS',
      icon: ClipboardList,
      action: () => onOpenOrders('in_prep'),
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
      badge: `${inPrepCount + readyCount} Active`,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'online_tx',
      label: 'Online Transaction',
      icon: CreditCard,
      action: onOpenOnlineTransactions,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      id: 'local_orders',
      label: 'Local Orders',
      icon: Database,
      action: onOpenSync,
      color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40',
      badge: syncStats.offlineQueueCount > 0 ? `${syncStats.offlineQueueCount} Queued` : 'Synced',
      badgeColor: syncStats.offlineQueueCount > 0 ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'noticeboard',
      label: 'Noticeboard',
      icon: Bell,
      action: onOpenNoticeboard,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40',
      badge: 'New',
    },
    {
      id: 'executive_sales',
      label: 'Executive Sales Summary',
      icon: FileSpreadsheet,
      action: onOpenExecutiveSales,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40',
    },
    {
      id: 'kot',
      label: 'KOT',
      icon: FileText,
      action: onOpenKOTHistory,
      color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40',
    },
    {
      id: 'item_stock',
      label: 'Item Stock (Online-Cloud)',
      icon: PackageCheck,
      action: onOpenItemStock,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40',
    },
    {
      id: 'sync',
      label: 'Sync',
      icon: RefreshCw,
      action: onOpenSync,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
      badge: isOnline ? 'Online' : 'Offline',
      badgeColor: isOnline ? 'bg-emerald-500 text-white' : 'bg-amber-600 text-white',
    },
    {
      id: 'end_day',
      label: 'END DAY',
      icon: HardDrive,
      action: onOpenEndDay,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
    },
    {
      id: 'device_summary',
      label: 'Device Summary',
      icon: Monitor,
      action: onOpenDeviceSummary,
      color: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: UserCheck,
      action: onNavigateAdmin,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: onNavigateSettings,
      color: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
    },
    {
      id: 'queue',
      label: 'Queue',
      icon: Layers,
      action: () => onOpenOrders('in_prep'),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
      badge: `${inPrepCount}`,
    },
    {
      id: 'customer',
      label: 'Customer',
      icon: Users,
      action: onOpenCustomers,
      color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40',
    },
    {
      id: 'all_portals',
      label: 'All Portals & Admin Menu',
      icon: Menu,
      action: () => {
        onClose();
        setIsHamburgerOpen(true);
      },
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      badge: 'Main Menu',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-80 sm:w-88 bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-300">
          {/* Drawer Top Header (RoyalPOS Brand & ID) */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">
                  RoyalPOS <span className="text-emerald-400 font-mono text-sm">6.5.2</span>
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono mt-0.5">
                ID : <span className="text-amber-300 font-bold">45768</span> • Terminal #01
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Support Section as in screenshot */}
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-200/50 dark:border-amber-900/40">
            <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>SUPPORT CONTACT</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="tel:+917291077919"
                className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate text-[11px]">+91 7291077919</span>
              </a>
              <a
                href="https://wa.me/918780228978"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate text-[11px]">+91 8780228978</span>
              </a>
            </div>
          </div>

          {/* Scrollable Navigation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${item.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition-colors uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Drawer Footer (LOGOUT) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white font-extrabold text-xs rounded-xl border border-rose-200 dark:border-rose-900/60 transition-all flex items-center justify-center gap-2 group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
