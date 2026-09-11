import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  Bike,
  Building2,
  Calendar,
  Calculator,
  CheckCircle,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Clock,
  Coffee,
  Cpu,
  CreditCard,
  DollarSign,
  Download,
  Edit2,
  FileSpreadsheet,
  FileText,
  Flame,
  Globe,
  Heart,
  Home,
  Layers,
  Lock,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  Monitor,
  Moon,
  Package,
  Percent,
  Plus,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Store,
  Sun,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTheme } from '../../context/ThemeContext';
import { Category, MenuItem, MenuVariant, RestaurantSettings, RestaurantTable, User } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency, formatDate, formatDateTime, getRoleDetails } from '../../utils/formatters';
import { UserManagement } from './UserManagement';
import { StaffPerformanceTable } from './StaffPerformanceTable';
import { CouponsManagement } from './CouponsManagement';
import { CategoryManagement } from './CategoryManagement';
import { CategoryModal } from './CategoryModal';
import { TableManagement } from './TableManagement';
import { ExpenseManagement } from './ExpenseManagement';
import { ReportsPortal } from '../reports/ReportsPortal';
import { WindowsAppSetupModal } from '../cashier/WindowsAppSetupModal';
import { OutletManagement } from './OutletManagement';
import { GSTTaxManagement } from './GSTTaxManagement';
import { OrganizationCustomizer } from './OrganizationCustomizer';
import { ModifierManagement } from './ModifierManagement';
import { BulkMenuManagement } from './BulkMenuManagement';
import { AggregatorManagement } from './AggregatorManagement';
import { CRMLoyaltyManagement } from './CRMLoyaltyManagement';
import { DayEndAuditClosing } from './DayEndAuditClosing';
import { ReceiptDesigner } from './ReceiptDesigner';
import { EnterpriseModuleMatrix } from './EnterpriseModuleMatrix';

interface AdminDashboardProps {
  onNavigatePortal?: (portal: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigatePortal }) => {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const {
    orders,
    menuItems,
    categories,
    tables,
    ingredients,
    recipes,
    expenses,
    auditLogs,
    coupons,
    settings,
    updateSettings,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    updateCategory,
    deleteCategory,
    addTable,
    updateTable,
    deleteTable,
    addExpense,
    executeDailyClosing,
    resetDatabase,
    modifiers,
    catalogManifest,
    setIsCatalogSyncModalOpen,
    exportCatalogPackage,
    adminSubTab: activeTab,
    setAdminSubTab: setActiveTab,
    setIsHamburgerOpen,
  } = useRestaurant();
  const { allUsers, currentUser } = useAuth();

  const [menuSubTab, setMenuSubTab] = useState<'items' | 'categories'>('items');
  const [selectedMenuCategoryFilter, setSelectedMenuCategoryFilter] = useState<string>('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);
  const [closingCash, setClosingCash] = useState('12500');
  const [closingNotes, setClosingNotes] = useState('Daily closing balanced by Store Manager');
  const [closingMessage, setClosingMessage] = useState('');

  // Menu item modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCatId, setItemCatId] = useState(categories[0]?.id || 'cat-1');
  const [itemPrice, setItemPrice] = useState('240');
  const [itemType, setItemType] = useState<'veg' | 'non_veg' | 'vegan'>('veg');
  const [itemSku, setItemSku] = useState('COF-001');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImg, setItemImg] = useState('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80');
  const [itemVariants, setItemVariants] = useState<MenuVariant[]>([]);
  const [itemModifierIds, setItemModifierIds] = useState<string[]>([]);

  // Analytics calculations
  const totalRevenue = (orders || []).reduce((sum, o) => (o.paymentStatus === 'paid' ? sum + o.grandTotal : sum), 0);
  const totalOrdersCount = (orders || []).length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / ((orders || []).filter((o) => o.paymentStatus === 'paid').length || 1) : 0;
  const occupiedTables = (tables || []).filter((t) => t.status === 'occupied').length;
  const occupancyRate = tables && tables.length > 0 ? (occupiedTables / tables.length) * 100 : 0;

  // Windows Cashier Billing Terminal & Hardware State
  const [isWindowsSetupModalOpen, setIsWindowsSetupModalOpen] = useState(false);
  const [stationName, setStationName] = useState(() => {
    return localStorage.getItem('cafeos_pos_terminal') || 'POS-TERMINAL-01';
  });
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    (settings.billPrinterWidth as '58mm' | '80mm') || '80mm'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [drawerPulseEnabled, setDrawerPulseEnabled] = useState(true);

  // Inventory Low Stock Alert Tracking
  const lowStockThreshold = settings?.lowStockThreshold !== undefined ? settings.lowStockThreshold : 10;
  const alertInventoryItems = (ingredients || []).filter((i) => i.currentStock < lowStockThreshold);

  // Category sales breakdown
  const categoryRevenueMap: { [catId: string]: number } = {};
  (orders || []).forEach((o) => {
    if (o.paymentStatus === 'paid') {
      (o.items || []).forEach((item) => {
        const menuItem = (menuItems || []).find((m) => m.id === item.menuItemId);
        if (menuItem) {
          categoryRevenueMap[menuItem.categoryId] = (categoryRevenueMap[menuItem.categoryId] || 0) + item.totalAmount;
        }
      });
    }
  });

  // Top selling items
  const itemSalesMap: { [itemId: string]: { name: string; qty: number; revenue: number } } = {};
  (orders || []).forEach((o) => {
    if (o.paymentStatus === 'paid') {
      (o.items || []).forEach((item) => {
        if (!itemSalesMap[item.menuItemId]) {
          itemSalesMap[item.menuItemId] = { name: item.name, qty: 0, revenue: 0 };
        }
        itemSalesMap[item.menuItemId].qty += item.quantity;
        itemSalesMap[item.menuItemId].revenue += item.totalAmount;
      });
    }
  });

  const topSellingItems = Object.values(itemSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCatId(item.categoryId);
      setItemPrice(String(item.basePrice));
      setItemType(item.foodType);
      setItemSku(item.sku);
      setItemDesc(item.description);
      setItemImg(item.image);
      setItemVariants(
        item.variants && item.variants.length > 0
          ? [...item.variants]
          : [{ id: `var-1-${Date.now()}`, name: 'Regular', price: item.basePrice, isDefault: true }]
      );
      setItemModifierIds(item.modifierIds || []);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemCatId(categories[0]?.id || 'cat-1');
      setItemPrice('250');
      setItemType('veg');
      setItemSku(`SKU-${Date.now().toString().slice(-4)}`);
      setItemDesc('');
      setItemImg('https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80');
      setItemVariants([
        { id: `var-1-${Date.now()}`, name: 'Regular', price: 250, isDefault: true },
        { id: `var-2-${Date.now()}`, name: 'Large', price: 320, isDefault: false },
      ]);
      setItemModifierIds(modifiers.slice(0, 3).map((m) => m.id));
    }
    setIsItemModalOpen(true);
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    const itemData = {
      name: itemName,
      categoryId: itemCatId,
      basePrice: parseFloat(itemPrice) || 0,
      foodType: itemType,
      sku: itemSku,
      description: itemDesc,
      image: itemImg,
      isAvailable: true,
      taxPercent: 5,
      modifierIds: itemModifierIds,
      variants: itemVariants,
    };

    if (editingItem) {
      updateMenuItem(editingItem.id, itemData);
    } else {
      addMenuItem(itemData);
    }
    setIsItemModalOpen(false);
  };

  const handleRunDailyClosing = (e: React.FormEvent) => {
    e.preventDefault();
    executeDailyClosing(closingDate, parseFloat(closingCash) || 0, closingNotes);
    setClosingMessage(`Daily Night Audit and Financial Closing for ${closingDate} completed successfully!`);
    setTimeout(() => setClosingMessage(''), 4000);
  };

  // AdminLTE Theme States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [lteAccent, setLteAccent] = useState<'blue' | 'indigo' | 'teal' | 'rose' | 'amber'>('blue');

  const lteAccents = {
    blue: {
      name: 'Classic Blue (AdminLTE Default)',
      activeNav: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
      badge: 'bg-blue-600 text-white',
      borderTop: 'border-t-blue-600',
      text: 'text-blue-600 dark:text-blue-400',
      btn: 'bg-blue-600 hover:bg-blue-700',
      dot: 'bg-blue-500',
    },
    indigo: {
      name: 'Royal Indigo',
      activeNav: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      badge: 'bg-indigo-600 text-white',
      borderTop: 'border-t-indigo-600',
      text: 'text-indigo-600 dark:text-indigo-400',
      btn: 'bg-indigo-600 hover:bg-indigo-700',
      dot: 'bg-indigo-500',
    },
    teal: {
      name: 'Forest Teal',
      activeNav: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
      badge: 'bg-teal-600 text-white',
      borderTop: 'border-t-teal-600',
      text: 'text-teal-600 dark:text-teal-400',
      btn: 'bg-teal-600 hover:bg-teal-700',
      dot: 'bg-teal-500',
    },
    rose: {
      name: 'Crimson Red',
      activeNav: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
      badge: 'bg-rose-600 text-white',
      borderTop: 'border-t-rose-600',
      text: 'text-rose-600 dark:text-rose-400',
      btn: 'bg-rose-600 hover:bg-rose-700',
      dot: 'bg-rose-500',
    },
    amber: {
      name: 'Golden Amber',
      activeNav: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
      badge: 'bg-amber-500 text-white',
      borderTop: 'border-t-amber-500',
      text: 'text-amber-500 dark:text-amber-400',
      btn: 'bg-amber-500 hover:bg-amber-600',
      dot: 'bg-amber-500',
    },
  };
  const activeAccent = lteAccents[lteAccent];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Distinct AdminLTE Categorized Navigation Groups
  const adminNavGroups = [
    {
      title: 'MAIN NAVIGATION',
      items: [
        {
          id: 'enterprise_matrix',
          label: 'System Modules & Architecture',
          description: '16 Front-Office, Back-Office, Industry & ERP Modules',
          icon: Cpu,
          badge: '16 Modules',
          badgeColor: 'bg-emerald-600 text-white',
        },
        {
          id: 'analytics',
          label: 'Dashboard & Reports',
          description: 'Sales, items, daily & financial overview',
          icon: BarChart3,
          badge: 'Live',
          badgeColor: 'bg-emerald-500 text-white',
        },
        {
          id: 'outlets',
          label: 'Multi-Branch & Outlets',
          description: 'Store locations, central menu & taxes',
          icon: Building2,
          badge: 'Enterprise',
          badgeColor: 'bg-blue-500 text-white',
        },
        {
          id: 'branding',
          label: 'Brand & Organization Customizer',
          description: 'White-label logo, brand colors, franchises & offers',
          icon: Sparkles,
          badge: 'White-Label',
          badgeColor: 'bg-amber-500 text-white',
        },
      ],
    },
    {
      title: 'MENU & CATALOG',
      items: [
        {
          id: 'menu_items',
          label: 'Dishes & Menu Catalog',
          description: 'Menu dishes, pricing & recipes',
          icon: UtensilsCrossed,
          badge: menuItems.length,
          badgeColor: 'bg-sky-500 text-white',
        },
        {
          id: 'categories',
          label: 'Category Management',
          description: 'Categories & live catalog tree',
          icon: Layers,
          badge: categories.length,
          badgeColor: 'bg-indigo-500 text-white',
        },
        {
          id: 'modifiers',
          label: 'Modifiers & Add-ons',
          description: 'Milk, crusts, flavours & variations',
          icon: Sliders,
        },
        {
          id: 'bulk_upload',
          label: 'Bulk CSV Menu Upload',
          description: 'Import/export catalog spreadsheet',
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: 'CHANNELS & COMMERCE',
      items: [
        {
          id: 'aggregators',
          label: 'Swiggy & Zomato Hub',
          description: 'Aggregator channels, markups & menu sync',
          icon: Bike,
          badge: 'Hub',
          badgeColor: 'bg-orange-500 text-white',
        },
        {
          id: 'crm_loyalty',
          label: 'Customer Loyalty & CRM',
          description: 'Points, tiers & WhatsApp campaigns',
          icon: Heart,
        },
        {
          id: 'offers',
          label: 'Offers & Coupons',
          description: 'Promo codes, discounts & BOGO',
          icon: Sparkles,
          badge: coupons.filter((c) => c.isActive).length,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'tables',
          label: 'Floor Layout & QR',
          description: 'Dining tables, seating & QR codes',
          icon: Store,
        },
      ],
    },
    {
      title: 'FINANCE & BILLING',
      items: [
        {
          id: 'day_end',
          label: 'Day-End Z-Report Audit',
          description: 'Cash drawer balance & shift closing',
          icon: Calculator,
        },
        {
          id: 'expenses',
          label: 'Petty Cash & Expenses',
          description: 'Cash outflows & vendor vouchers',
          icon: Wallet,
          badge: expenses.length,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'tax_gst',
          label: 'GST & Tax Master',
          description: 'CGST, SGST & GSTR-3B export',
          icon: Percent,
          badge: 'GST',
          badgeColor: 'bg-teal-500 text-white',
        },
        {
          id: 'windows_terminal',
          label: 'Windows Cashier POS',
          description: 'Desktop billing, hardware & kiosk',
          icon: Monitor,
          badge: 'Desktop',
          badgeColor: 'bg-blue-600 text-white',
        },
        {
          id: 'receipt_designer',
          label: 'Receipt & KOT Designer',
          description: 'Thermal print styling & QR codes',
          icon: Receipt,
        },
      ],
    },
    {
      title: 'ADMIN & SYSTEM',
      items: [
        {
          id: 'performance',
          label: 'Staff Performance Matrix',
          description: 'Cashier throughput & leaderboard',
          icon: TrendingUp,
        },
        {
          id: 'staff',
          label: 'Staff & User Roles',
          description: 'PIN credentials & RBAC permissions',
          icon: Users,
        },
        {
          id: 'settings',
          label: 'Store Settings',
          description: 'Branding & operational parameters',
          icon: Settings,
        },
        {
          id: 'audit',
          label: 'Security Audit Trail',
          description: 'System event logs & audit tracking',
          icon: FileText,
        },
      ],
    },
  ];

  const handleSelectNav = (subId: string) => {
    if (subId === 'categories') {
      setActiveTab('menu');
      setMenuSubTab('categories');
    } else if (subId === 'menu_items') {
      setActiveTab('menu');
      setMenuSubTab('items');
      setSelectedMenuCategoryFilter('all');
    } else {
      setActiveTab(subId as any);
    }
    setIsMobileSidebarOpen(false);
  };

  const getCurrentNavInfo = () => {
    if (activeTab === 'menu') {
      if (menuSubTab === 'categories') {
        return {
          title: 'Category Management',
          section: 'Menu & Catalog',
          desc: 'Live menu categories, department sorting & catalog visibility',
          icon: Layers,
        };
      }
      return {
        title: 'Dishes & Menu Catalog',
        section: 'Menu & Catalog',
        desc: 'Menu items, base pricing, portions, food types & recipe ingredients',
        icon: UtensilsCrossed,
      };
    }
    for (const group of adminNavGroups) {
      const found = group.items.find((i) => i.id === activeTab);
      if (found) {
        return {
          title: found.label,
          section: group.title,
          desc: found.description,
          icon: found.icon,
        };
      }
    }
    return {
      title: 'Dashboard & Reports',
      section: 'Main Navigation',
      desc: 'Sales, items, daily & financial overview',
      icon: BarChart3,
    };
  };

  const currentNav = getCurrentNavInfo();

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#f4f6f9] dark:bg-[#111827] flex flex-col font-sans text-slate-800 dark:text-slate-200">
      <div className="flex flex-1 relative min-h-0">
        {/* AdminLTE Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* AdminLTE Main Sidebar Container (sidebar-dark-primary) */}
        <aside
          className={`fixed md:sticky top-0 h-screen md:h-[calc(100vh-4rem)] z-50 md:z-30 bg-[#343a40] dark:bg-[#1a202c] text-[#c2c7d0] border-r border-[#4b545c]/70 transition-all duration-300 ease-in-out flex flex-col shrink-0 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
        >
          {/* Brand Logo Header */}
          <div className="h-14 bg-[#343a40] dark:bg-[#1a202c] border-b border-[#4b545c] px-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                <Store className="w-4 h-4" />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-extrabold text-white text-base tracking-tight">
                    Café<span className="font-light">OS</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white font-mono shadow-xs">
                    LTE 3.2
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1 rounded-md text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Panel */}
          <div className="p-3 border-b border-[#4b545c]/80 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-white font-black text-xs shrink-0 overflow-hidden shadow-inner">
              {currentUser?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-white truncate leading-tight">
                  {currentUser?.name || 'Administrator'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span className="text-[11px] text-emerald-400 font-semibold truncate capitalize">
                    Online ({currentUser?.role || 'Admin'})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Live Search */}
          {!isSidebarCollapsed && (
            <div className="p-2.5 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#3f474e] dark:bg-slate-800 text-xs text-white placeholder-slate-400 rounded-md border border-transparent focus:border-blue-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                {sidebarSearch && (
                  <button
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sidebar Nav Tree */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 no-scrollbar">
            {adminNavGroups.map((group) => {
              const matchingItems = group.items.filter(
                (item) =>
                  !sidebarSearch ||
                  item.label.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                  item.description.toLowerCase().includes(sidebarSearch.toLowerCase())
              );

              if (matchingItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  {!isSidebarCollapsed && (
                    <div className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400/80">
                      {group.title}
                    </div>
                  )}
                  {isSidebarCollapsed && <div className="h-px bg-[#4b545c]/50 my-1 mx-2" />}
                  {matchingItems.map((item) => {
                    const isSelected =
                      item.id === 'categories'
                        ? activeTab === 'menu' && menuSubTab === 'categories'
                        : item.id === 'menu_items'
                        ? activeTab === 'menu' && menuSubTab === 'items'
                        : activeTab === item.id;

                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectNav(item.id)}
                        title={isSidebarCollapsed ? `${item.label}` : undefined}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                          isSelected
                            ? activeAccent.activeNav
                            : 'text-[#c2c7d0] hover:bg-white/10 hover:text-white'
                        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        {!isSidebarCollapsed && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{item.label}</span>
                            {item.badge !== undefined && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-black shrink-0 ml-1 ${
                                  isSelected
                                    ? 'bg-white/25 text-white'
                                    : item.badgeColor || 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer Accent Picker */}
          {!isSidebarCollapsed && (
            <div className="p-3 border-t border-[#4b545c]/80 shrink-0 bg-[#2f353a] dark:bg-slate-900/90 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>AdminLTE Accent</span>
                <span className="text-[10px] text-slate-300 font-mono capitalize">{lteAccent}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {(['blue', 'indigo', 'teal', 'rose', 'amber'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setLteAccent(color)}
                    className={`w-5 h-5 rounded-full cursor-pointer ${
                      color === 'blue'
                        ? 'bg-blue-600'
                        : color === 'indigo'
                        ? 'bg-indigo-600'
                        : color === 'teal'
                        ? 'bg-teal-600'
                        : color === 'rose'
                        ? 'bg-rose-600'
                        : 'bg-amber-500'
                    } ${lteAccent === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'} transition-all`}
                    title={`AdminLTE ${color} accent`}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Content Wrapper (AdminLTE Content Layout) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* AdminLTE Top Navbar Header */}
          <header className="h-14 bg-white dark:bg-[#1f2937] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setIsMobileSidebarOpen(!isMobileSidebarOpen);
                  } else {
                    setIsSidebarCollapsed(!isSidebarCollapsed);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  onClick={() => onNavigatePortal && onNavigatePortal('pos')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  POS Terminal
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  onClick={() => onNavigatePortal && onNavigatePortal('windows_cashier')}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Windows POS
                </button>
              </div>
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Catalog Sync Hub Button */}
              <button
                type="button"
                onClick={() => setIsCatalogSyncModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                title="Manage Catalog Versioning, Push/Pull sync to offline Cashier & Stockist terminals"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden md:inline">Catalog Sync</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 font-black">
                  {catalogManifest.version}
                </span>
              </button>

              {/* Notifications dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {alertInventoryItems.length > 0 && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">
                      {alertInventoryItems.length}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in">
                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>Notifications & Alerts</span>
                      <span className="text-[10px] text-slate-400">AdminLTE Hub</span>
                    </div>
                    <div className="py-2 space-y-2 text-xs">
                      {alertInventoryItems.length > 0 ? (
                        <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/50 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-rose-900 dark:text-rose-200">
                              {alertInventoryItems.length} Low Stock Alert(s)
                            </div>
                            <div className="text-[11px] text-rose-700 dark:text-rose-300">
                              Requires vendor purchase ordering.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-center py-2 text-xs">
                          All systems operational. No critical warnings.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center border border-slate-300 dark:border-slate-700">
                  {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {currentUser?.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {currentUser?.role || 'Admin'}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-4 sm:p-6 space-y-6 flex-1">
            {/* Content Header (Page Header) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800/80">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <currentNav.icon className={`w-5 h-5 ${activeAccent.text}`} />
                  <span>{currentNav.title}</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">{currentNav.desc}</p>
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Home</span>
                <span>/</span>
                <span className="text-slate-400">{currentNav.section}</span>
                <span>/</span>
                <span className={`${activeAccent.text} font-bold`}>{currentNav.title}</span>
              </div>
            </div>

            {/* AdminLTE Small Boxes KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Box 1: Info (Cyan/Blue) */}
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-cyan-600 to-sky-700 text-white shadow-md flex flex-col justify-between">
                <div className="p-4 relative z-10">
                  <div className="text-2xl font-black tracking-tight">{formatCurrency(totalRevenue)}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-cyan-100 mt-1">
                    Gross Revenue (Paid)
                  </div>
                </div>
                <DollarSign className="absolute -right-2 -bottom-2 w-20 h-20 text-white/15 pointer-events-none" />
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-black/20 hover:bg-black/35 py-1.5 px-3 text-xs font-bold text-cyan-100 hover:text-white flex items-center justify-center gap-1 transition-colors border-t border-white/10 cursor-pointer"
                >
                  <span>More info</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Box 2: Success (Green) */}
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-md flex flex-col justify-between">
                <div className="p-4 relative z-10">
                  <div className="text-2xl font-black tracking-tight">
                    {(orders || []).filter((o) => o.paymentStatus === 'paid').length}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100 mt-1">
                    Settled Orders & Bills
                  </div>
                </div>
                <CheckCircle className="absolute -right-2 -bottom-2 w-20 h-20 text-white/15 pointer-events-none" />
                <button
                  onClick={() => setActiveTab('day_end')}
                  className="bg-black/20 hover:bg-black/35 py-1.5 px-3 text-xs font-bold text-emerald-100 hover:text-white flex items-center justify-center gap-1 transition-colors border-t border-white/10 cursor-pointer"
                >
                  <span>More info</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Box 3: Warning (Amber) */}
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-md flex flex-col justify-between">
                <div className="p-4 relative z-10">
                  <div className="text-2xl font-black tracking-tight">
                    {occupiedTables} / {tables.length || 0}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-100 mt-1">
                    Dine-in Tables ({occupancyRate.toFixed(0)}% Occupied)
                  </div>
                </div>
                <Store className="absolute -right-2 -bottom-2 w-20 h-20 text-white/15 pointer-events-none" />
                <button
                  onClick={() => setActiveTab('tables')}
                  className="bg-black/20 hover:bg-black/35 py-1.5 px-3 text-xs font-bold text-amber-100 hover:text-white flex items-center justify-center gap-1 transition-colors border-t border-white/10 cursor-pointer"
                >
                  <span>More info</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Box 4: Danger (Red) */}
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-md flex flex-col justify-between">
                <div className="p-4 relative z-10">
                  <div className="text-2xl font-black tracking-tight">
                    {alertInventoryItems.length}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-rose-100 mt-1">
                    Low Stock Alerts (&lt; {lowStockThreshold})
                  </div>
                </div>
                <AlertTriangle className="absolute -right-2 -bottom-2 w-20 h-20 text-white/15 pointer-events-none" />
                <button
                  onClick={() => {
                    if (onNavigatePortal) onNavigatePortal('inventory');
                  }}
                  className="bg-black/20 hover:bg-black/35 py-1.5 px-3 text-xs font-bold text-rose-100 hover:text-white flex items-center justify-center gap-1 transition-colors border-t border-white/10 cursor-pointer"
                >
                  <span>More info</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AdminLTE Card Outline Container */}
            <div className={`card card-outline bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 border-t-4 ${activeAccent.borderTop}`}>
              <div className="card-header px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeAccent.dot}`} />
                  <h3 className="card-title font-extrabold text-slate-900 dark:text-white text-base">
                    {currentNav.title}
                  </h3>
                </div>
                <div className="card-tools flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onNavigatePortal) onNavigatePortal('windows_cashier');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Launch Windows Terminal"
                  >
                    <Monitor className="w-3.5 h-3.5 text-blue-600" />
                    <span>Windows POS</span>
                  </button>
                </div>
              </div>

              <div className="card-body p-4 sm:p-6">

      {/* TAB 1: Analytics & Reports */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Low Stock Warning Banner on Main Dashboard */}
          {alertInventoryItems.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-rose-500 text-white shrink-0 shadow-md shadow-rose-500/20">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-rose-900 dark:text-rose-200 text-sm sm:text-base">
                      Inventory Low-Stock Warning: {alertInventoryItems.length} Items Below Threshold ({lowStockThreshold} units)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 max-w-2xl">
                    {alertInventoryItems.slice(0, 4).map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
                    {alertInventoryItems.length > 4 && ` and ${alertInventoryItems.length - 4} more items...`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onNavigatePortal) onNavigatePortal('inventory');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-inventory-alert-tab'));
                    }, 100);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Open Alert Inventory & Print</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Access to Enterprise System Modules & Architecture */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-white">
                    Enterprise System Modules &amp; Architecture Matrix
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    16 Modules Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Front-office checkout, payment gateways, returns &amp; refunds, back-office inventory, vendor GRN, CRM, apparel matrix, ERP journals &amp; hardware drivers.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('enterprise_matrix')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Master Modules Matrix</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Reports & Analytics Center */}
          <ReportsPortal />
        </div>
      )}

      {/* TAB: Offers & Coupons Management */}
      {activeTab === 'offers' && <CouponsManagement />}

      {/* TAB: Dedicated Staff Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <span>Staff Order Performance & Productivity Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tracks completed order throughput, sales volume, turnaround speed, discount discipline, and efficiency score across all floor staff.
            </p>
          </div>
          <StaffPerformanceTable />
        </div>
      )}

      {/* TAB 2: Menu & Categories */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          {/* Sub-tab Navigation */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMenuSubTab('items')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  menuSubTab === 'items'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Dishes & Beverages ({menuItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMenuSubTab('categories')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  menuSubTab === 'categories'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Menu Categories ({categories.length})</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Category</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenItemModal()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Menu Item</span>
              </button>
            </div>
          </div>

          {menuSubTab === 'categories' ? (
            /* Sub-tab 2: Categories Management View */
            <CategoryManagement
              onSelectCategoryFilter={(catId) => {
                setSelectedMenuCategoryFilter(catId);
                setMenuSubTab('items');
              }}
            />
          ) : (
            /* Sub-tab 1: Dishes & Items View */
            <div className="space-y-4">
              {/* Category Pills & Search */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMenuCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                      selectedMenuCategoryFilter === 'all'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    All Items ({menuItems.length})
                  </button>
                  {categories.map((c) => {
                    const count = menuItems.filter((i) => i.categoryId === c.id).length;
                    const isSelected = selectedMenuCategoryFilter === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedMenuCategoryFilter(c.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <span>{c.icon || '🍽️'}</span>
                        <span>{c.name}</span>
                        <span className="text-[10px] opacity-75">({count})</span>
                      </button>
                    );
                  })}
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search dishes by name or SKU..."
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {menuItems
                  .filter((item) => {
                    if (
                      selectedMenuCategoryFilter !== 'all' &&
                      item.categoryId !== selectedMenuCategoryFilter
                    )
                      return false;
                    if (menuSearchQuery.trim()) {
                      const q = menuSearchQuery.toLowerCase();
                      return (
                        item.name.toLowerCase().includes(q) ||
                        item.sku.toLowerCase().includes(q) ||
                        item.description.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((item) => {
                    const categoryObj = categories.find((c) => c.id === item.categoryId);
                    return (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
                      >
                        <div className="relative h-36 bg-slate-100 dark:bg-slate-800">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 p-1 rounded-md">
                            <span
                              className={`w-2.5 h-2.5 rounded-full inline-block ${
                                item.foodType === 'veg'
                                  ? 'bg-emerald-500'
                                  : item.foodType === 'vegan'
                                  ? 'bg-teal-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                          </div>
                          {categoryObj && (
                            <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <span>{categoryObj.icon || '🍽️'}</span>
                              <span>{categoryObj.name}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
                                {item.name}
                              </h4>
                              <span className="font-black text-amber-600 text-sm">
                                {formatCurrency(item.basePrice)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                              {item.description}
                            </p>
                            <div className="text-[11px] text-slate-400 mt-2">SKU: {item.sku}</div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 mt-3">
                            <button
                              onClick={() => handleOpenItemModal(item)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Menu Item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${item.name}?`)) deleteMenuItem(item.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Delete Menu Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Table Layout & QR Code Self-Ordering */}
      {activeTab === 'tables' && (
        <TableManagement
          tables={tables}
          orders={orders}
          onAddTable={addTable}
          onUpdateTable={updateTable}
          onDeleteTable={deleteTable}
          currencySymbol={settings.currencySymbol}
        />
      )}

      {/* TAB: Petty Cash & Expenses */}
      {activeTab === 'expenses' && (
        <ExpenseManagement
          expenses={expenses}
          onAddExpense={addExpense}
          currencySymbol={settings.currencySymbol}
        />
      )}

      {/* TAB 4: Staff & Role Permissions / User Management */}
      {activeTab === 'staff' && <UserManagement />}

      {/* TAB 5: Store Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 max-w-4xl">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Enterprise Store Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Café / Restaurant Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => updateSettings({ name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN / Tax Identification #
              </label>
              <input
                type="text"
                value={settings.gstNumber}
                onChange={(e) => updateSettings({ gstNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                FSSAI License #
              </label>
              <input
                type="text"
                value={settings.fssaiLicense}
                onChange={(e) => updateSettings({ fssaiLicense: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Thermal Printer Paper Roll Width
              </label>
              <select
                value={settings.billPrinterWidth}
                onChange={(e) => updateSettings({ billPrinterWidth: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="80mm">80mm (Standard POS Thermal Receipt)</option>
                <option value="58mm">58mm (Compact Mobile Thermal Receipt)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-amber-700 dark:text-amber-400 mb-1">
                Low-Stock Alert Threshold (Units)
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={settings.lowStockThreshold ?? 10}
                onChange={(e) => updateSettings({ lowStockThreshold: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full px-3 py-2 bg-amber-50 dark:bg-slate-800 border border-amber-300 dark:border-amber-700/80 rounded-xl font-bold text-amber-900 dark:text-amber-100"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                HOIN Thermal Printer Profile / Model
              </label>
              <input
                type="text"
                value={settings.hoinPrinter?.printerName || 'HOIN HOP-H58 / HOP-E801 Thermal Printer'}
                onChange={(e) =>
                  updateSettings({
                    hoinPrinter: {
                      ...(settings.hoinPrinter || {
                        printerName: 'HOIN Thermal Printer',
                        printerType: 'hoin_thermal',
                        connectionType: 'browser',
                        paperWidth: '80mm',
                      }),
                      printerName: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Physical Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => updateSettings({ address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Theme & Display Preference for Night Shifts */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Display Theme (Day & Night Shift Visibility)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isDark ? '🌙 Night Shift Active' : '☀️ Day Shift Active'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between high-contrast dark mode for low-light bar/kitchen environments or bright mode for outdoor daylight counters. Persisted locally per terminal.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  !isDark
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Day Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isDark
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Night Mode</span>
              </button>
            </div>
          </div>

          {/* Offline Sync & IndexedDB Resilience Section */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-900/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500 text-slate-950">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  IndexedDB Offline Storage & Background Sync
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Service Worker caches POS terminal shell. Orders and payments queue automatically during network drops.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                // Open global offline sync modal
                window.dispatchEvent(new CustomEvent('open-sync-modal'));
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-sm transition-all"
            >
              Open Sync Queue Center →
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              onClick={() => {
                if (confirm('Reset database back to initial seed state?')) resetDatabase();
              }}
              className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo Database to Initial State</span>
            </button>
            <span className="text-xs font-bold text-emerald-600">Auto-saved to persistent storage</span>
          </div>
        </div>
      )}

      {/* TAB 6: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 uppercase font-bold text-slate-500">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.slice(0, 30).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                    {log.userName}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-amber-600 text-[11px]">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{log.entity}</td>
                  <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                    {log.details || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 7: Windows Cashier Billing Terminal Management */}
      {activeTab === 'windows_terminal' && (
        <div className="space-y-5">
          {/* Main Hero Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[11px] font-bold border border-sky-500/30">
                    WINDOWS 11 / 10 POS CLIENT
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">
                    TERMINAL READY
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  CaféOS Windows Cashier Billing Terminal
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Dedicated high-speed checkout terminal optimized for desktop screens, keyboard shortcuts (F1-F12), barcode scanners, 80mm ESC/POS thermal printers, and automated cash drawer triggers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => setIsWindowsSetupModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4 text-sky-400" />
                  <span>Configure Terminal</span>
                </button>
                <button
                  onClick={() => onNavigatePortal && onNavigatePortal('windows_cashier')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xl shadow-sky-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Monitor className="w-4 h-4 text-white" />
                  <span>Launch Windows Cashier App →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Three Feature & Installation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Desktop PWA */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  1. Native Windows Desktop App
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Install CaféOS as a standalone desktop program on your cashier PC. Appears in Windows Start Menu, Taskbar, and runs without browser toolbars.
                </p>
              </div>

              <button
                onClick={() => setIsWindowsSetupModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-200 dark:border-sky-800 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Windows App (PWA)</span>
              </button>
            </div>

            {/* Card 2: 1-Click Batch Script */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  2. Desktop Kiosk Launcher (.bat)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Download a pre-configured Windows Batch or PowerShell script. Double-click from Windows Desktop to launch into cashier mode with hardware flags.
                </p>
              </div>

              <button
                onClick={() => setIsWindowsSetupModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Desktop .bat File</span>
              </button>
            </div>

            {/* Card 3: POS Peripherals */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Printer className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  3. Thermal Printers &amp; Cash Drawer
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Supports 80mm &amp; 58mm ESC/POS roll printing, automatic RJ11 24V drawer pulse on settlement, and USB barcode scanner instant lookup.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Station: {stationName}</span>
                <span className="text-emerald-600 font-black">Ready</span>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Reference Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Windows Cashier Keyboard Hotkey Matrix (High-Speed Checkout)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
              {[
                { k: 'F1', d: 'New / Clear Bill' },
                { k: 'F2', d: 'Focus Dish Search & Scan' },
                { k: 'F3', d: 'Customer / Loyalty' },
                { k: 'F4', d: 'Discount (% or Flat ₹)' },
                { k: 'F5', d: 'Hold / Park Order' },
                { k: 'F6', d: 'Recall Parked Order' },
                { k: 'F7', d: 'Switch Order Type' },
                { k: 'F8', d: 'Add Open / Custom Item' },
                { k: 'F9', d: 'Print Kitchen KOT' },
                { k: 'F10', d: 'Settle & Print Receipt' },
                { k: 'F11', d: 'Toggle Fullscreen Kiosk' },
                { k: 'F12', d: 'Manual Cash Drawer Kick' },
              ].map((hk) => (
                <div
                  key={hk.k}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between"
                >
                  <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-xs">
                    [{hk.k}]
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-tight">
                    {hk.d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Brand & Organization Customizer */}
      {activeTab === 'branding' && <OrganizationCustomizer />}

      {/* RoyalPOS Feature 1: Multi-Branch & Outlets Management */}
      {activeTab === 'outlets' && <OutletManagement />}

      {/* RoyalPOS Feature 2: Item Modifiers, Add-ons & Flavor Groups */}
      {activeTab === 'modifiers' && <ModifierManagement />}

      {/* RoyalPOS Feature 3: Bulk CSV Menu Upload & Catalog Sync */}
      {activeTab === 'bulk_upload' && <BulkMenuManagement />}

      {/* RoyalPOS Feature 4: Indian GST & Tax Master */}
      {activeTab === 'tax_gst' && <GSTTaxManagement />}

      {/* RoyalPOS Feature 5: Swiggy & Zomato Aggregator Channel Hub */}
      {activeTab === 'aggregators' && <AggregatorManagement />}

      {/* RoyalPOS Feature 6: Customer CRM & Loyalty Rewards Engine */}
      {activeTab === 'crm_loyalty' && <CRMLoyaltyManagement />}

      {/* RoyalPOS Feature 7: Day-End Closing & Cash Drawer Z-Report Audit */}
      {activeTab === 'day_end' && <DayEndAuditClosing />}

      {/* RoyalPOS Feature 8: Thermal Bill & KOT Print Format Designer */}
      {activeTab === 'receipt_designer' && <ReceiptDesigner />}

      {/* Enterprise System Modules & Architecture Master Matrix */}
      {activeTab === 'enterprise_matrix' && (
        <EnterpriseModuleMatrix onNavigatePortal={onNavigatePortal} />
      )}

              </div>
            </div>
          </main>

          {/* AdminLTE Main Footer */}
          <footer className="main-footer bg-white dark:bg-[#1f2937] border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div>
              <strong>
                Copyright &copy; 2026{' '}
                <span className={`${activeAccent.text} font-bold`}>CaféOS AdminLTE</span>.
              </strong>{' '}
              All rights reserved.
            </div>
            <div className="flex items-center gap-3">
              <span>Admin LTS Operations Dashboard</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <b>Version</b> <span className="font-mono font-bold text-slate-700 dark:text-slate-300">3.2.0-LTS</span>
            </div>
          </footer>
        </div>
      </div>

      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingItem ? 'Edit Dish / Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Category</span>
                    </button>
                  </div>
                  <select
                    value={itemCatId}
                    onChange={(e) => setItemCatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '🍽️'} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dietary Type
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non_veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={itemImg}
                    onChange={(e) => setItemImg(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[11px]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description & Flavor Profile
                  </label>
                  <textarea
                    rows={2}
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                {/* Variants Manager */}
                <div className="col-span-2 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        Dish Variants & Portion Sizes
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Configure size variants (e.g. Regular, Monster, Double Patty) with custom prices
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextNum = itemVariants.length + 1;
                        setItemVariants([
                          ...itemVariants,
                          {
                            id: `var-${Date.now()}-${nextNum}`,
                            name: nextNum === 3 ? 'Monster' : `Size ${nextNum}`,
                            price: (parseFloat(itemPrice) || 200) + nextNum * 40,
                            isDefault: false,
                          },
                        ]);
                      }}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Variant</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {itemVariants.map((v, vIdx) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={v.name}
                          placeholder="e.g. Regular / Large / Monster"
                          onChange={(e) => {
                            const val = e.target.value;
                            setItemVariants((prev) =>
                              prev.map((it, i) => (i === vIdx ? { ...it, name: val } : it))
                            );
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            step="any"
                            value={v.price}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setItemVariants((prev) =>
                                prev.map((it, i) => (i === vIdx ? { ...it, price: val } : it))
                              );
                            }}
                            className="w-24 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-black text-amber-600"
                          />
                        </div>
                        {itemVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setItemVariants((prev) => prev.filter((_, i) => i !== vIdx));
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                            title="Remove Variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Applicable Add-ons & Modifiers */}
                <div className="col-span-2 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Applicable Add-ons & Modifiers ({itemModifierIds.length} Selected)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Select which toppings or add-ons the cashier/customer can pick
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-36 overflow-y-auto">
                    {modifiers.map((mod) => {
                      const isChecked = itemModifierIds.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setItemModifierIds(itemModifierIds.filter((id) => id !== mod.id));
                              } else {
                                setItemModifierIds([...itemModifierIds, mod.id]);
                              }
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <div className="truncate flex-1">
                            <div>{mod.name}</div>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                              +₹{mod.price}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Save Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Category Modal for Quick Add */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={(catData) => {
          const newCat = addCategory(catData);
          if (newCat) {
            setItemCatId(newCat.id);
          }
        }}
        totalCategoriesCount={categories.length}
      />

      {/* Windows Cashier App Setup & Launcher Modal */}
      <WindowsAppSetupModal
        isOpen={isWindowsSetupModalOpen}
        onClose={() => setIsWindowsSetupModalOpen(false)}
        terminalStationName={stationName}
        onSaveTerminalStation={(name) => {
          setStationName(name);
          localStorage.setItem('cafeos_pos_terminal', name);
        }}
        paperWidth={paperWidth}
        onChangePaperWidth={(w) => setPaperWidth(w)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        drawerPulseEnabled={drawerPulseEnabled}
        onToggleDrawerPulse={() => setDrawerPulseEnabled(!drawerPulseEnabled)}
      />
    </div>
  );
};
