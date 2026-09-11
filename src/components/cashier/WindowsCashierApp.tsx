import {
  AlertCircle,
  ArrowLeft,
  Award,
  Banknote,
  Bike,
  Calculator,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronRight,
  Clock,
  Coffee,
  Coins,
  CreditCard,
  Crown,
  Delete,
  DollarSign,
  Download,
  ExternalLink,
  Flame,
  Gift,
  HelpCircle,
  Layers,
  Lock,
  LogOut,
  Maximize,
  Minimize,
  Monitor,
  Package,
  PauseCircle,
  Percent,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  RotateCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Split,
  Star,
  Tag,
  Terminal,
  Trash2,
  TrendingUp,
  Usb,
  User,
  UserCheck,
  UserPlus,
  Utensils,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
  WifiOff,
  X,
  Building2,
  Moon,
  Sun,
  Headphones,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTheme } from '../../context/ThemeContext';
import { useWindowsPWAInstall } from '../../hooks/useWindowsPWAInstall';
import { Customer, MenuItem, MenuModifier, Order, OrderItem, OrderType, PaymentAllocation, PaymentMethod } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { groupMenuItemsBySubcategory, SubcategoryGroup } from '../../utils/menuGrouping';
import { calculatePointsToEarn, getCustomerTierInfo } from '../../utils/loyaltyUtils';
import {
  playBarcodeBeep,
  playCashRegisterSound,
  playKeyClick,
  playKitchenReadyChime,
  playNewOrderKitchenChime,
} from '../../utils/soundUtils';
import { CashierReceiptModal } from './CashierReceiptModal';
import { CustomerLookupModal } from './CustomerLookupModal';
import { DiscountModal } from './DiscountModal';
import { HeldBill, HeldBillsModal } from './HeldBillsModal';
import { OpenItemModal } from './OpenItemModal';
import { WindowsAppSetupModal } from './WindowsAppSetupModal';
import { ItemCookingNoteModal } from './ItemCookingNoteModal';
import { PettyCashModal } from './PettyCashModal';
import { TableManagementModal } from './TableManagementModal';
import { AggregatorOrdersModal } from './AggregatorOrdersModal';
import { DayEndSummaryModal } from './DayEndSummaryModal';
import { FranchiseOperationsModal } from './FranchiseOperationsModal';
import { ModifierSelectorModal } from '../pos/ModifierSelectorModal';

interface WindowsCashierAppProps {
  onNavigateTab?: (tab: string) => void;
}

interface BillLineItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  itemTotal: number;
  foodType?: string;
  variantId?: string;
  variantName?: string;
  modifiers?: MenuModifier[];
}

export const WindowsCashierApp: React.FC<WindowsCashierAppProps> = ({ onNavigateTab }) => {
  const {
    menuItems,
    categories,
    tables,
    customers,
    settings,
    shifts,
    createOrder,
    processPayment,
    addCustomer,
    isOnline,
    setKOTModalOrder,
    catalogManifest,
    hasCatalogUpdate,
    isCatalogSyncing,
    setIsCatalogSyncModalOpen,
    isSimulatedOffline,
    toggleSimulatedOffline,
    syncStats,
  } = useRestaurant();
  const { currentUser } = useAuth();
  const { isInstallable, promptInstall, isInstalled } = useWindowsPWAInstall();

  // Terminal Identity & Hardware Configuration
  const [stationName, setStationName] = useState(() => {
    return localStorage.getItem('cafeos_pos_terminal') || 'POS-TERMINAL-01';
  });
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    (settings.billPrinterWidth as '58mm' | '80mm') || '80mm'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [drawerPulseEnabled, setDrawerPulseEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  const { isDark, toggleTheme } = useTheme();
  const [isOperationsModalOpen, setIsOperationsModalOpen] = useState(false);
  const [operationsInitialTab, setOperationsInitialTab] = useState<'launcher' | 'help' | 'support' | 'quote'>('launcher');

  // Bill Register State
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('Table 1');
  const [billItems, setBillItems] = useState<BillLineItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | { name: string; phone: string } | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  // Payment & Settlement State
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [lastSettledOrder, setLastSettledOrder] = useState<Order | null>(null);
  const [lastChangeDue, setLastChangeDue] = useState<number>(0);
  const [lastTenderedNum, setLastTenderedNum] = useState<number>(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Split Payment State
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitUpi, setSplitUpi] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [splitCashTendered, setSplitCashTendered] = useState<string>('');
  const [splitUpiRef, setSplitUpiRef] = useState<string>('');
  const [splitCardRef, setSplitCardRef] = useState<string>('');
  const [showSplitUPIQR, setShowSplitUPIQR] = useState<boolean>(false);

  // Parked / Held Bills
  const [heldBills, setHeldBills] = useState<HeldBill[]>(() => {
    try {
      const stored = localStorage.getItem('cafeos_held_bills');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [collapsedSubCats, setCollapsedSubCats] = useState<Record<string, boolean>>({});
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'veg' | 'non_veg'>('all');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isHeldBillsModalOpen, setIsHeldBillsModalOpen] = useState(false);
  const [isOpenItemModalOpen, setIsOpenItemModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isCookingNoteModalOpen, setIsCookingNoteModalOpen] = useState(false);
  const [selectedItemForNote, setSelectedItemForNote] = useState<BillLineItem | null>(null);
  const [isPettyCashModalOpen, setIsPettyCashModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isAggregatorModalOpen, setIsAggregatorModalOpen] = useState(false);
  const [isDayEndModalOpen, setIsDayEndModalOpen] = useState(false);

  // Cooking notes helper
  const handleOpenCookingNote = (item?: BillLineItem) => {
    if (item) {
      setSelectedItemForNote(item);
      setIsCookingNoteModalOpen(true);
    } else if (billItems.length > 0) {
      setSelectedItemForNote(billItems[billItems.length - 1]);
      setIsCookingNoteModalOpen(true);
    }
  };

  const handleSaveCookingNotes = (notes: string) => {
    if (!selectedItemForNote) return;
    setBillItems((prev) =>
      prev.map((i) => (i.id === selectedItemForNote.id ? { ...i, notes } : i))
    );
    setSelectedItemForNote(null);
  };

  const handleSelectTableForNewBill = (tableName: string) => {
    setSelectedTable(tableName);
    setOrderType('dine_in');
  };

  const handleLoadActiveTableOrder = (order: Order) => {
    setSelectedTable(order.tableName || order.tableNumber || 'Table 1');
    setOrderType('dine_in');
    setBillItems(
      order.items.map((i) => ({
        id: i.id,
        menuItemId: i.menuItemId,
        name: i.name,
        price: i.unitPrice,
        quantity: i.quantity,
        itemTotal: i.totalAmount,
        foodType: i.foodType,
        notes: i.notes,
      }))
    );
    if (order.customerName) {
      setSelectedCustomer({
        name: order.customerName,
        phone: order.customerPhone || '',
      });
    }
    if (order.discountAmount) {
      setDiscountAmount(order.discountAmount);
    }
  };

  // Save held bills to localStorage
  useEffect(() => {
    localStorage.setItem('cafeos_held_bills', JSON.stringify(heldBills));
  }, [heldBills]);

  // Active shift
  const activeShift = shifts.find((s) => s.status === 'open');

  // Search input ref for quick keyboard focus [F2]
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Financial Calculations
  const subtotal = useMemo(() => {
    return billItems.reduce((acc, item) => acc + item.itemTotal, 0);
  }, [billItems]);

  const taxRate = settings.taxRate !== undefined ? settings.taxRate : 5; // 5% standard GST
  const taxAmount = useMemo(() => {
    const taxable = Math.max(0, subtotal - discountAmount);
    return Math.round((taxable * taxRate) / 100);
  }, [subtotal, discountAmount, taxRate]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  const splitCashNum = parseFloat(splitCash) || 0;
  const splitUpiNum = parseFloat(splitUpi) || 0;
  const splitCardNum = parseFloat(splitCard) || 0;
  const splitCashTenderedNum = parseFloat(splitCashTendered) || 0;

  const splitTotalAllocated = useMemo(() => {
    return Math.round((splitCashNum + splitUpiNum + splitCardNum) * 100) / 100;
  }, [splitCashNum, splitUpiNum, splitCardNum]);

  const splitRemaining = useMemo(() => {
    return Math.round((grandTotal - splitTotalAllocated) * 100) / 100;
  }, [grandTotal, splitTotalAllocated]);

  const splitChangeDue = useMemo(() => {
    if (splitCashNum > 0 && splitCashTenderedNum > splitCashNum) {
      return Math.round((splitCashTenderedNum - splitCashNum) * 100) / 100;
    }
    return 0;
  }, [splitCashNum, splitCashTenderedNum]);

  const tenderedNumeric = parseFloat(cashTendered) || 0;
  const changeDue = useMemo(() => {
    if (paymentMode === 'split') {
      return splitChangeDue;
    }
    return Math.max(0, tenderedNumeric - grandTotal);
  }, [paymentMode, splitChangeDue, tenderedNumeric, grandTotal]);

  // Active Customer Loyalty & Tier Derivations
  const activeCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    const phone = 'phone' in selectedCustomer ? selectedCustomer.phone : '';
    const id = 'id' in selectedCustomer ? (selectedCustomer as any).id : '';
    const match = customers.find((c) => (id && c.id === id) || (phone && c.phone === phone));
    if (match) return match;
    return selectedCustomer as Customer;
  }, [selectedCustomer, customers]);

  const customerPoints = useMemo(() => {
    if (!activeCustomer) return 0;
    return (activeCustomer as Customer).loyaltyPoints ?? (activeCustomer as any).points ?? 0;
  }, [activeCustomer]);

  const customerTierInfo = useMemo(() => {
    if (!activeCustomer) return null;
    return getCustomerTierInfo(customerPoints);
  }, [activeCustomer, customerPoints]);

  const projectedPointsEarned = useMemo(() => {
    if (!customerTierInfo || grandTotal <= 0) return 0;
    return calculatePointsToEarn(grandTotal, customerTierInfo.tier);
  }, [grandTotal, customerTierInfo]);

  const handleSplitFillRemaining = (target: 'cash' | 'upi' | 'card') => {
    playSound('click');
    const otherAllocated =
      target === 'cash'
        ? splitUpiNum + splitCardNum
        : target === 'upi'
        ? splitCashNum + splitCardNum
        : splitCashNum + splitUpiNum;
    const balance = Math.max(0, Math.round((grandTotal - otherAllocated) * 100) / 100);

    if (target === 'cash') {
      setSplitCash(balance > 0 ? balance.toString() : '');
      if (splitCashTenderedNum < balance) {
        setSplitCashTendered(balance > 0 ? balance.toString() : '');
      }
    } else if (target === 'upi') {
      setSplitUpi(balance > 0 ? balance.toString() : '');
    } else if (target === 'card') {
      setSplitCard(balance > 0 ? balance.toString() : '');
    }
  };

  const handleSplitPreset = (preset: 'cash_card_half' | 'cash_upi_half' | 'upi_card_half' | 'clear') => {
    playSound('click');
    if (preset === 'clear') {
      setSplitCash('');
      setSplitUpi('');
      setSplitCard('');
      setSplitCashTendered('');
      setSplitUpiRef('');
      setSplitCardRef('');
      setShowSplitUPIQR(false);
      return;
    }
    const half1 = Math.floor(grandTotal / 2);
    const half2 = Math.round((grandTotal - half1) * 100) / 100;
    if (preset === 'cash_card_half') {
      setSplitCash(half1.toString());
      setSplitCard(half2.toString());
      setSplitUpi('');
      setSplitCashTendered(half1.toString());
    } else if (preset === 'cash_upi_half') {
      setSplitCash(half1.toString());
      setSplitUpi(half2.toString());
      setSplitCard('');
      setSplitCashTendered(half1.toString());
    } else if (preset === 'upi_card_half') {
      setSplitCash('');
      setSplitUpi(half1.toString());
      setSplitCard(half2.toString());
      setSplitCashTendered('');
    }
  };

  // Sound triggers
  const playSound = (type: 'barcode' | 'cash' | 'click' | 'chime') => {
    if (!soundEnabled) return;
    if (type === 'barcode') playBarcodeBeep();
    else if (type === 'cash') playCashRegisterSound();
    else if (type === 'click') playKeyClick();
    else if (type === 'chime') playNewOrderKitchenChime();
  };

  // Add Item to Bill (with variant / modifier check)
  const handleAddItem = (menuItem: MenuItem) => {
    if (
      (menuItem.variants && menuItem.variants.length > 0) ||
      (menuItem.modifierIds && menuItem.modifierIds.length > 0)
    ) {
      setCustomizingItem(menuItem);
      return;
    }

    playSound('barcode');
    setBillItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.menuItemId === menuItem.id && !i.variantId && (!i.modifiers || i.modifiers.length === 0)
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const item = updated[existingIdx];
        const newQty = item.quantity + 1;
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          itemTotal: newQty * item.price,
        };
        return updated;
      } else {
        const itemUnitPrice = menuItem.finalPrice ?? menuItem.basePrice ?? (menuItem as any).price ?? 0;
        return [
          ...prev,
          {
            id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: itemUnitPrice,
            quantity: 1,
            itemTotal: itemUnitPrice,
            foodType: menuItem.foodType,
          },
        ];
      }
    });
  };

  const handleAddCustomizedItem = (orderItem: OrderItem) => {
    playSound('barcode');
    setBillItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        menuItemId: orderItem.menuItemId,
        name: orderItem.name,
        price: orderItem.unitPrice,
        quantity: orderItem.quantity,
        notes: orderItem.notes,
        itemTotal: orderItem.totalAmount,
        foodType: orderItem.foodType,
        variantId: orderItem.variantId,
        variantName: orderItem.variantName,
        modifiers: (orderItem.modifiers as any) || [],
      },
    ]);
    setCustomizingItem(null);
  };

  // Update item quantity
  const handleUpdateQty = (lineId: string, delta: number) => {
    playSound('click');
    setBillItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === lineId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              itemTotal: newQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean) as BillLineItem[];
    });
  };

  // Remove item
  const handleRemoveLine = (lineId: string) => {
    playSound('click');
    setBillItems((prev) => prev.filter((i) => i.id !== lineId));
  };

  // Clear / New Bill [F1]
  const handleNewBill = () => {
    playSound('click');
    setBillItems([]);
    setSelectedCustomer(null);
    setDiscountAmount(0);
    setDiscountReason('');
    setCashTendered('');
    setSplitCash('');
    setSplitUpi('');
    setSplitCard('');
    setSplitCashTendered('');
    setSplitUpiRef('');
    setSplitCardRef('');
    setShowSplitUPIQR(false);
    searchInputRef.current?.focus();
  };

  // Hold / Park Bill [F5]
  const handleHoldBill = () => {
    if (billItems.length === 0) return;
    playSound('click');

    const held: HeldBill = {
      id: `held-${Date.now()}`,
      heldAt: new Date().toISOString(),
      orderType,
      tableNumber: orderType === 'dine_in' ? selectedTable : undefined,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      items: billItems,
      subtotal,
      discount: discountAmount,
      grandTotal,
    };

    setHeldBills((prev) => [held, ...prev]);
    handleNewBill();
  };

  // Resume Parked Bill
  const handleResumeBill = (bill: HeldBill) => {
    playSound('chime');
    setBillItems(bill.items);
    setOrderType(bill.orderType as OrderType);
    if (bill.tableNumber) setSelectedTable(bill.tableNumber);
    if (bill.customerName && bill.customerPhone) {
      setSelectedCustomer({ name: bill.customerName, phone: bill.customerPhone });
    }
    setDiscountAmount(bill.discount);
    setHeldBills((prev) => prev.filter((b) => b.id !== bill.id));
  };

  // Quick Cash Notes (NumPad)
  const handleAddCashTendered = (amount: number) => {
    playSound('click');
    setCashTendered((prev) => {
      const current = parseFloat(prev) || 0;
      return (current + amount).toString();
    });
  };

  const handleSetExactCash = () => {
    playSound('click');
    setCashTendered(grandTotal.toString());
  };

  const handleClearCash = () => {
    playSound('click');
    setCashTendered('');
  };

  // Manual Cash Drawer Kick [F12]
  const handleKickDrawer = () => {
    playSound('cash');
    console.log('[Windows POS] Fired RJ11 24V Cash Drawer Kick Pulse (ESC p 0 25 250)');
  };

  // Toggle Fullscreen [F11]
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // F9: Print Kitchen KOT
  const handlePrintKOT = () => {
    if (billItems.length === 0) return;
    playSound('chime');

    const tempOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: Math.floor(1000 + Math.random() * 9000),
      kotNumber: Math.floor(100 + Math.random() * 900),
      orderType,
      tableName: orderType === 'dine_in' ? selectedTable : undefined,
      tableNumber: orderType === 'dine_in' ? selectedTable : undefined,
      status: 'kot_generated',
      items: billItems.map((b) => ({
        id: b.id,
        menuItemId: b.menuItemId,
        name: b.name,
        foodType: (b.foodType as any) || 'veg',
        basePrice: b.price,
        unitPrice: b.price,
        quantity: b.quantity,
        variantId: b.variantId,
        variantName: b.variantName,
        modifiers: b.modifiers || [],
        selectedModifiers: b.modifiers || [],
        taxPercent: 5,
        taxAmount: 0,
        totalAmount: b.itemTotal,
        kitchenStatus: 'pending',
        notes: b.notes,
      })),
      subtotal,
      deliveryCharge: 0,
      taxAmount,
      discountAmount,
      roundOff: 0,
      grandTotal,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      paymentStatus: 'pending',
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cashierId: currentUser?.id || 'cashier-1',
      cashierName: currentUser?.name || 'Counter Cashier',
      terminalId: stationName,
    };

    setKOTModalOrder(tempOrder);
  };

  // F10: Settle & Print Bill
  const handleSettleOrder = () => {
    if (billItems.length === 0) return;

    if (paymentMode === 'split') {
      if (Math.abs(splitRemaining) > 0.01) {
        return;
      }
    }

    const hasCashInPayment = paymentMode === 'cash' || (paymentMode === 'split' && splitCashNum > 0);
    if (hasCashInPayment && drawerPulseEnabled) {
      playSound('cash');
    } else {
      playSound('chime');
    }

    // Build multiple payment allocations if split, or single allocation
    let paymentAllocations: PaymentAllocation[] = [];
    let effectivePaymentMethod: PaymentMethod = 'cash';

    if (paymentMode === 'split') {
      effectivePaymentMethod = 'split';
      if (splitCashNum > 0) {
        paymentAllocations.push({
          method: 'cash',
          amount: splitCashNum,
        });
      }
      if (splitUpiNum > 0) {
        paymentAllocations.push({
          method: 'upi',
          amount: splitUpiNum,
          transactionRef: splitUpiRef.trim() || undefined,
        });
      }
      if (splitCardNum > 0) {
        paymentAllocations.push({
          method: 'credit_card',
          amount: splitCardNum,
          transactionRef: splitCardRef.trim() || undefined,
        });
      }
    } else {
      effectivePaymentMethod = paymentMode === 'upi' ? 'upi' : paymentMode === 'card' ? 'credit_card' : 'cash';
      paymentAllocations = [
        {
          method: effectivePaymentMethod,
          amount: grandTotal,
        },
      ];
    }

    const orderPayload: Partial<Order> = {
      orderType,
      tableName: orderType === 'dine_in' ? selectedTable : undefined,
      tableNumber: orderType === 'dine_in' ? selectedTable : undefined,
      items: billItems.map((b) => ({
        id: b.id,
        menuItemId: b.menuItemId,
        name: b.name,
        foodType: (b.foodType as any) || 'veg',
        basePrice: b.price,
        unitPrice: b.price,
        quantity: b.quantity,
        variantId: b.variantId,
        variantName: b.variantName,
        modifiers: b.modifiers || [],
        selectedModifiers: b.modifiers || [],
        taxPercent: 5,
        taxAmount: 0,
        totalAmount: b.itemTotal,
        kitchenStatus: 'preparing',
        notes: b.notes,
      })),
      subtotal,
      deliveryCharge: 0,
      taxAmount,
      discountAmount,
      roundOff: 0,
      discountReason: discountReason || undefined,
      grandTotal,
      customerName: activeCustomer?.name || selectedCustomer?.name,
      customerPhone: activeCustomer?.phone || selectedCustomer?.phone,
      customerId: (activeCustomer as any)?.id || (selectedCustomer as any)?.id,
      customerEmail: (activeCustomer as any)?.email,
      paymentMethod: effectivePaymentMethod,
      payments: paymentAllocations,
      paymentStatus: 'paid',
      status: 'completed',
      cashierId: currentUser?.id || 'cashier-1',
      cashierName: currentUser?.name || 'Counter Cashier',
      terminalId: stationName,
    };

    const savedOrder = createOrder(orderPayload);

    // Save history for receipt preview
    setLastSettledOrder(savedOrder);
    setLastChangeDue(changeDue);
    const finalTendered =
      paymentMode === 'split'
        ? splitCashNum > 0
          ? splitCashTenderedNum || splitCashNum
          : 0
        : paymentMode === 'cash'
        ? tenderedNumeric || grandTotal
        : 0;
    setLastTenderedNum(finalTendered);
    setIsReceiptModalOpen(true);

    // Reset bill register
    handleNewBill();
  };

  // Global Keyboard Shortcuts (F1 - F12)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in active inputs (except F-keys)
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      if (e.key === 'F1') {
        e.preventDefault();
        setIsTableModalOpen(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsDiscountModalOpen(true);
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleHoldBill();
      } else if (e.key === 'F6') {
        e.preventDefault();
        setIsHeldBillsModalOpen(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleOpenCookingNote();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handlePrintKOT();
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsOpenItemModalOpen(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        setIsPettyCashModalOpen(true);
      } else if (e.key === 'F11') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'F12') {
        e.preventDefault();
        handleSettleOrder();
      } else if (e.key === 'Escape') {
        setIsCustomerModalOpen(false);
        setIsDiscountModalOpen(false);
        setIsHeldBillsModalOpen(false);
        setIsOpenItemModalOpen(false);
        setIsReceiptModalOpen(false);
        setIsSetupModalOpen(false);
        setIsCookingNoteModalOpen(false);
        setIsPettyCashModalOpen(false);
        setIsTableModalOpen(false);
        setIsAggregatorModalOpen(false);
        setIsDayEndModalOpen(false);
        setIsOperationsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    billItems,
    subtotal,
    discountAmount,
    grandTotal,
    orderType,
    selectedTable,
    selectedCustomer,
    paymentMode,
    cashTendered,
    changeDue,
    drawerPulseEnabled,
    splitRemaining,
    splitCashNum,
    splitUpiNum,
    splitCardNum,
    splitCashTenderedNum,
    splitUpiRef,
    splitCardRef,
  ]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'beverages') {
          const isBev =
            ['cat-cold-coffee', 'cat-hot', 'cat-mojito', 'cat-shakes', 'cat-ice-tea'].includes(item.categoryId) ||
            item.name.toLowerCase().includes('coffee') ||
            item.name.toLowerCase().includes('shake') ||
            item.name.toLowerCase().includes('mojito') ||
            item.name.toLowerCase().includes('tea');
          if (!isBev) return false;
        } else if (item.categoryId !== selectedCategory) {
          return false;
        }
      }
      // Food Type filter
      if (foodTypeFilter !== 'all' && item.foodType !== foodTypeFilter) {
        return false;
      }
      // Search query (matches name, description, or short code)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.id.toLowerCase().includes(q);
        return matchesName || matchesCode;
      }
      return true;
    });
  }, [menuItems, selectedCategory, foodTypeFilter, searchQuery]);

  // Handle main category switch and reset subcategory
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubCategory('all');
  };

  // Group items by subcategory with sticky headers
  const allSubCategoryGroups = useMemo(() => {
    return groupMenuItemsBySubcategory(filteredMenuItems, selectedCategory, categories);
  }, [filteredMenuItems, selectedCategory, categories]);

  // Available subcategories for quick jump pills
  const availableSubCategories = useMemo(() => {
    return allSubCategoryGroups.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      count: g.items.length,
    }));
  }, [allSubCategoryGroups]);

  // Groups actually displayed in grid (filtered by subcategory pill if selected)
  const displayedSubCategoryGroups = useMemo(() => {
    if (selectedSubCategory === 'all') {
      return allSubCategoryGroups;
    }
    return allSubCategoryGroups.filter((g) => g.id === selectedSubCategory);
  }, [allSubCategoryGroups, selectedSubCategory]);

  // Quick Barcode / Exact Match on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMenuItems.length > 0) {
        handleAddItem(filteredMenuItems[0]);
        setSearchQuery('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* 1. WINDOWS 11 NATIVE DESKTOP SHELL TITLE BAR */}
      <header className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 text-xs text-slate-300 select-none shrink-0 shadow-md">
        {/* Left: Windows Brand & App Name */}
        <div className="flex items-center gap-2.5">
          {/* Windows 11 Icon */}
          <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
            <div className="bg-[#00897b] rounded-2xs" />
            <div className="bg-[#00897b] rounded-2xs" />
            <div className="bg-[#00897b] rounded-2xs" />
            <div className="bg-[#00897b] rounded-2xs" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-tight">
              Windows POS Billing Terminal
            </span>
            <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold border border-teal-400/30">
              {stationName}
            </span>
            <span className="hidden lg:inline text-[11px] text-slate-400">
              Outlet: <strong className="text-slate-200">{settings.name || 'Main Branch'}</strong> | Shift:{' '}
              <strong className="text-slate-200">{activeShift?.id ? 'Day Shift' : 'General'}</strong> | Cashier:{' '}
              <strong className="text-amber-400">{currentUser?.name || 'Cashier'}</strong>
            </span>
          </div>
        </div>

        {/* Center: Hardware Status Indicators */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Thermal Printer */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-emerald-400 border border-slate-700/80 cursor-pointer"
            onClick={() => setIsSetupModalOpen(true)}
            title="Thermal ESC/POS Printer connected"
          >
            <Printer className="w-3 h-3 text-emerald-400" />
            <span className="font-bold">POS {paperWidth}</span>
          </div>

          {/* Cash Drawer */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-emerald-400 border border-slate-700/80 cursor-pointer"
            onClick={handleKickDrawer}
            title="Cash Drawer Armed (Click to test kick)"
          >
            <Usb className="w-3 h-3 text-emerald-400" />
            <span className="font-bold">Drawer Ready</span>
          </div>

          {/* Barcode Scanner */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-sky-400 border border-slate-700/80">
            <QrCode className="w-3 h-3 text-sky-400" />
            <span className="font-bold">Scanner Active</span>
          </div>

          {/* Online Sync & Catalog Version Pill */}
          <button
            type="button"
            onClick={() => setIsCatalogSyncModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
              hasCatalogUpdate
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black animate-pulse shadow-sm shadow-amber-500/30'
                : isOnline && !isSimulatedOffline
                ? 'bg-slate-800 text-emerald-400 border-slate-700/80 hover:bg-slate-700'
                : 'bg-amber-950/90 text-amber-300 border-amber-600/70'
            }`}
            title="Catalog Sync Status • Click to open Admin Sync Hub"
          >
            <RotateCw className={`w-3 h-3 ${isCatalogSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isOnline && !isSimulatedOffline ? 'Online' : 'Offline'} ({catalogManifest.version})
            </span>
            {hasCatalogUpdate && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
          </button>
        </div>

        {/* Right: Window Controls & Quick Action Hub */}
        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {/* Store Operations & Support Hub Button */}
          <button
            type="button"
            onClick={() => {
              setOperationsInitialTab('launcher');
              setIsOperationsModalOpen(true);
            }}
            className="px-2.5 py-1 bg-[#00897b] hover:bg-[#00796b] text-white font-extrabold text-[11px] rounded-md shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            title="Open Store Operations & Quick Launcher"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Operations Hub</span>
          </button>

          {/* Help & Hotkeys Button */}
          <button
            type="button"
            onClick={() => {
              setOperationsInitialTab('help');
              setIsOperationsModalOpen(true);
            }}
            className="hidden sm:flex px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-md border border-slate-700 items-center gap-1 cursor-pointer"
            title="Hotkeys & POS Help Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>Help</span>
          </button>

          {/* Support Ticket Button */}
          <button
            type="button"
            onClick={() => {
              setOperationsInitialTab('support');
              setIsOperationsModalOpen(true);
            }}
            className="hidden md:flex px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-md border border-slate-700 items-center gap-1 cursor-pointer"
            title="Support Desk & Inquiries"
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>Support</span>
          </button>

          {/* Windows Setup & Install Button */}
          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-md shadow-xs transition-colors flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span className="hidden lg:inline">Install App</span>
          </button>

          {/* Cash Drawer Kick */}
          <button
            onClick={handleKickDrawer}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-md border border-slate-700 flex items-center gap-1"
            title="Manual Cash Drawer Open [F12]"
          >
            <span>Drawer [F12]</span>
          </button>

          {/* Fullscreen / Kiosk Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Toggle Windows Kiosk Fullscreen [F11]"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          {/* Exit / Switch to Admin */}
          <button
            onClick={() => onNavigateTab && onNavigateTab('admin')}
            className="p-1.5 hover:bg-rose-600 hover:text-white text-slate-400 rounded transition-colors ml-1 cursor-pointer"
            title="Exit to Admin Dashboard"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* OFFLINE RESILIENCY BANNER */}
      {(!isOnline || isSimulatedOffline) && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-600/40 px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-amber-200">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>Autonomous Offline Billing Active:</strong> Operating on local IndexedDB snapshot ({catalogManifest.version}). All items, categories, variants, and offers operate with zero cloud dependency.
            </span>
            {syncStats.queuedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                {syncStats.queuedCount} orders queued
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCatalogSyncModalOpen(true)}
              className="px-2.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded text-[11px] cursor-pointer flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
              <span>Sync Hub</span>
            </button>
            {isSimulatedOffline && (
              <button
                type="button"
                onClick={() => toggleSimulatedOffline(false)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[10px] cursor-pointer border border-slate-700"
              >
                Exit Offline Sim
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. HIGH-SPEED POS KEYBOARD HOTKEY RIBBON (F1 - F12) */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-mono text-slate-300 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { key: 'F1', label: 'Tables / Floor', action: () => setIsTableModalOpen(true), highlight: 'amber' },
            { key: 'F2', label: 'Search / Scan', action: () => searchInputRef.current?.focus() },
            { key: 'F3', label: 'Customer CRM', action: () => setIsCustomerModalOpen(true) },
            { key: 'F4', label: 'Discount', action: () => setIsDiscountModalOpen(true) },
            { key: 'F5', label: 'Hold Bill', action: handleHoldBill },
            { key: 'F6', label: `Parked (${heldBills.length})`, action: () => setIsHeldBillsModalOpen(true) },
            { key: 'F7', label: 'Kitchen Notes', action: () => handleOpenCookingNote(), highlight: 'amber' },
            { key: 'F8', label: 'Fire KOT', action: handlePrintKOT, highlight: 'emerald' },
            { key: 'F9', label: 'Open Item', action: () => setIsOpenItemModalOpen(true) },
            { key: 'F10', label: 'Petty Cash In/Out', action: () => setIsPettyCashModalOpen(true), highlight: 'sky' },
            { key: 'F11', label: 'Fullscreen', action: handleToggleFullscreen },
            { key: 'F12', label: 'Settle Bill', action: handleSettleOrder, highlight: 'emerald' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={btn.action}
              className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1 shrink-0 cursor-pointer text-xs ${
                btn.highlight === 'amber'
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold'
                  : btn.highlight === 'emerald'
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold'
                  : btn.highlight === 'sky'
                  ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/80'
              }`}
            >
              <span className="font-black text-amber-400 font-sans text-[10px]">{btn.key}:</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Petpooja & RoyalPOS Special Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Swiggy / Zomato Aggregator Live Orders */}
          <button
            type="button"
            onClick={() => setIsAggregatorModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Swiggy & Zomato Live Orders (Petpooja Integration)"
          >
            <Bike className="w-3.5 h-3.5 text-orange-400" />
            <span>Swiggy & Zomato</span>
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          </button>

          {/* Shift / Day-End Summary & Z-Report */}
          <button
            type="button"
            onClick={() => setIsDayEndModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Shift Closing & Z-Report Summary"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Day-End Z-Report</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN CASHIER BILLING WORKFLOW: 3-COLUMN HIGH-SPEED POS */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN A: CATEGORY, SEARCH & ITEM QUICK-PUNCH GRID */}
        <div className="w-1/2 lg:w-5/12 border-r border-slate-800 flex flex-col bg-slate-950/50">
          {/* Fast Search & Barcode Scan Bar */}
          <div className="p-3 border-b border-slate-800 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search dish or scan barcode [F2]... Press Enter to quick-add"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Ribbon & Veg Toggle */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => handleSelectCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                All Menu
              </button>

              {/* Consolidated Beverages Filter */}
              <button
                onClick={() => handleSelectCategory('beverages')}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1.5 ${
                  selectedCategory === 'beverages'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title="View All Beverages (Hot & Cold)"
              >
                <span>☕</span>
                <span>Beverages (Hot & Cold)</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Veg / Non-Veg Pills & Sub-groups Bar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] pt-0.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFoodTypeFilter('all')}
                  className={`px-2.5 py-0.5 rounded-md font-bold transition-colors ${
                    foodTypeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFoodTypeFilter('veg')}
                  className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-colors ${
                    foodTypeFilter === 'veg'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-500 hover:text-emerald-400'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Veg Only</span>
                </button>
                <button
                  onClick={() => setFoodTypeFilter('non_veg')}
                  className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-colors ${
                    foodTypeFilter === 'non_veg'
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      : 'text-slate-500 hover:text-rose-400'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Non-Veg</span>
                </button>
              </div>

              <button
                onClick={() => setIsOpenItemModalOpen(true)}
                className="ml-auto px-2.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded-md font-bold flex items-center gap-1 transition-colors text-xs"
                title="Add Custom / Open Item [F8]"
              >
                <Plus className="w-3 h-3" />
                <span>Custom Item [F8]</span>
              </button>
            </div>

            {/* Sub-category Quick-Jump Ribbon */}
            {availableSubCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-[11px] border-t border-slate-800/80">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-500" />
                  Sub-groups:
                </span>
                <button
                  onClick={() => setSelectedSubCategory('all')}
                  className={`px-2 py-0.5 rounded-md font-bold shrink-0 transition-colors ${
                    selectedSubCategory === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  All ({filteredMenuItems.length})
                </button>
                {availableSubCategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubCategory(sub.id)}
                    className={`px-2 py-0.5 rounded-md font-bold shrink-0 transition-colors flex items-center gap-1.5 ${
                      selectedSubCategory === sub.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{sub.icon}</span>
                    <span className="truncate max-w-[140px]">{sub.name}</span>
                    <span className="text-[9px] px-1 rounded-full bg-slate-800 text-amber-400 font-mono">
                      {sub.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items Grid with Sticky Sub-headers */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 md:grid-cols-3 gap-2.5 content-start">
            {displayedSubCategoryGroups.length === 0 ? (
              <div className="col-span-2 md:col-span-3 text-center py-16 text-slate-500 text-xs">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-slate-400">No menu items found</p>
                <p className="text-[11px] text-slate-600 mt-1">Try changing category, sub-group, or search query</p>
              </div>
            ) : (
              displayedSubCategoryGroups.map((group) => {
                const isCollapsed = !!collapsedSubCats[group.id];
                return (
                  <React.Fragment key={group.id}>
                    {/* Sticky Sub-header */}
                    <div
                      id={`subcat-header-${group.id}`}
                      className="col-span-2 md:col-span-3 sticky top-0 z-10 -mx-1 px-3 py-2 bg-slate-950/95 backdrop-blur-md border-y border-slate-800/90 rounded-lg flex items-center justify-between shadow-xs transition-all"
                    >
                      <button
                        onClick={() =>
                          setCollapsedSubCats((prev) => ({
                            ...prev,
                            [group.id]: !prev[group.id],
                          }))
                        }
                        className="flex items-center gap-2 text-left group cursor-pointer"
                        title={isCollapsed ? 'Click to expand group' : 'Click to collapse group'}
                      >
                        <span className="text-base leading-none">{group.icon}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-white tracking-wide uppercase group-hover:text-amber-400 transition-colors">
                            {group.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-amber-400 border border-amber-500/30 font-mono">
                            {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                        )}
                      </button>

                      {/* Food Type Breakdown Badges */}
                      <div className="flex items-center gap-2 text-[10px]">
                        {group.items.some((i) => i.foodType === 'veg') && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{group.items.filter((i) => i.foodType === 'veg').length} Veg</span>
                          </span>
                        )}
                        {group.items.some((i) => i.foodType === 'non_veg') && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-500/20 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{group.items.filter((i) => i.foodType === 'non_veg').length} Non-Veg</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Group Items (hidden if collapsed) */}
                    {!isCollapsed &&
                      group.items.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className="p-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/60 rounded-xl flex flex-col justify-between text-left transition-all group relative overflow-hidden active:scale-98"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                              <span className="font-mono font-bold text-slate-400 group-hover:text-amber-400">
                                #{idx + 101}
                              </span>
                              {item.foodType === 'veg' ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
                              )}
                            </div>
                            <h4 className="font-extrabold text-xs text-white leading-snug line-clamp-2">
                              {item.name}
                            </h4>
                            {((item.variants && item.variants.length > 0) ||
                              (item.modifierIds && item.modifierIds.length > 0)) && (
                              <div className="mt-1">
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
                                  Customizable
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="w-5 h-5 rounded-lg bg-slate-800 group-hover:bg-amber-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                              <Plus className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN B: CURRENT RUNNING TICKET / BILL LINE ITEMS */}
        <div className="w-1/2 lg:w-4/12 border-r border-slate-800 flex flex-col bg-slate-900/40">
          {/* Ticket Header Controls: Order Type, Table, Customer */}
          <div className="p-3 border-b border-slate-800 space-y-2.5 bg-slate-900/60">
            {/* Order Type Toggle [F7] */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl text-xs font-extrabold">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  orderType === 'dine_in' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Dine-In</span>
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  orderType === 'takeaway' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Takeaway</span>
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  orderType === 'delivery' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Delivery</span>
              </button>
            </div>

            {/* Table Selector (if Dine-in) & Customer Phone Bar */}
            <div className="flex items-center gap-2 text-xs">
              {orderType === 'dine_in' && (
                <div className="w-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsTableModalOpen(true)}
                    className="flex-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl font-black text-amber-300 text-xs flex items-center justify-between transition-colors cursor-pointer"
                    title="Open Visual Table Floor Plan [F1]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{selectedTable}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-400 font-bold shrink-0">
                      [F1]
                    </span>
                  </button>
                </div>
              )}

              {/* Customer Lookup [F3] Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                  orderType === 'dine_in' ? 'w-1/2' : 'w-full'
                } ${
                  activeCustomer
                    ? 'bg-sky-950/70 border-sky-500/50 text-sky-200'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Customer & Loyalty Member Lookup [F3]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {activeCustomer ? (
                    <UserCheck className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">
                    {activeCustomer ? activeCustomer.name : 'Customer Lookup [F3]'}
                  </span>
                </div>
                {activeCustomer ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{customerPoints} pts</span>
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(null);
                      }}
                      className="p-0.5 hover:text-white text-slate-400 transition-colors"
                      title="Clear customer"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </div>
                ) : null}
              </button>
            </div>

            {/* When a customer is selected: Display their loyalty points, current tier & repeat visit incentives */}
            {activeCustomer && customerTierInfo && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                {/* Header: Customer, Tier Badge, Points */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-white text-xs truncate">
                        {activeCustomer.name}
                      </span>
                      {activeCustomer.phone && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {activeCustomer.phone}
                        </span>
                      )}
                    </div>

                    {/* Tier Badge with distinctive styling */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-xs ${
                          customerTierInfo.tier === 'platinum'
                            ? 'bg-purple-950/90 text-purple-200 border-purple-500/60'
                            : customerTierInfo.tier === 'gold'
                            ? 'bg-yellow-950/90 text-yellow-200 border-yellow-500/60'
                            : customerTierInfo.tier === 'silver'
                            ? 'bg-slate-800 text-slate-100 border-slate-400/60'
                            : 'bg-amber-950/70 text-amber-200 border-amber-600/60'
                        }`}
                      >
                        {customerTierInfo.tier === 'platinum' && <Sparkles className="w-3 h-3 text-purple-300" />}
                        {customerTierInfo.tier === 'gold' && <Crown className="w-3 h-3 text-yellow-300" />}
                        {customerTierInfo.tier === 'silver' && <ShieldCheck className="w-3 h-3 text-slate-200" />}
                        {customerTierInfo.tier === 'bronze' && <Award className="w-3 h-3 text-amber-300" />}
                        <span>{customerTierInfo.label}</span>
                        <span className="opacity-75 font-mono text-[9px]">({customerTierInfo.multiplier}x Pts)</span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {activeCustomer.totalOrders || 1} {activeCustomer.totalOrders === 1 ? 'visit' : 'visits'}
                      </span>
                    </div>
                  </div>

                  {/* Points Counter Box */}
                  <div className="text-right shrink-0 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-end gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-black text-sm font-mono">{customerPoints}</span>
                      <span className="text-[10px] font-bold uppercase text-amber-400/80">pts</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      ≈ ₹{(customerPoints * 0.5).toFixed(0)} value
                    </div>
                  </div>
                </div>

                {/* Repeat Visit Incentives: Next Tier Target Progress & Order Points Accrual */}
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1.5">
                  {customerTierInfo.nextTier ? (
                    <div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 flex items-center gap-1 font-medium">
                          <TrendingUp className="w-3 h-3 text-sky-400" />
                          <span>Level Up: <strong className="text-sky-300">{customerTierInfo.nextTier.label}</strong></span>
                        </span>
                        <span className="font-mono font-bold text-sky-400">
                          {customerTierInfo.nextTier.pointsNeeded} pts needed
                        </span>
                      </div>

                      {/* Tier Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-sky-400 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                8,
                                ((customerPoints - customerTierInfo.minPoints) /
                                  (customerTierInfo.nextTier.pointsNeeded + (customerPoints - customerTierInfo.minPoints))) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="text-[9px] text-amber-300/90 mt-1 flex items-center justify-between">
                        <span>💬 Prompt: "Only {customerTierInfo.nextTier.pointsNeeded} pts left to unlock {customerTierInfo.nextTier.label} perks on next visit!"</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-purple-300">
                      <span className="flex items-center gap-1 font-bold">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Top Tier VIP — Earning 2.0x Double Points on Every Visit</span>
                      </span>
                      <span className="text-[9px] font-mono text-purple-400/80">VIP Legend</span>
                    </div>
                  )}

                  {/* Projected Points Earned for Current Ticket */}
                  {billItems.length > 0 && (
                    <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>Points to earn today:</span>
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        +{projectedPointsEarned} pts ({customerTierInfo.multiplier}x rate)
                      </span>
                    </div>
                  )}

                  {/* Redeemable Loyalty Discount Call-to-Action */}
                  {customerPoints >= 100 && (
                    <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <Gift className="w-3 h-3 text-emerald-400" />
                        <span>Reward available: ₹50+ off [F4]</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDiscountModalOpen(true)}
                        className="text-[10px] font-bold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Redeem Discount</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Switch / Remove Bar */}
                <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-500">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="hover:text-sky-400 text-sky-500 font-bold transition-colors cursor-pointer"
                  >
                    Switch Member [F3]
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="hover:text-rose-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Line Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {billItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs p-6 space-y-3">
                <Coffee className="w-12 h-12 text-slate-700 stroke-1" />
                <div>
                  <div className="font-bold text-slate-400 text-sm">Ticket Register Empty</div>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Click items on the left or press <strong>[F2]</strong> to barcode scan items. Press{' '}
                    <strong>[F1]</strong> to reset.
                  </p>
                </div>
                {heldBills.length > 0 && (
                  <button
                    onClick={() => setIsHeldBillsModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Recall {heldBills.length} Held Bills [F6]</span>
                  </button>
                )}
              </div>
            ) : (
              billItems.map((line, idx) => (
                <div
                  key={line.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                        <h5 className="font-bold text-xs text-white truncate">{line.name}</h5>
                        {line.variantName && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/30">
                            {line.variantName}
                          </span>
                        )}
                      </div>
                      {line.modifiers && line.modifiers.length > 0 && (
                        <div className="text-[10px] text-slate-400 flex flex-wrap gap-1 mt-0.5">
                          {line.modifiers.map((m) => (
                            <span
                              key={m.id}
                              className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-200/90 text-[9px] border border-amber-500/20"
                            >
                              +{m.name} (₹{m.price})
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400">
                        {formatCurrency(line.price)} each
                      </div>
                    </div>
                    <div className="text-xs font-black text-amber-400 text-right">
                      {formatCurrency(line.itemTotal)}
                    </div>
                  </div>

                  {/* Petpooja / RoyalPOS Cooking Note Display */}
                  {line.notes && (
                    <div
                      onClick={() => handleOpenCookingNote(line)}
                      className="text-[10px] text-amber-300 font-medium flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 cursor-pointer transition-colors"
                      title="Click to edit cooking instructions"
                    >
                      <ChefHat className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">Kitchen: {line.notes}</span>
                    </div>
                  )}

                  {/* Line item stepper controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                    <div className="flex items-center gap-1.5 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => handleUpdateQty(line.id, -1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-white font-mono">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(line.id, 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenCookingNote(line)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          line.notes
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                        }`}
                        title="Kitchen instruction / cooking note [F7]"
                      >
                        <ChefHat className="w-3 h-3 text-amber-400" />
                        <span>{line.notes ? 'Edit Note' : '+ Note'}</span>
                      </button>

                      <button
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ticket Bottom Actions */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={handleNewBill}
              className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
              title="Reset Bill [F1]"
            >
              Clear [F1]
            </button>
            <button
              onClick={handleHoldBill}
              disabled={billItems.length === 0}
              className="px-3 py-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-xl transition-colors disabled:opacity-40"
              title="Hold / Park Current Bill [F5]"
            >
              Hold [F5]
            </button>
            <button
              onClick={handlePrintKOT}
              disabled={billItems.length === 0}
              className="px-3 py-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-950/30 border border-sky-500/30 rounded-xl transition-colors disabled:opacity-40"
              title="Print Kitchen KOT [F9]"
            >
              KOT [F9]
            </button>
          </div>
        </div>

        {/* COLUMN C: FINANCIAL SUMMARY, TENDERED CASH NUMPAD & SETTLEMENT ENGINE */}
        <div className="hidden lg:flex lg:w-3/12 flex-col bg-slate-950 p-4 space-y-4 overflow-y-auto">
          {/* Financial Calculation Panel */}
          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Discount [F4]:</span>
                <button
                  onClick={() => setIsDiscountModalOpen(true)}
                  className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20"
                >
                  Edit
                </button>
              </div>
              <span className="font-mono text-rose-400">
                {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : '₹0.00'}
              </span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>GST Tax ({taxRate}%):</span>
              <span className="font-mono text-white">{formatCurrency(taxAmount)}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-xs font-extrabold text-slate-300">NET TOTAL:</span>
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
            <button
              onClick={() => setPaymentMode('cash')}
              className={`py-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                paymentMode === 'cash'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash</span>
            </button>
            <button
              onClick={() => setPaymentMode('upi')}
              className={`py-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                paymentMode === 'upi'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI QR</span>
            </button>
            <button
              onClick={() => setPaymentMode('card')}
              className={`py-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                paymentMode === 'card'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Card</span>
            </button>
            <button
              onClick={() => setPaymentMode('split')}
              className={`py-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                paymentMode === 'split'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Split className="w-4 h-4" />
              <span>Split</span>
            </button>
          </div>

          {/* If UPI Selected: Live Scan-to-Pay QR Code display */}
          {paymentMode === 'upi' && (
            <div className="p-3 bg-slate-900 rounded-xl border border-sky-500/30 text-center space-y-2">
              <div className="text-[11px] font-bold text-sky-400">
                Customer Scan &amp; Pay via UPI
              </div>
              <div className="bg-white p-3 rounded-lg inline-block shadow-md">
                {/* SVG UPI QR representation */}
                <svg viewBox="0 0 100 100" className="w-24 h-24 text-slate-950" fill="currentColor">
                  <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 0h10v30H40zM50 40h20v10H50zM30 50h10v20H30zM70 50h30v10H70zM50 70h20v20H50zM80 80h10v10H80zM40 80h10v20H40zM0 40h20v10H0z" />
                </svg>
              </div>
              <div className="text-[10px] text-slate-400">
                Amount: <strong className="text-white font-mono">{formatCurrency(grandTotal)}</strong>
              </div>
            </div>
          )}

          {/* High-Speed Cash Tendered & Change Return Pad */}
          {paymentMode === 'cash' && (
            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400">
                  Cash Tendered by Customer (₹)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-lg font-black text-amber-400 font-mono text-right focus:outline-hidden"
                />
              </div>

              {/* Quick Cash Note Buttons */}
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono font-bold">
                <button
                  onClick={handleSetExactCash}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-center"
                >
                  Exact
                </button>
                <button
                  onClick={() => handleAddCashTendered(50)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-center"
                >
                  +₹50
                </button>
                <button
                  onClick={() => handleAddCashTendered(100)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-center"
                >
                  +₹100
                </button>
                <button
                  onClick={() => handleAddCashTendered(200)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-center"
                >
                  +₹200
                </button>
                <button
                  onClick={() => handleAddCashTendered(500)}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-center"
                >
                  +₹500
                </button>
                <button
                  onClick={handleClearCash}
                  className="py-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-800/40 rounded-lg text-center"
                >
                  Clear
                </button>
              </div>

              {/* Dynamic Return Change Banner */}
              <div
                className={`p-3 rounded-xl border transition-all text-xs font-bold flex items-center justify-between ${
                  changeDue > 0
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span>RETURN CHANGE:</span>
                <span className="text-base font-black font-mono">
                  {formatCurrency(changeDue)}
                </span>
              </div>
            </div>
          )}

          {/* Dedicated Split Payment Panel */}
          {paymentMode === 'split' && (
            <div className="space-y-2.5 p-2.5 bg-slate-900/90 rounded-2xl border border-emerald-500/30">
              {/* Presets & Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Split className="w-3.5 h-3.5" />
                  <span>Split Tender</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleSplitPreset('cash_card_half')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700"
                    title="Split equally between Cash & Card"
                  >
                    ½ Cash + ½ Card
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSplitPreset('cash_upi_half')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700"
                    title="Split equally between Cash & UPI"
                  >
                    ½ Cash + ½ UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSplitPreset('clear')}
                    className="px-1.5 py-0.5 rounded bg-rose-950/50 hover:bg-rose-900 text-rose-300 font-semibold border border-rose-800/40"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Method 1: Cash */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-amber-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>1. Cash Amount</span>
                  </div>
                  {splitRemaining > 0 && splitCashNum < grandTotal && (
                    <button
                      type="button"
                      onClick={() => handleSplitFillRemaining('cash')}
                      className="text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50"
                    >
                      + Fill Remainder (₹{splitRemaining})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={splitCash}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSplitCash(val);
                      const num = parseFloat(val) || 0;
                      if (splitCashTenderedNum < num) {
                        setSplitCashTendered(val);
                      }
                    }}
                    className="w-full pl-6 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-black text-amber-300 font-mono focus:outline-hidden focus:border-amber-500 text-right"
                  />
                </div>

                {splitCashNum > 0 && (
                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>Tendered:</span>
                      <input
                        type="number"
                        placeholder={splitCashNum.toString()}
                        value={splitCashTendered}
                        onChange={(e) => setSplitCashTendered(e.target.value)}
                        className="w-20 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-400 font-mono text-xs font-bold focus:outline-hidden text-right"
                      />
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold">
                      <span className="text-slate-400 text-[10px]">Change:</span>
                      <span className={splitChangeDue > 0 ? 'text-emerald-400 font-black' : 'text-slate-500'}>
                        {formatCurrency(splitChangeDue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Method 2: UPI / QR */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-sky-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>2. UPI / QR Amount</span>
                  </div>
                  {splitRemaining > 0 && splitUpiNum < grandTotal && (
                    <button
                      type="button"
                      onClick={() => handleSplitFillRemaining('upi')}
                      className="text-[10px] font-bold text-sky-300 hover:text-sky-200 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-700/50"
                    >
                      + Fill Remainder (₹{splitRemaining})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(e.target.value)}
                    className="w-full pl-6 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-black text-sky-300 font-mono focus:outline-hidden focus:border-sky-500 text-right"
                  />
                </div>

                {splitUpiNum > 0 && (
                  <div className="pt-1 border-t border-slate-800/80 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Optional: UPI Ref / UTR / Auth #"
                      value={splitUpiRef}
                      onChange={(e) => setSplitUpiRef(e.target.value)}
                      className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[10px] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSplitUPIQR(!showSplitUPIQR)}
                      className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>{showSplitUPIQR ? 'Hide UPI QR' : `Show UPI QR for ₹${splitUpiNum}`}</span>
                    </button>
                    {showSplitUPIQR && (
                      <div className="p-2 bg-slate-900 rounded-lg text-center space-y-1 border border-sky-500/20">
                        <div className="bg-white p-2 rounded inline-block shadow-sm">
                          <svg viewBox="0 0 100 100" className="w-16 h-16 text-slate-950" fill="currentColor">
                            <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 0h10v30H40zM50 40h20v10H50zM30 50h10v20H30zM70 50h30v10H70zM50 70h20v20H50zM80 80h10v10H80zM40 80h10v20H40zM0 40h20v10H0z" />
                          </svg>
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Scan to pay portion: <strong className="text-white font-mono">{formatCurrency(splitUpiNum)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Method 3: Card / POS */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-indigo-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>3. Card / POS EDC</span>
                  </div>
                  {splitRemaining > 0 && splitCardNum < grandTotal && (
                    <button
                      type="button"
                      onClick={() => handleSplitFillRemaining('card')}
                      className="text-[10px] font-bold text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-700/50"
                    >
                      + Fill Remainder (₹{splitRemaining})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    className="w-full pl-6 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-black text-indigo-300 font-mono focus:outline-hidden focus:border-indigo-500 text-right"
                  />
                </div>

                {splitCardNum > 0 && (
                  <div className="pt-1 border-t border-slate-800/80">
                    <input
                      type="text"
                      placeholder="Optional: Card Last 4 / Approval Code"
                      value={splitCardRef}
                      onChange={(e) => setSplitCardRef(e.target.value)}
                      className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300 text-[10px] focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Allocation Summary & Balance Verification */}
              <div className="pt-1 space-y-1">
                <div className="flex justify-between text-[11px] font-mono font-bold text-slate-400 px-1">
                  <span>Allocated: {formatCurrency(splitTotalAllocated)}</span>
                  <span>Bill: {formatCurrency(grandTotal)}</span>
                </div>

                {Math.abs(splitRemaining) < 0.01 && grandTotal > 0 ? (
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>✓ Balanced! Total {formatCurrency(grandTotal)} ready</span>
                  </div>
                ) : splitRemaining > 0 ? (
                  <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Remaining:</span>
                    </div>
                    <span className="font-mono font-black">{formatCurrency(splitRemaining)}</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Over-allocated:</span>
                    </div>
                    <span className="font-mono font-black">{formatCurrency(Math.abs(splitRemaining))}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Master Checkout Button [F10] */}
          <div className="pt-2">
            <button
              onClick={handleSettleOrder}
              disabled={
                billItems.length === 0 ||
                (paymentMode === 'split' && (Math.abs(splitRemaining) > 0.01 || grandTotal === 0))
              }
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex flex-col items-center justify-center gap-1 active:scale-98"
            >
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                <span>
                  {paymentMode === 'split'
                    ? Math.abs(splitRemaining) > 0.01
                      ? `ALLOCATE ${splitRemaining > 0 ? `${formatCurrency(splitRemaining)} MORE` : 'EXCESS'} TO SETTLE`
                      : 'SETTLE & PRINT SPLIT BILL [F10]'
                    : 'SETTLE & PRINT BILL [F10]'}
                </span>
              </div>
              <span className="text-[11px] text-amber-100 font-normal">
                {paymentMode === 'split'
                  ? `Splits across ${
                      [splitCashNum > 0 && `Cash (${formatCurrency(splitCashNum)})`, splitUpiNum > 0 && `UPI (${formatCurrency(splitUpiNum)})`, splitCardNum > 0 && `Card (${formatCurrency(splitCardNum)})`]
                        .filter(Boolean)
                        .join(' + ') || 'selected methods'
                    }`
                  : 'Generates 80mm Invoice, Kicks Drawer & Closes Ticket'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <CustomerLookupModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        onSelectCustomer={(cust) => setSelectedCustomer(cust)}
        onRegisterNewCustomer={(name, phone, email) => {
          const newCust = addCustomer({
            name,
            phone,
            email,
            status: 'active',
            tier: 'bronze',
            points: 50,
            loyaltyPoints: 50,
          });
          setSelectedCustomer(newCust);
        }}
      />

      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        subtotal={subtotal}
        currentDiscount={discountAmount}
        onApplyDiscount={(amt, reason) => {
          setDiscountAmount(amt);
          setDiscountReason(reason);
        }}
      />

      <HeldBillsModal
        isOpen={isHeldBillsModalOpen}
        onClose={() => setIsHeldBillsModalOpen(false)}
        heldBills={heldBills}
        onResumeBill={handleResumeBill}
        onDeleteHeldBill={(id) => setHeldBills((prev) => prev.filter((b) => b.id !== id))}
      />

      <OpenItemModal
        isOpen={isOpenItemModalOpen}
        onClose={() => setIsOpenItemModalOpen(false)}
        onAddOpenItem={(custom) => {
          playSound('barcode');
          setBillItems((prev) => [
            ...prev,
            {
              id: `custom-${Date.now()}`,
              menuItemId: `custom-${Date.now()}`,
              name: custom.name,
              price: custom.price,
              quantity: custom.quantity,
              notes: custom.notes,
              itemTotal: custom.price * custom.quantity,
            },
          ]);
        }}
      />

      <CashierReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={lastSettledOrder}
        settings={settings}
        paperWidth={paperWidth}
        cashTendered={lastTenderedNum}
        changeDue={lastChangeDue}
      />

      <WindowsAppSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
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

      {/* Petpooja / RoyalPOS Modals */}
      <ItemCookingNoteModal
        isOpen={isCookingNoteModalOpen}
        onClose={() => {
          setIsCookingNoteModalOpen(false);
          setSelectedItemForNote(null);
        }}
        itemName={selectedItemForNote?.name || 'Selected Dish'}
        currentNotes={selectedItemForNote?.notes || ''}
        onSaveNotes={handleSaveCookingNotes}
      />

      <PettyCashModal
        isOpen={isPettyCashModalOpen}
        onClose={() => setIsPettyCashModalOpen(false)}
      />

      <TableManagementModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onSelectTableForNewBill={handleSelectTableForNewBill}
        onLoadActiveTableOrder={handleLoadActiveTableOrder}
      />

      <AggregatorOrdersModal
        isOpen={isAggregatorModalOpen}
        onClose={() => setIsAggregatorModalOpen(false)}
      />

      <DayEndSummaryModal
        isOpen={isDayEndModalOpen}
        onClose={() => setIsDayEndModalOpen(false)}
      />

      {/* Store Operations & Support Hub Modal */}
      <FranchiseOperationsModal
        isOpen={isOperationsModalOpen}
        onClose={() => setIsOperationsModalOpen(false)}
        onNavigateTab={onNavigateTab}
        onStartNewOrder={() => {
          setIsOperationsModalOpen(false);
          handleNewBill();
        }}
        initialTab={operationsInitialTab}
      />

      {/* Item Customizer Modal (Variants & Add-on Modifiers) */}
      <ModifierSelectorModal
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleAddCustomizedItem}
      />
    </div>
  );
};
