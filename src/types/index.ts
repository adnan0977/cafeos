export type UserRole = 
  | 'super_admin'       // CaféOS SaaS Platform Owner
  | 'platform_employee' // CaféOS Portal Staff (Support, Operations, Tenant Billing)
  | 'brand_admin'       // Corporate Brand HQ (e.g. Burger King, Zorko, Mac D)
  | 'franchise_owner'   // Franchise Owner managing multiple stores across cities
  | 'admin'             // Store / Branch Manager
  | 'cashier'
  | 'biller'
  | 'kitchen_staff'
  | 'delivery_rider'
  | 'inventory_staff'
  | 'employee';

export type Permission =
  | 'view_dashboard'
  | 'manage_menu'
  | 'manage_categories'
  | 'manage_prices'
  | 'manage_orders'
  | 'create_order'
  | 'cancel_order'
  | 'manage_kitchen'
  | 'manage_tables'
  | 'manage_customers'
  | 'manage_inventory'
  | 'manage_purchases'
  | 'manage_suppliers'
  | 'manage_expenses'
  | 'manage_delivery'
  | 'manage_riders'
  | 'manage_sop'
  | 'complete_sop'
  | 'approve_sop'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_permissions'
  | 'view_reports'
  | 'export_reports'
  | 'process_payment'
  | 'process_refund'
  | 'apply_discount'
  | 'modify_price'
  | 'stock_adjustment'
  | 'approve_stock_variance'
  | 'manage_settings'
  | 'view_audit_logs'
  | 'manage_organizations'
  | 'manage_franchises'
  | 'inter_store_transfer';

export type FoodType = 'veg' | 'non_veg' | 'egg' | 'vegan' | 'other';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'online';

export type OrderStatus = 
  | 'new'
  | 'confirmed'
  | 'kot_generated'
  | 'kitchen_accepted'
  | 'in_prep'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'bill_generated'
  | 'payment_pending'
  | 'paid'
  | 'completed'
  | 'cancelled';

export type DeliveryStatus =
  | 'pending_assignment'
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export type PaymentMethod = 
  | 'cash'
  | 'upi'
  | 'debit_card'
  | 'credit_card'
  | 'bank_transfer'
  | 'online'
  | 'split';

export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'refunded' | 'failed';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'payment_pending' | 'ready' | 'in_prep';

export type StockStatus = 'ok' | 'low_stock' | 'out_of_stock';

export type StockUnitType =
  | 'Kg'
  | 'Gram'
  | 'Litre'
  | 'ml'
  | 'Piece'
  | 'kg'
  | 'g'
  | 'l'
  | 'ltr'
  | 'pcs'
  | 'portion'
  | string;

export type PurchaseUnitType =
  | 'Kg'
  | 'Gram'
  | 'Litre'
  | 'ml'
  | 'Packet'
  | 'Box'
  | 'Bag'
  | 'Bottle'
  | 'Tray'
  | 'Piece'
  | 'Dozen'
  | 'Pouch'
  | 'Can'
  | 'Jar'
  | 'kg'
  | 'g'
  | 'l'
  | 'ltr'
  | 'pcs'
  | 'pack'
  | 'portion'
  | string;

export type UnitType = StockUnitType | PurchaseUnitType;
export type UnitOfMeasure = UnitType;

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: UnitType;
  cost: number;
}

export type WastageReason = 
  | 'spoilage'
  | 'expired'
  | 'damaged'
  | 'prep_waste'
  | 'overproduction'
  | 'other';

export type SOPFrequency = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'per_shift'
  | 'as_required';

export type SOPStatus = 'draft' | 'under_review' | 'approved' | 'active' | 'archived';

export type TaskResultStatus = 'pending' | 'pass' | 'fail' | 'na';

export type EquipmentStatus = 'operational' | 'maintenance_due' | 'under_maintenance' | 'broken' | 'retired';

export type AppLogonType = 'android_app' | 'ios_app' | 'windows_app';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  pin?: string;
  department?: string;
  branchId: string;
  assignedStoreIds?: string[]; // IDs of stores/outlets this user can manage or access across cities
  isFranchiseOwner?: boolean;  // True if user is a franchise owner managing multiple stores
  franchiseName?: string;     // Name of the franchise (e.g. "Sharma Hospitality Group")
  franchiseGroupId?: string;  // Unique Franchise Group reference
  organizationId?: string;    // Corporate organisation identifier (e.g. "org-bk" for Burger King)
  organizationName?: string;  // Corporate organisation name (e.g. "Burger King India")
  isPlatformStaff?: boolean;  // True if employee of CaféOS platform managing the portal
  platformStaffRole?: 'operations' | 'support' | 'billing' | 'supervision';
  isActive: boolean;
  avatar?: string;
  maxDiscountPercent: number;
  customPermissions?: Permission[];
  allowedPortals?: string[];
  allowedAppLogons?: AppLogonType[]; // Permitted client logons: Android, iOS, or Windows App
  appLoginCode?: string;             // Quick Logon Code for Android / iOS mobile apps (e.g. AND-9402)
  windowsStationId?: string;         // Dedicated Windows Cashier Terminal Station ID (e.g. WIN-POS-01)
  devicePairingToken?: string;       // QR scan token for instant mobile camera pairing
  devicePin?: string;                // 4 to 6 digit quick PIN for POS / counter device login
  employeeCategory?: 'biller' | 'cashier' | 'delivery_boy' | 'kitchen_staff' | 'store_manager' | 'inventory_staff' | 'waiter';
  deviceStationId?: string;          // Assigned counter / station identifier (e.g. POS-TERM-01, RIDER-APP-02)
  deviceStationName?: string;        // Friendly name (e.g. "Main Billing Counter #1")
  credentialsDispatched?: {          // Corporate email dispatch record for franchise admin & corporate users
    sentAt: string;
    sentToEmail: string;
    defaultPassword?: string;
    brandSenderName?: string;
    brandSenderEmail?: string;
    status: 'dispatched' | 'pending';
    dispatchSubject?: string;
    assignedStoreNames?: string[];
  };
  createdByType?: 'super_admin' | 'brand_admin' | 'franchise_owner';
  createdByUserName?: string;
  createdAt?: string;
  lastLoginAt?: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuVariant {
  id: string;
  name: string; // e.g. "Regular", "Large", "Double Shot"
  price: number;
  costPrice: number;
  taxPercent: number;
  sku: string;
  isAvailable: boolean;
}

export interface MenuModifier {
  id: string;
  name: string;
  price: number;
  taxPercent: number;
  isAvailable: boolean;
  category?: string; // e.g., "Dairy", "Extra Toppings", "Spiciness"
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number; // in ingredient's base unit
  unit: UnitType;
  prepLossPercent?: number; // e.g. 5% trimming loss
}

export interface Recipe {
  id: string;
  menuItemId: string;
  variantId?: string;
  yieldQuantity: number;
  prepTimeMinutes: number;
  items: RecipeItem[];
  instructions?: string[];
  notes?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  image: string;
  foodType: FoodType;
  basePrice: number;
  costPrice: number;
  taxPercent: number; // e.g. 5% GST
  finalPrice: number;
  price?: number; // legacy alias for finalPrice
  profitMarginPercent: number;
  prepTimeMinutes: number;
  sku: string;
  barcode?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  sortOrder: number;
  variants: MenuVariant[];
  modifierIds: string[];
  recipeId?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: UnitType; // Stock / Consumption Unit (e.g. Piece, Kg, Gram, Litre, ml)
  purchaseUnit: UnitType; // Purchase Unit (e.g. Tray, Packet, Bag, Box, etc.)
  conversionFactor: number; // 1 purchaseUnit = conversionFactor stock units (e.g. 1 Tray = 30 Pieces, 1 Bag = 25 Kg)
  supplierId: string;
  supplierName?: string;
  costPerUnit: number; // Cost per Stock Unit
  purchaseCost?: number; // Cost per Purchase Unit
  openingStock: number; // Opening stock in Stock Units
  currentStock: number; // Current stock in Stock Units
  minStock: number; // Minimum / Alert threshold stock in Stock Units
  reorderLevel: number;
  maxStock: number;
  targetStock?: number; // Target stock in Stock Units
  idealStock?: number;
  storageLocation: string; // Store / Location (e.g. Main Store, Kitchen Pantry, Chiller)
  hasExpiry: boolean;
  isActive: boolean;
  sku?: string;
  branchId?: string;
}

export interface InventoryBatch {
  id: string;
  ingredientId: string;
  batchNumber: string;
  purchaseDate: string;
  expiryDate?: string;
  supplierId: string;
  initialQuantity: number;
  remainingQuantity: number;
  unitCost: number;
}

export interface InventoryTransaction {
  id: string;
  date: string;
  ingredientId: string;
  type: 
    | 'opening_stock'
    | 'purchase'
    | 'consumption'
    | 'waste'
    | 'damage'
    | 'adjustment_add'
    | 'adjustment_remove'
    | 'return_supplier';
  quantity: number; // positive or negative based on context
  unit: UnitType;
  unitCost: number;
  totalCost: number;
  referenceId?: string; // orderId, purchaseId, wasteId, stockCountId
  notes?: string;
  userId: string;
  userName: string;
}

export interface Supplier {
  id: string; // SUP-0001
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  suppliedIngredients: string[];
  paymentTerms: string; // e.g., "Net 15", "Net 30", "Immediate"
  isActive: boolean;
  notes?: string;
}

export interface PurchaseItem {
  ingredientId: string;
  ingredientName?: string;
  quantity?: number;
  orderedQuantity?: number;
  unit: UnitType;
  unitCost?: number;
  unitPrice?: number;
  totalCost?: number;
  totalAmount?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export type PurchaseOrderItem = PurchaseItem;

export interface PurchaseOrder {
  id: string; // PO-2026-0001
  supplierId: string;
  supplierName: string;
  invoiceNumber?: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  status: 'draft' | 'received' | 'partially_received' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  receivedDate?: string;
  receivedBy?: string;
  notes?: string;
}

export interface WastageRecord {
  id: string;
  date: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: UnitType;
  unitCost: number;
  totalCost: number;
  reason: WastageReason;
  userId: string;
  userName: string;
  notes?: string;
}

export interface StockCountItem {
  ingredientId: string;
  ingredientName: string;
  systemQuantity: number;
  physicalQuantity: number;
  varianceQuantity: number;
  variancePercent: number;
  unit: UnitType;
  unitCost: number;
  varianceCost: number;
  reason?: string;
  requiresManagerApproval: boolean;
}

export interface StockCount {
  id: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly' | 'random' | 'full' | 'category';
  categoryFilter?: string;
  userId: string;
  userName: string;
  items: StockCountItem[];
  status: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'completed';
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

export interface RestaurantTable {
  id: string;
  number: string;
  name: string;
  section: string; // "Ground Floor", "First Floor", "Outdoor Patio", "Mezzanine"
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
}

export interface OrderItemModifier {
  modifierId: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  foodType: FoodType;
  variantId?: string;
  variantName?: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  modifiers: OrderItemModifier[];
  notes?: string;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  kitchenStatus?: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  prepStartedAt?: string;
  readyAt?: string;
  servedAt?: string;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyTransaction {
  id: string;
  date: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'adjustment';
  points: number; // positive for earned/bonus, negative for redeemed
  orderId?: string;
  orderNumber?: number;
  description: string;
  balanceAfter: number;
}

export interface LoyaltyRewardOption {
  id: string;
  pointsCost: number;
  discountAmount: number;
  discountPercent?: number;
  couponCode: string;
  title: string;
  description: string;
  minSpend?: number;
  tierRequired?: LoyaltyTier;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  landmark?: string;
  deliveryNotes?: string;
  totalOrders: number;
  ordersCount?: number;
  totalSpend: number;
  totalSpent?: number;
  lastOrderDate?: string;
  loyaltyPoints: number;
  tier?: LoyaltyTier;
  loyaltyHistory?: LoyaltyTransaction[];
  earnedCouponCodes?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface PaymentAllocation {
  method: PaymentMethod;
  amount: number;
  transactionRef?: string;
}

export interface Order {
  id: string; // ORD-2026-0001
  orderNumber: number;
  kotNumber: number;
  orderType: OrderType;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  
  // Dine-in specifics
  tableId?: string;
  tableName?: string;
  tableNumber?: string;
  terminalId?: string;
  guestCount?: number;
  waiterId?: string;
  waiterName?: string;
  
  // Customer & Delivery specifics
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryLandmark?: string;
  deliveryInstructions?: string;
  deliveryCharge: number;
  deliveryZoneId?: string;
  deliveryStatus?: DeliveryStatus;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  
  // Loyalty Specifics
  pointsEarned?: number;
  pointsRedeemed?: number;
  loyaltyRewardId?: string;
  loyaltyDiscountAmount?: number;
  
  // Items & Financials
  items: OrderItem[];
  estimatedPrepTimeMinutes?: number;
  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  discountPercent?: number;
  couponId?: string;
  couponCode?: string;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  
  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  payments: PaymentAllocation[];
  
  // Metadata
  cashierId: string;
  cashierName: string;
  billerId?: string;
  billerName?: string;
  billerUsername?: string;
  billedBy?: string;
  supervisorAdminId?: string;
  supervisorAdminName?: string;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  isKOTPrinted?: boolean;
  kitchenStartedAt?: string;
  kitchenReadyAt?: string;
  kitchenServedAt?: string;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  orderNumber: number;
  amount: number;
  reason: string;
  paymentMethod: PaymentMethod;
  processedBy: string;
  approvedBy: string;
  timestamp: string;
  notes?: string;
}

export interface CashierShift {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  expectedCash?: number;
  actualCash?: number;
  variance?: number; // actual - expected
  cashSales: number;
  cashRefunds: number;
  totalTransactions: number;
  status: 'open' | 'closed';
  closingNotes?: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  totalSales: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  onlineSales: number;
  totalOrders: number;
  totalDiscounts: number;
  totalTaxes: number;
  totalExpenses: number;
  totalRefunds: number;
  netRevenue: number;
  expectedCash: number;
  actualCash: number;
  cashVariance: number;
  closedBy: string;
  closedAt: string;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 
    | 'rent'
    | 'electricity'
    | 'gas'
    | 'salaries'
    | 'maintenance'
    | 'packaging'
    | 'transport'
    | 'marketing'
    | 'miscellaneous';
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  receiptNumber?: string;
  enteredBy: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  pinCodes: string[];
  deliveryCharge: number;
  minOrderAmount: number;
  estimatedTimeMins: number;
  isActive: boolean;
}

export interface Rider {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  currentStatus: 'available' | 'on_delivery' | 'offline';
  activeDeliveriesCount: number;
  completedToday: number;
}

export interface SOPStep {
  id: string;
  stepNumber: number;
  instruction: string;
  isRequired: boolean;
  evidenceType: 'checkbox' | 'temperature' | 'photo' | 'number' | 'text';
  expectedMin?: number; // e.g. 2°C
  expectedMax?: number; // e.g. 5°C
  unit?: string;
  expectedValue?: string; // Standard or guideline value
}

export interface SOPMaster {
  id: string;
  title: string;
  category: 
    | 'opening'
    | 'closing'
    | 'food_prep'
    | 'beverage_prep'
    | 'food_safety'
    | 'hygiene'
    | 'cleaning'
    | 'inventory'
    | 'cash_pos'
    | 'equipment'
    | 'maintenance';
  department: string;
  description: string;
  purpose: string;
  responsibleRole: UserRole;
  frequency: SOPFrequency;
  estimatedMinutes: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  version: number;
  steps: SOPStep[];
  status: SOPStatus;
  linkedMenuItemId?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  outletId?: string;
  outletName?: string;
  isAiGenerated?: boolean;
  branchContextSummary?: string;
}

export interface SOPTaskStepResult {
  stepId: string;
  instruction?: string;
  evidenceType?: 'checkbox' | 'temperature' | 'photo' | 'number' | 'text';
  status?: TaskResultStatus;
  enteredValue?: string | number;
  value?: string | number;
  comment?: string;
  notes?: string;
  isCompleted?: boolean;
  isOutOfRange?: boolean;
  timestamp?: string;
}

export interface SOPTask {
  id: string;
  sopId: string;
  sopTitle: string;
  category: string;
  assignedRole: UserRole;
  assignedUserId?: string;
  assignedUserName?: string;
  shift: 'morning' | 'evening' | 'general';
  date: string;
  dueTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'failed';
  results: SOPTaskStepResult[];
  compliancePercent: number;
  completedAt?: string;
  completedBy?: string;
  managerReviewStatus?: 'pending' | 'approved' | 'rejected';
  managerReviewNotes?: string;
  reviewedBy?: string;
  outletId?: string;
  outletName?: string;
  // Compatibility aliases for UI views:
  sopMasterId?: string;
  title?: string;
  dueDate?: string;
  assignedToName?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  location: string;
  maintenanceFrequencyDays: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  status: EquipmentStatus;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  date: string;
  type: 'routine' | 'repair' | 'inspection';
  cost: number;
  performedBy: string;
  notes: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  module: string;
  recordId?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export interface HoinPrinterSettings {
  printerName: string;
  printerType: 'hoin_thermal' | 'esc_pos' | 'system_default';
  connectionType: 'browser' | 'usb' | 'network';
  paperWidth: '58mm' | '80mm';
  printerIp?: string;
  printerPort?: string;
  autoCut?: boolean;
  openDrawer?: boolean;
}

export interface RestaurantSettings {
  name: string;
  tagline: string;
  logoUrl: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  gstNumber: string;
  currencySymbol: string;
  currencyCode: string;
  timezone: string;
  dateFormat: string;
  kotPrinterWidth: '58mm' | '80mm';
  billPrinterWidth: '58mm' | '80mm';
  enableAutoKOTPrint: boolean;
  varianceThresholdPercent: number; // e.g. 5%
  maxCashierDiscountPercent: number;
  maxManagerDiscountPercent: number;
  fssaiLicense?: string;
  wifiName?: string;
  wifiPassword?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  showQrOnReceipt?: boolean;
  qrType?: 'upi' | 'review' | 'custom';
  qrData?: string;
  showHsnOnReceipt?: boolean;
  showServerOnReceipt?: boolean;
  taxRates: { name: string; percent: number; isInclusive: boolean }[];
  deliveryZones: DeliveryZone[];
  lowStockThreshold?: number;
  hoinPrinter?: HoinPrinterSettings;
}

export type AdminSubTab =
  | 'enterprise_matrix'
  | 'analytics'
  | 'branding'
  | 'outlets'
  | 'menu_items'
  | 'categories'
  | 'menu'
  | 'modifiers'
  | 'bulk_upload'
  | 'tax_gst'
  | 'aggregators'
  | 'crm_loyalty'
  | 'offers'
  | 'tables'
  | 'expenses'
  | 'day_end'
  | 'performance'
  | 'staff'
  | 'windows_terminal'
  | 'receipt_designer'
  | 'settings'
  | 'audit';

export interface Organization {
  id: string; // e.g. "org-bk" (Burger King), "org-zorko" (Zorko), "org-mcd" (Mac D)
  name: string; // e.g. "Burger King India", "Zorko Brand Global", "McDonald's India"
  brandCode: string; // e.g. "BK", "ZRK", "MCD"
  tagline?: string;
  logo?: string;
  headquartersCity: string;
  contactEmail: string;
  contactPhone: string;
  gstNumber: string;
  fssaiLicense: string;
  royaltyPercentage: number; // e.g. 5.0%
  masterMenuSync: boolean;
  franchiseCount: number;
  totalOutlets: number;
  createdAt: string;
  status: 'active' | 'onboarding' | 'suspended';
  subscriptionPlan: 'enterprise' | 'growth' | 'starter';
  primaryColor?: string;
  accentColor?: string;
  customReceiptHeader?: string;
  customReceiptFooter?: string;
  poweredByText?: string; // e.g. "Powered by CafeOS"
}

export interface Outlet {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state?: string;
  phone: string;
  email: string;
  gstNumber: string;
  fssaiLicense: string;
  defaultTaxPercent: number;
  terminalCount: number;
  isActive: boolean;
  isMain: boolean;
  openingTime: string;
  closingTime: string;
  todaySales?: number;
  todayOrders?: number;
  organizationId?: string;     // e.g. "org-bk" for Burger King
  organizationName?: string;   // e.g. "Burger King India"
  franchiseGroupId?: string;   // e.g. "fg-bk-1"
  franchiseOwnerId?: string;   // User ID of the franchise owner
  franchiseOwnerName?: string; // e.g. "Rohit Sharma"
  franchiseName?: string;      // e.g. "Sharma Retail & Hospitality LLP"
}

export interface FranchiseGroup {
  id: string;
  organizationId: string;     // e.g. "org-bk" (Burger King)
  organizationName: string;   // e.g. "Burger King India"
  name: string;               // e.g. "Sharma Retail & Hospitality LLP"
  ownerId: string;
  ownerName: string;
  email: string;
  phone: string;
  storeIds: string[];         // Multiple stores in different cities
  cities: string[];           // e.g. ["New Delhi", "Gurugram", "Noida"]
  joinedDate: string;
  royaltyPercentage: number;  // e.g. 5.0%
  status: 'active' | 'suspended' | 'pending';
  contractEndDate?: string;
  panNumber?: string;
}

export interface InterStoreTransfer {
  id: string;
  transferNumber: string;
  fromStoreId: string;
  fromStoreName: string;
  fromCity: string;
  toStoreId: string;
  toStoreName: string;
  toCity: string;
  franchiseGroupId: string;
  franchiseName: string;
  items: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
  }[];
  transferDate: string;
  status: 'requested' | 'in_transit' | 'received' | 'cancelled';
  dispatchedBy: string;
  receivedBy?: string;
  notes?: string;
}

export interface GSTTaxSlab {
  id: string;
  name: string;
  totalRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  hsnCode: string;
  description: string;
  isDefault: boolean;
  applicableCategoryIds?: string[];
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
  inStock: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  minSelection: number;
  maxSelection: number;
  isMultiSelect: boolean;
  options: ModifierOption[];
  applicableCategoryIds: string[];
}

export interface AggregatorChannel {
  id: string;
  name: 'Swiggy' | 'Zomato' | 'MagicPin' | 'Direct Delivery' | string;
  code: string;
  isEnabled: boolean;
  commissionPercent: number;
  markupPercent: number;
  autoAcceptOrders: boolean;
  status: 'online' | 'offline' | 'busy';
  ordersToday: number;
  salesToday: number;
  rating?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
  linkTo?: string;
}

// ----------------------------------------------------
// OFFLINE & BACKGROUND SYNC TYPES (IndexedDB & Service Worker)
// ----------------------------------------------------

export type OfflineTransactionType =
  | 'CREATE_ORDER'
  | 'ADD_ITEMS_TO_ORDER'
  | 'PROCESS_PAYMENT'
  | 'UPDATE_ORDER_STATUS'
  | 'UPDATE_ITEM_KITCHEN_STATUS'
  | 'CANCEL_ORDER'
  | 'PROCESS_REFUND'
  | 'ASSIGN_RIDER'
  | 'UPDATE_DELIVERY_STATUS'
  | 'OPEN_SHIFT'
  | 'CLOSE_SHIFT'
  | 'RECORD_WASTAGE'
  | 'SUBMIT_STOCK_COUNT'
  | 'SUBMIT_SOP_TASK'
  | 'ADD_PURCHASE_ORDER'
  | 'RECEIVE_PURCHASE_ORDER'
  | 'CUSTOM_TRANSACTION';

export type OfflineTransactionStatus = 'queued' | 'syncing' | 'synced' | 'failed';

export interface OfflineTransaction {
  id: string;
  type: OfflineTransactionType;
  entityId?: string;
  description: string;
  amount?: number;
  payload: any;
  actor: {
    id: string;
    name: string;
    role: UserRole;
  };
  status: OfflineTransactionStatus;
  retryCount: number;
  createdAt: string;
  syncedAt?: string;
  error?: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  syncedCount: number;
  failedCount: number;
  status: 'success' | 'partial' | 'failed';
  details: string;
  durationMs: number;
}

export interface OfflineSyncStats {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  syncedCount: number;
  failedCount: number;
  lastSyncTime: string | null;
  storageUsageBytes?: number;
}

// ----------------------------------------------------
// COUPONS, OFFERS & PROMOTIONS MANAGEMENT
// ----------------------------------------------------
export type CouponDiscountType = 'percentage' | 'flat' | 'bogo' | 'free_item';
export type DiscountType = CouponDiscountType;

export interface Coupon {
  id: string; // e.g. "COUP-001"
  code: string; // e.g. "WELCOME20"
  title: string; // e.g. "20% Off Welcome Deal"
  description: string;
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 20 (percent) or 5 (flat $)
  maxDiscountCap?: number; // e.g. 15 (max $15 discount for percentage)
  minOrderValue: number; // e.g. 20 (min $20 subtotal)
  applicableCategoryIds: string[]; // empty array = all categories
  applicableMenuItemIds: string[]; // empty array = all menu items
  bogoTriggerItemId?: string; // buy this item...
  bogoFreeItemId?: string; // ...get this item free / 100% off
  freeMenuItemId?: string; // Free item granted
  orderTypeRestrictions?: OrderType[]; // e.g. ['dine_in', 'takeaway'] or undefined = all
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  timeRestrictions?: {
    startHour: number; // e.g. 14 (2 PM)
    endHour: number; // e.g. 18 (6 PM)
    daysOfWeek?: number[]; // [0 = Sunday, 1 = Monday, ... 6 = Saturday]
  };
  usageLimitTotal?: number; // max overall redemptions
  usageLimitPerCustomer?: number; // max per customer
  usageCount: number;
  totalDiscountGiven: number;
  totalRevenueGenerated: number;
  isActive: boolean;
  isAutoApply?: boolean; // Recommend automatically in POS checkout
  tag?: string; // e.g. "Bestseller", "Happy Hour", "Weekend Special", "First Order"
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  reason?: string;
  calculatedDiscount: number;
  freeItemName?: string;
  coupon?: Coupon;
}

