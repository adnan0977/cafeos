import React, { useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { User, UserRole } from '../../types';

interface CorporateAdminCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (user: User) => void;
}

export const CorporateAdminCreateModal: React.FC<CorporateAdminCreateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { addUser, currentUser } = useAuth();
  const { organizations = [], franchiseGroups = [], outlets = [] } = useRestaurant();

  const [accountType, setAccountType] = useState<'franchise_owner' | 'brand_admin'>('franchise_owner');
  const [selectedOrgId, setSelectedOrgId] = useState<string>(organizations[0]?.id || 'org-bk');
  const [franchiseName, setFranchiseName] = useState('Singhania Food Ventures (West)');
  const [fullName, setFullName] = useState('Meera Singhania');
  const [email, setEmail] = useState('meera.singhania@franchise-bk.in');
  const [phone, setPhone] = useState('+91 98200 44556');
  const [assignedStores, setAssignedStores] = useState<string[]>(['out-4', 'out-5', 'out-6']);
  const [demoPassword, setDemoPassword] = useState('BK@Franchise2026!');
  const [showPassword, setShowPassword] = useState(true);
  const [dispatchEmail, setDispatchEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentOrg = organizations.find((o) => o.id === selectedOrgId) || organizations[0];
  const orgOutlets = outlets.filter((o) => o.organizationId === selectedOrgId || !o.organizationId);

  const generateDemoPassword = () => {
    const orgPrefix = currentOrg?.code?.toUpperCase() || 'CORP';
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    setDemoPassword(`${orgPrefix}#${year}x${rand}`);
  };

  const handleToggleStore = (storeId: string) => {
    setAssignedStores((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);

    const role: UserRole = accountType === 'franchise_owner' ? 'franchise_owner' : 'brand_admin';
    const cleanStores = assignedStores.length > 0 ? assignedStores : [orgOutlets[0]?.id || 'out-1'];

    const storeNames = outlets
      .filter((o) => cleanStores.includes(o.id))
      .map((o) => `${o.name} (${o.city || 'Store'})`);

    const brandSenderName = `${currentOrg?.name || 'Corporate Brand'} Corporate HQ`;
    const brandSenderEmail = `corporate.credentials@${(currentOrg?.code || 'brand').toLowerCase()}.cafeos.in`;

    const newUserPayload: Omit<User, 'id'> = {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      password: demoPassword.trim(),
      pin: '5555',
      department: accountType === 'franchise_owner' ? 'Franchise Partner Management' : 'Corporate Brand HQ',
      branchId: cleanStores[0],
      assignedStoreIds: cleanStores,
      isFranchiseOwner: accountType === 'franchise_owner',
      franchiseName: accountType === 'franchise_owner' ? franchiseName.trim() : undefined,
      franchiseGroupId: accountType === 'franchise_owner' ? `fg-${Date.now().toString().slice(-4)}` : undefined,
      organizationId: currentOrg?.id,
      organizationName: currentOrg?.name,
      isActive: true,
      maxDiscountPercent: accountType === 'franchise_owner' ? 30 : 50,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      allowedPortals: ['admin', 'pos', 'kds', 'biller', 'inventory', 'rider', 'sop'],
      allowedAppLogons: ['android_app', 'ios_app', 'windows_app'],
      createdByType: currentUser?.role === 'super_admin' ? 'super_admin' : 'brand_admin',
      createdByUserName: currentUser?.name || 'Corporate HQ Admin',
      createdAt: new Date().toISOString(),
      credentialsDispatched: dispatchEmail
        ? {
            sentAt: new Date().toISOString(),
            sentToEmail: email.trim().toLowerCase(),
            defaultPassword: demoPassword.trim(),
            brandSenderName,
            brandSenderEmail,
            status: 'dispatched',
            dispatchSubject: `[${currentOrg?.name || 'Corporate HQ'}] Welcome to CaféOS - Your Franchise Admin Login & Demo Default Password`,
            assignedStoreNames: storeNames,
          }
        : undefined,
    };

    setTimeout(() => {
      const created = addUser(newUserPayload);
      setIsSubmitting(false);
      onCreated(created);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Corporate & Franchise Admin Login</h3>
              <p className="text-xs text-slate-400">
                Provision multi-store admin accounts with demo default password emailed directly from Corporate HQ
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Account Type Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Account Category to Provision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAccountType('franchise_owner');
                  setFullName('Meera Singhania');
                  setEmail('meera.singhania@franchise-bk.in');
                  setFranchiseName('Singhania Food Ventures (West)');
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  accountType === 'franchise_owner'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Store className={`w-5 h-5 mt-0.5 ${accountType === 'franchise_owner' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <h4 className="text-xs font-bold text-white">Franchise Admin Login</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Franchise partner managing multiple stores across different cities
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType('brand_admin');
                  setFullName('Siddharth Rao');
                  setEmail('corporate.hq@burgerking.in');
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  accountType === 'brand_admin'
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-white shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building2 className={`w-5 h-5 mt-0.5 ${accountType === 'brand_admin' ? 'text-indigo-400' : 'text-slate-500'}`} />
                <div>
                  <h4 className="text-xs font-bold text-white">Corporate Organisation Login</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Corporate Brand HQ user overseeing brand standards, menus & finances
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Organisation Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Parent Brand Organisation <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>

            {accountType === 'franchise_owner' && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Franchise Legal Entity / Group <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={franchiseName}
                  onChange={(e) => setFranchiseName(e.target.value)}
                  placeholder="e.g. Singhania Food Ventures (West)"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Admin User Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Admin Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Meera Singhania"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Franchise Official Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="franchise@domain.com"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Contact Phone <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 00000"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Demo Default Password & Generation */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Demo Default Password
              </label>
              <button
                type="button"
                onClick={generateDemoPassword}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate Demo Password</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:border-amber-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Corporate Dispatch Checkbox */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dispatchEmail}
                  onChange={(e) => setDispatchEmail(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    Send demo default password to franchise email from corporate organisation
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automated onboarding email will be sent to <strong className="text-amber-300">{email || 'franchise email'}</strong> containing login link, username, and demo password.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Assigned Stores across cities */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Assign Franchise Stores Across Cities ({assignedStores.length} Selected)
              </label>
              <button
                type="button"
                onClick={() => setAssignedStores(orgOutlets.map((o) => o.id))}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
              >
                Select All {currentOrg.name} Stores
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
              {orgOutlets.map((outlet) => {
                const isSelected = assignedStores.includes(outlet.id);
                return (
                  <button
                    type="button"
                    key={outlet.id}
                    onClick={() => handleToggleStore(outlet.id)}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block text-white">{outlet.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {outlet.city || 'City'} &bull; {outlet.code || outlet.id}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Provisioning & Sending Email...'
                  : 'Create Login & Send Demo Password'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
