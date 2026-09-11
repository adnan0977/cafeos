import {
  AlertCircle,
  Bell,
  Bike,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Clock,
  Coffee,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  HardDrive,
  Layers,
  LayoutGrid,
  List,
  Menu,
  Minus,
  Monitor,
  MoreHorizontal,
  PackageCheck,
  Pause,
  Play,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  User as UserIcon,
  UserCheck,
  Users,
  UtensilsCrossed,
  Volume2,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Coupon, FoodType, MenuItem, Order, OrderItem, OrderType, RestaurantTable } from '../../types';
import { CouponValidationContext, findBestAutoApplicableCoupon, validateAndCalculateCoupon } from '../../utils/couponUtils';
import { formatCurrency } from '../../utils/formatters';
import { AdminPasswordModal } from './AdminPasswordModal';
import { BankDepositModal } from './BankDepositModal';
import { CouponPickerModal } from './CouponPickerModal';
import { DeviceSummaryModal } from './DeviceSummaryModal';
import { ExecutiveSalesModal } from './ExecutiveSalesModal';
import { HeldOrdersModal } from './HeldOrdersModal';
import { ItemStockModal } from './ItemStockModal';
import { ModifierSelectorModal } from './ModifierSelectorModal';
import { NoticeboardModal } from './NoticeboardModal';
import { OrdersManagerModal } from './OrdersManagerModal';
import { PaymentModal } from './PaymentModal';
import { POSDrawerMenu } from './POSDrawerMenu';
import { POSTableFloorView } from './POSTableFloorView';
import { POSTerminalLogin } from './POSTerminalLogin';
import { TableSelectorModal } from './TableSelectorModal';
import { KitchenReadyToast, ReadyToastItem } from '../common/KitchenReadyToast';
import { playKitchenReadyChime } from '../../utils/soundUtils';

interface POSPortalProps {
  onNavigateTab?: (tab: string) => void;
}

export const POSPortal: React.FC<POSPortalProps> = ({ onNavigateTab }) => {
  const {
    menuItems,
    categories,
    coupons,
    orders,
    tables,
    createOrder,
    addItemsToOrder,
    setKOTModalOrder,
    setReceiptModalOrder,
    updateOrderStatus,
    settings,
    isOnline,
    setIsSyncModalOpen,
    setIsShiftModalOpen,
  } = useRestaurant();
  const {
    currentUser,
    logout,
    activeBiller,
    setActiveBiller,
    supervisorAdmin,
    setSupervisorAdmin,
  } = useAuth();

  // Admin password authorization modal
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState<boolean>(false);
  const [adminRedirectTarget, setAdminRedirectTarget] = useState<string>('admin');

  // Terminal Session active state (controls showing POSTerminalLogin)
  const [isTerminalSessionActive, setIsTerminalSessionActive] = useState<boolean>(() => {
    return sessionStorage.getItem('cafeos_pos_session_active') === 'true' && !!localStorage.getItem('cafeos_active_biller_id');
  });
  const [isBillerDropdownOpen, setIsBillerDropdownOpen] = useState<boolean>(false);

  // Navigation & POS Operating Mode (Search/Menu | Delivery | Table Floor Plan | Quick Takeaway)
  const [posMode, setPosMode] = useState<'catalog' | 'table' | 'delivery' | 'quick'>('catalog');

  // Active drawer & modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState<boolean>(false);
  const [ordersModalInitialTab, setOrdersModalInitialTab] = useState<'in_prep' | 'ready' | 'history'>('in_prep');
  const [isNoticeboardModalOpen, setIsNoticeboardModalOpen] = useState<boolean>(false);
  const [isBankDepositModalOpen, setIsBankDepositModalOpen] = useState<boolean>(false);
  const [isDeviceSummaryModalOpen, setIsDeviceSummaryModalOpen] = useState<boolean>(false);
  const [isExecutiveSalesModalOpen, setIsExecutiveSalesModalOpen] = useState<boolean>(false);
  const [isItemStockModalOpen, setIsItemStockModalOpen] = useState<boolean>(false);

  // Active filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | FoodType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [menuViewMode, setMenuViewMode] = useState<'grid' | 'cards' | 'list'>(() => {
    return (localStorage.getItem('cafeos_pos_menu_view') as 'grid' | 'cards' | 'list') || 'grid';
  });

  // Cart state
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [editingExistingOrderId, setEditingExistingOrderId] = useState<string | null>(null);

  // Customer & Delivery state
  const [customerName, setCustomerName] = useState<string>('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryLandmark, setDeliveryLandmark] = useState<string>('');
  const [deliveryZoneId, setDeliveryZoneId] = useState<string>('zone-1');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState<boolean>(false);

  // Modals state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState<boolean>(false);
  const [heldOrders, setHeldOrders] = useState<Order[]>([]);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeMobileView, setActiveMobileView] = useState<'menu' | 'cart'>('menu');

  // Live Kitchen Toast Alert State for Real-Time Kitchen Notifications
  const [readyToasts, setReadyToasts] = useState<ReadyToastItem[]>([]);
  const [dispatchToast, setDispatchToast] = useState<{
    id: string;
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!dispatchToast) return;
    const timer = setTimeout(() => setDispatchToast(null), 4000);
    return () => clearTimeout(timer);
  }, [dispatchToast]);

  // Real-time Kitchen status change listener to notify POS Terminal immediately when an order is Ready
  const prevOrderStatusesRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const prevMap = prevOrderStatusesRef.current;
    const newMap: Record<string, string> = {};

    orders.forEach((ord) => {
      newMap[ord.id] = ord.status;
      const prevStatus = prevMap[ord.id];

      // If status transitioned to 'ready' from any non-ready state (or newly marked ready)
      if (prevStatus && prevStatus !== 'ready' && ord.status === 'ready') {
        playKitchenReadyChime();
        setReadyToasts((prev) => [
          {
            id: `toast-${ord.id}-${Date.now()}`,
            order: ord,
            timestamp: Date.now(),
            message: `${ord.tableName || (ord.orderType === 'takeaway' ? 'Takeaway' : 'Delivery')} (Order #${ord.orderNumber}) is cooked & ready for pickup/serving!`,
          },
          ...prev.filter((t) => t.order.id !== ord.id),
        ]);
      }
    });

    prevOrderStatusesRef.current = newMap;
  }, [orders]);

  // Filtered menu items
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.isAvailable) return false;
    if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) return false;
    if (foodTypeFilter !== 'all' && item.foodType !== foodTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = cartItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const activeZone = settings.deliveryZones.find((z) => z.id === deliveryZoneId);
  const deliveryCharge = orderType === 'delivery' ? activeZone?.deliveryCharge || 30 : 0;

  // Coupon validation against current cart
  const couponContext: CouponValidationContext = {
    subtotal,
    items: cartItems,
    orderType,
    customerPhone,
  };

  let currentCouponDiscount = 0;
  let couponWarning = '';

  if (appliedCoupon) {
    const val = validateAndCalculateCoupon(appliedCoupon, couponContext);
    if (val.isValid) {
      currentCouponDiscount = val.calculatedDiscount;
    } else {
      couponWarning = val.reason || 'Coupon invalid for cart';
    }
  }

  const bestAutoCoupon =
    !appliedCoupon && cartItems.length > 0
      ? findBestAutoApplicableCoupon(coupons, couponContext)
      : null;

  const rawTotal = Math.max(0, subtotal - currentCouponDiscount) + taxAmount + deliveryCharge;
  const roundOff = Math.round(rawTotal) - rawTotal;
  const grandTotal = Math.round(rawTotal);

  // Active counts for header
  const inPrepCount = orders.filter(
    (o) =>
      ['in_prep', 'kot_generated', 'new', 'confirmed', 'kitchen_accepted', 'preparing'].includes(o.status) &&
      o.status !== 'cancelled' &&
      o.paymentStatus !== 'paid'
  ).length;

  const readyCount = orders.filter(
    (o) =>
      o.status === 'ready' &&
      o.status !== 'cancelled' &&
      o.paymentStatus !== 'paid'
  ).length;

  const onlineOrdersCount = orders.filter(
    (o) =>
      (o.orderType === 'delivery' || o.orderType === 'online') &&
      o.paymentStatus !== 'paid' &&
      o.status !== 'cancelled'
  ).length;

  // Cart quantity helpers for fast cashier tapping
  const getItemCartQuantity = (menuItemId: string) => {
    return cartItems
      .filter((ci) => ci.menuItemId === menuItemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  // Add Item handler
  const handleItemClick = (item: MenuItem) => {
    if ((item.variants && item.variants.length > 0) || item.modifierIds.length > 0) {
      setCustomizingItem(item);
    } else {
      // Check if this item without modifiers already exists in cart -> increment quantity!
      setCartItems((prev) => {
        const existingIdx = prev.findIndex(
          (ci) => ci.menuItemId === item.id && (!ci.modifiers || ci.modifiers.length === 0)
        );
        if (existingIdx > -1) {
          const updated = [...prev];
          const curr = updated[existingIdx];
          const newQty = curr.quantity + 1;
          const tax = (curr.unitPrice * newQty * curr.taxPercent) / 100;
          updated[existingIdx] = {
            ...curr,
            quantity: newQty,
            taxAmount: tax,
            totalAmount: curr.unitPrice * newQty + tax,
          };
          return updated;
        }

        const taxAmt = (item.basePrice * item.taxPercent) / 100;
        const newItem: OrderItem = {
          id: `ord-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          menuItemId: item.id,
          name: item.name,
          foodType: item.foodType,
          basePrice: item.basePrice,
          unitPrice: item.basePrice,
          quantity: 1,
          modifiers: [],
          taxPercent: item.taxPercent,
          taxAmount: taxAmt,
          totalAmount: item.basePrice + taxAmt,
        };
        return [...prev, newItem];
      });
    }
  };

  const handleDecrementItem = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Find the last added cart item for this menuItemId
    const matchingItems = cartItems.filter((ci) => ci.menuItemId === item.id);
    if (matchingItems.length > 0) {
      const targetItem = matchingItems[matchingItems.length - 1];
      handleUpdateQuantity(targetItem.id, targetItem.quantity - 1);
    }
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const tax = (item.unitPrice * newQty * item.taxPercent) / 100;
            return {
              ...item,
              quantity: newQty,
              taxAmount: tax,
              totalAmount: item.unitPrice * newQty + tax,
            };
          }
          return item;
        })
      );
    }
  };

  const handleClearCart = () => {
    if (cartItems.length > 0 && confirm('Are you sure you want to clear current cart?')) {
      setCartItems([]);
      setSelectedTable(null);
      setEditingExistingOrderId(null);
      setOrderNotes('');
      setAppliedCoupon(null);
    }
  };

  // Hold Order
  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;
    const tempOrder: Order = {
      id: `HELD-${Date.now()}`,
      orderNumber: 900 + heldOrders.length + 1,
      kotNumber: 900 + heldOrders.length + 1,
      orderType,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tableId: selectedTable?.id,
      tableName: selectedTable?.name,
      guestCount,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryLandmark,
      deliveryCharge,
      items: cartItems,
      subtotal,
      discountAmount: 0,
      taxAmount,
      roundOff,
      grandTotal,
      paymentStatus: 'pending',
      payments: [],
      cashierId: currentUser?.id || 'usr-3',
      cashierName: currentUser?.name || 'Cashier',
      notes: orderNotes,
    };
    setHeldOrders([tempOrder, ...heldOrders]);
    setCartItems([]);
    setSelectedTable(null);
    setEditingExistingOrderId(null);
  };

  const handleResumeOrder = (order: Order) => {
    setCartItems(order.items);
    setOrderType(order.orderType);
    if (order.tableId) {
      setSelectedTable({
        id: order.tableId,
        number: order.tableName || 'T-01',
        name: order.tableName || 'Table',
        section: 'Dining',
        capacity: order.guestCount || 2,
        status: 'occupied',
      });
    }
    setCustomerName(order.customerName || 'Walk-in Guest');
    setCustomerPhone(order.customerPhone || '');
    setHeldOrders(heldOrders.filter((h) => h.id !== order.id));
  };

  // Send KOT & Create Order or Append to Running Tab
  const handleSendKOT = () => {
    if (cartItems.length === 0) {
      alert('Please add items to cart before sending KOT.');
      return;
    }
    if (orderType === 'dine_in' && !selectedTable) {
      setIsTableModalOpen(true);
      return;
    }

    // If adding to an existing running order on an active table
    if (editingExistingOrderId) {
      const count = cartItems.length;
      const updated = addItemsToOrder(editingExistingOrderId, cartItems);
      setCartItems([]);
      setSelectedTable(null);
      setEditingExistingOrderId(null);
      setOrderNotes('');
      setAppliedCoupon(null);

      // Instant non-blocking confirmation toast to cashier
      setDispatchToast({
        id: `toast-add-${Date.now()}`,
        title: '🚀 Items Forwarded to Kitchen!',
        message: `${count} new item(s) sent directly to Kitchen Display (Order #${updated?.orderNumber || ''}).`,
      });
      return;
    }

    const created = createOrder({
      orderType,
      tableId: selectedTable?.id,
      tableName: selectedTable ? `${selectedTable.number} - ${selectedTable.name}` : undefined,
      guestCount,
      customerName,
      customerPhone,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      deliveryLandmark: orderType === 'delivery' ? deliveryLandmark : undefined,
      deliveryZoneId: orderType === 'delivery' ? deliveryZoneId : undefined,
      deliveryCharge,
      items: cartItems,
      subtotal,
      discountAmount: currentCouponDiscount,
      discountReason: appliedCoupon
        ? `Coupon Promo: ${appliedCoupon.code} (${appliedCoupon.title})`
        : undefined,
      couponId: appliedCoupon?.id,
      couponCode: appliedCoupon?.code,
      taxAmount,
      roundOff,
      grandTotal,
      notes: orderNotes,
      status: 'kot_generated',
      paymentStatus: 'pending',
      cashierId: activeBiller?.id || currentUser?.id || 'usr-4',
      cashierName: activeBiller?.name || currentUser?.name || 'Sameer Joshi',
      billerId: activeBiller?.id || currentUser?.id,
      billerName: activeBiller?.name || currentUser?.name,
      billerUsername: activeBiller?.username || 'amityu4701',
      billedBy: `${activeBiller?.name || 'Sameer Joshi'} (${activeBiller?.username || 'amityu4701'})`,
      supervisorAdminId: supervisorAdmin?.id,
      supervisorAdminName: supervisorAdmin?.name,
    });

    // Directly forward to Kitchen (KDS) - NO forced physical print modal!
    setCartItems([]);
    setSelectedTable(null);
    setEditingExistingOrderId(null);
    setOrderNotes('');
    setAppliedCoupon(null);

    // Instant confirmation toast to cashier
    setDispatchToast({
      id: `toast-new-${Date.now()}`,
      title: '🚀 Forwarded to Kitchen Display (KDS)',
      message: `Order #${created.orderNumber} (${created.tableName || created.orderType.toUpperCase()}) dispatched directly to kitchen!`,
    });
  };

  // Settle Bill / Quick Pay
  const handlePayNow = () => {
    if (cartItems.length === 0) {
      alert('Please add items to cart before billing.');
      return;
    }
    if (orderType === 'dine_in' && !selectedTable) {
      setIsTableModalOpen(true);
      return;
    }

    const created = createOrder({
      orderType,
      tableId: selectedTable?.id,
      tableName: selectedTable ? `${selectedTable.number} - ${selectedTable.name}` : undefined,
      guestCount,
      customerName,
      customerPhone,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      deliveryLandmark: orderType === 'delivery' ? deliveryLandmark : undefined,
      deliveryZoneId: orderType === 'delivery' ? deliveryZoneId : undefined,
      deliveryCharge,
      items: cartItems,
      subtotal,
      discountAmount: currentCouponDiscount,
      discountReason: appliedCoupon
        ? `Coupon Promo: ${appliedCoupon.code} (${appliedCoupon.title})`
        : undefined,
      couponId: appliedCoupon?.id,
      couponCode: appliedCoupon?.code,
      taxAmount,
      roundOff,
      grandTotal,
      notes: orderNotes,
      status: 'bill_generated',
      paymentStatus: 'pending',
      cashierId: activeBiller?.id || currentUser?.id || 'usr-4',
      cashierName: activeBiller?.name || currentUser?.name || 'Sameer Joshi',
      billerId: activeBiller?.id || currentUser?.id,
      billerName: activeBiller?.name || currentUser?.name,
      billerUsername: activeBiller?.username || 'amityu4701',
      billedBy: `${activeBiller?.name || 'Sameer Joshi'} (${activeBiller?.username || 'amityu4701'})`,
      supervisorAdminId: supervisorAdmin?.id,
      supervisorAdminName: supervisorAdmin?.name,
    });

    setActivePaymentOrder(created);
    setCartItems([]);
    setSelectedTable(null);
    setEditingExistingOrderId(null);
    setAppliedCoupon(null);
  };

  // If POS Terminal is not logged in or active biller not established, show dedicated RoyalPOS terminal login!
  if (!isTerminalSessionActive || !activeBiller) {
    return (
      <POSTerminalLogin
        onLoginSuccess={() => {
          setIsTerminalSessionActive(true);
          sessionStorage.setItem('cafeos_pos_session_active', 'true');
        }}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
      {/* 1. TOP ROYALPOS COMMAND BAR (Exact header matching user screenshot Image 2) */}
      <div className="h-12 bg-[#00897b] text-white px-3 sm:px-4 flex items-center justify-between border-b border-[#00796b] shrink-0 select-none z-30 shadow-xs">
        {/* Left: Hamburger, Store Title & Active Biller Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white transition-colors flex items-center justify-center cursor-pointer"
            title="Open RoyalPOS Drawer"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          {/* Store Location Title matching user screenshot */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm tracking-tight text-white truncate max-w-[160px] sm:max-w-xs md:max-w-sm">
              Amity University, Lucknow , UP , ZORKO
            </span>
          </div>

          {/* Active Biller User Pill with Dropdown (amityu4701) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBillerDropdownOpen(!isBillerDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold text-white transition-all cursor-pointer border border-white/20"
              title="Click to view Biller session details or switch station"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-200" />
              <span className="font-mono">{activeBiller.username || 'amityu4701'}</span>
              <span className="text-[10px] text-emerald-200 font-normal hidden md:inline">
                ({activeBiller.name.split(' ')[0]})
              </span>
            </button>

            {/* Biller Info Dropdown */}
            {isBillerDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 text-slate-800 dark:text-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Biller</div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center justify-between mt-0.5">
                    <span>{activeBiller.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                      {activeBiller.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">@{activeBiller.username || 'amityu4701'}</div>

                  {supervisorAdmin && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                        Supervised By Admin
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {supervisorAdmin.name} <span className="font-mono text-[11px] text-slate-500">(@{supervisorAdmin.username || 'admin'})</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBillerDropdownOpen(false);
                      setIsTerminalSessionActive(false);
                      sessionStorage.removeItem('cafeos_pos_session_active');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <span>Switch Biller / Terminal Login</span>
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsBillerDropdownOpen(false);
                      setAdminRedirectTarget('admin');
                      setIsAdminPasswordModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center justify-between cursor-pointer"
                  >
                    <span>Admin Dashboard (Password Protected)</span>
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Action Buttons from Screenshot */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Queue Button with Live Prep & Ready Counts */}
          <button
            type="button"
            onClick={() => {
              setOrdersModalInitialTab(readyCount > 0 ? 'ready' : 'in_prep');
              setIsOrdersModalOpen(true);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
              readyCount > 0
                ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40 animate-pulse'
                : 'bg-black/20 hover:bg-black/30 text-white border-white/20'
            }`}
            title="Kitchen Order Queue (In Prep & Ready)"
          >
            <Layers className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Queue</span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full" title="In Kitchen Prep">
                {inPrepCount}
              </span>
              {readyCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-emerald-900 font-black text-[10px] rounded-full shadow-xs" title="Food Ready for Serving!">
                  {readyCount} Ready
                </span>
              )}
            </div>
          </button>

          {/* Online Order */}
          <button
            type="button"
            onClick={() => {
              setOrdersModalInitialTab('in_prep');
              setIsOrdersModalOpen(true);
            }}
            className="px-2.5 py-1 bg-black/20 hover:bg-black/30 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/20 shadow-2xs cursor-pointer"
          >
            <Bike className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Online Order</span>
            <span className="px-1.5 py-0.2 bg-emerald-300 text-emerald-950 font-black text-[10px] rounded-full">
              {onlineOrdersCount}
            </span>
          </button>

          {/* KDS */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('kds');
            }}
            className="px-2.5 py-1 bg-black/20 hover:bg-black/30 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/20 cursor-pointer"
            title="Switch to Kitchen Display System"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
            <span>KDS</span>
          </button>

          {/* HOLD Orders */}
          <button
            type="button"
            onClick={() => setIsHeldModalOpen(true)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/20 cursor-pointer ${
              heldOrders.length > 0
                ? 'bg-amber-500 text-slate-950 animate-pulse font-black'
                : 'bg-black/20 hover:bg-black/30 text-white'
            }`}
          >
            <Pause className="w-3.5 h-3.5 text-white" />
            <span>HOLD</span>
            {heldOrders.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-slate-900 text-[10px] font-black rounded-full">
                {heldOrders.length}
              </span>
            )}
          </button>

          {/* Guest */}
          <button
            type="button"
            onClick={() => {
              const name = prompt('Enter customer name or phone for loyalty lookup:', customerName);
              if (name) setCustomerName(name);
            }}
            className="px-2.5 py-1 bg-black/20 hover:bg-black/30 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/20 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Guest</span>
          </button>

          {/* More (...) -> Opens Drawer */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 bg-black/20 hover:bg-black/30 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center border border-white/20 cursor-pointer"
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FLOATING KITCHEN DISPATCH CONFIRMATION TOAST */}
      {dispatchToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-300 pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl border text-sm font-semibold backdrop-blur-md bg-slate-900/95 text-white border-slate-700 shadow-slate-900/40">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-black text-xs uppercase tracking-wider text-emerald-400">{dispatchToast.title}</span>
              <span className="text-xs font-normal text-slate-100">{dispatchToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOrdersModalInitialTab('in_prep');
                setIsOrdersModalOpen(true);
                setDispatchToast(null);
              }}
              className="ml-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => setDispatchToast(null)}
              className="p-1 hover:bg-white/20 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* LIVE KITCHEN SYNC TICKER BAR (If food is ready or in prep) */}
      {readyCount > 0 && (
        <div
          onClick={() => {
            setOrdersModalInitialTab('ready');
            setIsOrdersModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 flex items-center justify-between text-xs font-bold cursor-pointer transition-colors shadow-inner"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>
              <strong>KITCHEN ALERT:</strong> {readyCount} order(s) marked <strong>READY</strong> by Kitchen! Ready to serve.
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-emerald-800/80 px-2 py-0.5 rounded-lg border border-emerald-400/40">
            <span>Open Ready Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 2. SUB-BAR: 4 OPERATING MODES (Search | Delivery | Table | Quick) */}
      <div className="h-11 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mode: Search / Menu Catalog */}
          <button
            type="button"
            onClick={() => setPosMode('catalog')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              posMode === 'catalog'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search / Menu</span>
          </button>

          {/* Mode: Delivery */}
          <button
            type="button"
            onClick={() => {
              setPosMode('catalog');
              setOrderType('delivery');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              orderType === 'delivery' && posMode === 'catalog'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Delivery</span>
          </button>

          {/* Mode: Table Floor Plan */}
          <button
            type="button"
            onClick={() => setPosMode('table')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              posMode === 'table'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Table Floor Plan</span>
            <span className="px-1.5 py-0.2 bg-slate-900/40 text-white text-[10px] rounded-full font-bold">
              {tables.filter((t) => t.status !== 'available').length} Active
            </span>
          </button>

          {/* Mode: Quick Takeaway */}
          <button
            type="button"
            onClick={() => {
              setPosMode('catalog');
              setOrderType('takeaway');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              orderType === 'takeaway' && posMode === 'catalog'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Quick Takeaway</span>
          </button>
        </div>

        {/* Right side of sub-bar: Active Table / Tab Indicator */}
        <div className="flex items-center gap-2">
          {selectedTable && (
            <div className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-black flex items-center gap-1.5">
              <span>Table: {selectedTable.number}</span>
              {editingExistingOrderId && (
                <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded-full">
                  Adding to Active Order
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setOrdersModalInitialTab('in_prep');
              setIsOrdersModalOpen(true);
            }}
            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Active Orders ({inPrepCount})</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Mobile Toggle Bar */}
        <div className="lg:hidden flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 gap-2">
          <button
            onClick={() => setActiveMobileView('menu')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMobileView === 'menu'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu / Table</span>
          </button>
          <button
            onClick={() => setActiveMobileView('cart')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMobileView === 'cart'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>
              Cart ({cartItems.reduce((sum, i) => sum + i.quantity, 0)}) •{' '}
              {formatCurrency(grandTotal, settings.currencySymbol)}
            </span>
          </button>
        </div>

        {/* CENTER PANE: Either TABLE FLOOR PLAN or MENU CATALOG */}
        <div
          className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
            activeMobileView === 'cart' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {posMode === 'table' ? (
            <POSTableFloorView
              selectedTableId={selectedTable?.id}
              onSelectTableForCart={(table) => {
                setSelectedTable(table);
                setOrderType('dine_in');
                setEditingExistingOrderId(null);
                setPosMode('catalog');
              }}
              onSelectOrderToPay={(order) => {
                setActivePaymentOrder(order);
              }}
              onAddItemsToTableOrder={(order) => {
                const foundTable = tables.find((t) => t.id === order.tableId);
                if (foundTable) {
                  setSelectedTable(foundTable);
                }
                setOrderType('dine_in');
                setEditingExistingOrderId(order.id);
                setPosMode('catalog');
              }}
            />
          ) : (
            <>
              {/* Top Search & Filter Bar */}
              <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search dishes, drinks, pizzas, SKUs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                {/* View Mode Toggle (Grid View / Cards / List) */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuViewMode('grid');
                      localStorage.setItem('cafeos_pos_menu_view', 'grid');
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      menuViewMode === 'grid'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Touch-Optimized Large Tile Grid: Faster Tapping for Cashiers"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grid View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuViewMode('cards');
                      localStorage.setItem('cafeos_pos_menu_view', 'cards');
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      menuViewMode === 'cards'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Detailed Photo Cards with Images and Descriptions"
                  >
                    <span>Cards</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuViewMode('list');
                      localStorage.setItem('cafeos_pos_menu_view', 'list');
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      menuViewMode === 'list'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Compact Row List for Rapid Scanning"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List</span>
                  </button>
                </div>

                {/* Food Type Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                  {(
                    [
                      { id: 'all', label: 'All Items' },
                      { id: 'veg', label: 'Veg', dot: 'bg-emerald-500' },
                      { id: 'non_veg', label: 'Non-Veg', dot: 'bg-rose-500' },
                      { id: 'vegan', label: 'Vegan', dot: 'bg-teal-500' },
                    ] as { id: 'all' | FoodType; label: string; dot?: string }[]
                  ).map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setFoodTypeFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        foodTypeFilter === filter.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {filter.dot && <span className={`w-2 h-2 rounded-full ${filter.dot}`} />}
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selector Horizontal Tabs */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedCategoryId('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategoryId === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All Menu ({menuItems.length})
                </button>
                {categories
                  .filter((c) => c.isActive)
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((cat) => {
                    const count = menuItems.filter(
                      (m) => m.categoryId === cat.id && m.isAvailable
                    ).length;
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{cat.icon || '🍽️'}</span>
                        <span>{cat.name}</span>
                        <span className="text-[10px] opacity-75">({count})</span>
                      </button>
                    );
                  })}
              </div>

              {/* Food Items Visual Display Area */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
                {filteredMenuItems.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    No menu items found for the selected category/filters.
                  </div>
                ) : menuViewMode === 'grid' ? (
                  /* 1. LARGE TOUCH-OPTIMIZED TILE GRID (High-speed cashier tapping) */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                    {filteredMenuItems.map((item) => {
                      const inCartQty = getItemCartQuantity(item.id);
                      const isSelectedInCart = inCartQty > 0;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`min-h-[125px] sm:min-h-[135px] p-3 rounded-2xl relative flex flex-col justify-between select-none cursor-pointer transition-all duration-150 group active:scale-[0.96] shadow-xs ${
                            isSelectedInCart
                              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-500 ring-2 ring-amber-400/25 shadow-amber-500/10'
                              : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 hover:shadow-md'
                          }`}
                        >
                          {/* Top row: Type dot, category tag, and in-cart count */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              {/* Veg / Non-Veg Indicator */}
                              <span
                                className={`w-3 h-3 rounded-full shrink-0 shadow-2xs border border-white dark:border-slate-900 ${
                                  item.foodType === 'veg'
                                    ? 'bg-emerald-500'
                                    : item.foodType === 'vegan'
                                    ? 'bg-teal-500'
                                    : 'bg-rose-500'
                                }`}
                                title={item.foodType.toUpperCase()}
                              />
                              {item.sku && (
                                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline truncate max-w-[60px]">
                                  #{item.sku}
                                </span>
                              )}
                            </div>

                            {/* In-Cart Badge OR Popular Tag */}
                            {isSelectedInCart ? (
                              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-full shadow-xs ring-2 ring-amber-300 animate-in zoom-in-75">
                                ×{inCartQty} in cart
                              </span>
                            ) : item.isPopular ? (
                              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px] rounded-md flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                <span>Hot</span>
                              </span>
                            ) : null}
                          </div>

                          {/* Middle row: Large Touch Title & Avatar */}
                          <div className="my-1.5 flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm sm:text-base font-black leading-snug line-clamp-2 transition-colors ${
                                  isSelectedInCart
                                    ? 'text-amber-900 dark:text-amber-300'
                                    : 'text-slate-900 dark:text-white group-hover:text-amber-600'
                                }`}
                              >
                                {item.name}
                              </h4>
                              {((item.variants && item.variants.length > 0) || item.modifierIds.length > 0) && (
                                <span className="inline-block mt-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                                  Customizable
                                </span>
                              )}
                            </div>

                            {/* Crisp thumbnail image */}
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shrink-0 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </div>

                          {/* Bottom row: Price Pill & Rapid Tapping Stepper/Add Button */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-black text-xs sm:text-sm rounded-lg border border-emerald-200/70 dark:border-emerald-800/70">
                              {formatCurrency(item.basePrice, settings.currencySymbol)}
                            </span>

                            {isSelectedInCart ? (
                              <div
                                className="flex items-center gap-1 bg-amber-500 text-slate-950 rounded-lg p-0.5 shadow-2xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleDecrementItem(item, e)}
                                  className="w-6 h-6 rounded-md bg-white/30 hover:bg-white/50 text-slate-950 flex items-center justify-center font-black transition-colors cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                                <span className="w-5 text-center font-black text-xs">{inCartQty}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemClick(item);
                                  }}
                                  className="w-6 h-6 rounded-md bg-white/30 hover:bg-white/50 text-slate-950 flex items-center justify-center font-black transition-colors cursor-pointer"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              </div>
                            ) : (
                              <div className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 transition-colors">
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                <span className="font-extrabold">Add</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : menuViewMode === 'list' ? (
                  /* 2. DENSE LIST ROWS (Compact for rapid scanning) */
                  <div className="space-y-2">
                    {filteredMenuItems.map((item) => {
                      const inCartQty = getItemCartQuantity(item.id);
                      const isSelectedInCart = inCartQty > 0;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.99] shadow-2xs ${
                            isSelectedInCart
                              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-400/40'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 hover:shadow-xs'
                          }`}
                        >
                          {/* Left: Indicator, Image, Item info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span
                              className={`w-3 h-3 rounded-full shrink-0 shadow-2xs ${
                                item.foodType === 'veg'
                                  ? 'bg-emerald-500'
                                  : item.foodType === 'vegan'
                                  ? 'bg-teal-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                  {item.name}
                                </h4>
                                {item.sku && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    #{item.sku}
                                  </span>
                                )}
                                {item.isPopular && (
                                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold rounded">
                                    Hot
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          {/* Right: Price & Quick Action */}
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-black text-sm text-slate-900 dark:text-white min-w-[65px] text-right">
                              {formatCurrency(item.basePrice, settings.currencySymbol)}
                            </span>

                            {isSelectedInCart ? (
                              <div
                                className="flex items-center gap-1 bg-amber-500 text-slate-950 rounded-lg p-0.5 shadow-2xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleDecrementItem(item, e)}
                                  className="w-6 h-6 rounded-md bg-white/30 hover:bg-white/50 text-slate-950 flex items-center justify-center font-black transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                                <span className="w-5 text-center font-black text-xs">{inCartQty}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemClick(item);
                                  }}
                                  className="w-6 h-6 rounded-md bg-white/30 hover:bg-white/50 text-slate-950 flex items-center justify-center font-black transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(item);
                                }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* 3. DETAILED PHOTO CARDS VIEW */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {filteredMenuItems.map((item) => {
                      const inCartQty = getItemCartQuantity(item.id);
                      const isSelectedInCart = inCartQty > 0;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`rounded-2xl border shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col group active:scale-[0.98] ${
                            isSelectedInCart
                              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500 ring-1 ring-amber-400/40'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50'
                          }`}
                        >
                          {/* Item Image */}
                          <div className="relative h-28 sm:h-32 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {/* Food Type Indicator */}
                            <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1 rounded-md shadow-xs flex items-center justify-center">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  item.foodType === 'veg'
                                    ? 'bg-emerald-500'
                                    : item.foodType === 'vegan'
                                    ? 'bg-teal-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                            </div>

                            {/* In-cart badge on card */}
                            {isSelectedInCart ? (
                              <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs ring-2 ring-amber-300">
                                ×{inCartQty} in cart
                              </div>
                            ) : item.isPopular ? (
                              <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                                <Flame className="w-3 h-3 fill-white" />
                                <span>Popular</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Content */}
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 transition-colors">
                                {item.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                                {item.description}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {formatCurrency(item.basePrice, settings.currencySymbol)}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(item);
                                }}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: POS Order Cart & Billing Panel */}
        <div
          className={`w-full lg:w-96 xl:w-104 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden shrink-0 ${
            activeMobileView === 'menu' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Cart Header & Order Type Picker */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            {/* Order Type Toggle */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'dine_in', label: 'Dine In', icon: UtensilsCrossed },
                { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
                { id: 'delivery', label: 'Delivery', icon: Bike },
              ].map((type) => {
                const Icon = type.icon;
                const isSelected = orderType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setOrderType(type.id as OrderType);
                      if (type.id === 'dine_in' && !selectedTable) {
                        setIsTableModalOpen(true);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dine-In Table Selector Pill */}
            {orderType === 'dine_in' && (
              <div className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="font-bold text-xs text-amber-900 dark:text-amber-300">
                      {selectedTable
                        ? `${selectedTable.number} (${selectedTable.name})`
                        : 'No Table Selected'}
                    </span>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      {selectedTable
                        ? `Section: ${selectedTable.section} • Guests: ${guestCount}`
                        : 'Select table for dine-in KOT'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  {selectedTable ? 'Change' : 'Assign'}
                </button>
              </div>
            )}

            {/* Delivery Inputs */}
            {orderType === 'delivery' && (
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Customer Delivery Address..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Phone number..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs"
                  />
                  <select
                    value={deliveryZoneId}
                    onChange={(e) => setDeliveryZoneId(e.target.value)}
                    className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-medium"
                  >
                    {settings.deliveryZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} (+{formatCurrency(zone.deliveryCharge, settings.currencySymbol)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
                <p className="text-xs">Your order cart is empty.</p>
                <p className="text-[11px] opacity-75">Click on menu items or choose a table to start billing.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2 text-xs">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.foodType === 'veg'
                            ? 'bg-emerald-500'
                            : item.foodType === 'vegan'
                            ? 'bg-teal-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.name}
                      </span>
                    </div>

                    {item.variantName && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 pl-3.5">
                        Variant: {item.variantName}
                      </div>
                    )}

                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="text-[10px] text-slate-500 pl-3.5 space-y-0.5">
                        {item.modifiers.map((m, idx) => (
                          <div key={idx}>
                            + {m.optionName} ({formatCurrency(m.price, settings.currencySymbol)})
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-slate-500 text-[11px] pl-3.5 mt-0.5">
                      {formatCurrency(item.unitPrice, settings.currencySymbol)} x {item.quantity}
                    </div>
                  </div>

                  {/* Quantity Counter & Total */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(item.unitPrice * item.quantity, settings.currencySymbol)}
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-100 hover:text-rose-600 transition-colors text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-100 hover:text-amber-600 transition-colors text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Coupon Picker & Promotion Strip */}
          {cartItems.length > 0 && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-[11px] text-emerald-600 ml-1">
                        (-{formatCurrency(currentCouponDiscount, settings.currencySymbol)})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : bestAutoCoupon ? (
                <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <div>
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        Auto Promo: {bestAutoCoupon.coupon.code}
                      </span>
                      <span className="text-[11px] text-amber-700 ml-1">
                        Save {formatCurrency(bestAutoCoupon.calculatedDiscount, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(bestAutoCoupon.coupon)}
                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(true)}
                  className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-dashed border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Apply Coupon / Offers</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                    {coupons.filter((c) => c.isActive).length} Available
                  </span>
                </button>
              )}

              {couponWarning && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium px-1">
                  ⚠️ {couponWarning}
                </div>
              )}
            </div>
          )}

          {/* Totals & POS Action Buttons */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            {/* Subtotal, Tax, Delivery calculations */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, settings.currencySymbol)}</span>
              </div>

              {currentCouponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Discount ({appliedCoupon?.code})</span>
                  </span>
                  <span>-{formatCurrency(currentCouponDiscount, settings.currencySymbol)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Taxes (GST 5%)</span>
                <span>{formatCurrency(taxAmount, settings.currencySymbol)}</span>
              </div>
              {deliveryCharge > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Delivery Charge</span>
                  <span>{formatCurrency(deliveryCharge, settings.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Total</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatCurrency(grandTotal, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Quick POS Controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleHoldOrder}
                disabled={cartItems.length === 0}
                className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Hold Order</span>
              </button>

              <button
                type="button"
                onClick={handleClearCart}
                disabled={cartItems.length === 0}
                className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            </div>

            {/* Main Action Buttons: Send KOT vs Settle Bill */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleSendKOT}
                disabled={cartItems.length === 0}
                className="py-3 px-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{editingExistingOrderId ? 'Add to KOT' : 'Send KOT'}</span>
              </button>

              <button
                type="button"
                onClick={handlePayNow}
                disabled={cartItems.length === 0}
                className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Pay & Settle</span>
              </button>
            </div>

            {!isOnline && (
              <div
                onClick={() => setIsSyncModalOpen(true)}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-center justify-between cursor-pointer hover:opacity-90"
              >
                <span>⚡ Offline Mode: Queued to IndexedDB</span>
                <span className="underline">View Queue →</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROYALPOS SLIDING DRAWER MENU */}
      <POSDrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenOrders={(tab) => {
          setOrdersModalInitialTab(tab || 'in_prep');
          setIsOrdersModalOpen(true);
        }}
        onOpenIncome={() => setIsExecutiveSalesModalOpen(true)}
        onOpenExpense={() => {
          setAdminRedirectTarget('admin');
          setIsAdminPasswordModalOpen(true);
        }}
        onOpenBankDeposit={() => setIsBankDepositModalOpen(true)}
        onOpenOnlineTransactions={() => {
          setOrdersModalInitialTab('in_prep');
          setIsOrdersModalOpen(true);
        }}
        onOpenNoticeboard={() => setIsNoticeboardModalOpen(true)}
        onOpenExecutiveSales={() => setIsExecutiveSalesModalOpen(true)}
        onOpenKOTHistory={() => {
          setOrdersModalInitialTab('in_prep');
          setIsOrdersModalOpen(true);
        }}
        onOpenItemStock={() => setIsItemStockModalOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenEndDay={() => setIsShiftModalOpen(true)}
        onOpenDeviceSummary={() => setIsDeviceSummaryModalOpen(true)}
        onNavigateAdmin={() => {
          setAdminRedirectTarget('admin');
          setIsAdminPasswordModalOpen(true);
        }}
        onNavigateSettings={() => {
          setAdminRedirectTarget('admin');
          setIsAdminPasswordModalOpen(true);
        }}
        onOpenCustomers={() => {
          const name = prompt('Customer Master Search / Phone:', customerName);
          if (name) setCustomerName(name);
        }}
        onLogout={() => {
          setIsTerminalSessionActive(false);
          sessionStorage.removeItem('cafeos_pos_session_active');
        }}
      />

      {/* ALL IN ONE ORDERS MANAGER MODAL (In Prep, Ready, History, All, Dine In, Takeaway, Delivery) */}
      <OrdersManagerModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        initialTab={ordersModalInitialTab}
        onSelectOrderForPayment={(order) => {
          setActivePaymentOrder(order);
        }}
      />

      {/* NOTICEBOARD MODAL */}
      {isNoticeboardModalOpen && (
        <NoticeboardModal onClose={() => setIsNoticeboardModalOpen(false)} />
      )}

      {/* BANK DEPOSIT MODAL */}
      {isBankDepositModalOpen && (
        <BankDepositModal onClose={() => setIsBankDepositModalOpen(false)} />
      )}

      {/* DEVICE SUMMARY MODAL */}
      {isDeviceSummaryModalOpen && (
        <DeviceSummaryModal onClose={() => setIsDeviceSummaryModalOpen(false)} />
      )}

      {/* EXECUTIVE SALES MODAL */}
      {isExecutiveSalesModalOpen && (
        <ExecutiveSalesModal onClose={() => setIsExecutiveSalesModalOpen(false)} />
      )}

      {/* ITEM STOCK MODAL */}
      {isItemStockModalOpen && (
        <ItemStockModal onClose={() => setIsItemStockModalOpen(false)} />
      )}

      {/* SUB-MODALS */}
      {customizingItem && (
        <ModifierSelectorModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={(orderItem) => setCartItems((prev) => [...prev, orderItem])}
        />
      )}

      {isTableModalOpen && (
        <TableSelectorModal
          selectedTableId={selectedTable?.id}
          guestCount={guestCount}
          onSelectTable={(table, guests) => {
            setSelectedTable(table);
            setGuestCount(guests);
            setEditingExistingOrderId(null);
          }}
          onSelectOrderToAppend={(order) => {
            const foundTable = tables.find((t) => t.id === order.tableId);
            if (foundTable) setSelectedTable(foundTable);
            setOrderType('dine_in');
            setEditingExistingOrderId(order.id);
            setPosMode('catalog');
          }}
          onSelectOrderToSettle={(order) => {
            setActivePaymentOrder(order);
          }}
          onClose={() => setIsTableModalOpen(false)}
        />
      )}

      {isHeldModalOpen && (
        <HeldOrdersModal
          heldOrders={heldOrders}
          onResumeOrder={handleResumeOrder}
          onDeleteHeldOrder={(id) => setHeldOrders(heldOrders.filter((h) => h.id !== id))}
          onClose={() => setIsHeldModalOpen(false)}
        />
      )}

      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentComplete={() => {
            setActivePaymentOrder(null);
          }}
        />
      )}

      {isCouponModalOpen && (
        <CouponPickerModal
          coupons={coupons}
          items={cartItems}
          subtotal={subtotal}
          orderType={orderType}
          customerPhone={customerPhone}
          appliedCoupon={appliedCoupon}
          currencySymbol={settings.currencySymbol}
          onApplyCoupon={(coupon) => {
            setAppliedCoupon(coupon);
            setIsCouponModalOpen(false);
          }}
          onRemoveCoupon={() => {
            setAppliedCoupon(null);
          }}
          onClose={() => setIsCouponModalOpen(false)}
        />
      )}

      {/* REAL-TIME KITCHEN READY NOTIFICATION TOASTS */}
      <KitchenReadyToast
        toasts={readyToasts}
        currencySymbol={settings.currencySymbol}
        onDismiss={(id) => setReadyToasts((prev) => prev.filter((t) => t.id !== id))}
        onSettleOrder={(order) => {
          setActivePaymentOrder(order);
        }}
        onMarkServed={(order) => {
          updateOrderStatus(order.id, 'served');
        }}
        onPrintReceipt={(order) => {
          setReceiptModalOrder(order);
        }}
        onPrintKOT={(order) => {
          setKOTModalOrder(order);
        }}
        onViewOrder={(order) => {
          if (order.tableId) {
            const table = tables.find((t) => t.id === order.tableId);
            if (table) setSelectedTable(table);
            setPosMode('table');
          } else {
            setOrdersModalInitialTab('ready');
            setIsOrdersModalOpen(true);
          }
        }}
      />

      {/* ADMIN PASSWORD VERIFICATION MODAL */}
      {isAdminPasswordModalOpen && (
        <AdminPasswordModal
          isOpen={isAdminPasswordModalOpen}
          onClose={() => setIsAdminPasswordModalOpen(false)}
          onSuccess={() => {
            setIsAdminPasswordModalOpen(false);
            if (onNavigateTab) {
              onNavigateTab(adminRedirectTarget);
            }
          }}
          title="Admin Authorization Required"
          description="Enter Store Manager or Super Admin PIN / password to access Admin Portal"
        />
      )}
    </div>
  );
};
