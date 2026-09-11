import React, { useState } from 'react';
import {
  Bike,
  Building2,
  Check,
  CheckCircle2,
  ChefHat,
  Copy,
  Hash,
  KeyRound,
  Layers,
  Lock,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  Shield,
  Smartphone,
  Sparkles,
  Store,
  Tablet,
  Tv,
  User,
  UserCheck,
  UserPlus,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { User as UserType, UserRole } from '../../types';

interface FranchiseEmployeeAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded?: (employee: UserType) => void;
}

interface CategoryOption {
  id: 'biller' | 'cashier' | 'delivery_boy' | 'kitchen_staff' | 'store_manager' | 'waiter';
  role: UserRole;
  title: string;
  badge: string;
  icon: React.ElementType;
  color: string;
  defaultPortal: string;
  allowedPortals: string[];
  desc: string;
  suggestedStation: string;
}

const EMPLOYEE_CATEGORIES: CategoryOption[] = [
  {
    id: 'biller',
    role: 'biller',
    title: 'Biller (Billing Desk)',
    badge: 'Invoicing & Tax',
    icon: Receipt,
    color: 'emerald',
    defaultPortal: 'biller',
    allowedPortals: ['biller', 'pos', 'sop'],
    desc: 'High-speed counter invoicing, thermal print receipts, payment settlements & GST reports.',
    suggestedStation: 'BILLING-DESK-01',
  },
  {
    id: 'cashier',
    role: 'cashier',
    title: 'Cashier (POS Counter)',
    badge: 'Front of House',
    icon: Tv,
    color: 'amber',
    defaultPortal: 'pos',
    allowedPortals: ['pos', 'biller', 'sop'],
    desc: 'Touch POS order punching, table orders, menu modifier selection & quick cash checkout.',
    suggestedStation: 'POS-COUNTER-01',
  },
  {
    id: 'delivery_boy',
    role: 'delivery_rider',
    title: 'Delivery Boy / Rider',
    badge: 'Fleet & Logistics',
    icon: Bike,
    color: 'sky',
    defaultPortal: 'rider',
    allowedPortals: ['rider', 'sop'],
    desc: 'Order pickups, live GPS delivery tracking, cash-on-delivery collection & customer drop-offs.',
    suggestedStation: 'RIDER-MOBI-01',
  },
  {
    id: 'kitchen_staff',
    role: 'kitchen_staff',
    title: 'Kitchen Chef / Line Cook',
    badge: 'Back of House',
    icon: ChefHat,
    color: 'rose',
    defaultPortal: 'kds',
    allowedPortals: ['kds', 'sop'],
    desc: 'Live KDS display orders, preparation timers, bump bar management & food quality standards.',
    suggestedStation: 'KDS-SCREEN-01',
  },
  {
    id: 'store_manager',
    role: 'admin',
    title: 'Store / Shift Supervisor',
    badge: 'Floor Manager',
    icon: Users,
    color: 'purple',
    defaultPortal: 'admin',
    allowedPortals: ['admin', 'pos', 'kds', 'biller', 'inventory', 'rider', 'sop'],
    desc: 'Cash drawer closing, staff shift supervision, discount authorization & stock counts.',
    suggestedStation: 'MGR-DESK-01',
  },
  {
    id: 'waiter',
    role: 'employee',
    title: 'Waiter / Server',
    badge: 'Dining Floor',
    icon: UtensilsCrossed,
    color: 'orange',
    defaultPortal: 'pos',
    allowedPortals: ['pos', 'sop'],
    desc: 'Tableside mobile ordering, order status checks & guest bill presentation.',
    suggestedStation: 'WAITER-TAB-01',
  },
];

export const FranchiseEmployeeAddModal: React.FC<FranchiseEmployeeAddModalProps> = ({
  isOpen,
  onClose,
  onEmployeeAdded,
}) => {
  const { addUser, currentUser } = useAuth();
  const { outlets = [], franchiseGroups = [] } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<CategoryOption['id']>('biller');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(outlets[0]?.id || 'out-1');
  const [devicePin, setDevicePin] = useState('4567');
  const [deviceStationId, setDeviceStationId] = useState('BILLING-DESK-01');
  const [deviceStationName, setDeviceStationName] = useState('Main Billing Counter #1');

  // Keypad verification test state
  const [testPinInput, setTestPinInput] = useState('');
  const [pinVerified, setPinVerified] = useState<boolean | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentCategoryConfig =
    EMPLOYEE_CATEGORIES.find((c) => c.id === selectedCategory) || EMPLOYEE_CATEGORIES[0];

  // Franchise outlets available to this franchise owner
  const franchiseOutlets = currentUser?.assignedStoreIds?.length
    ? outlets.filter((o) => currentUser.assignedStoreIds?.includes(o.id))
    : outlets;

  const selectedOutlet = outlets.find((o) => o.id === selectedStoreId) || outlets[0];

  const handleCategoryChange = (catId: CategoryOption['id']) => {
    setSelectedCategory(catId);
    const cat = EMPLOYEE_CATEGORIES.find((c) => c.id === catId);
    if (cat) {
      setDeviceStationId(cat.suggestedStation);
      setDeviceStationName(
        catId === 'biller'
          ? 'Main Billing Counter #1'
          : catId === 'cashier'
          ? 'Touch POS Terminal #1'
          : catId === 'delivery_boy'
          ? 'Delivery Handheld Device #1'
          : catId === 'kitchen_staff'
          ? 'Main Kitchen KDS Display'
          : 'Floor Operations Terminal'
      );
    }
  };

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setDevicePin(randomPin);
    setTestPinInput('');
    setPinVerified(null);
  };

  const handleKeypadDigit = (digit: string) => {
    if (testPinInput.length < 6) {
      const next = testPinInput + digit;
      setTestPinInput(next);
      if (next === devicePin) {
        setPinVerified(true);
      } else if (next.length >= devicePin.length) {
        setPinVerified(false);
      } else {
        setPinVerified(null);
      }
    }
  };

  const handleClearKeypad = () => {
    setTestPinInput('');
    setPinVerified(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const generatedEmail =
      email.trim() ||
      `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.${selectedCategory}@${(selectedOutlet?.name || 'store').toLowerCase().replace(/[^a-z0-9]/g, '')}.cafeos.local`;

    const newStaffUser: Omit<UserType, 'id'> = {
      name: name.trim(),
      email: generatedEmail,
      phone: phone.trim() || '+91 98000 00000',
      role: currentCategoryConfig.role,
      password: 'staffpass123',
      pin: devicePin.trim(),
      devicePin: devicePin.trim(),
      employeeCategory: selectedCategory,
      deviceStationId: deviceStationId.trim(),
      deviceStationName: deviceStationName.trim(),
      department: currentCategoryConfig.badge,
      branchId: selectedStoreId,
      assignedStoreIds: [selectedStoreId],
      organizationId: selectedOutlet?.organizationId || currentUser?.organizationId,
      organizationName: currentUser?.organizationName || 'Franchise Network',
      franchiseName: currentUser?.franchiseName || 'Franchise Store',
      franchiseGroupId: currentUser?.franchiseGroupId,
      isActive: true,
      maxDiscountPercent: selectedCategory === 'store_manager' ? 25 : selectedCategory === 'cashier' ? 10 : 0,
      avatar:
        selectedCategory === 'biller'
          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
          : selectedCategory === 'delivery_boy'
          ? 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80'
          : selectedCategory === 'kitchen_staff'
          ? 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      allowedPortals: currentCategoryConfig.allowedPortals,
      allowedAppLogons: ['android_app', 'ios_app', 'windows_app'],
      appLoginCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      windowsStationId: deviceStationId.trim(),
      createdByType: 'franchise_owner',
      createdByUserName: currentUser?.name || 'Franchise Partner',
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      const added = addUser(newStaffUser);
      setIsSubmitting(false);
      if (onEmployeeAdded) onEmployeeAdded(added);
      onClose();
    }, 400);
  };

  const handleCopyPass = () => {
    const text = `📱 CaféOS Store Staff Device PIN Pass
=========================================
Employee Name: ${name || 'Staff Member'}
Category: ${currentCategoryConfig.title}
Store Location: ${selectedOutlet?.name} (${selectedOutlet?.city})
Assigned Device Station: ${deviceStationName} [${deviceStationId}]
Device Login PIN: ${devicePin}
-----------------------------------------
*Instructions: Tap "Quick Device PIN Login" on the POS screen and enter your 4-digit PIN to sign in instantly.`;

    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Add Franchise Employee & Device PIN</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Franchise Owner Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enroll billers, delivery boys, cashiers and chefs with fast numerical Device PIN login
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Category Selector Grid */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
              1. Select Employee Category / Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {EMPLOYEE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                        {cat.badge}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-white leading-tight">{cat.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{cat.desc}</p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Store & Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Assigned Franchise Store <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
              >
                {franchiseOutlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name} ({outlet.city || 'City'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Employee Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar (Biller)"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Device PIN Setup & Interactive PIN Verification */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  2. Create Device PIN Login for POS & Terminals
                </span>
              </div>
              <button
                type="button"
                onClick={handleGeneratePin}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Random PIN</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PIN Settings */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Device Login PIN (4 to 6 Digits) <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={devicePin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setDevicePin(val);
                        setTestPinInput('');
                        setPinVerified(null);
                      }}
                      required
                      placeholder="e.g. 4567"
                      className="w-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-base font-mono font-black text-amber-400 text-center tracking-widest focus:border-amber-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setDevicePin('1234');
                        setTestPinInput('');
                        setPinVerified(null);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] text-slate-300 font-bold"
                    >
                      Default: 1234
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPass}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] text-slate-300 font-bold flex items-center gap-1"
                    >
                      {copiedPass ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPass ? 'Copied' : 'Copy PIN Pass'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    This PIN allows the {currentCategoryConfig.title} to punch orders or clock in on POS screens without typing email or password.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Device Station ID
                    </label>
                    <input
                      type="text"
                      value={deviceStationId}
                      onChange={(e) => setDeviceStationId(e.target.value)}
                      placeholder="e.g. BILLING-DESK-01"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Station Description
                    </label>
                    <input
                      type="text"
                      value={deviceStationName}
                      onChange={(e) => setDeviceStationName(e.target.value)}
                      placeholder="e.g. Counter #1"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Keypad Tester */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Tablet className="w-3.5 h-3.5 text-amber-400" />
                    Touch Pad Tester
                  </span>
                  {pinVerified === true && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> PIN Verified!
                    </span>
                  )}
                  {pinVerified === false && (
                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                      Incorrect PIN
                    </span>
                  )}
                </div>

                {/* Display Dots */}
                <div className="w-full bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-800 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.max(4, devicePin.length) }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          i < testPinInput.length
                            ? pinVerified === true
                              ? 'bg-emerald-400 scale-110'
                              : pinVerified === false
                              ? 'bg-rose-500 scale-110'
                              : 'bg-amber-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearKeypad}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>

                {/* Numeric Grid */}
                <div className="grid grid-cols-3 gap-1.5 w-full max-w-[190px]">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => {
                        if (key === 'C') handleClearKeypad();
                        else if (key === '✓') {
                          setPinVerified(testPinInput === devicePin);
                        } else {
                          handleKeypadDigit(key);
                        }
                      }}
                      className={`h-8 rounded-lg text-xs font-bold font-mono transition-all active:scale-95 ${
                        key === '✓'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : key === 'C'
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPass}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>{copiedPass ? 'Pass Copied!' : 'Copy Device Pass'}</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : `Enroll ${currentCategoryConfig.title}`}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
