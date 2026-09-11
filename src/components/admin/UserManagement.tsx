import {
  AlertCircle,
  AlertTriangle,
  Award,
  Bike,
  Building2,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Grid,
  Info,
  KeyRound,
  Layers,
  List,
  Lock,
  Package,
  Percent,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  Monitor,
  Apple,
  QrCode,
  Store,
  Trash2,
  Tv,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Zap,
  Mail,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ROLE_PERMISSIONS_MAP, useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { AppLogonType, Permission, User, UserRole } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatDate, getRoleDetails } from '../../utils/formatters';
import { ClientAppLogonModal } from './ClientAppLogonModal';
import { CorporateAdminCreateModal } from './CorporateAdminCreateModal';
import { CorporateEmailDispatchModal } from './CorporateEmailDispatchModal';
import { FranchiseEmployeeAddModal } from './FranchiseEmployeeAddModal';

const PRESET_AVATARS = [
  { label: 'Executive Owner', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { label: 'Store Manager', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { label: 'POS Cashier', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { label: 'Billing Desk', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
  { label: 'Head Chef (KDS)', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&auto=format&fit=crop&q=80' },
  { label: 'Delivery Rider', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80' },
  { label: 'Inventory Keeper', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80' },
  { label: 'SOP Barista', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
];

interface RoleInfoConfig {
  role: UserRole;
  title: string;
  category: string;
  defaultPortal: string;
  desc: string;
  badge: string;
  icon: React.ElementType;
}

const ROLES_CATALOG: RoleInfoConfig[] = [
  {
    role: 'super_admin',
    title: 'CaféOS SaaS Platform Owner',
    category: 'Platform SaaS',
    defaultPortal: 'admin',
    desc: 'Top-level SaaS master admin: Full access across all client organisations, franchises, portal employees, billing, and system diagnostics.',
    badge: 'SaaS Founder',
    icon: ShieldCheck,
  },
  {
    role: 'platform_employee',
    title: 'CaféOS Portal Employee (Support & Ops)',
    category: 'Platform SaaS',
    defaultPortal: 'admin',
    desc: 'CaféOS internal team members handling the web portal, client onboarding, tenant setup, support tickets, and system monitoring.',
    badge: 'Portal Staff',
    icon: Shield,
  },
  {
    role: 'brand_admin',
    title: 'Brand Corporate HQ Admin (e.g. Burger King)',
    category: 'Brand HQ',
    defaultPortal: 'admin',
    desc: 'Corporate Brand Headquarters overseeing all franchises, master recipes, royalty calculations, and nationwide menu synchronisation.',
    badge: 'Brand HQ',
    icon: Building2,
  },
  {
    role: 'franchise_owner',
    title: 'Franchise Partner & Multi-Store Owner',
    category: 'Franchise Level',
    defaultPortal: 'admin',
    desc: 'Franchise owner managing multiple stores across different cities in the same organisation from a single login.',
    badge: 'Franchisee',
    icon: Store,
  },
  {
    role: 'admin',
    title: 'Store / General Manager',
    category: 'Store Level',
    defaultPortal: 'admin',
    desc: 'Floor supervision, discounts, shift audits, stock checks, menu & SOP reviews.',
    badge: 'Manager',
    icon: Users,
  },
  {
    role: 'cashier',
    title: 'POS Terminal Cashier',
    category: 'Front of House',
    defaultPortal: 'pos',
    desc: 'Front-of-house order taking, tables, modifiers, payments & discounts within limit.',
    badge: 'POS Touch',
    icon: Tv,
  },
  {
    role: 'biller',
    title: 'Billing Counter Desk',
    category: 'Front of House',
    defaultPortal: 'biller',
    desc: 'Fast invoice generation, thermal receipts, payment settlements & authorized refunds.',
    badge: 'Invoicing',
    icon: Receipt,
  },
  {
    role: 'kitchen_staff',
    title: 'Kitchen Chef / Line Cook (KDS)',
    category: 'Kitchen',
    defaultPortal: 'kds',
    desc: 'Kitchen Display System (KDS), line prep timers, recipe specs & rush alerts.',
    badge: 'KDS Live',
    icon: ChefHat,
  },
  {
    role: 'inventory_staff',
    title: 'Inventory & Store Keeper',
    category: 'Back of House',
    defaultPortal: 'inventory',
    desc: 'Raw materials, stockroom batches, purchase orders, wastage logging & physical counts.',
    badge: 'Stockroom',
    icon: Package,
  },
  {
    role: 'delivery_rider',
    title: 'Delivery Fleet Rider',
    category: 'Logistics',
    defaultPortal: 'rider',
    desc: 'Mobile order pickup, customer delivery navigation, COD collections & delivery status.',
    badge: 'Logistics',
    icon: Bike,
  },
  {
    role: 'employee',
    title: 'SOP & Operations Staff / Barista',
    category: 'Floor Operations',
    defaultPortal: 'sop',
    desc: 'Daily hygiene checklists, opening/closing SOPs & machine maintenance logs.',
    badge: 'Operations',
    icon: ClipboardCheck,
  },
];

const AVAILABLE_PORTALS = [
  { id: 'pos', label: 'POS Terminal', icon: Tv, desc: 'Touch order entry & tables' },
  { id: 'kds', label: 'Kitchen KDS', icon: ChefHat, desc: 'Kitchen prep & bump bar' },
  { id: 'biller', label: 'Billing Counter', icon: Receipt, desc: 'Invoices, settlements & refunds' },
  { id: 'inventory', label: 'Inventory & Store', icon: Package, desc: 'Raw stock, batches & POs' },
  { id: 'rider', label: 'Rider Delivery', icon: Bike, desc: 'Delivery routing & COD' },
  { id: 'sop', label: 'SOP & Operations', icon: ClipboardCheck, desc: 'Daily hygiene checklists' },
  { id: 'admin', label: 'Admin Dashboard', icon: ShieldCheck, desc: 'Full business management' },
];

interface PermissionGroup {
  groupName: string;
  icon: string;
  permissions: { id: Permission; label: string; desc: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    groupName: 'POS & Order Operations',
    icon: '🖥️',
    permissions: [
      { id: 'create_order', label: 'Create Orders', desc: 'Punch Dine-In, Takeaway & Delivery orders' },
      { id: 'manage_orders', label: 'Manage Orders', desc: 'Modify, re-open or edit punched tickets' },
      { id: 'cancel_order', label: 'Cancel & Void Orders', desc: 'Cancel active tickets or void KOT items' },
      { id: 'apply_discount', label: 'Apply Discounts', desc: 'Apply % or flat rupee discounts within limit' },
      { id: 'modify_price', label: 'Override Item Prices', desc: 'Custom price adjustments at POS' },
    ],
  },
  {
    groupName: 'Kitchen & KDS Operations',
    icon: '🍳',
    permissions: [
      { id: 'manage_kitchen', label: 'KDS Live Rush Screen', desc: 'Operate Kitchen bump bar, timers & recipe specs' },
    ],
  },
  {
    groupName: 'Billing, Payments & Refunds',
    icon: '💳',
    permissions: [
      { id: 'process_payment', label: 'Process Payments', desc: 'Settle bills via Cash, UPI, Cards or Split' },
      { id: 'process_refund', label: 'Issue Refunds', desc: 'Authorize payment reversals & credit notes' },
    ],
  },
  {
    groupName: 'Inventory, Stockroom & Suppliers',
    icon: '📦',
    permissions: [
      { id: 'manage_inventory', label: 'Raw Stock Management', desc: 'View stock levels, batches and ingredient details' },
      { id: 'stock_adjustment', label: 'Log Wastage & Adjustments', desc: 'Record spoiled ingredients and variance' },
      { id: 'manage_purchases', label: 'Purchase Orders', desc: 'Create and receive supplier POs' },
      { id: 'manage_suppliers', label: 'Supplier Directory', desc: 'Add and manage vendors & contact info' },
      { id: 'approve_stock_variance', label: 'Approve Physical Counts', desc: 'Authorize stock count reconciliation' },
    ],
  },
  {
    groupName: 'Delivery & Fleet Logistics',
    icon: '🛵',
    permissions: [
      { id: 'manage_delivery', label: 'Delivery Dispatch', desc: 'Assign riders and track orders' },
      { id: 'manage_riders', label: 'Rider Fleet Roster', desc: 'Manage driver profiles and payout rates' },
    ],
  },
  {
    groupName: 'SOP, Hygiene & Assets',
    icon: '📋',
    permissions: [
      { id: 'complete_sop', label: 'Execute Daily Checklists', desc: 'Complete opening/closing hygiene checks' },
      { id: 'manage_sop', label: 'Manage SOP Templates', desc: 'Create and edit operational SOP masters' },
      { id: 'approve_sop', label: 'Review Staff SOP Submissions', desc: 'Audit compliance and sign off tasks' },
    ],
  },
  {
    groupName: 'Analytics, Users & Administration',
    icon: '⚙️',
    permissions: [
      { id: 'view_dashboard', label: 'Executive Analytics', desc: 'View revenue, sales metrics and profit reports' },
      { id: 'view_reports', label: 'Detailed Reports', desc: 'Access granular product and shift reports' },
      { id: 'export_reports', label: 'Export Data', desc: 'Download CSV and Excel audit reports' },
      { id: 'view_audit_logs', label: 'View Security Audit Logs', desc: 'Inspect system activity and staff action history' },
      { id: 'manage_users', label: 'Staff Accounts CRUD', desc: 'Create, edit and delete staff logins' },
      { id: 'manage_roles', label: 'Role & Permissions Config', desc: 'Change permissions and security levels' },
      { id: 'manage_menu', label: 'Menu & Recipes Catalog', desc: 'Add/edit food items, recipes and modifiers' },
      { id: 'manage_tables', label: 'Dine-In Table Layout', desc: 'Add, edit and organize dining tables' },
      { id: 'manage_customers', label: 'Customer Loyalty & CRM', desc: 'Manage guest loyalty points and profiles' },
      { id: 'manage_expenses', label: 'Cash Drawer Expenses', desc: 'Record daily petty cash and vendor bills' },
      { id: 'manage_settings', label: 'Store & Printer Settings', desc: 'Configure GST, invoices, and thermal printers' },
    ],
  },
];

export const UserManagement: React.FC = () => {
  const {
    allUsers,
    addUser,
    updateUser,
    deleteUser,
    resetUserPIN,
    resetUserPassword,
    toggleUserStatus,
    currentUser,
    switchUser,
  } = useAuth();

  const { outlets = [] } = useRestaurant();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);

  // Modals & Drawers
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'details' | 'portals' | 'permissions'>('details');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pin, setPin] = useState('1234');
  const [department, setDepartment] = useState('Front of House POS');
  const [branchId, setBranchId] = useState('out-1');
  const [maxDiscountPercent, setMaxDiscountPercent] = useState('10');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[2].url);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // Multi-Store Assignment & Franchise Owner States
  const [assignedStoreIds, setAssignedStoreIds] = useState<string[]>(['out-1']);
  const [isFranchiseOwner, setIsFranchiseOwner] = useState(false);
  const [franchiseName, setFranchiseName] = useState('');

  // Portals & Custom Permissions State
  const [allowedPortals, setAllowedPortals] = useState<string[]>(['pos', 'biller', 'sop']);
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);

  // Client App Logon Modal & Form States (Android / iOS / Windows)
  const [clientAppLogonTargetUser, setClientAppLogonTargetUser] = useState<User | null>(null);
  const [clientAppLogonInitialTab, setClientAppLogonInitialTab] = useState<AppLogonType>('android_app');
  const [allowedAppLogons, setAllowedAppLogons] = useState<AppLogonType[]>(['android_app', 'ios_app', 'windows_app']);
  const [appLoginCode, setAppLoginCode] = useState<string>('AND-3301');
  const [windowsStationId, setWindowsStationId] = useState<string>('POS-WIN-01');

  // Reset PIN / Password Modal
  const [isResetCredentialsModalOpen, setIsResetCredentialsModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [resetType, setResetType] = useState<'password' | 'pin'>('password');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [credentialCopied, setCredentialCopied] = useState(false);

  // View User Profile Drawer
  const [inspectUser, setInspectUser] = useState<User | null>(null);

  // Delete User Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Franchise Employee & Corporate Admin Provisioning Modals
  const [isFranchiseEmployeeModalOpen, setIsFranchiseEmployeeModalOpen] = useState(false);
  const [isCorporateAdminModalOpen, setIsCorporateAdminModalOpen] = useState(false);
  const [emailDispatchTargetUser, setEmailDispatchTargetUser] = useState<User | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ title: string; desc: string; type: 'employee' | 'corporate' } | null>(null);

  // Password & PIN visibility toggles per user in table/grid
  const [visibleCredentials, setVisibleCredentials] = useState<{ [userId: string]: { pass?: boolean; pin?: boolean } }>({});

  const toggleCredentialVisibility = (userId: string, type: 'pass' | 'pin') => {
    setVisibleCredentials((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [type]: !prev[userId]?.[type],
      },
    }));
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.replace(/[\s-]/g, '').includes(q.replace(/[\s-]/g, '')) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);

      let matchesRole = true;
      if (selectedRoleFilter !== 'all') {
        if (selectedRoleFilter === 'management') {
          matchesRole = u.role === 'super_admin' || u.role === 'admin';
        } else if (selectedRoleFilter === 'pos_terminal') {
          matchesRole = u.role === 'cashier';
        } else if (selectedRoleFilter === 'billing_counter') {
          matchesRole = u.role === 'biller';
        } else if (selectedRoleFilter === 'kitchen_kds') {
          matchesRole = u.role === 'kitchen_staff';
        } else if (selectedRoleFilter === 'inventory_store') {
          matchesRole = u.role === 'inventory_staff';
        } else if (selectedRoleFilter === 'rider_delivery') {
          matchesRole = u.role === 'delivery_rider';
        } else if (selectedRoleFilter === 'sop_operations') {
          matchesRole = u.role === 'employee';
        } else {
          matchesRole = u.role === selectedRoleFilter;
        }
      }

      const matchesStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'active' && u.isActive) ||
        (selectedStatusFilter === 'inactive' && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [allUsers, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Summary Metrics
  const totalStaff = allUsers.length;
  const activeCount = allUsers.filter((u) => u.isActive).length;
  const managersCount = allUsers.filter((u) => ['super_admin', 'admin'].includes(u.role)).length;
  const posCashiersCount = allUsers.filter((u) => u.role === 'cashier').length;
  const billersCount = allUsers.filter((u) => u.role === 'biller').length;
  const kitchenCount = allUsers.filter((u) => u.role === 'kitchen_staff').length;
  const inventoryCount = allUsers.filter((u) => u.role === 'inventory_staff').length;
  const ridersCount = allUsers.filter((u) => u.role === 'delivery_rider').length;
  const sopStaffCount = allUsers.filter((u) => u.role === 'employee').length;

  // Helper: Generate Random Strong Password
  const generateStrongPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${result}123!`;
  };

  // Helper: Generate 4-digit PIN
  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Open Create Modal
  const handleOpenCreateModal = (defaultRole?: UserRole) => {
    const targetRole: UserRole = defaultRole || 'cashier';
    const defaultRoleConfig = ROLES_CATALOG.find((r) => r.role === targetRole);
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword(generateStrongPassword());
    setShowFormPassword(false);
    setPhone('+91 98200 ');
    setRole(targetRole);
    setPin(generateRandomPin());
    setDepartment(defaultRoleConfig?.category || 'Front of House POS');
    setBranchId('branch-1');
    setMaxDiscountPercent(targetRole === 'super_admin' ? '100' : targetRole === 'admin' ? '30' : '10');
    setAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].url);
    setIsActive(true);
    setNotes('');
    setAllowedPortals(
      targetRole === 'super_admin' || targetRole === 'admin'
        ? ['admin', 'pos', 'kds', 'biller', 'inventory', 'rider', 'sop']
        : targetRole === 'cashier'
        ? ['pos', 'biller', 'sop']
        : targetRole === 'biller'
        ? ['biller', 'pos', 'sop']
        : targetRole === 'kitchen_staff'
        ? ['kds', 'sop']
        : targetRole === 'inventory_staff'
        ? ['inventory', 'sop']
        : targetRole === 'delivery_rider'
        ? ['rider', 'sop']
        : ['sop']
    );
    setUseCustomPermissions(false);
    setCustomPermissions([...(ROLE_PERMISSIONS_MAP[targetRole] || [])]);
    setAllowedAppLogons(
      targetRole === 'super_admin' || targetRole === 'admin'
        ? ['android_app', 'ios_app', 'windows_app']
        : targetRole === 'cashier' || targetRole === 'biller'
        ? ['windows_app', 'android_app', 'ios_app']
        : ['android_app', 'ios_app']
    );
    setAppLoginCode(
      `${targetRole === 'cashier' ? 'POS' : targetRole === 'biller' ? 'BIL' : targetRole === 'kitchen_staff' ? 'KDS' : targetRole === 'delivery_rider' ? 'RID' : 'APP'}-${Math.floor(1000 + Math.random() * 9000)}`
    );
    setWindowsStationId(`POS-WIN-0${Math.floor(1 + Math.random() * 4)}`);
    setAssignedStoreIds(outlets.length > 0 ? [outlets[0].id] : ['out-1']);
    setIsFranchiseOwner(targetRole === 'admin');
    setFranchiseName(targetRole === 'admin' ? 'Sharma Hospitality Group' : '');
    setActiveFormTab('details');
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword(u.password || 'password123');
    setShowFormPassword(false);
    setPhone(u.phone);
    setRole(u.role);
    setPin(u.pin || '1234');
    setDepartment(u.department || 'General Operations');
    setBranchId(u.branchId || 'out-1');
    setAssignedStoreIds(
      u.assignedStoreIds && u.assignedStoreIds.length > 0
        ? u.assignedStoreIds
        : [u.branchId || 'out-1']
    );
    setIsFranchiseOwner(!!u.isFranchiseOwner);
    setFranchiseName(u.franchiseName || '');
    setMaxDiscountPercent(String(u.maxDiscountPercent || 0));
    setAvatar(u.avatar || PRESET_AVATARS[0].url);
    setIsActive(u.isActive);
    setNotes(u.notes || '');
    setAllowedPortals(
      u.allowedPortals && u.allowedPortals.length > 0
        ? u.allowedPortals
        : u.role === 'super_admin' || u.role === 'admin'
        ? ['admin', 'pos', 'kds', 'biller', 'inventory', 'rider', 'sop']
        : [ROLES_CATALOG.find((r) => r.role === u.role)?.defaultPortal || 'pos', 'sop']
    );
    setAllowedAppLogons(
      u.allowedAppLogons && u.allowedAppLogons.length > 0
        ? u.allowedAppLogons
        : ['android_app', 'ios_app', 'windows_app']
    );
    setAppLoginCode(u.appLoginCode || `APP-${Math.floor(1000 + Math.random() * 9000)}`);
    setWindowsStationId(u.windowsStationId || 'POS-WIN-01');
    setUseCustomPermissions(!!(u.customPermissions && u.customPermissions.length > 0));
    setCustomPermissions(
      u.customPermissions && u.customPermissions.length > 0
        ? [...u.customPermissions]
        : [...(ROLE_PERMISSIONS_MAP[u.role] || [])]
    );
    setActiveFormTab('details');
    setIsAddEditModalOpen(true);
  };

  // Handle Role Change inside Modal (auto-sets suggested default portals & permissions)
  const handleRoleSelect = (newRole: UserRole) => {
    setRole(newRole);
    const catalogItem = ROLES_CATALOG.find((r) => r.role === newRole);
    if (catalogItem) {
      setDepartment(catalogItem.category);
    }
    if (newRole === 'super_admin') {
      setMaxDiscountPercent('100');
      setAllowedPortals(['admin', 'pos', 'kds', 'biller', 'inventory', 'rider', 'sop']);
      setAllowedAppLogons(['android_app', 'ios_app', 'windows_app']);
    } else if (newRole === 'admin') {
      setMaxDiscountPercent('30');
      setAllowedPortals(['admin', 'pos', 'kds', 'biller', 'inventory', 'rider', 'sop']);
      setAllowedAppLogons(['android_app', 'ios_app', 'windows_app']);
    } else if (newRole === 'cashier') {
      setMaxDiscountPercent('10');
      setAllowedPortals(['pos', 'biller', 'sop']);
      setAllowedAppLogons(['windows_app', 'android_app', 'ios_app']);
    } else if (newRole === 'biller') {
      setMaxDiscountPercent('15');
      setAllowedPortals(['biller', 'pos', 'sop']);
      setAllowedAppLogons(['windows_app', 'android_app', 'ios_app']);
    } else if (newRole === 'kitchen_staff') {
      setMaxDiscountPercent('0');
      setAllowedPortals(['kds', 'sop']);
      setAllowedAppLogons(['android_app', 'ios_app']);
    } else if (newRole === 'inventory_staff') {
      setMaxDiscountPercent('0');
      setAllowedPortals(['inventory', 'sop']);
      setAllowedAppLogons(['android_app', 'ios_app']);
    } else if (newRole === 'delivery_rider') {
      setMaxDiscountPercent('0');
      setAllowedPortals(['rider', 'sop']);
      setAllowedAppLogons(['android_app', 'ios_app']);
    } else {
      setMaxDiscountPercent('0');
      setAllowedPortals(['sop']);
      setAllowedAppLogons(['android_app']);
    }

    if (!useCustomPermissions) {
      setCustomPermissions([...(ROLE_PERMISSIONS_MAP[newRole] || [])]);
    }
  };

  // Toggle Portal Checkbox
  const togglePortal = (portalId: string) => {
    setAllowedPortals((prev) =>
      prev.includes(portalId) ? prev.filter((p) => p !== portalId) : [...prev, portalId]
    );
  };

  // Toggle Client App Logon Checkbox
  const toggleAppLogon = (appType: AppLogonType) => {
    setAllowedAppLogons((prev) =>
      prev.includes(appType)
        ? prev.length > 1
          ? prev.filter((a) => a !== appType)
          : prev
        : [...prev, appType]
    );
  };

  // Toggle Single Permission Checkbox
  const togglePermission = (permId: Permission) => {
    setCustomPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Save User (Create or Update)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!email.trim()) return;

    const chosenStores = assignedStoreIds.length > 0 ? assignedStoreIds : ['out-1'];

    const userData: Omit<User, 'id'> = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim() || 'password123',
      phone: phone.trim(),
      role,
      pin: pin.trim() || '1234',
      department: department.trim(),
      branchId: chosenStores[0],
      assignedStoreIds: chosenStores,
      isFranchiseOwner,
      franchiseName: franchiseName.trim() || undefined,
      organizationId: 'org-cafeos-corp',
      maxDiscountPercent: parseInt(maxDiscountPercent, 10) || 0,
      avatar,
      isActive,
      notes: notes.trim(),
      allowedPortals: allowedPortals.length > 0 ? allowedPortals : ['sop'],
      allowedAppLogons: allowedAppLogons.length > 0 ? allowedAppLogons : ['android_app', 'ios_app', 'windows_app'],
      appLoginCode: appLoginCode.trim() || undefined,
      windowsStationId: windowsStationId.trim() || undefined,
      devicePairingToken: editingUser?.devicePairingToken || `PAIR-${Math.floor(100000 + Math.random() * 900000)}`,
      customPermissions: useCustomPermissions ? customPermissions : undefined,
      createdAt: editingUser?.createdAt || new Date().toISOString(),
    };

    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }
    setIsAddEditModalOpen(false);
  };

  // Open Reset Credentials Modal
  const handleOpenResetCredentials = (u: User, type: 'password' | 'pin' = 'password') => {
    setResetTargetUser(u);
    setResetType(type);
    setNewPasswordInput(generateStrongPassword());
    setNewPinInput(generateRandomPin());
    setCredentialCopied(false);
    setIsResetCredentialsModalOpen(true);
  };

  const handleConfirmResetCredentials = () => {
    if (!resetTargetUser) return;
    if (resetType === 'password') {
      resetUserPassword(resetTargetUser.id, newPasswordInput);
    } else {
      resetUserPIN(resetTargetUser.id, newPinInput);
    }
    setIsResetCredentialsModalOpen(false);
  };

  // Copy Complete Staff Credentials Card
  const handleCopyStaffCredentials = (u: User) => {
    const text = `🍽️ CaféOS Staff Account Details:
----------------------------------------
Name: ${u.name}
Role: ${getRoleDetails(u.role).label}
Department: ${u.department || 'General'}
Email ID: ${u.email}
Password: ${u.password || 'password123'}
Touch PIN: ${u.pin || '1234'}
Allowed Portals: ${(u.allowedPortals || ['pos', 'sop']).join(', ')}
Status: ${u.isActive ? 'Active' : 'Suspended'}
----------------------------------------
Sign in at CaféOS Login Portal`;
    navigator.clipboard.writeText(text);
    alert(`Credentials for ${u.name} copied to clipboard!`);
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (u: User) => {
    setDeleteTargetUser(u);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetUser) {
      const ok = deleteUser(deleteTargetUser.id);
      if (!ok) {
        setDeleteError('Cannot delete the sole active Super Admin account. Create another Super Admin first.');
      } else {
        setIsDeleteModalOpen(false);
      }
    }
  };

  // Export Staff Roster
  const handleExportRoster = () => {
    const dataToExport = allUsers.map((u) => ({
      ID: u.id,
      Name: u.name,
      'Email ID': u.email,
      'Password / Pass': u.password || 'password123',
      'Access PIN': u.pin || '1234',
      Phone: u.phone,
      Role: u.role,
      Department: u.department || 'General',
      Branch: u.branchId,
      'Allowed Portals': (u.allowedPortals || []).join(', '),
      'Discount Limit %': u.maxDiscountPercent,
      'Last Login': u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never',
      Status: u.isActive ? 'ACTIVE' : 'SUSPENDED',
    }));
    exportToCSV(`CafeOS_Staff_Roster_Credentials_${new Date().toISOString().split('T')[0]}`, dataToExport);
  };

  // Role Category Tabs for Quick Navigation
  const roleCategoryTabs = [
    { id: 'all', label: 'All Accounts', count: totalStaff, icon: Users },
    { id: 'pos_terminal', label: 'POS Terminal', count: posCashiersCount, icon: Tv },
    { id: 'kitchen_kds', label: 'Kitchen KDS', count: kitchenCount, icon: ChefHat },
    { id: 'billing_counter', label: 'Billing Desk', count: billersCount, icon: Receipt },
    { id: 'inventory_store', label: 'Inventory & Store', count: inventoryCount, icon: Package },
    { id: 'rider_delivery', label: 'Riders Fleet', count: ridersCount, icon: Bike },
    { id: 'sop_operations', label: 'SOP & Floor', count: sopStaffCount, icon: ClipboardCheck },
    { id: 'management', label: 'Managers', count: managersCount, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Backoffice Security Policy & Multi-Platform Client App Governance Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950 rounded-2xl border border-amber-500/30 p-4 sm:p-5 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                Backoffice Security Rule
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-300 font-medium">
                Admin Exclusive Access & Multi-Platform Client App Logon Hub
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-1">
              Admin Web Portal Access Reserved Strictly for Administrators
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl mt-0.5 leading-relaxed">
              Inside Admin, no other staff roles can log in. The web portal is reserved exclusively for the <strong>Super Admin (Organization)</strong> and <strong>Franchise Owners (Store Admins)</strong>. All other staff (Cashiers, Billers, Kitchen, Inventory, Riders) are created here with dedicated <strong>Android App</strong>, <strong>iOS App</strong>, or <strong>Windows App</strong> logon credentials.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFranchiseEmployeeModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            title="Franchise Owner: Add store employees like billers, delivery boys, cashiers with Device PIN login"
          >
            <Smartphone className="w-4 h-4" />
            <span>+ Add Store Employee (Device PIN)</span>
          </button>

          <button
            onClick={() => setIsCorporateAdminModalOpen(true)}
            className="px-3.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
            title="Create Organization user, corporate login or franchise admin with demo default password emailed"
          >
            <Mail className="w-4 h-4" />
            <span>+ Corporate / Franchise Admin Login</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Open standard staff creation form"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Custom Staff</span>
          </button>
        </div>
      </div>

      {/* Interactive Feedback Banner after provisioning */}
      {feedbackBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-black">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                {feedbackBanner.title}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                {feedbackBanner.desc}
              </div>
            </div>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {ROLES_CATALOG.map((cfg) => {
          const count = allUsers.filter((u) => u.role === cfg.role).length;
          const activeInRole = allUsers.filter((u) => u.role === cfg.role && u.isActive).length;
          const IconComp = cfg.icon;
          return (
            <button
              key={cfg.role}
              onClick={() => {
                setSelectedRoleFilter(cfg.role);
                setSearchQuery('');
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                selectedRoleFilter === cfg.role
                  ? 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <IconComp className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {activeInRole}/{count}
                </span>
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{count}</div>
                <div className="text-[10px] font-bold text-slate-500 truncate mt-1">{cfg.badge}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        {/* Horizontal Role Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-100 dark:border-slate-800">
          {roleCategoryTabs.map((tab) => {
            const isSelected = selectedRoleFilter === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Status & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Search bar */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by Name, Email, Phone, Role, Station..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:border-amber-500 outline-hidden text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses ({totalStaff})</option>
              <option value="active">Active Only ({activeCount})</option>
              <option value="inactive">Suspended ({totalStaff - activeCount})</option>
            </select>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dense Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid Cards View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Permissions Matrix Drawer Toggle */}
            <button
              onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 ${
                showPermissionsMatrix
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Permissions Matrix</span>
            </button>

            {/* Export Roster CSV */}
            <button
              onClick={handleExportRoster}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Export Staff Roster with Email & Passwords"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Primary Add Staff Button */}
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-amber-600/30 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Drawer (Collapsible) */}
      {showPermissionsMatrix && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-500/40 shadow-xl p-5 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  System Role-Based Access Control (RBAC) Permissions Matrix
                </h4>
                <p className="text-xs text-slate-500">
                  Default and customizable permissions mapped to each operational role across POS, KDS, Billing, Inventory and Administration.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPermissionsMatrix(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 p-1"
            >
              ✕ Close
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 uppercase font-black text-slate-500 text-[10px]">
                <tr>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Operational Capability</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-center">Super Admin</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-center">Manager</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-center">POS Cashier</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-center">Biller Desk</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-center">Kitchen KDS</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-center">Inventory</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-center">Rider Fleet</th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-center">SOP Floor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {PERMISSION_GROUPS.flatMap((g) => g.permissions).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold">
                      <div>{p.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{p.desc}</div>
                    </td>
                    <td className="p-2.5 text-center">
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                    <td className="p-2.5 text-center">
                      {ROLE_PERMISSIONS_MAP.admin.includes(p.id) ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      {ROLE_PERMISSIONS_MAP.cashier.includes(p.id) ? (
                        <Check className="w-4 h-4 text-blue-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      {ROLE_PERMISSIONS_MAP.biller.includes(p.id) ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      {ROLE_PERMISSIONS_MAP.kitchen_staff.includes(p.id) ? (
                        <Check className="w-4 h-4 text-rose-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      {ROLE_PERMISSIONS_MAP.inventory_staff.includes(p.id) ? (
                        <Check className="w-4 h-4 text-indigo-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      {ROLE_PERMISSIONS_MAP.delivery_rider.includes(p.id) ? (
                        <Check className="w-4 h-4 text-cyan-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      {ROLE_PERMISSIONS_MAP.employee.includes(p.id) ? (
                        <Check className="w-4 h-4 text-teal-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Staff Display (Table or Grid) */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-black text-lg text-slate-900 dark:text-white">No Staff Accounts Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No accounts match your current filter query. Try clearing the search keyword or register a new staff account.
          </p>
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md"
          >
            Create New Account
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Role & Department</th>
                  <th className="py-3 px-3">Client App Logon</th>
                  <th className="py-3 px-3">Email ID & Password</th>
                  <th className="py-3 px-3">Access PIN</th>
                  <th className="py-3 px-3">Allowed Portals</th>
                  <th className="py-3 px-3">Discount Authorization</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredUsers.map((u) => {
                  const roleDetails = getRoleDetails(u.role);
                  const isPassVisible = visibleCredentials[u.id]?.pass;
                  const isPinVisible = visibleCredentials[u.id]?.pin;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        !u.isActive ? 'opacity-60 bg-slate-50/30 dark:bg-slate-950/20' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {currentUser?.id === u.id && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${roleDetails.bg} ${roleDetails.text}`}
                        >
                          {roleDetails.label}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">{u.department || 'General'}</div>
                        {u.isFranchiseOwner && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-bold">
                              🏪 Franchise Owner
                            </span>
                            {u.franchiseName && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate max-w-[140px]">
                                {u.franchiseName}
                              </div>
                            )}
                          </div>
                        )}
                        {u.employeeCategory && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[9px] font-black uppercase">
                              {u.employeeCategory === 'biller'
                                ? '🧾 Biller'
                                : u.employeeCategory === 'delivery_boy'
                                ? '🛵 Delivery Boy'
                                : u.employeeCategory === 'cashier'
                                ? '💵 Cashier'
                                : u.employeeCategory === 'kitchen_staff'
                                ? '👨‍🍳 Kitchen Staff'
                                : u.employeeCategory === 'waiter'
                                ? '🍽️ Waiter'
                                : '🏪 Store Staff'}
                            </span>
                          </div>
                        )}
                        {u.assignedStoreIds && u.assignedStoreIds.length > 0 && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {u.assignedStoreIds.length} Store{u.assignedStoreIds.length > 1 ? 's' : ''} Managed
                          </div>
                        )}
                      </td>

                      {/* Client App Logon (Android / iOS / Windows) */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(u.allowedAppLogons && u.allowedAppLogons.length > 0
                              ? u.allowedAppLogons
                              : ['android_app', 'ios_app', 'windows_app']
                            ).map((app) => (
                              <span
                                key={app}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  app === 'android_app'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : app === 'ios_app'
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                    : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                                }`}
                              >
                                {app === 'android_app' ? '📱 Android' : app === 'ios_app' ? '📲 iOS' : '💻 Windows'}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-black">
                              {u.appLoginCode || 'APP-3301'}
                            </span>
                            <button
                              onClick={() => {
                                setClientAppLogonTargetUser(u);
                                setClientAppLogonInitialTab(
                                  u.allowedAppLogons?.includes('android_app')
                                    ? 'android_app'
                                    : u.allowedAppLogons?.includes('ios_app')
                                    ? 'ios_app'
                                    : 'windows_app'
                                );
                              }}
                              className="text-[9px] font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-0.5"
                              title="View Mobile/Windows App Logon Key & QR"
                            >
                              <QrCode className="w-2.5 h-2.5" />
                              <span>QR & Key</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Email ID & Password */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-[180px]">
                          {u.email}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-[10px]">
                          <span>Pass:</span>
                          <span className="font-black text-amber-600 dark:text-amber-400">
                            {isPassVisible ? u.password || 'password123' : '••••••••'}
                          </span>
                          <button
                            onClick={() => toggleCredentialVisibility(u.id, 'pass')}
                            className="hover:text-slate-200"
                            title={isPassVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        {u.credentialsDispatched && (
                          <button
                            onClick={() => setEmailDispatchTargetUser(u)}
                            className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                            title="View official Corporate HQ email dispatched with demo default password"
                          >
                            <Mail className="w-2.5 h-2.5" />
                            <span>Demo Pass Emailed: {u.credentialsDispatched.defaultPassword}</span>
                          </button>
                        )}
                      </td>

                      {/* PIN */}
                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-amber-600 dark:text-amber-400 text-xs">
                            {isPinVisible ? u.pin || '1234' : '••••'}
                          </span>
                          <button
                            onClick={() => toggleCredentialVisibility(u.id, 'pin')}
                            className="text-slate-400 hover:text-slate-200"
                            title={isPinVisible ? 'Hide PIN' : 'Show PIN'}
                          >
                            {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        {u.devicePin && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[9px] font-black font-mono">
                              📟 DEV PIN: {isPinVisible ? u.devicePin : '••••'}
                            </span>
                            {u.deviceStationId && (
                              <span className="text-[9px] text-slate-400 font-mono truncate max-w-[110px]">
                                {u.deviceStationId}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Allowed Portals */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {(u.allowedPortals && u.allowedPortals.length > 0
                            ? u.allowedPortals
                            : ['pos', 'sop']
                          ).map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase font-mono"
                            >
                              {p}
                            </span>
                          ))}
                          {u.customPermissions && u.customPermissions.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase">
                              Custom ({u.customPermissions.length})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Discount Limit */}
                      <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                        {u.maxDiscountPercent || 0}%
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase transition-colors ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Login As Switch */}
                          <button
                            onClick={() => {
                              switchUser(u.id);
                              alert(`Switched active session to ${u.name} (${roleDetails.label}). You can now navigate portals with this account!`);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10"
                            title="Quick Login as this staff member"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          {/* Client App Logon (Android / iOS / Windows) */}
                          <button
                            onClick={() => {
                              setClientAppLogonTargetUser(u);
                              setClientAppLogonInitialTab(
                                u.allowedAppLogons?.includes('android_app')
                                  ? 'android_app'
                                  : u.allowedAppLogons?.includes('ios_app')
                                  ? 'ios_app'
                                  : 'windows_app'
                              );
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                            title="Client App Logon Credentials & QR (Android / iOS / Windows)"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>

                          {/* Corporate HQ Email Dispatch View */}
                          {(u.credentialsDispatched || u.isFranchiseOwner || u.role === 'admin' || u.role === 'super_admin') && (
                            <button
                              onClick={() => setEmailDispatchTargetUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10"
                              title="View Corporate HQ Email Dispatch & Demo Default Password"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Copy Full Credentials */}
                          <button
                            onClick={() => handleCopyStaffCredentials(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10"
                            title="Copy Email & Password Credentials"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Pass / PIN */}
                          <button
                            onClick={() => handleOpenResetCredentials(u, 'password')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10"
                            title="Reset Password or PIN"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10"
                            title="Edit Account"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleOpenDelete(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((u) => {
            const roleDetails = getRoleDetails(u.role);
            const isPassVisible = visibleCredentials[u.id]?.pass;
            const isPinVisible = visibleCredentials[u.id]?.pin;

            return (
              <div
                key={u.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  u.isActive
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 opacity-75'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="relative">
                      <img
                        src={
                          u.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={u.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                          u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${roleDetails.bg} ${roleDetails.text}`}
                    >
                      {roleDetails.label}
                    </span>
                  </div>

                  {u.employeeCategory && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[9px] font-black uppercase">
                        {u.employeeCategory === 'biller'
                          ? '🧾 Biller'
                          : u.employeeCategory === 'delivery_boy'
                          ? '🛵 Delivery Rider'
                          : u.employeeCategory === 'cashier'
                          ? '💵 Cashier'
                          : u.employeeCategory === 'kitchen_staff'
                          ? '👨‍🍳 Kitchen Staff'
                          : u.employeeCategory === 'waiter'
                          ? '🍽️ Waiter'
                          : '🏪 Store Staff'}
                      </span>
                    </div>
                  )}

                  {/* Staff Info */}
                  <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{u.name}</span>
                    {currentUser?.id === u.id && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                    {u.email}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{u.phone}</div>

                  {/* Credentials & Permissions Details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Password:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-black text-slate-900 dark:text-slate-100">
                          {isPassVisible ? u.password || 'password123' : '••••••••'}
                        </span>
                        <button
                          onClick={() => toggleCredentialVisibility(u.id, 'pass')}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {u.credentialsDispatched && (
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[10px] flex items-center justify-between">
                        <span className="text-indigo-700 dark:text-indigo-300 font-bold">Emailed Demo Pass:</span>
                        <button
                          onClick={() => setEmailDispatchTargetUser(u)}
                          className="font-mono font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-2.5 h-2.5" />
                          <span>{u.credentialsDispatched.defaultPassword}</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Access PIN:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                          {isPinVisible ? u.pin || '1234' : '••••'}
                        </span>
                        <button
                          onClick={() => toggleCredentialVisibility(u.id, 'pin')}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {u.devicePin && (
                      <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] flex items-center justify-between">
                        <span className="text-emerald-800 dark:text-emerald-300 font-bold">Device Station PIN:</span>
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                          {isPinVisible ? u.devicePin : '••••'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{u.department || 'General'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Portals:</span>
                      <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {(u.allowedPortals || ['pos', 'sop']).join(', ')}
                      </span>
                    </div>

                    {/* Client App Logon Badges */}
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500">App Logon:</span>
                        <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {u.appLoginCode || 'APP-3301'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(u.allowedAppLogons && u.allowedAppLogons.length > 0
                          ? u.allowedAppLogons
                          : ['android_app', 'ios_app', 'windows_app']
                        ).map((app) => (
                          <span
                            key={app}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              app === 'android_app'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : app === 'ios_app'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                            }`}
                          >
                            {app === 'android_app' ? '📱 Android' : app === 'ios_app' ? '📲 iOS' : '💻 Windows'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <button
                    onClick={() => {
                      switchUser(u.id);
                      alert(`Switched active session to ${u.name}!`);
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                    title="Quick Login as this user"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Login</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setClientAppLogonTargetUser(u);
                        setClientAppLogonInitialTab(
                          u.allowedAppLogons?.includes('android_app')
                            ? 'android_app'
                            : u.allowedAppLogons?.includes('ios_app')
                            ? 'ios_app'
                            : 'windows_app'
                        );
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                      title="Client App Logon (Android / iOS / Windows)"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                    {(u.credentialsDispatched || u.isFranchiseOwner || u.role === 'admin' || u.role === 'super_admin') && (
                      <button
                        onClick={() => setEmailDispatchTargetUser(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10"
                        title="View Corporate HQ Email Dispatch & Demo Default Password"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyStaffCredentials(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Copy Credentials"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenResetCredentials(u, 'password')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Reset Password/PIN"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Profile & Permissions"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD OR EDIT STAFF ACCOUNT WITH CREDENTIALS & PERMISSIONS         */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingUser ? `Edit Account: ${editingUser.name}` : 'Register New Staff Account'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure Email & Password credentials, touch terminal PIN, station portals and granular permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-850 px-6 pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveFormTab('details')}
                className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeFormTab === 'details'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Staff & Credentials</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('portals')}
                className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeFormTab === 'portals'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>2. Client App Logon & Portals ({allowedAppLogons.length} Platforms)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('permissions')}
                className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeFormTab === 'permissions'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>3. Granular RBAC Permissions</span>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              {/* TAB 1: Basic Profile & Credentials */}
              {activeFormTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Full Name */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98200 00000"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Email Address (Login ID) */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Login Email ID *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. cashier2@zorko.in"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">
                          Login Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => setPassword(generateStrongPassword())}
                          className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                        >
                          🎲 Generate Password
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showFormPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter account password"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-amber-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFormPassword(!showFormPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                        >
                          {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* System Role */}
                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Staff Primary Role *
                      </label>
                      <select
                        value={role}
                        onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                      >
                        {ROLES_CATALOG.map((r) => (
                          <option key={r.role} value={r.role}>
                            {r.title} — ({r.desc})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Touch PIN */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">
                          Touch Station Access PIN *
                        </label>
                        <button
                          type="button"
                          onClick={() => setPin(generateRandomPin())}
                          className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                        >
                          🎲 Generate PIN
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="1234"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-black text-slate-900 dark:text-white text-center text-base tracking-widest outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Max Discount Limit */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Max Discount Limit %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={maxDiscountPercent}
                        onChange={(e) => setMaxDiscountPercent(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Department & Station */}
                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Department & Station Assigned
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Front of House POS / Kitchen Line 1"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Preset Avatars */}
                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Staff Avatar Preset
                      </label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {PRESET_AVATARS.map((av) => (
                          <button
                            key={av.url}
                            type="button"
                            onClick={() => setAvatar(av.url)}
                            className={`p-0.5 rounded-xl border-2 transition-all ${
                              avatar === av.url
                                ? 'border-amber-500 scale-110 shadow-md'
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                            title={av.label}
                          >
                            <img src={av.url} alt={av.label} className="w-8 h-8 rounded-lg object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Multi-Store Franchise Assignment */}
                    <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <label className="block font-bold text-slate-800 dark:text-slate-200">
                            Multi-Store Access & Franchise Owner Control
                          </label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Assign multiple outlets to this single user account. The user will be able to switch stores seamlessly.
                          </p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isFranchiseOwner}
                            onChange={(e) => setIsFranchiseOwner(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                          />
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            Franchise Owner
                          </span>
                        </label>
                      </div>

                      {isFranchiseOwner && (
                        <div className="mb-3">
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Franchise Group / Partner Name
                          </label>
                          <input
                            type="text"
                            value={franchiseName}
                            onChange={(e) => setFranchiseName(e.target.value)}
                            placeholder="e.g. Sharma Hospitality Group"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {outlets.map((outlet) => {
                          const isAssigned = assignedStoreIds.includes(outlet.id);
                          return (
                            <label
                              key={outlet.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isAssigned
                                  ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => {
                                    setAssignedStoreIds((prev) =>
                                      prev.includes(outlet.id)
                                        ? prev.length > 1
                                          ? prev.filter((id) => id !== outlet.id)
                                          : prev
                                        : [...prev, outlet.id]
                                    );
                                  }}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                                />
                                <div>
                                  <div className="font-bold text-xs leading-tight">{outlet.name}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                    {outlet.code} • {outlet.city}
                                  </div>
                                </div>
                              </div>
                              {outlet.isMain && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                                  Main HQ
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Checkbox */}
                    <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <input
                        type="checkbox"
                        id="userActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                      />
                      <label htmlFor="userActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Active Account (Staff member can log in to stations using Email/Password or PIN)
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Client App Logon & Station Portals Access */}
              {activeFormTab === 'portals' && (
                <div className="space-y-5">
                  {/* Security Policy Reminder */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                      <strong className="block font-black mb-0.5">Admin Console Separation Rule:</strong>
                      Inside Admin, only administrative users can log in. Operational staff members cannot log in to the Web Admin Portal and must use their authorized <strong>Android App</strong>, <strong>iOS App</strong>, or <strong>Windows App</strong>.
                    </div>
                  </div>

                  {/* Client App Logon Platforms */}
                  <div>
                    <label className="block font-black text-slate-800 dark:text-white text-xs mb-2">
                      Authorized Client App Logon Platforms
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Android App */}
                      <button
                        type="button"
                        onClick={() => toggleAppLogon('android_app')}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                          allowedAppLogons.includes('android_app')
                            ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30'
                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl text-xs ${
                            allowedAppLogons.includes('android_app')
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-900 dark:text-white">Android App</span>
                            <span
                              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                                allowedAppLogons.includes('android_app')
                                  ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-black'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {allowedAppLogons.includes('android_app') && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Handheld POS, Captain, Rider APK
                          </p>
                        </div>
                      </button>

                      {/* iOS App */}
                      <button
                        type="button"
                        onClick={() => toggleAppLogon('ios_app')}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                          allowedAppLogons.includes('ios_app')
                            ? 'bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/30'
                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl text-xs ${
                            allowedAppLogons.includes('ios_app')
                              ? 'bg-indigo-500 text-white font-black'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <Apple className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-900 dark:text-white">iOS App</span>
                            <span
                              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                                allowedAppLogons.includes('ios_app')
                                  ? 'bg-indigo-500 border-indigo-500 text-white font-black'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {allowedAppLogons.includes('ios_app') && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            iPad Table POS & Waiter Captain
                          </p>
                        </div>
                      </button>

                      {/* Windows App */}
                      <button
                        type="button"
                        onClick={() => toggleAppLogon('windows_app')}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                          allowedAppLogons.includes('windows_app')
                            ? 'bg-sky-500/10 border-sky-500/60 ring-1 ring-sky-500/30'
                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl text-xs ${
                            allowedAppLogons.includes('windows_app')
                              ? 'bg-sky-500 text-slate-950 font-black'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-900 dark:text-white">Windows App</span>
                            <span
                              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                                allowedAppLogons.includes('windows_app')
                                  ? 'bg-sky-500 border-sky-500 text-slate-950 font-black'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {allowedAppLogons.includes('windows_app') && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Cashier Desk Station POS .exe
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* App Logon Credentials Setup */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                          Client App Logon Code
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setAppLoginCode(
                              `${role === 'cashier' ? 'POS' : role === 'biller' ? 'BIL' : role === 'kitchen_staff' ? 'KDS' : role === 'delivery_rider' ? 'RID' : 'APP'}-${Math.floor(1000 + Math.random() * 9000)}`
                            )
                          }
                          className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          🎲 Generate New
                        </button>
                      </div>
                      <input
                        type="text"
                        value={appLoginCode}
                        onChange={(e) => setAppLoginCode(e.target.value)}
                        placeholder="e.g. POS-8492"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-black text-amber-600 dark:text-amber-400 outline-hidden focus:border-amber-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Used for fast login on Android/iOS/Windows native apps without email typing.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">
                        Windows Station Terminal ID
                      </label>
                      <input
                        type="text"
                        value={windowsStationId}
                        onChange={(e) => setWindowsStationId(e.target.value)}
                        placeholder="e.g. POS-WIN-01"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Locks this user to a designated Windows billing machine terminal.
                      </p>
                    </div>
                  </div>

                  {/* Operational Portals */}
                  <div>
                    <label className="block font-black text-slate-800 dark:text-white text-xs mb-2">
                      Operational Modules & Station Portals
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AVAILABLE_PORTALS.map((portal) => {
                        const isChecked = allowedPortals.includes(portal.id);
                        const IconComp = portal.icon;
                        return (
                          <button
                            key={portal.id}
                            type="button"
                            onClick={() => togglePortal(portal.id)}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                              isChecked
                                ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-xl border mt-0.5 ${
                                isChecked
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                  {portal.label}
                                </span>
                                <span
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                                    isChecked
                                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                                      : 'border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{portal.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Granular Permissions Checklist */}
              {activeFormTab === 'permissions' && (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Custom Permissions Override</div>
                      <div className="text-[11px] text-slate-500">
                        {useCustomPermissions
                          ? 'Using fine-grained custom permissions assigned to this user'
                          : `Using default permissions for "${getRoleDetails(role).label}"`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !useCustomPermissions;
                        setUseCustomPermissions(nextState);
                        if (!nextState) {
                          setCustomPermissions([...(ROLE_PERMISSIONS_MAP[role] || [])]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition-colors ${
                        useCustomPermissions
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {useCustomPermissions ? 'Custom Active' : 'Enable Custom'}
                    </button>
                  </div>

                  {useCustomPermissions && (
                    <div className="flex items-center justify-end gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomPermissions(
                            PERMISSION_GROUPS.flatMap((g) => g.permissions).map((p) => p.id)
                          )
                        }
                        className="text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Select All
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setCustomPermissions([])}
                        className="text-slate-500 hover:underline"
                      >
                        Clear All
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setCustomPermissions([...(ROLE_PERMISSIONS_MAP[role] || [])])}
                        className="text-purple-500 hover:underline"
                      >
                        Reset to Role Defaults
                      </button>
                    </div>
                  )}

                  {/* Grouped Permissions */}
                  <div className="space-y-4">
                    {PERMISSION_GROUPS.map((grp) => (
                      <div
                        key={grp.groupName}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                      >
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{grp.icon}</span>
                          <span>{grp.groupName}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {grp.permissions.map((perm) => {
                            const isChecked = useCustomPermissions
                              ? customPermissions.includes(perm.id)
                              : (ROLE_PERMISSIONS_MAP[role] || []).includes(perm.id);

                            return (
                              <label
                                key={perm.id}
                                className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={!useCustomPermissions}
                                  checked={isChecked}
                                  onChange={() => togglePermission(perm.id)}
                                  className="w-3.5 h-3.5 mt-0.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                                />
                                <div>
                                  <div className="font-bold text-xs leading-snug">{perm.label}</div>
                                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                                    {perm.desc}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeFormTab !== 'details' && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFormTab(activeFormTab === 'permissions' ? 'portals' : 'details')
                      }
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200"
                    >
                      ← Previous
                    </button>
                  )}
                  {activeFormTab !== 'permissions' && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFormTab(activeFormTab === 'details' ? 'portals' : 'permissions')
                      }
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200"
                    >
                      Next Step →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black shadow-md shadow-amber-600/30"
                  >
                    {editingUser ? 'Save Changes' : 'Create Staff Account'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESET PASSWORD / PIN WITH 1-CLICK CLIPBOARD COPY                */}
      {/* ========================================================================= */}
      {isResetCredentialsModalOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 mx-auto flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Reset Credentials for {resetTargetUser.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">{resetTargetUser.email}</p>
            </div>

            {/* Toggle Reset Type */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setResetType('password')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  resetType === 'password'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                    : 'text-slate-400'
                }`}
              >
                Reset Password
              </button>
              <button
                type="button"
                onClick={() => setResetType('pin')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  resetType === 'pin' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-400'
                }`}
              >
                Reset Touch PIN
              </button>
            </div>

            {resetType === 'password' ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  New Login Password
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full text-center font-mono font-black text-lg text-slate-900 dark:text-white bg-transparent outline-hidden"
                />
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(generateStrongPassword())}
                    className="text-xs text-slate-400 hover:text-amber-500 font-bold"
                  >
                    🎲 Regenerate
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newPasswordInput);
                      setCredentialCopied(true);
                      setTimeout(() => setCredentialCopied(false), 2000);
                    }}
                    className="text-xs text-amber-600 font-bold flex items-center gap-1"
                  >
                    {credentialCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{credentialCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  New 4-Digit Access PIN
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="w-full text-center font-mono font-black text-2xl tracking-widest text-slate-900 dark:text-white bg-transparent outline-hidden"
                />
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNewPinInput(generateRandomPin())}
                    className="text-xs text-slate-400 hover:text-amber-500 font-bold"
                  >
                    🎲 Regenerate
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newPinInput);
                      setCredentialCopied(true);
                      setTimeout(() => setCredentialCopied(false), 2000);
                    }}
                    className="text-xs text-amber-600 font-bold flex items-center gap-1"
                  >
                    {credentialCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{credentialCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetCredentialsModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetCredentials}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/30"
              >
                Save New {resetType === 'password' ? 'Password' : 'PIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION WITH ADMIN SAFETY GUARD                     */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && deleteTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Delete Staff Account?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{deleteTargetUser.name}</strong> ({deleteTargetUser.email}) from the system?
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs rounded-xl font-bold flex items-center gap-1.5 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/30"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CLIENT APP LOGON CREDENTIALS & QR (ANDROID / IOS / WINDOWS)      */}
      {/* ========================================================================= */}
      {clientAppLogonTargetUser && (
        <ClientAppLogonModal
          user={clientAppLogonTargetUser}
          isOpen={Boolean(clientAppLogonTargetUser)}
          onClose={() => setClientAppLogonTargetUser(null)}
          initialTab={clientAppLogonInitialTab}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: FRANCHISE EMPLOYEE (BILLERS, DELIVERY BOYS, CASHIERS) WITH PIN   */}
      {/* ========================================================================= */}
      <FranchiseEmployeeAddModal
        isOpen={isFranchiseEmployeeModalOpen}
        onClose={() => setIsFranchiseEmployeeModalOpen(false)}
        onEmployeeAdded={(emp) => {
          setFeedbackBanner({
            title: `Store Employee Added: ${emp.name}`,
            desc: `Role: ${emp.employeeCategory?.toUpperCase() || emp.role} • Device PIN: ${emp.devicePin || emp.pin} • Station: ${emp.deviceStationId || 'POS'} assigned successfully.`,
            type: 'employee',
          });
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 6: CORPORATE / FRANCHISE ADMIN (DEMO DEFAULT PASSWORD EMAILED)      */}
      {/* ========================================================================= */}
      <CorporateAdminCreateModal
        isOpen={isCorporateAdminModalOpen}
        onClose={() => setIsCorporateAdminModalOpen(false)}
        onCreated={(user) => {
          setFeedbackBanner({
            title: `Corporate / Franchise Admin Created: ${user.name}`,
            desc: `Demo default password generated and dispatched to ${user.email} from Corporate Organisation HQ.`,
            type: 'corporate',
          });
          setEmailDispatchTargetUser(user);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 7: CORPORATE EMAIL DISPATCH INSPECTOR & DEMO PASSWORD PREVIEW       */}
      {/* ========================================================================= */}
      {emailDispatchTargetUser && (
        <CorporateEmailDispatchModal
          isOpen={Boolean(emailDispatchTargetUser)}
          onClose={() => setEmailDispatchTargetUser(null)}
          user={emailDispatchTargetUser}
          onTestLogin={(u) => {
            switchUser(u.id);
            setEmailDispatchTargetUser(null);
            alert(`Logged in as ${u.name} (${u.role === 'super_admin' ? 'Organization Brand Admin' : 'Franchise Admin'}).`);
          }}
        />
      )}
    </div>
  );
};
