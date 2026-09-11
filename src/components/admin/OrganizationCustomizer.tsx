import React, { useState, useRef } from 'react';
import {
  Building2,
  Sparkles,
  Plus,
  Edit2,
  Check,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Palette,
  Store,
  Tag,
  Percent,
  Download,
  Terminal,
  Monitor,
  PackageCheck,
  ExternalLink,
  Trash2,
  Copy,
  Receipt,
  FileText,
  MapPin,
  Phone,
  Mail,
  Shield,
  Clock,
  Layers,
  Award,
  Zap,
  Sliders,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useWindowsPWAInstall } from '../../hooks/useWindowsPWAInstall';
import { Coupon, DiscountType, FranchiseGroup, Organization, Outlet } from '../../types';
import { formatCurrency } from '../../utils/formatters';

// Brand Presets for 1-click transformation
const BRAND_PRESETS = [
  {
    id: 'org-zorko',
    name: 'ZORKO Brand Global',
    brandCode: 'ZRK',
    tagline: 'Zorko - Brand of Foodies | Fresh Brews, Pizza & Fries',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
    primaryColor: '#F59E0B',
    accentColor: '#10B981',
    headquartersCity: 'Ahmedabad, Gujarat',
    contactEmail: 'partner@zorko.in',
    contactPhone: '+91 79 4000 8900',
    gstNumber: '24AABCZ5678G1Z2',
    fssaiLicense: '10016021000002',
    royaltyPercentage: 4.5,
    customReceiptHeader: '*** WELCOME TO ZORKO - BRAND OF FOODIES ***',
    customReceiptFooter: 'Visit zorko.in | Tag us on Instagram @zorkofoodies',
    poweredByText: 'Powered by CafeOS Enterprise',
  },
  {
    id: 'org-bk',
    name: 'Burger King India',
    brandCode: 'BK',
    tagline: 'Taste Is King — Master Franchise Network',
    logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=160&auto=format&fit=crop&q=80',
    primaryColor: '#D62300',
    accentColor: '#F59E0B',
    headquartersCity: 'Mumbai, Maharashtra',
    contactEmail: 'corporate@burgerking.in',
    contactPhone: '+91 22 6123 4567',
    gstNumber: '27AABCB1234F1Z8',
    fssaiLicense: '10014022000001',
    royaltyPercentage: 5.0,
    customReceiptHeader: '*** TASTE IS KING - BURGER KING INDIA ***',
    customReceiptFooter: 'Thank you for dining with King! Have it your way.',
    poweredByText: 'Powered by CafeOS Enterprise',
  },
  {
    id: 'org-mcd',
    name: "McDonald's India",
    brandCode: 'MCD',
    tagline: "I'm Lovin' It — Northern & Western Enterprise",
    logo: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=160&auto=format&fit=crop&q=80',
    primaryColor: '#E11D48',
    accentColor: '#FACC15',
    headquartersCity: 'New Delhi, Delhi',
    contactEmail: 'franchise@mcdonaldsindia.in',
    contactPhone: '+91 11 4321 0987',
    gstNumber: '07AABCM9012H1Z5',
    fssaiLicense: '10012011000003',
    royaltyPercentage: 5.5,
    customReceiptHeader: "*** McDONALD'S INDIA - I'M LOVIN' IT ***",
    customReceiptFooter: 'Download the McDonald\'s app for rewards and surprises!',
    poweredByText: 'Powered by CafeOS Enterprise',
  },
  {
    id: 'org-chai',
    name: 'Chai Point Roastery',
    brandCode: 'CP',
    tagline: 'India Runs On Chai — Fresh Brews & Snacks',
    logo: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=160&auto=format&fit=crop&q=80',
    primaryColor: '#0D9488',
    accentColor: '#F59E0B',
    headquartersCity: 'Bengaluru, Karnataka',
    contactEmail: 'corporate@chaipoint.in',
    contactPhone: '+91 80 4912 3456',
    gstNumber: '29AABCC3456K1Z9',
    fssaiLicense: '10018043000007',
    royaltyPercentage: 4.0,
    customReceiptHeader: '*** CHAI POINT - FRESH GOURMET BREWS ***',
    customReceiptFooter: 'Sip fresh, stay energised! Order online at chaipoint.in',
    poweredByText: 'Powered by CafeOS Enterprise',
  },
];

const COLOR_PALETTES = [
  { name: 'Zorko Gold / Amber', primary: '#F59E0B', accent: '#10B981' },
  { name: 'Burger King Crimson', primary: '#D62300', accent: '#F59E0B' },
  { name: 'McDonald\'s Red & Yellow', primary: '#E11D48', accent: '#FACC15' },
  { name: 'Chai Point Emerald', primary: '#0D9488', accent: '#F59E0B' },
  { name: 'Sapphire Royal Blue', primary: '#2563EB', accent: '#38BDF8' },
  { name: 'Deep Purple / Violet', primary: '#7C3AED', accent: '#F43F5E' },
  { name: 'Obsidian & Gold', primary: '#1E293B', accent: '#EAB308' },
];

export const OrganizationCustomizer: React.FC = () => {
  const {
    organizations,
    activeOrganizationId,
    activeOrganization,
    setActiveOrganizationId,
    updateOrganization,
    addOrganization,
    franchiseGroups,
    addFranchiseGroup,
    outlets,
    addOutlet,
    coupons,
    addCoupon,
    deleteCoupon,
    toggleCouponStatus,
    settings,
  } = useRestaurant();

  const {
    isInstalled,
    promptInstall,
    downloadCashierLauncherBatch,
    downloadCashierShortcutScript,
    downloadStockistLauncherBatch,
    downloadStockistShortcutScript,
  } = useWindowsPWAInstall();

  const [activeTab, setActiveTab] = useState<'branding' | 'franchises' | 'outlets' | 'offers' | 'windows_apps'>('branding');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Active Organization
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: activeOrganization?.name || 'ZORKO Brand Global',
    brandCode: activeOrganization?.brandCode || 'ZRK',
    tagline: activeOrganization?.tagline || 'Zorko - Brand of Foodies | Fresh Brews, Pizza & Fries',
    logo: activeOrganization?.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
    primaryColor: activeOrganization?.primaryColor || '#F59E0B',
    accentColor: activeOrganization?.accentColor || '#10B981',
    headquartersCity: activeOrganization?.headquartersCity || 'Ahmedabad, Gujarat',
    contactEmail: activeOrganization?.contactEmail || 'partner@zorko.in',
    contactPhone: activeOrganization?.contactPhone || '+91 79 4000 8900',
    gstNumber: activeOrganization?.gstNumber || '24AABCZ5678G1Z2',
    fssaiLicense: activeOrganization?.fssaiLicense || '10016021000002',
    royaltyPercentage: activeOrganization?.royaltyPercentage || 4.5,
    customReceiptHeader: activeOrganization?.customReceiptHeader || '*** WELCOME TO ZORKO - BRAND OF FOODIES ***',
    customReceiptFooter: activeOrganization?.customReceiptFooter || 'Visit zorko.in | Tag us on Instagram @zorkofoodies',
    poweredByText: activeOrganization?.poweredByText || 'Powered by CafeOS Enterprise',
  });

  // Sync form when activeOrganization changes
  React.useEffect(() => {
    if (activeOrganization) {
      setFormData({
        name: activeOrganization.name,
        brandCode: activeOrganization.brandCode,
        tagline: activeOrganization.tagline || '',
        logo: activeOrganization.logo || '',
        primaryColor: activeOrganization.primaryColor || '#F59E0B',
        accentColor: activeOrganization.accentColor || '#10B981',
        headquartersCity: activeOrganization.headquartersCity,
        contactEmail: activeOrganization.contactEmail,
        contactPhone: activeOrganization.contactPhone,
        gstNumber: activeOrganization.gstNumber,
        fssaiLicense: activeOrganization.fssaiLicense,
        royaltyPercentage: activeOrganization.royaltyPercentage,
        customReceiptHeader: activeOrganization.customReceiptHeader || `*** WELCOME TO ${activeOrganization.name.toUpperCase()} ***`,
        customReceiptFooter: activeOrganization.customReceiptFooter || 'Thank you for visiting! Have a wonderful day.',
        poweredByText: activeOrganization.poweredByText || 'Powered by CafeOS Enterprise',
      });
    }
  }, [activeOrganization?.id]);

  // Handle Logo Upload from Local Device
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (under 3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('Logo file size must be under 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({ ...prev, logo: dataUrl }));
      showToast('Logo uploaded successfully! Click Save to apply.');
    };
    reader.readAsDataURL(file);
  };

  const showToast = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Save Brand Updates
  const handleSaveOrganization = () => {
    if (!formData.name) {
      alert('Organization name cannot be empty');
      return;
    }
    updateOrganization(activeOrganization.id, formData);
    showToast(`Brand customized! "${formData.name}" is now active with "Powered by CafeOS".`);
  };

  // Switch to or Load a Preset
  const handleApplyPreset = (preset: (typeof BRAND_PRESETS)[0]) => {
    // Check if preset already exists in organizations
    const existing = organizations.find((o) => o.id === preset.id || o.name.toLowerCase() === preset.name.toLowerCase());
    if (existing) {
      setActiveOrganizationId(existing.id);
      showToast(`Switched active organization to ${preset.name}!`);
    } else {
      const newOrg = addOrganization({
        name: preset.name,
        brandCode: preset.brandCode,
        tagline: preset.tagline,
        logo: preset.logo,
        headquartersCity: preset.headquartersCity,
        contactEmail: preset.contactEmail,
        contactPhone: preset.contactPhone,
        gstNumber: preset.gstNumber,
        fssaiLicense: preset.fssaiLicense,
        royaltyPercentage: preset.royaltyPercentage,
        masterMenuSync: true,
        franchiseCount: 1,
        totalOutlets: 1,
        status: 'active',
        subscriptionPlan: 'enterprise',
        primaryColor: preset.primaryColor,
        accentColor: preset.accentColor,
        customReceiptHeader: preset.customReceiptHeader,
        customReceiptFooter: preset.customReceiptFooter,
        poweredByText: preset.poweredByText,
      });
      setActiveOrganizationId(newOrg.id);
      showToast(`Created & transformed software into ${preset.name}!`);
    }
  };

  // Create brand new custom organization
  const handleCreateCustomOrg = () => {
    const customName = prompt('Enter your Restaurant/Brand Name:', 'My Gourmet Cafe');
    if (!customName) return;

    const brandCode = prompt('Enter 2-3 letter Brand Code:', 'MGC') || 'MGC';
    const newOrg = addOrganization({
      name: customName,
      brandCode: brandCode.toUpperCase(),
      tagline: 'Artisan Flavours, Handcrafted Daily',
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
      headquartersCity: 'Mumbai, Maharashtra',
      contactEmail: 'contact@brand.com',
      contactPhone: '+91 98000 12345',
      gstNumber: '27ABCDE1234F1Z5',
      fssaiLicense: '10020000000000',
      royaltyPercentage: 5.0,
      masterMenuSync: true,
      franchiseCount: 1,
      totalOutlets: 1,
      status: 'active',
      subscriptionPlan: 'growth',
      primaryColor: '#059669',
      accentColor: '#F59E0B',
      customReceiptHeader: `*** WELCOME TO ${customName.toUpperCase()} ***`,
      customReceiptFooter: 'Thank you for your visit! Follow us online.',
      poweredByText: 'Powered by CafeOS',
    });
    setActiveOrganizationId(newOrg.id);
    showToast(`Created new organization "${customName}"!`);
  };

  // Add Franchise Modal / Form state
  const [isAddFranchiseOpen, setIsAddFranchiseOpen] = useState(false);
  const [franchiseForm, setFranchiseForm] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    cities: '',
    royaltyPercentage: activeOrganization?.royaltyPercentage || 4.5,
    panNumber: '',
  });

  const handleCreateFranchise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseForm.name || !franchiseForm.ownerName) {
      alert('Please provide Franchise Name and Owner Name');
      return;
    }

    addFranchiseGroup({
      organizationId: activeOrganization.id,
      organizationName: activeOrganization.name,
      name: franchiseForm.name,
      ownerId: `usr-${Date.now().toString(36)}`,
      ownerName: franchiseForm.ownerName,
      email: franchiseForm.email || 'franchise@partner.in',
      phone: franchiseForm.phone || '+91 98000 00000',
      storeIds: [],
      cities: franchiseForm.cities ? franchiseForm.cities.split(',').map((c) => c.trim()) : ['Main City'],
      royaltyPercentage: Number(franchiseForm.royaltyPercentage) || 4.5,
      status: 'active',
      contractEndDate: '2028-12-31',
      panNumber: franchiseForm.panNumber || 'AAACF1234F',
    });

    setIsAddFranchiseOpen(false);
    setFranchiseForm({
      name: '',
      ownerName: '',
      email: '',
      phone: '',
      cities: '',
      royaltyPercentage: 4.5,
      panNumber: '',
    });
    showToast(`Franchise "${franchiseForm.name}" created under ${activeOrganization.name}!`);
  };

  // Add Outlet Modal / Form state
  const [isAddOutletOpen, setIsAddOutletOpen] = useState(false);
  const [outletForm, setOutletForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    franchiseGroupId: '',
  });

  const handleCreateOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletForm.name) {
      alert('Please provide Outlet Name');
      return;
    }

    const selectedFranchise = franchiseGroups.find((fg) => fg.id === outletForm.franchiseGroupId);

    addOutlet({
      name: outletForm.name,
      code: outletForm.code || `${activeOrganization.brandCode}-${Date.now().toString(36).slice(-3).toUpperCase()}`,
      address: outletForm.address || 'Commercial Hub, Main Road',
      city: outletForm.city || activeOrganization.headquartersCity || 'Metro',
      state: outletForm.state || 'State',
      phone: outletForm.phone || activeOrganization.contactPhone,
      email: outletForm.email || activeOrganization.contactEmail,
      gstNumber: activeOrganization.gstNumber || '27AAAAA0000A1Z5',
      fssaiLicense: activeOrganization.fssaiLicense || '10000000000000',
      defaultTaxPercent: 5,
      terminalCount: 2,
      isActive: true,
      isMain: false,
      openingTime: '09:00 AM',
      closingTime: '11:00 PM',
      organizationId: activeOrganization.id,
      organizationName: activeOrganization.name,
      franchiseGroupId: selectedFranchise?.id,
      franchiseOwnerId: selectedFranchise?.ownerId,
      franchiseOwnerName: selectedFranchise?.ownerName,
      franchiseName: selectedFranchise?.name,
    });

    setIsAddOutletOpen(false);
    setOutletForm({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      email: '',
      franchiseGroupId: '',
    });
    showToast(`New branch "${outletForm.name}" added to ${activeOrganization.name}!`);
  };

  // Add Offer / Promo Code State
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage' as DiscountType,
    discountValue: 20,
    minOrderValue: 299,
    maxDiscountCap: 100,
    isAutoApply: false,
  });

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.code || !offerForm.title) {
      alert('Please provide Offer Code and Title');
      return;
    }

    addCoupon({
      code: offerForm.code.toUpperCase().trim(),
      title: offerForm.title,
      description: offerForm.description || `Special promotion for ${activeOrganization.name}`,
      discountType: offerForm.discountType,
      discountValue: Number(offerForm.discountValue) || 10,
      minOrderValue: Number(offerForm.minOrderValue) || 0,
      maxDiscountCap: Number(offerForm.maxDiscountCap) || 100,
      applicableCategoryIds: [],
      applicableMenuItemIds: [],
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      usageLimitPerCustomer: 5,
      usageLimitTotal: 1000,
    });

    setIsAddOfferOpen(false);
    setOfferForm({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 20,
      minOrderValue: 299,
      maxDiscountCap: 100,
      isAutoApply: false,
    });
    showToast(`Offer "${offerForm.code.toUpperCase()}" is now live across all POS billing registers!`);
  };

  // Filter franchises and outlets belonging to active organization
  const orgFranchises = franchiseGroups.filter((fg) => fg.organizationId === activeOrganization.id);
  const orgOutlets = outlets.filter((o) => o.organizationId === activeOrganization.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. TOP EXECUTIVE BANNER: Active Brand & 1-Click Transformation Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Decorative dynamic glow with brand primary color */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ backgroundColor: formData.primaryColor || '#F59E0B' }}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* Live Brand Logo Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center p-1.5 shadow-md border-2 shrink-0 bg-white dark:bg-slate-800 overflow-hidden"
              style={{ borderColor: formData.primaryColor || '#F59E0B' }}
            >
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt={formData.name || 'Brand'}
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Building2 className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formData.name || 'Organization Brand'}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-xs"
                  style={{ backgroundColor: formData.primaryColor || '#F59E0B' }}
                >
                  {formData.brandCode || 'CODE'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {formData.poweredByText || 'Powered by CafeOS'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formData.tagline || 'Configure organization white-label identity, outlets, offers & desktop apps'}
              </p>
            </div>
          </div>

          {/* Quick Preset Transformers */}
          <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant 1-Click Brand Transformation:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {BRAND_PRESETS.map((preset) => {
                const isSelected = activeOrganization?.name?.toLowerCase().includes(preset.name.toLowerCase().split(' ')[0]);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                    <span>{preset.name.split(' ')[0]}</span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400 dark:text-amber-600" />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleCreateCustomOrg}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Custom Brand</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success Toast Notification */}
        {saveMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl px-6 pt-2 gap-3 overflow-x-auto text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveTab('branding')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'branding'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Brand Identity & Logo</span>
        </button>

        <button
          onClick={() => setActiveTab('franchises')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'franchises'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Franchises ({orgFranchises.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('outlets')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'outlets'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Branches & Outlets ({orgOutlets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'offers'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Offers & Discounts ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('windows_apps')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'windows_apps'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Download Windows Apps</span>
        </button>
      </div>

      {/* 3. TAB PANELS */}

      {/* TAB 1: BRAND IDENTITY & WHITE-LABEL LOGO */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form Editor */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-500" />
                <span>Self-Serve Organization Customizer</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize brand logos, titles, color accents, and thermal bill headers. All changes immediately propagate across Cashier registers, POS touchscreens, receipts, and KDS screens.
              </p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brand / Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. ZORKO Brand Global or Burger King India"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Code / Acronym (2-4 Chars) *
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={formData.brandCode || ''}
                  onChange={(e) => setFormData({ ...formData, brandCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. ZRK, BK, MCD"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Tagline / Slogan
                </label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Zorko - Brand of Foodies | Taste Is King"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            {/* Logo Customizer */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
                Brand Logo (Image URL or Upload from Device)
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                  {formData.logo ? (
                    <img
                      src={formData.logo}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <input
                    type="url"
                    value={formData.logo || ''}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://example.com/brand-logo.png"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo File (PNG/JPG/SVG)</span>
                    </button>
                    {formData.logo && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="px-2.5 py-1.5 text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Color Theme Palette */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Primary Brand Color & Palette</span>
                <span className="font-mono text-amber-500">{formData.primaryColor}</span>
              </label>

              {/* Color Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_PALETTES.map((pal) => {
                  const isActive = formData.primaryColor === pal.primary;
                  return (
                    <button
                      key={pal.name}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          primaryColor: pal.primary,
                          accentColor: pal.accent,
                        })
                      }
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-slate-900 dark:border-white ring-2 ring-amber-500 bg-amber-500/10'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-white/40"
                        style={{ backgroundColor: pal.primary }}
                      />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                        {pal.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor || '#F59E0B'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800"
                  />
                  <div className="flex-1">
                    <span className="block text-[11px] font-bold text-slate-500">Primary Color (Hex)</span>
                    <input
                      type="text"
                      value={formData.primaryColor || ''}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.accentColor || '#10B981'}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800"
                  />
                  <div className="flex-1">
                    <span className="block text-[11px] font-bold text-slate-500">Accent Color (Hex)</span>
                    <input
                      type="text"
                      value={formData.accentColor || ''}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt & Thermal Header/Footer */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-sky-500" />
                <span>Thermal Bill & Customer Receipt Formatting</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt Welcome Header
                  </label>
                  <input
                    type="text"
                    value={formData.customReceiptHeader || ''}
                    onChange={(e) => setFormData({ ...formData, customReceiptHeader: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt Custom Footer Message
                  </label>
                  <input
                    type="text"
                    value={formData.customReceiptFooter || ''}
                    onChange={(e) => setFormData({ ...formData, customReceiptFooter: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Software Architecture Attribution Tag
                  </label>
                  <input
                    type="text"
                    value={formData.poweredByText || ''}
                    onChange={(e) => setFormData({ ...formData, poweredByText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Displays "Powered by CafeOS" across desktop title bars, customer bills, and reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Statutory Compliance (GST, FSSAI, Phone, Email) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Headquarters & Statutory Registrations</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber || ''}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono uppercase text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    FSSAI License
                  </label>
                  <input
                    type="text"
                    value={formData.fssaiLicense || ''}
                    onChange={(e) => setFormData({ ...formData, fssaiLicense: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    HQ City & State
                  </label>
                  <input
                    type="text"
                    value={formData.headquartersCity || ''}
                    onChange={(e) => setFormData({ ...formData, headquartersCity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSaveOrganization}
                className="px-6 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:opacity-90"
                style={{ backgroundColor: formData.primaryColor || '#F59E0B' }}
              >
                <Check className="w-4 h-4" />
                <span>Save Organization Branding</span>
              </button>
            </div>
          </div>

          {/* Right Col: Live Mockup Preview */}
          <div className="space-y-6">
            {/* 1. Terminal Header Mockup */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md text-white space-y-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span>Live Windows POS Header Preview</span>
              </div>

              {/* Windows 11 Shell Preview */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center p-1 bg-white shrink-0 overflow-hidden"
                    style={{ borderColor: formData.primaryColor }}
                  >
                    {formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="Logo"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Store className="w-4 h-4 text-slate-900" />
                    )}
                  </div>
                  <div>
                    <div className="font-extrabold text-white leading-tight">
                      {formData.name || 'Brand POS'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Terminal #01 • <span className="text-amber-400 font-bold">{formData.poweredByText || 'Powered by CafeOS'}</span>
                    </div>
                  </div>
                </div>

                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white"
                  style={{ backgroundColor: formData.primaryColor || '#F59E0B' }}
                >
                  ONLINE
                </span>
              </div>
            </div>

            {/* 2. Live Thermal Bill Preview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-500" />
                <span>Live Thermal Receipt (80mm) Preview</span>
              </div>

              {/* Simulated Paper */}
              <div className="bg-amber-50/40 dark:bg-slate-950 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-300 space-y-2">
                <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-800">
                  <div className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                    {formData.name || 'BRAND NAME'}
                  </div>
                  <div className="text-[10px] text-slate-500">{formData.tagline}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    GSTIN: {formData.gstNumber || '27AAAAA0000A1Z5'} | FSSAI: {formData.fssaiLicense || '10000000000000'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-700 dark:text-slate-400 mt-1">
                    {formData.customReceiptHeader}
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-dashed border-slate-300 dark:border-slate-800">
                  <span>1x Artisan Paneer Pizza</span>
                  <span>₹249.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-300 dark:border-slate-800">
                  <span>1x Cold Brew Coffee</span>
                  <span>₹120.00</span>
                </div>

                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1">
                  <span>TOTAL (GST Included)</span>
                  <span className="text-amber-600 dark:text-amber-400">₹369.00</span>
                </div>

                <div className="text-center pt-2 border-t border-dashed border-slate-300 dark:border-slate-800 text-[10px] text-slate-500">
                  <div>{formData.customReceiptFooter}</div>
                  <div className="font-bold text-slate-600 dark:text-slate-400 mt-1">
                    *** {formData.poweredByText || 'Powered by CafeOS'} ***
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FRANCHISE MANAGEMENT */}
      {activeTab === 'franchises' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>Franchise Groups & Partners for {activeOrganization.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Add franchise entities, assign branch locations, specify royalty percentages, and manage multi-region partners.
              </p>
            </div>

            <button
              onClick={() => setIsAddFranchiseOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Franchise</span>
            </button>
          </div>

          {/* Franchise Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgFranchises.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Franchises Registered Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add your first franchise partner to grant portal access, track royalties, and group store branches.
                </p>
                <button
                  onClick={() => setIsAddFranchiseOpen(true)}
                  className="mt-3 px-4 py-1.5 bg-amber-500 text-white font-bold text-xs rounded-xl"
                >
                  Create First Franchise
                </button>
              </div>
            ) : (
              orgFranchises.map((fg) => {
                const assignedOutlets = outlets.filter((o) => o.franchiseGroupId === fg.id);
                return (
                  <div
                    key={fg.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-amber-400 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{fg.name}</h4>
                        <div className="text-xs text-slate-500">
                          Owner: <strong className="text-slate-700 dark:text-slate-300">{fg.ownerName}</strong>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {fg.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cities: {fg.cities.join(', ') || 'Regional'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-amber-500" />
                        <span>Royalty: <strong>{fg.royaltyPercentage}%</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-sky-500" />
                        <span>Active Outlets: <strong>{assignedOutlets.length} stores</strong></span>
                      </div>
                    </div>

                    {/* Outlet Chips */}
                    {assignedOutlets.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
                        {assignedOutlets.map((o) => (
                          <span
                            key={o.id}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {o.name.replace(activeOrganization.name, '').replace('-', '').trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add Franchise Modal */}
          {isAddFranchiseOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span>Add New Franchise Partner</span>
                  </h3>
                  <button
                    onClick={() => setIsAddFranchiseOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateFranchise} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Franchise Legal Entity Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={franchiseForm.name}
                      onChange={(e) => setFranchiseForm({ ...franchiseForm, name: e.target.value })}
                      placeholder="e.g. Patel QuickBites LLP (Gujarat Region)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Franchise Owner Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={franchiseForm.ownerName}
                        onChange={(e) => setFranchiseForm({ ...franchiseForm, ownerName: e.target.value })}
                        placeholder="e.g. Anand Patel"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Royalty Percentage (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={franchiseForm.royaltyPercentage}
                        onChange={(e) => setFranchiseForm({ ...franchiseForm, royaltyPercentage: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                      <input
                        type="email"
                        value={franchiseForm.email}
                        onChange={(e) => setFranchiseForm({ ...franchiseForm, email: e.target.value })}
                        placeholder="franchise@partner.in"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={franchiseForm.phone}
                        onChange={(e) => setFranchiseForm({ ...franchiseForm, phone: e.target.value })}
                        placeholder="+91 98000 00000"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Operating Cities (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={franchiseForm.cities}
                      onChange={(e) => setFranchiseForm({ ...franchiseForm, cities: e.target.value })}
                      placeholder="e.g. Ahmedabad, Surat, Vadodara"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddFranchiseOpen(false)}
                      className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm"
                    >
                      Create Franchise
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OUTLETS & BRANCHES */}
      {activeTab === 'outlets' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                <span>Store Outlets & Branches ({orgOutlets.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Add branch locations, set store codes, and assign cashier terminal count for {activeOrganization.name}.
              </p>
            </div>

            <button
              onClick={() => setIsAddOutletOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Store Branch</span>
            </button>
          </div>

          {/* Outlets Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgOutlets.map((outlet) => (
              <div
                key={outlet.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-amber-400 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{outlet.name}</h4>
                    <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                      {outlet.code}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {outlet.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{outlet.address}, {outlet.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{outlet.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>{outlet.terminalCount || 2} Billing Terminals</span>
                  </div>
                </div>

                {outlet.franchiseName && (
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                    Franchise: <strong className="text-slate-700 dark:text-slate-300">{outlet.franchiseName}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Outlet Modal */}
          {isAddOutletOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-500" />
                    <span>Add New Store Branch</span>
                  </h3>
                  <button onClick={() => setIsAddOutletOpen(false)} className="p-1 text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateOutlet} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Store / Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={outletForm.name}
                      onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })}
                      placeholder={`e.g. ${activeOrganization.name} - CyberHub Flagship`}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Store Code</label>
                      <input
                        type="text"
                        value={outletForm.code}
                        onChange={(e) => setOutletForm({ ...outletForm, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. ZRK-DEL-01"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Franchise Partner
                      </label>
                      <select
                        value={outletForm.franchiseGroupId}
                        onChange={(e) => setOutletForm({ ...outletForm, franchiseGroupId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      >
                        <option value="">Direct Company Owned</option>
                        {orgFranchises.map((fg) => (
                          <option key={fg.id} value={fg.id}>
                            {fg.name} ({fg.ownerName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                    <input
                      type="text"
                      value={outletForm.address}
                      onChange={(e) => setOutletForm({ ...outletForm, address: e.target.value })}
                      placeholder="Shop 14, Inner Circle, Connaught Place"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                      <input
                        type="text"
                        value={outletForm.city}
                        onChange={(e) => setOutletForm({ ...outletForm, city: e.target.value })}
                        placeholder="New Delhi"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
                      <input
                        type="text"
                        value={outletForm.state}
                        onChange={(e) => setOutletForm({ ...outletForm, state: e.target.value })}
                        placeholder="Delhi"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddOutletOpen(false)}
                      className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm"
                    >
                      Add Store Branch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OFFERS & PROMOTIONAL DISCOUNTS */}
      {activeTab === 'offers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Offers, Promo Codes & Discounts Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure brand promo codes, BOGO specials, and percentage discounts. When created here, they immediately show on Windows Cashier registers for 1-click redemption.
              </p>
            </div>

            <button
              onClick={() => setIsAddOfferOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Promo Offer</span>
            </button>
          </div>

          {/* Offers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-amber-400 transition-all space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {coupon.code}
                    </span>
                    {coupon.discountType === 'percentage' && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {coupon.discountValue}% OFF
                      </span>
                    )}
                    {coupon.discountType === 'flat' && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{coupon.discountValue} OFF
                      </span>
                    )}
                    {coupon.discountType === 'bogo' && (
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        BOGO (1+1)
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleCouponStatus(coupon.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase cursor-pointer ${
                      coupon.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {coupon.isActive ? 'Active' : 'Paused'}
                  </button>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                    {coupon.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{coupon.description}</p>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Min: ₹{coupon.minOrderValue}</span>
                  {coupon.maxDiscountCap && <span>Cap: ₹{coupon.maxDiscountCap}</span>}
                  <button
                    onClick={() => deleteCoupon(coupon.id)}
                    className="text-rose-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
                    title="Delete offer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Offer Modal */}
          {isAddOfferOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <span>Create New Promo Offer</span>
                  </h3>
                  <button onClick={() => setIsAddOfferOpen(false)} className="p-1 text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Promo Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={offerForm.code}
                        onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                        placeholder={`e.g. ${activeOrganization.brandCode}50`}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Discount Type
                      </label>
                      <select
                        value={offerForm.discountType}
                        onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value as DiscountType })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                      >
                        <option value="percentage">Percentage Discount (%)</option>
                        <option value="flat">Flat Amount Discount (₹)</option>
                        <option value="bogo">BOGO (Buy 1 Get 1 Free)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Offer Title *</label>
                    <input
                      type="text"
                      required
                      value={offerForm.title}
                      onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                      placeholder="e.g. Weekend Feast 20% Off on Combos"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Value ({offerForm.discountType === 'percentage' ? '%' : '₹'})
                      </label>
                      <input
                        type="number"
                        required
                        value={offerForm.discountValue}
                        onChange={(e) => setOfferForm({ ...offerForm, discountValue: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Min Order (₹)
                      </label>
                      <input
                        type="number"
                        value={offerForm.minOrderValue}
                        onChange={(e) => setOfferForm({ ...offerForm, minOrderValue: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Max Cap (₹)
                      </label>
                      <input
                        type="number"
                        value={offerForm.maxDiscountCap}
                        onChange={(e) => setOfferForm({ ...offerForm, maxDiscountCap: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddOfferOpen(false)}
                      className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm"
                    >
                      Launch Offer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DOWNLOAD WINDOWS APPS (FOR CASHIER AND STOCKIST) */}
      {activeTab === 'windows_apps' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-sky-500" />
              <span>Downloadable Windows Desktop Apps for {activeOrganization.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide dedicated standalone desktop applications for your store registers and warehouse stockists. Pre-configured with {activeOrganization.name} branding and "Powered by CafeOS".
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* APP 1: WINDOWS CASHIER BILLING TERMINAL */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-500 flex items-center justify-center p-2.5 border border-sky-400/30">
                    <Monitor className="w-full h-full" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                    For Cashier Counter
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {activeOrganization.name} Cashier POS App
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Ultra-fast counter billing app for Windows 10/11. Includes F1-F12 keyboard hotkeys ribbon, automatic 80mm ESC/POS thermal printing, RJ11 cash drawer trigger, dual-screen customer display, and offline billing cache.
                  </p>
                </div>

                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-bold">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Launches into high-speed Windows Cashier Terminal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Direct USB/LAN Thermal Bill &amp; KOT Print</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Works 100% offline during Internet drops</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() => downloadCashierLauncherBatch(activeOrganization.name)}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Cashier Launcher (.bat)</span>
                </button>

                <button
                  onClick={() => downloadCashierShortcutScript(activeOrganization.name)}
                  className="w-full py-2 px-4 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-sky-500" />
                  <span>Create Cashier Desktop Shortcut (.ps1)</span>
                </button>
              </div>
            </div>

            {/* APP 2: WINDOWS STOCKIST & WAREHOUSE INVENTORY TERMINAL */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center p-2.5 border border-amber-400/30">
                    <PackageCheck className="w-full h-full" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                    For Stockist &amp; Storekeeper
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {activeOrganization.name} Stockist Inventory App
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Dedicated stock and warehouse management application for storekeepers, commissaries, and inventory staff. Supports USB barcode scanners, physical stock counts, inward goods (GRN), and inter-store stock dispatches.
                  </p>
                </div>

                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-bold">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Launches into dedicated Stockist &amp; Inventory Workstation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Barcode scanner support for Inward Goods (GRN)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Inter-store stock transfers &amp; low-stock reorder triggers</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() => downloadStockistLauncherBatch(activeOrganization.name)}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Stockist Launcher (.bat)</span>
                </button>

                <button
                  onClick={() => downloadStockistShortcutScript(activeOrganization.name)}
                  className="w-full py-2 px-4 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-500" />
                  <span>Create Stockist Desktop Shortcut (.ps1)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Windows Setup Instructions Banner */}
          <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>How to Install on Windows 10 &amp; 11 Cashier / Stockist PC:</span>
              </h4>
              <p className="text-xs text-slate-400">
                1. Click "Download Launcher (.bat)" &rarr; 2. Place on Windows Desktop &rarr; 3. Double-click to start POS in dedicated window without browser bars.
              </p>
            </div>
            {isInstalled ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 shrink-0">
                Installed as Standalone App
              </span>
            ) : (
              <button
                onClick={() => promptInstall()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white transition-colors shrink-0"
              >
                Trigger Windows Native PWA Install
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
