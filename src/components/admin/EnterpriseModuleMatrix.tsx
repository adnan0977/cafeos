import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Barcode,
  BarChart3,
  Bike,
  Boxes,
  Building2,
  Calendar,
  Calculator,
  CheckCircle,
  CheckCircle2,
  ChefHat,
  Clock,
  Cpu,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Flame,
  Globe,
  HardDrive,
  Heart,
  Layers,
  Monitor,
  Package,
  Percent,
  Plus,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  RotateCcw,
  Scale,
  Scan,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, PaymentMethod } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface EnterpriseModuleMatrixProps {
  onNavigatePortal?: (portal: string) => void;
  onOpenWindowsAppModal?: () => void;
}

export const EnterpriseModuleMatrix: React.FC<EnterpriseModuleMatrixProps> = ({
  onNavigatePortal,
  onOpenWindowsAppModal,
}) => {
  const {
    orders,
    menuItems,
    categories,
    ingredients,
    tables,
    customers,
    suppliers,
    purchaseOrders,
    expenses,
    settings,
    updateSettings,
    setReceiptModalOrder,
    outlets,
  } = useRestaurant();
  const { allUsers, currentUser } = useAuth();

  // Active module tab
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'front_office' | 'back_office' | 'industry' | 'integrations'
  >('all');

  // Returns & Refunds Playground State
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<Order | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<{ [itemId: string]: boolean }>({});
  const [returnReason, setReturnReason] = useState('Customer changed mind / wrong order');
  const [refundMethod, setRefundMethod] = useState<'credit_note' | 'original_tender' | 'cash'>('credit_note');
  const [restockToInventory, setRestockToInventory] = useState(true);
  const [creditNoteGenerated, setCreditNoteGenerated] = useState<{
    code: string;
    amount: number;
    customerName: string;
    expiryDate: string;
  } | null>(null);

  // Hardware Peripherals Test Bench State
  const [testScaleWeight, setTestScaleWeight] = useState('0.450');
  const [isScaleConnected, setIsScaleConnected] = useState(true);
  const [cfdMessage, setCfdMessage] = useState('Welcome to ' + settings.name + ' • Table 4 Active');
  const [hardwareLog, setHardwareLog] = useState<string[]>([
    'ESC/POS 80mm Driver initialized on port COM3 (baud 9600)',
    'Cash Drawer RJ11 24V pulse circuit ready',
    'RS-232 Digital Scale HID stream active (0.450 kg)',
    'Dual-Display Customer Facing Display (CFD) synchronized',
  ]);

  // ERP Export State
  const [selectedErpTool, setSelectedErpTool] = useState<'tally' | 'quickbooks' | 'netsuite'>('tally');
  const [erpDateRange, setErpDateRange] = useState<'today' | 'this_week' | 'this_month'>('today');
  const [erpExportSuccess, setErpExportSuccess] = useState(false);

  // Retail Matrix Variant State
  const [retailSizes] = useState(['S', 'M', 'L', 'XL', 'Free Size']);
  const [retailColors] = useState(['Black', 'White', 'Charcoal', 'Navy']);

  // Handle Receipt Search for Return
  const handleSearchReturnOrder = () => {
    if (!returnSearchQuery.trim()) return;
    const cleanQ = returnSearchQuery.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase().includes(cleanQ) ||
        o.id.toLowerCase().includes(cleanQ) ||
        (o.customerPhone && o.customerPhone.includes(cleanQ))
    );
    if (found) {
      setSelectedReturnOrder(found);
      const initialSelection: { [k: string]: boolean } = {};
      found.items.forEach((item) => {
        initialSelection[item.id] = true;
      });
      setReturnItemsState(initialSelection);
      setCreditNoteGenerated(null);
    } else {
      alert(`Receipt not found matching "${returnSearchQuery}". Try an order number like #${orders[0]?.orderNumber || '101'}`);
    }
  };

  // Process Return & Issue Credit Note
  const handleProcessReturn = () => {
    if (!selectedReturnOrder) return;
    const itemsToReturn = selectedReturnOrder.items.filter((item) => returnItemsState[item.id]);
    if (itemsToReturn.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    const calculatedRefundAmount = itemsToReturn.reduce((sum, item) => sum + item.totalAmount, 0);
    const newCreditNoteCode = `CN-${Math.floor(100000 + Math.random() * 900000)}`;

    setCreditNoteGenerated({
      code: newCreditNoteCode,
      amount: calculatedRefundAmount,
      customerName: selectedReturnOrder.customerName || 'Walk-in Guest',
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
    });

    setHardwareLog((prev) => [
      `[RETURN] Receipt #${selectedReturnOrder.orderNumber}: ${itemsToReturn.length} items returned. Refund: ${formatCurrency(calculatedRefundAmount, settings.currencySymbol)}. Restock: ${restockToInventory ? 'YES' : 'NO'}`,
      ...prev,
    ]);
  };

  // Hardware Peripheral Triggers
  const handleTriggerHardwareAction = (action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    let msg = '';
    if (action === 'drawer_kick') {
      msg = `[${timestamp}] RJ11 24V Drawer Solenoid Kick fired (ESC p 0 25 250)`;
    } else if (action === 'printer_cut') {
      msg = `[${timestamp}] 80mm Thermal Auto-Cutter knife triggered (GS V 66 0)`;
    } else if (action === 'scale_zero') {
      setTestScaleWeight('0.000');
      msg = `[${timestamp}] Digital Scale Zero/Tare calibrated to 0.000 kg`;
    } else if (action === 'scale_weigh') {
      const randomW = (Math.random() * 2 + 0.1).toFixed(3);
      setTestScaleWeight(randomW);
      msg = `[${timestamp}] Scale RS232 polled: stable weight ${randomW} kg received`;
    } else if (action === 'cfd_update') {
      msg = `[${timestamp}] CFD Display payload pushed: "${cfdMessage}"`;
    }
    setHardwareLog((prev) => [msg, ...prev.slice(0, 15)]);
  };

  // ERP Data Export simulation
  const handleGenerateErpExport = () => {
    setErpExportSuccess(true);
    setTimeout(() => setErpExportSuccess(false), 4000);

    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
    const totalSales = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalGst = paidOrders.reduce((sum, o) => sum + o.taxAmount, 0);

    let exportContent = '';
    let fileName = '';

    if (selectedErpTool === 'tally') {
      fileName = `Tally_Sales_Journal_${new Date().toISOString().slice(0, 10)}.xml`;
      exportContent = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>${new Date().toISOString().slice(0, 10).replace(/-/g, '')}</DATE>
            <VOUCHERNUMBER>SALES-${Date.now()}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>Cash / POS Customer</PARTYLEDGERNAME>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Restaurant Food Sales</LEDGERNAME>
              <AMOUNT>-${(totalSales - totalGst).toFixed(2)}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Output SGST 2.5%</LEDGERNAME>
              <AMOUNT>-${(totalGst / 2).toFixed(2)}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Output CGST 2.5%</LEDGERNAME>
              <AMOUNT>-${(totalGst / 2).toFixed(2)}</AMOUNT>
            </LEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
    } else {
      fileName = `${selectedErpTool.toUpperCase()}_Journal_${new Date().toISOString().slice(0, 10)}.csv`;
      exportContent = `Date,Account,Debit,Credit,Description,TaxCode
${new Date().toLocaleDateString()},POS Settlement Clearing,${totalSales.toFixed(2)},0.00,Daily POS Register Closing,
${new Date().toLocaleDateString()},Food & Beverage Revenue,0.00,${(totalSales - totalGst).toFixed(2)},Net Sales,GST-5
${new Date().toLocaleDateString()},Output GST Payable,0.00,${totalGst.toFixed(2)},GST 5% Ledger,GST-5`;
    }

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 16 Master Modules Definition
  const enterpriseModules = [
    // PILLAR 1: CORE FRONT-OFFICE
    {
      id: 'billing_checkout',
      category: 'front_office',
      title: 'Billing & Checkout (Register)',
      description: 'Barcode scanning, item lookups, cart adjustments, discounts, tax calculations, and bill splitting.',
      status: 'Live & Operational',
      statusColor: 'bg-emerald-500',
      icon: Receipt,
      accentColor: 'from-blue-600 to-indigo-700',
      stats: `${orders.length} Bills punched • ₹${formatCurrency(orders.reduce((sum, o) => sum + o.grandTotal, 0), '')} total volume`,
      capabilities: [
        'USB/Bluetooth 1D/2D Barcode scanner instant lookup',
        'Custom open-item entry & cooking notes (e.g. less spicy)',
        'Multi-tier tax engine (5%, 12%, 18% CGST + SGST)',
        'Equal & Custom split billing across guests',
        'Percentage & Flat ₹ promotional discounts with supervisor limits',
      ],
      primaryActionLabel: 'Launch Windows POS',
      onAction: () => onNavigatePortal && onNavigatePortal('windows_cashier'),
    },
    {
      id: 'payment_processing',
      category: 'front_office',
      title: 'Payment Processing & Cash Drawer',
      description: 'Integrated gateway handling cash drawers, credit/debit cards, contactless/NFC (Apple Pay, Google Pay), UPI/QR codes, gift cards, and store credits.',
      status: 'Multi-Tender Active',
      statusColor: 'bg-emerald-500',
      icon: CreditCard,
      accentColor: 'from-emerald-600 to-teal-700',
      stats: 'Cash • Credit/Debit • Dynamic UPI QR • Split Tender',
      capabilities: [
        'Dynamic BharatPe/PhonePe/GPay UPI QR with embedded amount',
        'EMV Chip & Pin / Contactless NFC card integration',
        'Gift card & store credit balance redemption',
        'Automatic RJ11 24V cash drawer kick on cash settlement',
        'Split-tender allocations (e.g. ₹500 Cash + ₹750 UPI)',
      ],
      primaryActionLabel: 'Open POS Terminal',
      onAction: () => onNavigatePortal && onNavigatePortal('pos'),
    },
    {
      id: 'returns_refunds',
      category: 'front_office',
      title: 'Returns, Exchanges & Refunds',
      description: 'Validation against original receipts, return policies, credit note generation, and restock tracking.',
      status: 'Policy Active',
      statusColor: 'bg-blue-500',
      icon: RotateCcw,
      accentColor: 'from-amber-600 to-orange-700',
      stats: 'Credit Note Generator • Restock tracking • Receipt lookup',
      capabilities: [
        'Instant receipt lookup by barcode or order number',
        'Line-item return validation against return window',
        'Automated Credit Note / Gift Voucher generation',
        'Option to restock items back into inventory batches',
        'Supervisor authorization log for tender reversals',
      ],
      primaryActionLabel: 'Test Returns Console',
      onAction: () => {
        const el = document.getElementById('returns_console_section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'cash_drawer_shift',
      category: 'front_office',
      title: 'Cash Drawer & Shift Management',
      description: 'Cash drops, float management, cashier till balancing, end-of-day (X/Z-reports), and tender settlements.',
      status: 'Audited',
      statusColor: 'bg-emerald-500',
      icon: Calculator,
      accentColor: 'from-purple-600 to-indigo-700',
      stats: 'Opening Float • Mid-day X-Read • End-of-Day Z-Report',
      capabilities: [
        'Cashier opening float declaration (denomination breakdown)',
        'Mid-shift safe cash drops & petty cash expenses',
        'Mid-day X-Report reading without closing the register',
        'End-of-day Z-Report shift closing with blind till counting',
        'Overage / Shortage discrepancy tracking & audit logs',
      ],
      primaryActionLabel: 'Open Day-End Closing',
      onAction: () => {
        const el = document.getElementById('day_end_section_trigger');
        if (onNavigatePortal) onNavigatePortal('admin');
      },
    },

    // PILLAR 2: BACK-OFFICE & OPERATIONAL MODULES
    {
      id: 'inventory_stock',
      category: 'back_office',
      title: 'Inventory & Stock Management',
      description: 'SKU/variant tracking, real-time stock levels, low-stock threshold alerts, automated purchase orders (PO), and stock transfers between branches/warehouses.',
      status: `${ingredients.length} SKU tracked`,
      statusColor: 'bg-emerald-500',
      icon: Boxes,
      accentColor: 'from-teal-600 to-emerald-700',
      stats: `${ingredients.filter((i) => i.currentStock < (settings.lowStockThreshold || 10)).length} low stock alerts`,
      capabilities: [
        'Recipe-level automatic stock depletion upon billing',
        'Multi-tier units (Purchase: Box/Bag -> Consumption: Kg/Piece)',
        'Real-time threshold warning alerts and reorder levels',
        'Inter-branch warehouse stock transfer memos',
        'Physical stock count audits & variance reconciliation',
      ],
      primaryActionLabel: 'Launch Inventory Portal',
      onAction: () => onNavigatePortal && onNavigatePortal('inventory'),
    },
    {
      id: 'purchasing_vendor',
      category: 'back_office',
      title: 'Purchasing & Vendor Management (GRN)',
      description: 'Supplier directory, purchase orders, goods receipt notes (GRN), and vendor invoice matching.',
      status: `${suppliers.length} Suppliers Active`,
      statusColor: 'bg-emerald-500',
      icon: Truck,
      accentColor: 'from-sky-600 to-cyan-700',
      stats: `${purchaseOrders.length} POs • 3-Way Invoice Matching`,
      capabilities: [
        'Comprehensive supplier master directory with payment terms',
        'Automated Purchase Order (PO) dispatch to vendors',
        'Goods Receipt Notes (GRN) with batch & expiry capture',
        '3-way matching: PO vs. Delivered GRN vs. Vendor Bill',
        'Vendor payable ledger & aging analysis',
      ],
      primaryActionLabel: 'Manage Suppliers',
      onAction: () => onNavigatePortal && onNavigatePortal('inventory'),
    },
    {
      id: 'crm_loyalty',
      category: 'back_office',
      title: 'Customer Relationship (CRM) & Loyalty',
      description: 'Customer profiles, purchase history, loyalty point systems, tiers, gift card accounts, and targeted marketing/SMS integrations.',
      status: `${customers.length} Profiles`,
      statusColor: 'bg-emerald-500',
      icon: Heart,
      accentColor: 'from-rose-600 to-pink-700',
      stats: 'Bronze • Silver • Gold • Platinum VIP Tiers',
      capabilities: [
        'Customer purchase history & lifetime value (LTV)',
        'Automated loyalty points calculation on bill total',
        'Multi-tier reward progression (Bronze to Platinum)',
        'Gift card issuance, activation, and reload accounts',
        'Targeted WhatsApp & SMS re-engagement messaging',
      ],
      primaryActionLabel: 'Open CRM Hub',
      onAction: () => {
        if (onNavigatePortal) onNavigatePortal('admin');
      },
    },
    {
      id: 'employee_security',
      category: 'back_office',
      title: 'Employee Management & Security (RBAC)',
      description: 'Role-based access control (RBAC), cashier permissions, shift scheduling, clock-in/clock-out time cards, and commission tracking.',
      status: `${allUsers.length} Users Enrolled`,
      statusColor: 'bg-emerald-500',
      icon: Users,
      accentColor: 'from-indigo-600 to-violet-700',
      stats: 'Super Admin • Manager • Biller • Cashier • Kitchen',
      capabilities: [
        'Role-Based Access Control (RBAC) with granular security flags',
        'Supervisor password interception on sensitive admin settings',
        'Quick 4-digit PIN access for cashier touchscreens',
        'Staff clock-in/clock-out shift time cards',
        'Cashier billing speed and throughput performance matrix',
      ],
      primaryActionLabel: 'Manage Staff Roles',
      onAction: () => {
        if (onNavigatePortal) onNavigatePortal('admin');
      },
    },
    {
      id: 'reporting_analytics',
      category: 'back_office',
      title: 'Reporting & Business Analytics',
      description: 'Real-time dashboards covering gross margins, best/worst-selling items, peak sales hours, cashier performance, and audit trails.',
      status: 'Live Real-Time',
      statusColor: 'bg-emerald-500',
      icon: BarChart3,
      accentColor: 'from-amber-600 to-yellow-600',
      stats: 'Gross Margins • Hourly Heatmaps • Audit Trail',
      capabilities: [
        'Comprehensive P&L and gross profit margin analytics',
        'Hourly sales breakdown to identify peak rush windows',
        'Top-selling revenue drivers vs. slow-moving menu deadstock',
        'Cashier settlement breakdown (Cash vs. UPI vs. Cards)',
        'Complete chronological security audit log of all system actions',
      ],
      primaryActionLabel: 'View Detailed Reports',
      onAction: () => onNavigatePortal && onNavigatePortal('reports'),
    },

    // PILLAR 3: INDUSTRY-SPECIFIC MODULES
    {
      id: 'restaurant_fb',
      category: 'industry',
      title: 'Restaurant & F&B Management',
      description: 'Table layout/floor management, Kitchen Display System (KDS) / Kitchen Order Ticket (KOT) routing, menu modifiers, course firing, and online delivery integrations (e.g., UberEats, DoorDash, Zomato).',
      status: `${tables.length} Tables • KDS Live`,
      statusColor: 'bg-emerald-500',
      icon: UtensilsCrossed,
      accentColor: 'from-orange-600 to-red-700',
      stats: 'Floor Map • KOT Routing • Modifiers • Swiggy/Zomato',
      capabilities: [
        'Interactive graphical floor plan & table occupancy tracker',
        'Kitchen Display System (KDS) with color-coded preparation timers',
        'Multi-station KOT routing (Kitchen vs. Bar vs. Bakery)',
        'Menu modifiers (extra cheese, sugar level, crust selection)',
        'Live online delivery channel sync for Swiggy, Zomato, UberEats',
      ],
      primaryActionLabel: 'Launch Kitchen KDS',
      onAction: () => onNavigatePortal && onNavigatePortal('kds'),
    },
    {
      id: 'retail_apparel',
      category: 'industry',
      title: 'Retail & Apparel Matrix Extensions',
      description: 'Matrix inventory (size, color, style variants), label/barcode generation, and alteration/tailoring tracking.',
      status: 'Matrix Engine Ready',
      statusColor: 'bg-blue-500',
      icon: Tag,
      accentColor: 'from-fuchsia-600 to-purple-700',
      stats: 'Multi-variant Matrix • Barcode Label Printer',
      capabilities: [
        '2D Product Matrix: Parent SKU with Size x Color variants',
        'EAN-13 / Code-128 barcode sticker generator for thermal label rolls',
        'Garment alteration & tailoring pickup tracking workflow',
        'Style/Season tag categorization (Summer/Winter collections)',
        'Exchange window policy enforcement & price difference handling',
      ],
      primaryActionLabel: 'Test Retail Matrix',
      onAction: () => {
        const el = document.getElementById('retail_matrix_section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'service_appointments',
      category: 'industry',
      title: 'Service & Appointment Booking',
      description: 'Appointment booking, staff service allocation, calendar sync, and resource management.',
      status: 'Scheduler Enabled',
      statusColor: 'bg-teal-500',
      icon: Calendar,
      accentColor: 'from-cyan-600 to-blue-700',
      stats: 'Stylist/Staff Allocation • Time Slot Booking',
      capabilities: [
        'Time slot reservation for dine-in banquet or salon/wellness chairs',
        'Staff specialist assignment per customer booking',
        'Automated SMS appointment confirmation and reminder',
        'Combined service + retail billing checkout on same ticket',
        'Resource utilization calendar (VIP rooms, party halls)',
      ],
      primaryActionLabel: 'Floor & Reservations',
      onAction: () => {
        if (onNavigatePortal) onNavigatePortal('admin');
      },
    },

    // PILLAR 4: INTEGRATION & SYSTEM MODULES
    {
      id: 'omnichannel_sync',
      category: 'integrations',
      title: 'Omnichannel / E-Commerce Sync',
      description: 'Unifying catalog, orders, and stock levels across online storefronts and physical registers.',
      status: 'Sync Engine Active',
      statusColor: 'bg-emerald-500',
      icon: Globe,
      accentColor: 'from-sky-600 to-indigo-700',
      stats: 'Catalog Manifest • Real-Time Stock Reconciliation',
      capabilities: [
        'Centralized menu/catalog distribution across web, mobile & terminals',
        'Unified customer order stream from QR menu, website, and counter',
        'Real-time inventory deduction preventing online overselling',
        'Omnichannel order status notifications via WhatsApp/SMS',
        'Single master pricing sheet with channel-specific markups',
      ],
      primaryActionLabel: 'Open Digital QR Menu',
      onAction: () => onNavigatePortal && onNavigatePortal('customer_menu'),
    },
    {
      id: 'accounting_erp',
      category: 'integrations',
      title: 'Accounting & ERP Integration',
      description: 'Automatic posting of daily journals, tax ledgers, and accounts receivable/payable to tools like QuickBooks, Tally, or NetSuite.',
      status: 'Tally / QB / NetSuite',
      statusColor: 'bg-emerald-500',
      icon: FileSpreadsheet,
      accentColor: 'from-emerald-600 to-green-700',
      stats: '1-Click XML/CSV Daily Sales & Tax Journal Export',
      capabilities: [
        'Tally XML Sales & Tax Voucher automated generation',
        'QuickBooks Online (QBO) IIF/CSV journal import format',
        'Oracle NetSuite General Ledger (GL) standard schema output',
        'Automated split of CGST, SGST, IGST into distinct accounting ledgers',
        'Accounts Payable (AP) export from vendor GRN invoices',
      ],
      primaryActionLabel: 'Generate ERP Journal',
      onAction: () => {
        const el = document.getElementById('erp_integration_section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'hardware_drivers',
      category: 'integrations',
      title: 'Hardware Drivers & POS Peripherals',
      description: 'Abstracted interfaces for receipt printers, digital scales, customer-facing displays (CFD), and hand scanners.',
      status: 'Hardware Bus Ready',
      statusColor: 'bg-emerald-500',
      icon: Printer,
      accentColor: 'from-slate-700 to-slate-900',
      stats: '80mm/58mm ESC/POS • Scale RS232 • CFD • Scanner',
      capabilities: [
        'ESC/POS Thermal Printer direct browser driver (80mm / 58mm)',
        'RJ-11 Cash Drawer 24V solenoid automated pulse',
        'RS-232 / USB HID Digital Weighing Scale live polling',
        'Customer Facing Display (CFD) dual-screen live order mirror',
        'USB Keyboard-Wedge 1D/2D Barcode scanner event listener',
      ],
      primaryActionLabel: 'Test Hardware Bus',
      onAction: () => {
        const el = document.getElementById('hardware_peripherals_section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'multistore_franchise',
      category: 'integrations',
      title: 'Multi-Branch & Franchise Master',
      description: 'Centralized menu pushing, multi-city tax compliance, store licensing, and inter-store performance consolidation.',
      status: `${outlets.length} Outlets Linked`,
      statusColor: 'bg-emerald-500',
      icon: Building2,
      accentColor: 'from-blue-700 to-slate-900',
      stats: 'Brand HQ • Franchise Portals • Centralized Menu',
      capabilities: [
        'Enterprise multi-branch outlet provisioning across cities',
        'Centrally curated menu templates pushed to franchise stores',
        'Consolidated owner executive dashboard across all locations',
        'Branch-specific price overrides and local tax registrations',
        'Franchise royalty fee tracking and performance metrics',
      ],
      primaryActionLabel: 'Manage Outlets',
      onAction: () => {
        if (onNavigatePortal) onNavigatePortal('admin');
      },
    },
  ];

  // Filter modules
  const filteredModules =
    activeCategory === 'all'
      ? enterpriseModules
      : enterpriseModules.filter((m) => m.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Enterprise Executive Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-amber-500/10 via-sky-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                ENTERPRISE SYSTEM ARCHITECTURE
              </span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                16 / 16 MODULES DEPLOYED
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[11px] font-bold">
                v3.2.0-LTS
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              CaféOS Enterprise POS Master Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Complete, production-grade operational stack covering front-office high-speed checkout, payment gateways, returns & credit notes, back-office inventory and GRN purchasing, restaurant F&B floor controls, apparel matrix inventory, accounting journal exports, and abstracted hardware peripheral drivers.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigatePortal && onNavigatePortal('windows_cashier')}
              className="px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              <span>Launch Windows Cashier</span>
            </button>

            <button
              onClick={() => onNavigatePortal && onNavigatePortal('pos')}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Open POS Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {[
          { id: 'all', label: 'All 16 Master Modules', icon: Layers, count: 16 },
          { id: 'front_office', label: '1. Front-Office (Checkout & Tenders)', icon: ShoppingBag, count: 4 },
          { id: 'back_office', label: '2. Back-Office (Stock, GRN & CRM)', icon: Boxes, count: 5 },
          { id: 'industry', label: '3. Industry-Specific (F&B & Retail)', icon: Store, count: 3 },
          { id: 'integrations', label: '4. System & Hardware Drivers', icon: Cpu, count: 4 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive
                    ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive 16-Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {filteredModules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-amber-400 dark:hover:border-amber-500/50"
            >
              {/* Card Header with Category & Status */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${module.statusColor} animate-pulse`} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      {module.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {module.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {module.description}
                </p>
              </div>

              {/* Capabilities Checklist */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 flex-1 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Key Capabilities:
                </span>
                {module.capabilities.slice(0, 3).map((cap, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{cap}</span>
                  </div>
                ))}
              </div>

              {/* Footer with Stats & Direct Trigger */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900">
                <span className="text-[11px] font-bold text-slate-500 truncate max-w-[150px]">
                  {module.stats}
                </span>

                <button
                  type="button"
                  onClick={module.onAction}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-amber-600 dark:bg-slate-800 dark:hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                >
                  <span>{module.primaryActionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED INTERACTIVE BENCH 1: RETURNS, EXCHANGES & CREDIT NOTES */}
      <div
        id="returns_console_section"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Returns, Exchanges &amp; Credit Note Generator
                </h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold rounded-full">
                  Policy Validation Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Lookup historical receipts, validate return eligibility, calculate refund amounts, restock inventory, and generate tamper-proof Credit Notes.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={returnSearchQuery}
                onChange={(e) => setReturnSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchReturnOrder()}
                placeholder="Enter Bill # (e.g. 101 or 102)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              />
            </div>
            <button
              onClick={handleSearchReturnOrder}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Lookup Bill
            </button>
          </div>
        </div>

        {/* Return Order Details & Restock Options */}
        {selectedReturnOrder ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Item selection list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Receipt #{selectedReturnOrder.orderNumber} • {formatDateTime(selectedReturnOrder.createdAt)}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Guest: {selectedReturnOrder.customerName || 'Direct Billing'} ({selectedReturnOrder.customerPhone || 'No Phone'}) • Biller: {selectedReturnOrder.billerName || 'Cashier'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs rounded-full">
                  Original Tender: {selectedReturnOrder.paymentMethod?.toUpperCase()}
                </span>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 font-extrabold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Return?</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Refund Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedReturnOrder.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={!!returnItemsState[item.id]}
                            onChange={(e) =>
                              setReturnItemsState((prev) => ({
                                ...prev,
                                [item.id]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-amber-600 rounded border-slate-300"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.name}
                          </span>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <span className="text-[10px] text-slate-400">
                              + {item.modifiers.map((m) => m.name).join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatCurrency(item.unitPrice, settings.currencySymbol)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-amber-600 font-mono">
                          {formatCurrency(item.totalAmount, settings.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Col: Restock, Refund Type & Issue */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Refund &amp; Restock Policy</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Return Reason
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  >
                    <option value="Customer changed mind / wrong order">Customer changed mind / wrong order</option>
                    <option value="Quality defect / cold food">Quality defect / cold food</option>
                    <option value="Billing clerical error">Billing clerical error</option>
                    <option value="Apparel size/color exchange">Apparel size/color exchange</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Settlement Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'credit_note', label: 'Credit Note' },
                      { id: 'cash', label: 'Cash Out' },
                      { id: 'original_tender', label: 'Original' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setRefundMethod(m.id as any)}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition-colors ${
                          refundMethod === m.id
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Restock Items to Inventory
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={restockToInventory}
                    onChange={(e) => setRestockToInventory(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </div>
              </div>

              {/* Total Refund & Issue Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">Eligible Refund:</span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {formatCurrency(
                      selectedReturnOrder.items
                        .filter((i) => returnItemsState[i.id])
                        .reduce((sum, i) => sum + i.totalAmount, 0),
                      settings.currencySymbol
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleProcessReturn}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Authorize Refund &amp; Issue Credit Note</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <RotateCcw className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              No receipt loaded. Enter any historical bill number (e.g. #{orders[0]?.orderNumber || '101'}) above to test line-item return validation.
            </p>
          </div>
        )}

        {/* Issued Credit Note Card */}
        {creditNoteGenerated && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                CREDIT NOTE ISSUED &amp; ACTIVE
              </span>
              <h4 className="text-xl font-black text-white font-mono flex items-center gap-2">
                <span>{creditNoteGenerated.code}</span>
                <span className="text-emerald-400">
                  ({formatCurrency(creditNoteGenerated.amount, settings.currencySymbol)})
                </span>
              </h4>
              <p className="text-xs text-slate-300">
                Valid for guest: <b>{creditNoteGenerated.customerName}</b> • Expires: {creditNoteGenerated.expiryDate} • Can be redeemed at any cashier register.
              </p>
            </div>

            <button
              onClick={() => alert(`Credit Note #${creditNoteGenerated.code} printed to 80mm thermal roll!`)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Credit Voucher</span>
            </button>
          </div>
        )}
      </div>

      {/* DETAILED INTERACTIVE BENCH 2: HARDWARE DRIVERS & POS PERIPHERALS */}
      <div
        id="hardware_peripherals_section"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Hardware Drivers &amp; Peripherals Diagnostic Bench
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                  Abstracted Device Bus Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct hardware signals for ESC/POS 80mm thermal cutters, RJ-11 24V drawer solenoids, RS-232 digital scales, and secondary Customer Facing Displays (CFD).
              </p>
            </div>
          </div>
        </div>

        {/* Peripheral Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 80mm Thermal Printer */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Printer className="w-5 h-5 text-sky-500" />
                <span className="text-[10px] font-mono text-emerald-600 font-bold">ONLINE</span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                ESC/POS Thermal Printer
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                80mm / 58mm roll with hardware paper auto-cutter.
              </p>
            </div>

            <button
              onClick={() => handleTriggerHardwareAction('printer_cut')}
              className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-sky-600 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Test Auto-Cutter (GS V 66 0)
            </button>
          </div>

          {/* Card 2: RJ11 Cash Drawer */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-mono text-emerald-600 font-bold">ARMED</span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Cash Drawer Solenoid
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                24V RJ-11 kick pulse pin 2 &amp; pin 5.
              </p>
            </div>

            <button
              onClick={() => handleTriggerHardwareAction('drawer_kick')}
              className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Kick Drawer (ESC p 0 25 250)
            </button>
          </div>

          {/* Card 3: Digital Weighing Scale */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Scale className="w-5 h-5 text-teal-500" />
                <span className="text-xs font-mono font-black text-teal-600">
                  {testScaleWeight} kg
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                RS-232 Digital Scale
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Continuous weight stream for deli &amp; bakery.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTriggerHardwareAction('scale_weigh')}
                className="py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-teal-600 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-[11px] rounded-xl transition-colors cursor-pointer"
              >
                Simulate Load
              </button>
              <button
                onClick={() => handleTriggerHardwareAction('scale_zero')}
                className="py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-[11px] rounded-xl transition-colors cursor-pointer"
              >
                Tare / Zero
              </button>
            </div>
          </div>

          {/* Card 4: Customer Facing Display (CFD) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Monitor className="w-5 h-5 text-purple-500" />
                <span className="text-[10px] font-mono text-purple-600 font-bold">MIRRORED</span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Customer Facing Display
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {cfdMessage}
              </p>
            </div>

            <button
              onClick={() => handleTriggerHardwareAction('cfd_update')}
              className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-purple-600 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Push Update to CFD
            </button>
          </div>
        </div>

        {/* Live Hardware Signal Log Console */}
        <div className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800 space-y-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-slate-400 font-bold">Hardware Signal Bus Log:</span>
            <span className="text-[10px] text-emerald-400 font-bold">● Streaming Active</span>
          </div>
          {hardwareLog.slice(0, 5).map((log, idx) => (
            <div key={idx} className="text-slate-300 truncate">
              &gt; {log}
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED INTERACTIVE BENCH 3: ACCOUNTING & ERP JOURNAL EXPORT */}
      <div
        id="erp_integration_section"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Accounting &amp; ERP Integration Ledger
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                  Tally XML &amp; QuickBooks Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                1-click automated generation of sales vouchers, CGST/SGST tax split entries, and accounts payable to eliminate manual bookkeeping.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Journal Preview */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Daily Sales Voucher &amp; Tax Split Preview</span>
              </h4>
              <span className="font-mono text-xs font-bold text-slate-500">
                Posting Date: {new Date().toLocaleDateString('en-GB')}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-200/70 dark:bg-slate-700/70 font-bold text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">General Ledger Account</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold">POS Cash &amp; Bank Clearing</td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans">Asset</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                      ₹{orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.grandTotal, 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold">Food &amp; Beverage Revenue</td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans">Revenue</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">0.00</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      ₹{orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.subtotal, 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold">Output CGST (Central Tax 2.5%)</td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans">Liability</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">0.00</td>
                    <td className="py-2.5 px-3 text-right font-bold text-teal-600">
                      ₹{(orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.taxAmount, 0) / 2).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold">Output SGST (State Tax 2.5%)</td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans">Liability</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">0.00</td>
                    <td className="py-2.5 px-3 text-right font-bold text-teal-600">
                      ₹{(orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.taxAmount, 0) / 2).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Col: Export Trigger */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Target Accounting Software
              </h4>

              <div className="space-y-2">
                {[
                  { id: 'tally', name: 'Tally Prime / ERP 9 (XML Voucher)', desc: 'Standard XML format for direct Tally Import' },
                  { id: 'quickbooks', name: 'QuickBooks Online (IIF / CSV)', desc: 'Standard General Ledger CSV format' },
                  { id: 'netsuite', name: 'Oracle NetSuite (JSON Schema)', desc: 'Enterprise ERP journal payload' },
                ].map((tool) => (
                  <label
                    key={tool.id}
                    onClick={() => setSelectedErpTool(tool.id as any)}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                      selectedErpTool === tool.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="erp_tool"
                      checked={selectedErpTool === tool.id}
                      onChange={() => setSelectedErpTool(tool.id as any)}
                      className="mt-1 text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {tool.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{tool.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleGenerateErpExport}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export {selectedErpTool.toUpperCase()} Journal File</span>
              </button>

              {erpExportSuccess && (
                <p className="text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  ✓ Journal file generated and downloaded successfully!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
