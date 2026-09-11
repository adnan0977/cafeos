import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  CreditCard,
  Receipt,
  Lock,
  Eye,
  EyeOff,
  Delete,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { User, UserRole } from '../../types';

interface POSTerminalLoginProps {
  onLoginSuccess: () => void;
}

export const POSTerminalLogin: React.FC<POSTerminalLoginProps> = ({ onLoginSuccess }) => {
  const { allUsers, loginWithUserAndPin, login, setActiveBiller, setSupervisorAdmin, currentUser } = useAuth();
  const { settings } = useRestaurant();

  // Mode: 'staff_select' | 'custom_login' | 'admin_select_biller'
  const [activeTab, setActiveTab] = useState<'biller' | 'cashier' | 'admin' | 'custom'>('biller');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Custom manual login fields
  const [customUsername, setCustomUsername] = useState<string>('');
  const [customPassword, setCustomPassword] = useState<string>('');

  // Admin select biller flow state
  const [pendingAdminUser, setPendingAdminUser] = useState<User | null>(null);
  const [chosenBiller, setChosenBiller] = useState<User | null>(null);
  const [customBillerName, setCustomBillerName] = useState<string>('');

  // Filter users by role
  const billers = allUsers.filter((u) => u.role === 'biller' && u.isActive);
  const cashiers = allUsers.filter((u) => u.role === 'cashier' && u.isActive);
  const admins = allUsers.filter(
    (u) => (u.role === 'admin' || u.role === 'super_admin' || u.role === 'franchise_owner') && u.isActive
  );

  // Determine which user list to show based on selected role tab
  const getActiveRoleUsers = () => {
    switch (activeTab) {
      case 'biller':
        return billers.length > 0 ? billers : allUsers.filter((u) => u.role === 'biller');
      case 'cashier':
        return cashiers.length > 0 ? cashiers : allUsers.filter((u) => u.role === 'cashier');
      case 'admin':
        return admins.length > 0 ? admins : allUsers.filter((u) => u.role === 'admin' || u.role === 'super_admin');
      default:
        return [];
    }
  };

  const handleSelectStaff = (user: User) => {
    setSelectedUser(user);
    setPinInput('');
    setErrorMessage('');
  };

  const handleDigitClick = (digit: string) => {
    if (pinInput.length < 10) {
      setPinInput((prev) => prev + digit);
      setErrorMessage('');
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMessage('');
  };

  // Perform sign-in for staff
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedUser) {
      setErrorMessage('Please choose a staff member first');
      return;
    }

    if (!pinInput.trim()) {
      setErrorMessage('Please enter the 4-digit PIN');
      return;
    }

    const success = loginWithUserAndPin(selectedUser.id, pinInput.trim());

    if (success) {
      // Check if the logged-in user is an Admin
      if (
        selectedUser.role === 'admin' ||
        selectedUser.role === 'super_admin' ||
        selectedUser.role === 'brand_admin' ||
        selectedUser.role === 'franchise_owner'
      ) {
        // Admin logging into POS -> MUST select active biller!
        setPendingAdminUser(selectedUser);
        // Pre-select default biller (Sameer Joshi / amityu4701 if available)
        const defaultBiller = billers[0] || cashiers[0] || null;
        setChosenBiller(defaultBiller);
      } else {
        // Cashier or Biller directly enters POS
        setActiveBiller(selectedUser);
        setSupervisorAdmin(null);
        onLoginSuccess();
      }
    } else {
      setErrorMessage('Invalid PIN. Please try again.');
    }
  };

  // One-touch instant test login
  const handleInstantLogin = (user: User) => {
    const defaultPin = user.pin || '1234';
    const success = loginWithUserAndPin(user.id, defaultPin);
    if (success) {
      if (
        user.role === 'admin' ||
        user.role === 'super_admin' ||
        user.role === 'brand_admin' ||
        user.role === 'franchise_owner'
      ) {
        setPendingAdminUser(user);
        const defaultBiller = billers[0] || cashiers[0] || null;
        setChosenBiller(defaultBiller);
      } else {
        setActiveBiller(user);
        setSupervisorAdmin(null);
        onLoginSuccess();
      }
    }
  };

  // Manual custom credentials login
  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUsername.trim() || !customPassword.trim()) {
      setErrorMessage('Please enter both username and password/PIN');
      return;
    }

    const success = login(customUsername.trim(), customPassword.trim());
    if (success) {
      const loggedUser = allUsers.find(
        (u) =>
          u.username?.toLowerCase() === customUsername.trim().toLowerCase() ||
          u.email.toLowerCase() === customUsername.trim().toLowerCase()
      );
      if (
        loggedUser &&
        (loggedUser.role === 'admin' ||
          loggedUser.role === 'super_admin' ||
          loggedUser.role === 'brand_admin' ||
          loggedUser.role === 'franchise_owner')
      ) {
        setPendingAdminUser(loggedUser);
        const defaultBiller = billers[0] || cashiers[0] || null;
        setChosenBiller(defaultBiller);
      } else {
        if (loggedUser) {
          setActiveBiller(loggedUser);
        }
        setSupervisorAdmin(null);
        onLoginSuccess();
      }
    } else {
      setErrorMessage('Invalid username or credentials.');
    }
  };

  // Admin completes biller selection and enters POS
  const handleConfirmAdminBiller = () => {
    if (!pendingAdminUser) return;

    if (customBillerName.trim()) {
      // Create a temporary/assigned shift biller representation
      const tempBiller: User = {
        id: `shift-biller-${Date.now()}`,
        name: customBillerName.trim(),
        username: customBillerName.toLowerCase().replace(/\s+/g, '_'),
        email: `${customBillerName.toLowerCase().replace(/\s+/g, '')}@station.pos`,
        phone: '+91 7291077919',
        role: 'biller',
        branchId: pendingAdminUser.branchId || 'branch-1',
        isActive: true,
        maxDiscountPercent: 15,
      };
      setActiveBiller(tempBiller);
    } else if (chosenBiller) {
      setActiveBiller(chosenBiller);
    } else {
      // Admin acts as biller themselves
      setActiveBiller(pendingAdminUser);
    }

    setSupervisorAdmin(pendingAdminUser);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-slate-950 flex flex-col font-sans select-none">
      {/* Top POS Header matching RoyalPOS / Reference */}
      <header className="bg-[#00897b] text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-white/20 rounded-md font-mono text-xs font-black tracking-wider uppercase">
            RoyalPOS 6.5.2
          </div>
          <div className="h-4 w-px bg-white/30" />
          <span className="text-xs font-mono font-bold text-white/90">ID: 45768</span>
          <div className="h-4 w-px bg-white/30" />
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight">
            <span>Amity University, Lucknow , UP , ZORKO</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-white/90">
          <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Terminal: POS-WIN-01</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/80">
            <Phone className="w-3.5 h-3.5" />
            <span>Support: +91 7291077919</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        {/* If Admin logged in and needs to select active biller */}
        {pendingAdminUser ? (
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#00897b] to-[#00796b] text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                      Admin Supervision
                    </span>
                    <span className="text-xs text-teal-100">Logged in as {pendingAdminUser.name}</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight mt-0.5">Select Active Biller for Shift</h2>
                  <p className="text-xs text-teal-100/90 mt-0.5">
                    All receipts, KOTs, and register sales will be attributed to this selected biller.
                  </p>
                </div>
              </div>
            </div>

            {/* Biller Selection Content */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Choose Enrolled Biller or Cashier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Default Biller: Sameer Joshi (amityu4701) */}
                  {billers.concat(cashiers).map((biller) => {
                    const isSelected = chosenBiller?.id === biller.id && !customBillerName;
                    return (
                      <div
                        key={biller.id}
                        onClick={() => {
                          setChosenBiller(biller);
                          setCustomBillerName('');
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-[#00897b] bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-100 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                            isSelected ? 'bg-[#00897b] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {biller.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{biller.name}</div>
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span className="font-bold text-[#00897b] dark:text-teal-400">
                              @{biller.username || biller.name.toLowerCase().replace(/\s+/g, '')}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{biller.role}</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#00897b] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Or enter custom shift biller name */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Or Assign Custom Shift Biller Name
                </label>
                <input
                  type="text"
                  value={customBillerName}
                  onChange={(e) => {
                    setCustomBillerName(e.target.value);
                    if (e.target.value) setChosenBiller(null);
                  }}
                  placeholder="e.g. Sameer (Shift A) or amityu4701"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-hidden focus:border-[#00897b] focus:ring-2 focus:ring-[#00897b]/20"
                />
              </div>

              {/* Active Selection Summary Banner */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">
                    Billed By:{' '}
                    <span className="underline">
                      {customBillerName.trim() || chosenBiller?.name || pendingAdminUser.name} (
                      {customBillerName.trim()
                        ? customBillerName.toLowerCase().replace(/\s+/g, '_')
                        : chosenBiller?.username || 'amityu4701'}
                      )
                    </span>
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Supervisor Admin: {pendingAdminUser.name}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingAdminUser(null);
                    setSelectedUser(null);
                    setPinInput('');
                  }}
                  className="py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel / Switch Admin
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdminBiller}
                  className="flex-1 py-3 px-5 bg-[#00897b] hover:bg-[#00796b] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Launch POS Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main POS Login Card */
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Role & Staff Selection */}
            <div className="lg:col-span-7 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                {/* Heading */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#00897b] mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span>Point of Sale Terminal Access</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Select Your Role & Sign In
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Sign in as Biller, Cashier, or Admin to manage counter orders and print KOTs.
                  </p>
                </div>

                {/* Role Tabs */}
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('biller');
                      setSelectedUser(billers[0] || null);
                      setPinInput('');
                      setErrorMessage('');
                    }}
                    className={`py-2 px-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                      activeTab === 'biller'
                        ? 'bg-white dark:bg-slate-900 text-[#00897b] dark:text-teal-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Biller
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('cashier');
                      setSelectedUser(cashiers[0] || null);
                      setPinInput('');
                      setErrorMessage('');
                    }}
                    className={`py-2 px-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                      activeTab === 'cashier'
                        ? 'bg-white dark:bg-slate-900 text-[#00897b] dark:text-teal-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Cashier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('admin');
                      setSelectedUser(admins[0] || null);
                      setPinInput('');
                      setErrorMessage('');
                    }}
                    className={`py-2 px-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                      activeTab === 'admin'
                        ? 'bg-white dark:bg-slate-900 text-[#00897b] dark:text-teal-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('custom');
                      setSelectedUser(null);
                      setPinInput('');
                      setErrorMessage('');
                    }}
                    className={`py-2 px-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                      activeTab === 'custom'
                        ? 'bg-white dark:bg-slate-900 text-[#00897b] dark:text-teal-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {/* Staff Cards or Custom Form */}
                {activeTab !== 'custom' ? (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Enrolled Staff ({getActiveRoleUsers().length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {getActiveRoleUsers().map((staff) => {
                        const isChosen = selectedUser?.id === staff.id;
                        return (
                          <div
                            key={staff.id}
                            onClick={() => handleSelectStaff(staff)}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              isChosen
                                ? 'border-[#00897b] bg-teal-50/50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-100 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                  isChosen
                                    ? 'bg-[#00897b] text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {staff.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs truncate">{staff.name}</div>
                                <div className="text-[11px] font-mono text-[#00897b] dark:text-teal-400 font-bold truncate">
                                  @{staff.username || 'amityu4701'}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstantLogin(staff);
                              }}
                              className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 cursor-pointer shrink-0 transition-colors"
                              title="Instant 1-Click Sign In"
                            >
                              Fast In
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCustomLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Username / Email / Mobile
                      </label>
                      <input
                        type="text"
                        value={customUsername}
                        onChange={(e) => setCustomUsername(e.target.value)}
                        placeholder="e.g. amityu4701, pooja_pos, or admin_store"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-hidden focus:border-[#00897b]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Password or 4-Digit PIN
                      </label>
                      <input
                        type="password"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder="Enter password or PIN"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-hidden focus:border-[#00897b]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#00897b] hover:bg-[#00796b] text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Authenticate & Proceed
                    </button>
                  </form>
                )}
              </div>

              {/* Support reference matching image */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp: +91 8780228978</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Call: +91 7291077919</span>
                </div>
              </div>
            </div>

            {/* Right Column: Touch PIN Keypad & Confirmation */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between">
              <div>
                {/* Staff Selection Preview */}
                <div className="text-center mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Selected Staff Station
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/70 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200">
                    <UserCheck className="w-4 h-4 text-[#00897b]" />
                    <span className="font-extrabold text-xs">
                      {selectedUser ? selectedUser.name : 'Choose Staff Member'}
                    </span>
                    {selectedUser && (
                      <span className="font-mono text-[11px] font-bold text-[#00897b]">
                        (@{selectedUser.username || 'amityu4701'})
                      </span>
                    )}
                  </div>
                </div>

                {/* PIN Input Display */}
                <form onSubmit={handlePinSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="• • • •"
                      maxLength={10}
                      className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-2xl text-center font-mono text-2xl tracking-widest font-black text-slate-900 dark:text-white outline-hidden focus:border-[#00897b] transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Touch Number Pad */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleDigitClick(digit)}
                        className="py-3 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-lg rounded-2xl transition-all active:scale-95 cursor-pointer shadow-xs border border-slate-200 dark:border-slate-700"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleClear}
                      className="py-3 bg-white dark:bg-slate-800 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:text-slate-400 text-xs font-black uppercase rounded-2xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDigitClick('0')}
                      className="py-3 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-lg rounded-2xl transition-all active:scale-95 cursor-pointer shadow-xs border border-slate-200 dark:border-slate-700"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleBackspace}
                      className="py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                      title="Backspace"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Enter Button */}
                  <button
                    type="submit"
                    className="w-full mt-3 py-3.5 px-4 bg-[#00897b] hover:bg-[#00796b] text-white font-extrabold text-sm rounded-2xl shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Sign In to Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Demo Hint */}
              <div className="mt-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-[11px] text-slate-500 dark:text-slate-400">
                <span>Default PINs: Sameer </span>
                <strong className="text-teal-700 dark:text-teal-400">4444</strong>
                <span> • Pooja </span>
                <strong className="text-teal-700 dark:text-teal-400">3333</strong>
                <span> • Admin </span>
                <strong className="text-teal-700 dark:text-teal-400">2222 / 1234</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
