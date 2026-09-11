import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShieldCheck,
  RefreshCw,
  Search,
  Check,
  TrendingUp,
  Monitor,
  AlertCircle,
  Layers,
  ArrowRight,
  Store,
  Users,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Truck,
  ArrowLeftRight,
  Tag,
  Briefcase,
  Globe,
  DollarSign,
  Share2,
  Sliders,
  Award,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import { FranchiseGroup, InterStoreTransfer, Organization, Outlet } from '../../types';
import { formatCurrency } from '../../utils/formatters';

type ActiveTab = 'stores' | 'organizations' | 'franchises' | 'transfers' | 'hierarchy';

export const OutletManagement: React.FC = () => {
  const {
    settings,
    organizations = [],
    activeOrganizationId,
    setActiveOrganizationId,
    addOrganization,
    updateOrganization,
    outlets = [],
    activeOutletId,
    setActiveOutletId,
    updateOutlet,
    addOutlet,
    accessibleOutlets = [],
    franchiseGroups = [],
    addFranchiseGroup,
    updateFranchiseGroup,
    interStoreTransfers = [],
    createInterStoreTransfer,
    updateTransferStatus,
    isSuperAdmin,
    isFranchiseOwner,
    isBrandAdmin,
    isPlatformStaff,
    menuItems = [],
  } = useRestaurant();

  const { currentUser, allUsers, switchUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('stores');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [selectedFranchiseFilter, setSelectedFranchiseFilter] = useState<string>('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('');

  // Outlet Add/Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [formData, setFormData] = useState<Partial<Outlet>>({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    gstNumber: settings.gstNumber || '07AAAAA0000A1Z5',
    fssaiLicense: settings.fssaiLicense || '10722001000123',
    defaultTaxPercent: 5,
    terminalCount: 2,
    isActive: true,
    isMain: false,
    openingTime: '09:00 AM',
    closingTime: '11:00 PM',
    organizationId: 'org-bk',
    organizationName: 'Burger King India',
    franchiseGroupId: 'fg-bk-1',
    franchiseOwnerId: 'usr-2',
    franchiseOwnerName: 'Rohit Sharma',
    franchiseName: 'Sharma Retail & Hospitality LLP (Delhi-NCR)',
  });

  // Organization Add Modal
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [orgFormData, setOrgFormData] = useState<Omit<Organization, 'id' | 'createdAt'>>({
    name: '',
    brandCode: '',
    tagline: '',
    headquartersCity: 'Mumbai, Maharashtra',
    contactEmail: '',
    contactPhone: '+91 ',
    gstNumber: '27AABC9999Z1Z0',
    fssaiLicense: '10012000000000',
    royaltyPercentage: 5.0,
    masterMenuSync: true,
    franchiseCount: 1,
    totalOutlets: 1,
    status: 'active',
    subscriptionPlan: 'enterprise',
    primaryColor: '#D62300',
  });

  // Franchise Owner Add Modal
  const [isAddFranchiseModalOpen, setIsAddFranchiseModalOpen] = useState(false);
  const [franchiseFormData, setFranchiseFormData] = useState<Omit<FranchiseGroup, 'id' | 'joinedDate'>>({
    organizationId: 'org-bk',
    organizationName: 'Burger King India',
    name: '',
    ownerId: 'usr-2',
    ownerName: '',
    email: '',
    phone: '+91 ',
    storeIds: [],
    cities: [],
    royaltyPercentage: 5.0,
    status: 'active',
    panNumber: '',
  });
  const [franchiseCitiesInput, setFranchiseCitiesInput] = useState('');

  // Inter-Store Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFormData, setTransferFormData] = useState({
    fromStoreId: '',
    toStoreId: '',
    ingredientName: 'Whopper Sesame Buns',
    quantity: 100,
    unit: 'pcs',
    notes: '',
  });

  // Extract unique cities for city filter
  const allCities = useMemo(() => {
    const set = new Set<string>();
    outlets.forEach((o) => {
      if (o.city) {
        const cityName = o.city.split(',')[0].trim();
        set.add(cityName);
      }
    });
    return Array.from(set);
  }, [outlets]);

  // Filter outlets depending on User's hierarchy permission & active filter
  const displayedOutlets = useMemo(() => {
    // If CaféOS Super Admin or Platform Staff: Can view all
    // If Brand Admin (Burger King HQ): Only views Burger King outlets
    // If Franchise Owner: Only sees outlets assigned to their franchise group/user account
    const baseList = isSuperAdmin || isPlatformStaff ? outlets : accessibleOutlets;

    return baseList.filter((o) => {
      const matchesSearch =
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.franchiseName && o.franchiseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.organizationName && o.organizationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.franchiseOwnerName && o.franchiseOwnerName.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesBrand = true;
      if (selectedBrandFilter !== 'all') {
        matchesBrand = o.organizationId === selectedBrandFilter;
      }

      let matchesFranchise = true;
      if (selectedFranchiseFilter !== 'all') {
        matchesFranchise =
          o.franchiseGroupId === selectedFranchiseFilter ||
          o.franchiseOwnerId === selectedFranchiseFilter;
      }

      let matchesCity = true;
      if (selectedCityFilter !== 'all') {
        matchesCity = o.city.toLowerCase().includes(selectedCityFilter.toLowerCase());
      }

      return matchesSearch && matchesBrand && matchesFranchise && matchesCity;
    });
  }, [
    outlets,
    accessibleOutlets,
    isSuperAdmin,
    isPlatformStaff,
    searchQuery,
    selectedBrandFilter,
    selectedFranchiseFilter,
    selectedCityFilter,
  ]);

  // Switch active store for POS Terminal / Orders
  const handleSelectActiveOutlet = (id: string) => {
    setActiveOutletId(id);
    const selected = outlets.find((o) => o.id === id);
    if (selected) {
      setSyncStatusMessage(`Active store switched to "${selected.name}" (${selected.code})!`);
      setTimeout(() => setSyncStatusMessage(''), 3500);
    }
  };

  const handleOpenAddOutlet = () => {
    setEditingOutlet(null);
    setFormData({
      name: '',
      code: `BK-OUT-0${outlets.length + 1}`,
      address: '',
      city: 'Gurugram, Haryana',
      state: 'Haryana',
      phone: '+91 98',
      email: '',
      gstNumber: settings.gstNumber || '07AAAAA0000A1Z5',
      fssaiLicense: settings.fssaiLicense || '10722001000123',
      defaultTaxPercent: 5,
      terminalCount: 2,
      isActive: true,
      isMain: false,
      openingTime: '09:00 AM',
      closingTime: '11:00 PM',
      organizationId: 'org-bk',
      organizationName: 'Burger King India',
      franchiseGroupId: 'fg-bk-1',
      franchiseOwnerId: 'usr-2',
      franchiseOwnerName: 'Rohit Sharma',
      franchiseName: 'Sharma Retail & Hospitality LLP (Delhi-NCR)',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditOutlet = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setFormData(outlet);
    setIsAddModalOpen(true);
  };

  const handleSaveOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (editingOutlet) {
      updateOutlet(editingOutlet.id, formData as Partial<Outlet>);
      setSyncStatusMessage(`Outlet "${formData.name}" updated successfully!`);
    } else {
      const selectedOrg = organizations.find((org) => org.id === formData.organizationId);
      const selectedFranchise = franchiseGroups.find((fg) => fg.id === formData.franchiseGroupId);

      const newOutlet = addOutlet({
        name: formData.name || 'New Outlet',
        code: formData.code || `OUT-${Date.now().toString().slice(-4)}`,
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        phone: formData.phone || '',
        email: formData.email || '',
        gstNumber: formData.gstNumber || '07AAAAA0000A1Z5',
        fssaiLicense: formData.fssaiLicense || '',
        defaultTaxPercent: Number(formData.defaultTaxPercent) || 5,
        terminalCount: Number(formData.terminalCount) || 1,
        isActive: formData.isActive ?? true,
        isMain: formData.isMain ?? false,
        openingTime: formData.openingTime || '09:00 AM',
        closingTime: formData.closingTime || '11:00 PM',
        organizationId: formData.organizationId || selectedOrg?.id || 'org-bk',
        organizationName: selectedOrg?.name || formData.organizationName || 'Burger King India',
        franchiseGroupId: formData.franchiseGroupId || selectedFranchise?.id || 'fg-bk-1',
        franchiseOwnerId: selectedFranchise?.ownerId || formData.franchiseOwnerId || 'usr-2',
        franchiseOwnerName: selectedFranchise?.ownerName || formData.franchiseOwnerName || 'Rohit Sharma',
        franchiseName: selectedFranchise?.name || formData.franchiseName || 'Sharma Retail & Hospitality LLP',
        todaySales: 0,
        todayOrders: 0,
      });
      setSyncStatusMessage(`New outlet "${newOutlet.name}" added to ${newOutlet.organizationName} (${newOutlet.city})!`);
    }
    setIsAddModalOpen(false);
    setTimeout(() => setSyncStatusMessage(''), 3500);
  };

  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgFormData.name || !orgFormData.brandCode) return;
    const newOrg = addOrganization(orgFormData);
    setSyncStatusMessage(`Organization "${newOrg.name}" registered successfully with CaféOS!`);
    setIsAddOrgModalOpen(false);
    setTimeout(() => setSyncStatusMessage(''), 3500);
  };

  const handleSaveFranchise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseFormData.name || !franchiseFormData.ownerName) return;
    const citiesList = franchiseCitiesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const selectedOrg = organizations.find((o) => o.id === franchiseFormData.organizationId);

    const newGroup = addFranchiseGroup({
      ...franchiseFormData,
      organizationName: selectedOrg?.name || franchiseFormData.organizationName,
      cities: citiesList.length > 0 ? citiesList : ['New Delhi', 'Gurugram'],
      storeIds: franchiseFormData.storeIds || [],
    });

    setSyncStatusMessage(`Franchise partner "${newGroup.name}" registered under ${newGroup.organizationName}!`);
    setIsAddFranchiseModalOpen(false);
    setTimeout(() => setSyncStatusMessage(''), 3500);
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFormData.fromStoreId || !transferFormData.toStoreId) return;

    const fromStore = outlets.find((o) => o.id === transferFormData.fromStoreId);
    const toStore = outlets.find((o) => o.id === transferFormData.toStoreId);

    if (!fromStore || !toStore) return;

    const xfer = createInterStoreTransfer({
      fromStoreId: fromStore.id,
      fromStoreName: fromStore.name,
      fromCity: fromStore.city.split(',')[0],
      toStoreId: toStore.id,
      toStoreName: toStore.name,
      toCity: toStore.city.split(',')[0],
      franchiseGroupId: fromStore.franchiseGroupId || 'fg-bk-1',
      franchiseName: fromStore.franchiseName || 'Franchise Partner',
      items: [
        {
          ingredientId: `ing-${Date.now()}`,
          ingredientName: transferFormData.ingredientName,
          quantity: Number(transferFormData.quantity),
          unit: transferFormData.unit,
        },
      ],
      status: 'in_transit',
      dispatchedBy: currentUser?.name || 'Store Dispatch Manager',
      notes: transferFormData.notes || 'Inter-city highway transfer',
    });

    setSyncStatusMessage(`Transfer ${xfer.transferNumber} created: ${fromStore.name} (${xfer.fromCity}) -> ${toStore.name} (${xfer.toCity})`);
    setIsTransferModalOpen(false);
    setTimeout(() => setSyncStatusMessage(''), 4000);
  };

  const handleSyncAllOutlets = () => {
    setSyncStatusMessage(
      `Instant Multi-Store Sync Complete! Broadcasted master catalog & prices across all ${outlets.length} stores in ${organizations.length} organizations.`
    );
    setTimeout(() => setSyncStatusMessage(''), 4500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Architecture Breadcrumb Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hierarchical Multi-Tenant Architecture</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
              <span>Enterprise Brand &amp; Franchise Control</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              <strong>Architecture Hierarchy:</strong> CaféOS SaaS Owner &rarr; Client Organisation (e.g.{' '}
              <span className="text-amber-300 font-semibold">Burger King</span>,{' '}
              <span className="text-amber-300 font-semibold">Zorko</span>,{' '}
              <span className="text-amber-300 font-semibold">Mac D</span>) &rarr; Franchise Owners &rarr; Multiple stores across different cities from a <strong>single user login</strong>.
            </p>

            {/* Current Active Persona Status */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2 text-xs">
                <span className="text-slate-400">Current Login:</span>
                <strong className="text-white">{currentUser?.name}</strong>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black uppercase">
                  {currentUser?.role === 'super_admin'
                    ? '👑 SaaS Owner'
                    : currentUser?.role === 'platform_employee'
                    ? '🛡️ Portal Staff'
                    : currentUser?.role === 'brand_admin'
                    ? '🏢 Brand Corporate HQ'
                    : '🏪 Franchise Owner'}
                </span>
              </div>

              {currentUser?.organizationName && (
                <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{currentUser.organizationName}</span>
                </div>
              )}

              {currentUser?.franchiseName && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentUser.franchiseName} ({accessibleOutlets.length} Stores Managed)</span>
                </div>
              )}
            </div>
          </div>

          {/* Persona Switcher Box */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0 lg:max-w-md w-full">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
              <Users className="w-3 h-3" />
              <span>Test Specific Scenarios (Instant Switch):</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const sa = allUsers.find((u) => u.role === 'super_admin');
                  if (sa) switchUser(sa.id);
                }}
                className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.role === 'super_admin'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                title="CaféOS SaaS Owner: Full system authority"
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="truncate">CaféOS Owner</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5 truncate">Adnan Khan (All Brands)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const emp = allUsers.find((u) => u.id === 'usr-emp-1' || u.role === 'platform_employee');
                  if (emp) switchUser(emp.id);
                }}
                className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.role === 'platform_employee'
                    ? 'bg-sky-500 text-white shadow-md ring-2 ring-sky-300'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                title="CaféOS Employee: Portal Operations & Support"
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="truncate">Portal Employee</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5 truncate">Priya Verma (Operations)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const bk = allUsers.find((u) => u.id === 'usr-bk-hq' || u.role === 'brand_admin');
                  if (bk) switchUser(bk.id);
                }}
                className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.role === 'brand_admin'
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                title="Burger King Corporate Brand HQ Admin"
              >
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate">Burger King Brand HQ</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5 truncate">Siddharth Rao (6 Stores)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const rohit = allUsers.find((u) => u.id === 'usr-2' || u.name.includes('Rohit'));
                  if (rohit) switchUser(rohit.id);
                }}
                className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.id === 'usr-2' || (currentUser?.isFranchiseOwner && currentUser?.name.includes('Rohit'))
                    ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                title="Burger King Franchise Owner: 3 stores in Gurugram, Delhi, Noida"
              >
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span className="truncate">BK Franchisee: Rohit</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5 truncate">3 Stores in 3 Cities (NCR)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const meera = allUsers.find((u) => u.id === 'usr-franchise-2' || u.name.includes('Meera'));
                  if (meera) switchUser(meera.id);
                }}
                className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.id === 'usr-franchise-2' || (currentUser?.isFranchiseOwner && currentUser?.name.includes('Meera'))
                    ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                title="Burger King Franchise Owner: 3 stores in Mumbai, Bangalore, Pune"
              >
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span className="truncate">BK Franchisee: Meera</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5 truncate">Mumbai, BLR &amp; Pune</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const anand = allUsers.find((u) => u.id === 'usr-anand' || u.name.includes('Anand'));
                  if (anand) switchUser(anand.id);
                }}
                className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.id === 'usr-anand' || (currentUser?.isFranchiseOwner && currentUser?.name.includes('Anand'))
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                title="Zorko Franchise Owner: 2 stores in Ahmedabad & Surat"
              >
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span className="truncate">Zorko Franchisee: Anand</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5 truncate">Ahmedabad &amp; Surat</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{syncStatusMessage}</span>
        </div>
      )}

      {/* 2. Top Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'stores'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Stores &amp; Outlets ({outlets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('organizations')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'organizations'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Organisations / Brands ({organizations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('franchises')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'franchises'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Franchise Owners ({franchiseGroups.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Inter-Store Transfers ({interStoreTransfers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hierarchy')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'hierarchy'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Architecture Blueprint</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncAllOutlets}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Broadcast catalog changes instantly across all stores"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
            <span>Sync All</span>
          </button>

          {activeTab === 'stores' && (
            <button
              type="button"
              onClick={handleOpenAddOutlet}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-600/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Outlet</span>
            </button>
          )}

          {activeTab === 'organizations' && (
            <button
              type="button"
              onClick={() => setIsAddOrgModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Brand</span>
            </button>
          )}

          {activeTab === 'franchises' && (
            <button
              type="button"
              onClick={() => setIsAddFranchiseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Franchise Owner</span>
            </button>
          )}

          {activeTab === 'transfers' && (
            <button
              type="button"
              onClick={() => {
                const firstStore = displayedOutlets[0]?.id || outlets[0]?.id || '';
                const secondStore = displayedOutlets[1]?.id || outlets[1]?.id || '';
                setTransferFormData({
                  fromStoreId: firstStore,
                  toStoreId: secondStore,
                  ingredientName: 'Whopper Sesame Buns',
                  quantity: 150,
                  unit: 'pcs',
                  notes: 'Peak evening inventory rebalance',
                });
                setIsTransferModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-600/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Inter-Store Transfer</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* ------------------------------------------------------------- */}
      {/* TAB: STORES & OUTLETS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'stores' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stores by city, branch name, code, franchise..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Brand Filter */}
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Brands / Organisations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.brandCode})
                  </option>
                ))}
              </select>

              {/* City Filter */}
              <select
                value={selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Cities</option>
                {allCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{displayedOutlets.length}</strong> of <strong>{outlets.length}</strong> Outlets
            </div>
          </div>

          {/* Outlets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedOutlets.map((outlet) => {
              const isActive = outlet.id === activeOutletId;
              const isAssignedToUser =
                currentUser?.assignedStoreIds?.includes(outlet.id) ||
                outlet.franchiseOwnerId === currentUser?.id ||
                currentUser?.role === 'super_admin' ||
                currentUser?.role === 'platform_employee';

              return (
                <div
                  key={outlet.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all relative flex flex-col justify-between ${
                    isActive
                      ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                        {outlet.code}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {outlet.organizationName && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {outlet.organizationName}
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Active POS</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                      {outlet.name}
                    </h4>

                    {/* Franchise Group & City Info */}
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {outlet.city}
                        </span>
                      </div>

                      {outlet.franchiseName && (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">
                            Franchisee: <strong>{outlet.franchiseName}</strong>
                          </span>
                        </div>
                      )}

                      {outlet.franchiseOwnerName && (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Owner: {outlet.franchiseOwnerName}</span>
                        </div>
                      )}
                    </div>

                    {/* Store Metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Today's Revenue
                        </span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {formatCurrency(outlet.todaySales || 0)}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Orders / Terminals
                        </span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {outlet.todayOrders || 0} / {outlet.terminalCount || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditOutlet(outlet)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {isActive ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <BadgeCheck className="w-4 h-4" />
                        <span>Current Active Outlet</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectActiveOutlet(outlet.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Switch POS Here</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: ORGANISATIONS / BRANDS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'organizations' && (
        <div className="space-y-5">
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                  Client Organisations &amp; Enterprise Brands
                </h4>
                <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-0.5">
                  Each brand (e.g. Burger King, Zorko, Mac D) is an isolated tenant with its own master menus, franchise contracts, and corporate royalties.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOrgModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition-all cursor-pointer"
            >
              + Register New Brand
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {organizations.map((org) => {
              const brandOutlets = outlets.filter((o) => o.organizationId === org.id);
              const brandFranchises = franchiseGroups.filter((f) => f.organizationId === org.id);

              return (
                <div
                  key={org.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                          CODE: {org.brandCode}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
                          {org.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">
                          "{org.tagline || 'Enterprise Restaurant Network'}"
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {org.subscriptionPlan}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Headquarters City:</span>
                        <strong>{org.headquartersCity}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Brand Royalty:</span>
                        <strong className="text-amber-600 dark:text-amber-400">{org.royaltyPercentage}%</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Master Menu Sync:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {org.masterMenuSync ? 'Enabled (Auto Broadcast)' : 'Disabled'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Contact Email:</span>
                        <span className="truncate">{org.contactEmail}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Franchise Owners
                        </span>
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                          {brandFranchises.length} Partners
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Total Stores
                        </span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {brandOutlets.length} Stores
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBrandFilter(org.id);
                        setActiveTab('stores');
                      }}
                      className="w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>View All {org.name} Stores ({brandOutlets.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: FRANCHISE OWNERS (MULTI-CITY STORES) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'franchises' && (
        <div className="space-y-5">
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Franchise Owners with Multi-City Stores
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Demonstrates your exact scenario: One Franchise Owner (e.g. Rohit Sharma or Meera Singhania under Burger King) manages stores across multiple cities with a single login.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddFranchiseModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-all cursor-pointer"
            >
              + Add Franchise Owner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {franchiseGroups.map((fg) => {
              const ownedOutlets = outlets.filter(
                (o) => fg.storeIds.includes(o.id) || o.franchiseGroupId === fg.id
              );

              return (
                <div
                  key={fg.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 uppercase">
                          Brand: {fg.organizationName}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                          {fg.name}
                        </h3>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {fg.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Franchise Owner:</span>
                        <strong>{fg.ownerName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email &amp; Phone:</span>
                        <span>{fg.email} | {fg.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Royalty to Brand:</span>
                        <strong className="text-amber-600 dark:text-amber-400">{fg.royaltyPercentage}%</strong>
                      </div>
                      {fg.contractEndDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Contract End Date:</span>
                          <span>{fg.contractEndDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Cities of Operation */}
                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Cities of Operation:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {fg.cities.map((city) => (
                          <span
                            key={city}
                            className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          >
                            📍 {city}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Assigned Stores */}
                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                        Stores Managed ({ownedOutlets.length}):
                      </span>
                      <div className="space-y-1.5">
                        {ownedOutlets.map((st) => (
                          <div
                            key={st.id}
                            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-slate-800 dark:text-slate-200">
                                {st.name}
                              </strong>
                              <span className="text-slate-400 ml-2">({st.city})</span>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(st.todaySales || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const user = allUsers.find((u) => u.id === fg.ownerId);
                        if (user) switchUser(user.id);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Login as {fg.ownerName}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: INTER-STORE TRANSFERS ACROSS CITIES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'transfers' && (
        <div className="space-y-5">
          <div className="bg-sky-50 dark:bg-sky-950/30 p-4 rounded-2xl border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-sky-950 dark:text-sky-200">
                  Inter-Store Inventory Transfers Across Cities
                </h4>
                <p className="text-xs text-sky-800 dark:text-sky-300 mt-0.5">
                  Franchise owners managing stores in multiple cities can balance stock (e.g., dispatch sesame buns from Gurugram to Connaught Place or Mumbai to Pune).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const firstStore = displayedOutlets[0]?.id || outlets[0]?.id || '';
                const secondStore = displayedOutlets[1]?.id || outlets[1]?.id || '';
                setTransferFormData({
                  fromStoreId: firstStore,
                  toStoreId: secondStore,
                  ingredientName: 'Whopper Sesame Buns',
                  quantity: 150,
                  unit: 'pcs',
                  notes: 'Evening rush rebalance',
                });
                setIsTransferModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shrink-0 transition-all cursor-pointer"
            >
              + New Stock Transfer
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Transfer #</th>
                    <th className="p-3.5">Origin Store &amp; City</th>
                    <th className="p-3.5">Destination Store &amp; City</th>
                    <th className="p-3.5">Items Transferred</th>
                    <th className="p-3.5">Franchise Group</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {interStoreTransfers.map((xfer) => (
                    <tr key={xfer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {xfer.transferNumber}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {new Date(xfer.transferDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <strong className="text-slate-800 dark:text-slate-200 block">
                          {xfer.fromStoreName}
                        </strong>
                        <span className="text-[11px] text-rose-500 font-semibold">
                          📍 {xfer.fromCity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <strong className="text-slate-800 dark:text-slate-200 block">
                          {xfer.toStoreName}
                        </strong>
                        <span className="text-[11px] text-emerald-500 font-semibold">
                          📍 {xfer.toCity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          {xfer.items.map((item, idx) => (
                            <div key={idx} className="text-slate-700 dark:text-slate-300">
                              • <strong>{item.quantity} {item.unit}</strong> {item.ingredientName}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-600 dark:text-slate-400">
                          {xfer.franchiseName}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            xfer.status === 'received'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : xfer.status === 'in_transit'
                              ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 animate-pulse'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {xfer.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {xfer.status === 'in_transit' ? (
                          <button
                            type="button"
                            onClick={() => {
                              updateTransferStatus(xfer.id, 'received', currentUser?.name);
                              setSyncStatusMessage(`Transfer ${xfer.transferNumber} marked as received at destination store!`);
                              setTimeout(() => setSyncStatusMessage(''), 3000);
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Confirm Receipt
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Completed</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: ARCHITECTURE BLUEPRINT & EXPLAINER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'hierarchy' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Multi-Tenant &amp; Multi-Franchise Architecture Blueprint
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Complete breakdown of how CaféOS models Organizations, Franchise Owners, and Multi-City Stores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Level 1 */}
            <div className="p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  Level 1: Platform SaaS
                </span>
                <h4 className="text-base font-bold mt-1">CaféOS Owner &amp; Employees</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  You (the CaféOS SaaS Owner) and your portal employees. Controls multi-tenant billing, tenant provisioning, system health, and cross-organization audits.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300">
                👤 <strong>Adnan Khan</strong> (Owner)<br />
                👤 <strong>Priya Verma</strong> (Portal Ops)
              </div>
            </div>

            {/* Level 2 */}
            <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Level 2: Organisations
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Brands (Burger King, Zorko, Mac D)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Corporate Brand HQ. Manages master catalog synchronization, nationwide recipes, and brand royalty collections across all franchisees.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-800 text-[11px] text-slate-600 dark:text-slate-300">
                🏢 <strong>Burger King India</strong> (BK)<br />
                🏢 <strong>Zorko Brand Global</strong> (ZRK)<br />
                🏢 <strong>McDonald's India</strong> (MCD)
              </div>
            </div>

            {/* Level 3 */}
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                  Level 3: Franchise Partners
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Franchise Owners
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Franchise partners owning the legal operating entity. A single user login allows the franchise owner to switch and control all their outlets.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800 text-[11px] text-slate-600 dark:text-slate-300">
                🤝 <strong>Rohit Sharma</strong> (Sharma LLP)<br />
                🤝 <strong>Meera Singhania</strong> (Singhania Foods)<br />
                🤝 <strong>Anand Patel</strong> (Patel QuickBites)
              </div>
            </div>

            {/* Level 4 */}
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  Level 4: Store Outlets
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Multi-City Stores
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Individual physical outlets situated in various cities. Includes local tax rates, POS terminals, and inter-store inventory transfer capabilities.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800 text-[11px] text-slate-600 dark:text-slate-300">
                📍 <strong>Gurugram, New Delhi, Noida</strong><br />
                📍 <strong>Mumbai, Bangalore, Pune</strong><br />
                📍 <strong>Ahmedabad, Surat, Jaipur</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT OUTLET */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" />
              <span>{editingOutlet ? 'Edit Store Details' : 'Register New Store / Outlet'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add a new store and assign it to an Organisation (e.g. Burger King) and a Franchise Owner.
            </p>

            <form onSubmit={handleSaveOutlet} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Store / Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Burger King - DLF CyberHub"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Store Code (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. BK-GUR-01"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>

              {/* Organisation & Franchise Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Parent Brand / Organisation *
                  </label>
                  <select
                    value={formData.organizationId || 'org-bk'}
                    onChange={(e) => {
                      const selected = organizations.find((o) => o.id === e.target.value);
                      setFormData({
                        ...formData,
                        organizationId: e.target.value,
                        organizationName: selected?.name,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.brandCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Franchise Owner *
                  </label>
                  <select
                    value={formData.franchiseGroupId || 'fg-bk-1'}
                    onChange={(e) => {
                      const selected = franchiseGroups.find((f) => f.id === e.target.value);
                      setFormData({
                        ...formData,
                        franchiseGroupId: e.target.value,
                        franchiseName: selected?.name,
                        franchiseOwnerId: selected?.ownerId,
                        franchiseOwnerName: selected?.ownerName,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {franchiseGroups.map((fg) => (
                      <option key={fg.id} value={fg.id}>
                        {fg.name} ({fg.ownerName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* City & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    City &amp; State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Gurugram, Haryana"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    POS Touch Terminals Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.terminalCount || 2}
                    onChange={(e) => setFormData({ ...formData, terminalCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Shop 14, Food Court, DLF CyberHub"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber || ''}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="e.g. 06AAAAA0000A1Z5"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    FSSAI License No.
                  </label>
                  <input
                    type="text"
                    value={formData.fssaiLicense || ''}
                    onChange={(e) => setFormData({ ...formData, fssaiLicense: e.target.value })}
                    placeholder="e.g. 10822001000123"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {editingOutlet ? 'Save Changes' : 'Register Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REGISTER NEW ORGANISATION */}
      {/* ------------------------------------------------------------- */}
      {isAddOrgModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <span>Register New Client Organisation (Brand HQ)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add a new enterprise restaurant brand (e.g. Subway, Taco Bell, Haldiram's).
            </p>

            <form onSubmit={handleSaveOrganization} className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Brand / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={orgFormData.name}
                  onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                  placeholder="e.g. Burger King India"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Brand Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgFormData.brandCode}
                    onChange={(e) => setOrgFormData({ ...orgFormData, brandCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. BK"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Royalty % *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={orgFormData.royaltyPercentage}
                    onChange={(e) => setOrgFormData({ ...orgFormData, royaltyPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Headquarters City
                </label>
                <input
                  type="text"
                  value={orgFormData.headquartersCity}
                  onChange={(e) => setOrgFormData({ ...orgFormData, headquartersCity: e.target.value })}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Corporate Contact Email
                </label>
                <input
                  type="email"
                  value={orgFormData.contactEmail}
                  onChange={(e) => setOrgFormData({ ...orgFormData, contactEmail: e.target.value })}
                  placeholder="e.g. corporate@burgerking.in"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOrgModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REGISTER NEW FRANCHISE OWNER */}
      {/* ------------------------------------------------------------- */}
      {isAddFranchiseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" />
              <span>Register Franchise Partner (Multi-Store Owner)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add a franchise partner who can own and manage multiple stores in different cities under a brand.
            </p>

            <form onSubmit={handleSaveFranchise} className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Brand / Organisation *
                </label>
                <select
                  value={franchiseFormData.organizationId}
                  onChange={(e) => {
                    const sel = organizations.find((o) => o.id === e.target.value);
                    setFranchiseFormData({
                      ...franchiseFormData,
                      organizationId: e.target.value,
                      organizationName: sel?.name || '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.brandCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Franchise Legal Entity / Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={franchiseFormData.name}
                  onChange={(e) => setFranchiseFormData({ ...franchiseFormData, name: e.target.value })}
                  placeholder="e.g. Sharma Retail & Hospitality LLP"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={franchiseFormData.ownerName}
                    onChange={(e) => setFranchiseFormData({ ...franchiseFormData, ownerName: e.target.value })}
                    placeholder="e.g. Rohit Sharma"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Royalty %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={franchiseFormData.royaltyPercentage}
                    onChange={(e) => setFranchiseFormData({ ...franchiseFormData, royaltyPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Operating Cities (Comma separated) *
                </label>
                <input
                  type="text"
                  required
                  value={franchiseCitiesInput}
                  onChange={(e) => setFranchiseCitiesInput(e.target.value)}
                  placeholder="e.g. Gurugram, New Delhi, Noida"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Enables this franchise partner to open and manage stores across all these cities.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={franchiseFormData.email}
                    onChange={(e) => setFranchiseFormData({ ...franchiseFormData, email: e.target.value })}
                    placeholder="e.g. partner@franchise.in"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={franchiseFormData.phone}
                    onChange={(e) => setFranchiseFormData({ ...franchiseFormData, phone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddFranchiseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: INTER-STORE TRANSFER */}
      {/* ------------------------------------------------------------- */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-500" />
              <span>Create Inter-Store Stock Transfer</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dispatch stock between stores owned by the franchise in different cities.
            </p>

            <form onSubmit={handleCreateTransfer} className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Source Store (Origin) *
                </label>
                <select
                  required
                  value={transferFormData.fromStoreId}
                  onChange={(e) => setTransferFormData({ ...transferFormData, fromStoreId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">Select Origin Store</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Destination Store *
                </label>
                <select
                  required
                  value={transferFormData.toStoreId}
                  onChange={(e) => setTransferFormData({ ...transferFormData, toStoreId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">Select Destination Store</option>
                  {outlets
                    .filter((o) => o.id !== transferFormData.fromStoreId)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.city})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Item / Ingredient *
                  </label>
                  <input
                    type="text"
                    required
                    value={transferFormData.ingredientName}
                    onChange={(e) => setTransferFormData({ ...transferFormData, ingredientName: e.target.value })}
                    placeholder="e.g. Whopper Buns"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Quantity &amp; Unit *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      required
                      min={1}
                      value={transferFormData.quantity}
                      onChange={(e) => setTransferFormData({ ...transferFormData, quantity: Number(e.target.value) })}
                      className="w-2/3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                    />
                    <select
                      value={transferFormData.unit}
                      onChange={(e) => setTransferFormData({ ...transferFormData, unit: e.target.value })}
                      className="w-1/3 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="box">box</option>
                      <option value="liters">liters</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Transit / Dispatch Notes
                </label>
                <input
                  type="text"
                  value={transferFormData.notes}
                  onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                  placeholder="e.g. Dispatched via highway delivery van"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                >
                  Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
