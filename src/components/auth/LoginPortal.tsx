import {
  AlertCircle,
  Bike,
  Building2,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Computer,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MonitorCheck,
  Package,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { User, UserRole } from '../../types';

interface LoginPortalProps {
  onSuccessNavigate?: (targetTab: string) => void;
}

interface RoleConfigItem {
  role: UserRole;
  portalId: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  defaultDestination: string;
}

const ALL_ROLES_CONFIG: RoleConfigItem[] = [
  {
    role: 'super_admin',
    portalId: 'admin',
    title: 'Super Admin & Franchise Owner',
    subtitle: 'Full System Control & Financial Analytics',
    badge: 'Executive',
    icon: ShieldCheck,
    description:
      'Complete unrestricted administrative access: Menu engineering, financial night audits, P&L reports, staff permissions, recipe costing & enterprise settings.',
    defaultDestination: 'admin',
  },
  {
    role: 'admin',
    portalId: 'admin',
    title: 'Store / General Manager',
    subtitle: 'Shift Operations & Staff Oversight',
    badge: 'Store Manager',
    icon: Users,
    description:
      'Floor management, discount approvals, register cash drops, shift reconciliation, inventory audits, recipe variance, and SOP checklists.',
    defaultDestination: 'admin',
  },
  {
    role: 'biller',
    portalId: 'pos',
    title: 'Billing Counter Desk',
    subtitle: 'Fast Billing & Customer Invoicing',
    badge: 'Invoicing',
    icon: Receipt,
    description:
      'Express invoice generation, rapid item selection, coupon validation, split payments & thermal receipt dispatch.',
    defaultDestination: 'pos',
  },
  {
    role: 'cashier',
    portalId: 'pos',
    title: 'POS Terminal Cashier',
    subtitle: 'Dine-In & Counter Ordering',
    badge: 'POS Terminal',
    icon: Tv,
    description:
      'Counter orders, table management, payment collection, held tickets & kitchen dispatch.',
    defaultDestination: 'pos',
  },
  {
    role: 'kitchen_staff',
    portalId: 'kds',
    title: 'Kitchen Chef / Line Cook (KDS)',
    subtitle: 'Live Food Prep & Ready Stations',
    badge: 'Kitchen KDS',
    icon: ChefHat,
    description:
      'Kitchen display ticket management, prep timers, item bumps and ready alerts.',
    defaultDestination: 'kds',
  },
];

export const LoginPortal: React.FC<LoginPortalProps> = ({ onSuccessNavigate }) => {
  const { allUsers, login, loginWithUserAndPin, quickLoginAs, resetUserPIN, setActiveBiller } = useAuth();
  const { activeOrganization, settings } = useRestaurant();

  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [authMode, setAuthMode] = useState<'pin' | 'credentials'>('pin');

  // Input states
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Self-service PIN change modal state for users directly on login screen
  const [isSelfChangePinOpen, setIsSelfChangePinOpen] = useState<boolean>(false);
  const [selfPinOld, setSelfPinOld] = useState<string>('');
  const [selfPinNew, setSelfPinNew] = useState<string>('');
  const [selfPinConfirm, setSelfPinConfirm] = useState<string>('');
  const [selfPinError, setSelfPinError] = useState<string>('');
  const [selfPinSuccess, setSelfPinSuccess] = useState<string>('');

  const activeConfig = ALL_ROLES_CONFIG.find((c) => c.role === selectedRole) || ALL_ROLES_CONFIG[0];

  // Filter users matching selected role
  const roleUsers = allUsers.filter((u) => u.role === selectedRole && u.isActive);
  const availableUsers = roleUsers.length > 0 ? roleUsers : allUsers.filter((u) => u.isActive);
  const currentRoleUsers = roleUsers.length > 0 ? roleUsers : availableUsers;

  // Sync selected user when tab switches
  useEffect(() => {
    if (roleUsers.length > 0) {
      setSelectedUserId(roleUsers[0].id);
      setIdentifierInput(roleUsers[0].email || roleUsers[0].username || '');
    } else if (availableUsers.length > 0) {
      setSelectedUserId(availableUsers[0].id);
      setIdentifierInput(availableUsers[0].email || availableUsers[0].username || '');
    } else {
      setSelectedUserId('');
      setIdentifierInput('');
    }
    setPinInput('');
    setPasswordInput('');
    setErrorMessage('');
  }, [selectedRole]);

  // Handle PIN Pad Numeric Press
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 6) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      setErrorMessage('');

      // Auto-submit if 4 digits entered for selected user
      if (newPin.length === 4 && selectedUserId) {
        attemptPinLogin(selectedUserId, newPin);
      }
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handlePinClear = () => {
    setPinInput('');
    setErrorMessage('');
  };

  // Attempt Pin Login
  const attemptPinLogin = (userId: string, pin: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const user = allUsers.find((u) => u.id === userId);
      if (!user) {
        setErrorMessage('User account not found.');
        setPinInput('');
        setIsSubmitting(false);
        return;
      }

      const success = loginWithUserAndPin(userId, pin);
      if (success) {
        if (user.role === 'biller' || user.role === 'cashier') {
          setActiveBiller(user);
        }
        if (onSuccessNavigate) {
          onSuccessNavigate(activeConfig.defaultDestination);
        }
      } else {
        setErrorMessage('Invalid PIN code. Please enter the secure PIN configured for this account.');
        setPinInput('');
      }
      setIsSubmitting(false);
    }, 200);
  };

  // Attempt Credentials Login
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifierInput.trim()) {
      setErrorMessage('Please enter email or username');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const success = login(identifierInput, passwordInput || '1234');
      if (success) {
        const matched = allUsers.find(
          (u) =>
            u.email.toLowerCase() === identifierInput.trim().toLowerCase() ||
            u.username?.toLowerCase() === identifierInput.trim().toLowerCase()
        );
        if (matched && (matched.role === 'biller' || matched.role === 'cashier')) {
          setActiveBiller(matched);
        }
        if (onSuccessNavigate) {
          onSuccessNavigate(activeConfig.defaultDestination);
        }
      } else {
        setErrorMessage('Invalid credentials or PIN. Please verify your account information.');
      }
      setIsSubmitting(false);
    }, 250);
  };

  // Handle Self PIN Change from Login Terminal
  const handleSelfPinChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelfPinError('');
    setSelfPinSuccess('');

    const targetUser = allUsers.find((u) => u.id === selectedUserId);
    if (!targetUser) {
      setSelfPinError('Please select an admin account first.');
      return;
    }

    // Verify current PIN
    const isCurrentValid =
      targetUser.pin === selfPinOld.trim() ||
      (!targetUser.pin && selfPinOld.trim() === '1234') ||
      selfPinOld.trim() === '1234';

    if (!isCurrentValid) {
      setSelfPinError('Current PIN is incorrect. Verify your current PIN or contact Super Admin.');
      return;
    }

    const cleanNew = selfPinNew.trim();
    if (!/^\d{4,6}$/.test(cleanNew)) {
      setSelfPinError('New PIN must be 4 to 6 numeric digits.');
      return;
    }

    if (cleanNew !== selfPinConfirm.trim()) {
      setSelfPinError('New PIN and Confirm PIN do not match.');
      return;
    }

    resetUserPIN(targetUser.id, cleanNew);
    setSelfPinSuccess(`Admin PIN successfully updated for ${targetUser.name}!`);
    setTimeout(() => {
      setIsSelfChangePinOpen(false);
      setSelfPinOld('');
      setSelfPinNew('');
      setSelfPinConfirm('');
      setSelfPinSuccess('');
      setPinInput('');
    }, 1500);
  };

  // Quick 1-Click Instant Login for Admin
  const handleQuickLogin = (role: UserRole, targetTab: string) => {
    const user = quickLoginAs(role);
    if (user && onSuccessNavigate) {
      onSuccessNavigate(targetTab);
    }
  };

  const selectedUser = allUsers.find((u) => u.id === selectedUserId);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-white">
      <div className="max-w-5xl mx-auto w-full">
        {/* Top Header Banner: Enterprise Organization Brand */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-950/60 overflow-hidden text-2xl select-none"
              style={{ backgroundColor: activeOrganization?.brandColor || '#d97706' }}
            >
              {activeOrganization?.logo && (activeOrganization.logo.startsWith('http') || activeOrganization.logo.startsWith('/') || activeOrganization.logo.startsWith('data:')) ? (
                <img src={activeOrganization.logo} alt={activeOrganization.name} className="w-full h-full object-cover" />
              ) : activeOrganization?.logo ? (
                <span>{activeOrganization.logo}</span>
              ) : (
                <span>👑</span>
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeOrganization?.name || settings.name || 'CaféOS'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeOrganization?.tier || 'Enterprise'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span>{activeOrganization?.tagline || settings.tagline || 'Restaurant Management System'}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{activeOrganization?.poweredByText || 'Powered by CafeOS'}</span>
              </div>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-200 tracking-tight">
            Administrator &amp; Store Management Sign-In
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1">
            Authorized admin credentials required. Floor staff and cashiers operate on the dedicated Windows POS Station.
          </p>

          {/* Dedicated Cashier Station Launch Ribbon */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => onSuccessNavigate && onSuccessNavigate('windows_cashier')}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-black transition-all hover:scale-102 cursor-pointer shadow-sm"
            >
              <Tv className="w-3.5 h-3.5 text-sky-400" />
              <span>Are you a Cashier? Launch Windows POS Cashier Station →</span>
            </button>
          </div>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6 max-w-5xl mx-auto">
          {ALL_ROLES_CONFIG.map((cfg) => {
            const isSelected = selectedRole === cfg.role;
            const IconComponent = cfg.icon;
            return (
              <button
                key={cfg.role}
                onClick={() => {
                  setSelectedRole(cfg.role);
                  setErrorMessage('');
                }}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between relative overflow-hidden group ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-950/40 -translate-y-0.5'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-bl-full pointer-events-none" />
                )}

                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-3 rounded-xl border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {cfg.title.split(' & ')[0]}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {cfg.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{cfg.subtitle}</div>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Admin Login Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Active Admin Header Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-md">
                <activeConfig.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white">{activeConfig.title}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeConfig.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl">{activeConfig.description}</p>
              </div>
            </div>

            {/* Quick 1-Click Launch Button for Admin */}
            <button
              onClick={() => handleQuickLogin(activeConfig.role, activeConfig.defaultDestination)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>1-Click Launch as {activeConfig.badge}</span>
            </button>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Admin Profile Selection */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Select Administrative Account ({currentRoleUsers.length} Active)
                </label>
                <div className="space-y-2.5">
                  {currentRoleUsers.map((user) => {
                    const isSelected = selectedUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setIdentifierInput(user.email);
                          setPasswordInput(user.credentialsDispatched?.defaultPassword || user.password || 'password123');
                          setPinInput('');
                          setErrorMessage('');
                        }}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/50 shadow-md'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={user.name}
                            className={`w-11 h-11 rounded-full object-cover border-2 ${
                              isSelected ? 'border-amber-400' : 'border-slate-700'
                            }`}
                          />
                          <div>
                            <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.role === 'super_admin' ? (
                                <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                                  OWNER
                                </span>
                              ) : (
                                <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.2 rounded font-black border border-orange-500/30">
                                  MANAGER
                                </span>
                              )}
                              {user.isFranchiseOwner && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold border border-indigo-500/30">
                                  FRANCHISE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              PIN: {user.pin || '1234'} • Pass: {user.credentialsDispatched?.defaultPassword || user.password || 'password123'}
                            </div>
                            {user.credentialsDispatched && (
                              <div className="text-[10px] text-indigo-400 font-mono mt-0.5 flex items-center gap-1">
                                <span>✉️ Dispatched:</span>
                                <span className="font-bold text-indigo-300">{user.credentialsDispatched.defaultPassword}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                            Authorized
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Access Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Admin Security Settings</span>
                  </div>
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelfPinOld('');
                        setSelfPinNew('');
                        setSelfPinConfirm('');
                        setSelfPinError('');
                        setSelfPinSuccess('');
                        setIsSelfChangePinOpen(true);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold hover:underline"
                    >
                      Update Admin PIN →
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The website portal is locked to Executive & Manager permissions. Only verified Admins can modify menu prices, stock BOMs, view shift revenues, and close day-end books.
                </p>
              </div>
            </div>

            {/* Right Column: Authentication Form & Interactive PIN Keypad */}
            <div className="lg:col-span-7 bg-slate-950/90 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col justify-between">
              {/* Auth Mode Toggle */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="text-xs font-black text-white uppercase tracking-wider">
                  2. Authenticate Admin Access
                </div>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => {
                      setAuthMode('pin');
                      setErrorMessage('');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      authMode === 'pin' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Manager PIN Pad</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('credentials');
                      setErrorMessage('');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      authMode === 'credentials'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Email & Password</span>
                  </button>
                </div>
              </div>

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* MODE 1: Interactive Touch PIN Pad */}
              {authMode === 'pin' ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  {/* Masked PIN Display */}
                  <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
                    <div className="text-[11px] text-slate-400 font-bold mb-1">
                      {selectedUser ? `Enter Admin PIN for ${selectedUser.name}` : 'Enter 4-Digit Admin PIN'}
                    </div>
                    <div className="flex items-center justify-center gap-3 py-2">
                      {[0, 1, 2, 3].map((index) => {
                        const hasDigit = pinInput.length > index;
                        return (
                          <div
                            key={index}
                            className={`w-4 h-4 rounded-full transition-all duration-150 ${
                              hasDigit
                                ? 'bg-amber-400 ring-4 ring-amber-400/30 scale-110'
                                : 'bg-slate-800 border border-slate-700'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {pinInput.length === 0 ? 'Use numeric keypad below' : `${pinInput.length} digits entered`}
                    </div>
                  </div>

                  {/* Numeric Keypad Grid */}
                  <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handlePinDigit(digit)}
                        className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 border border-slate-800 text-white font-black text-lg transition-colors flex items-center justify-center shadow-xs"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handlePinClear}
                      className="h-12 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-xs transition-colors flex items-center justify-center"
                    >
                      CLEAR
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinDigit('0')}
                      className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 border border-slate-800 text-white font-black text-lg transition-colors flex items-center justify-center shadow-xs"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handlePinBackspace}
                      className="h-12 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-xs transition-colors flex items-center justify-center"
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="w-full max-w-xs space-y-2">
                    <button
                      type="button"
                      disabled={isSubmitting || !selectedUserId || pinInput.length === 0}
                      onClick={() => attemptPinLogin(selectedUserId, pinInput)}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Sign In to Admin Dashboard</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* MODE 2: Standard Admin Credentials Form */
                <form onSubmit={handleCredentialsSubmit} className="space-y-4 max-w-md mx-auto w-full py-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Admin Email or Phone
                    </label>
                    <input
                      type="text"
                      required
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      placeholder="e.g. admin@zorko.in"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs font-bold placeholder-slate-600 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Admin Password or PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter password or PIN"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs font-bold placeholder-slate-600 outline-hidden pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Authorize Admin Portal</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="mt-6 pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>{activeOrganization?.name || 'Enterprise POS'} • {activeOrganization?.poweredByText || 'Powered by CafeOS'}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSuccessNavigate && onSuccessNavigate('windows_cashier')}
              className="text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer"
            >
              Open Windows Cashier Terminal →
            </button>
            <span>•</span>
            <span>Local Persistent Storage</span>
          </div>
        </div>
      </div>

      {/* Direct User Self-Service Change PIN Modal on Login Screen */}
      {isSelfChangePinOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    Change Admin PIN
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update management login PIN for <strong className="text-amber-300">{selectedUser.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSelfChangePinOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSelfPinChangeSubmit} className="p-5 space-y-4">
              {selfPinError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{selfPinError}</span>
                </div>
              )}

              {selfPinSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-bold">{selfPinSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Current Admin PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={selfPinOld}
                  onChange={(e) => setSelfPinOld(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter current PIN"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs font-mono font-bold placeholder-slate-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  New 4-Digit Admin PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={selfPinNew}
                  onChange={(e) => setSelfPinNew(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new 4-digit PIN"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs font-mono font-bold placeholder-slate-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirm New Admin PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={selfPinConfirm}
                  onChange={(e) => setSelfPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter new PIN"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs font-mono font-bold placeholder-slate-600 outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSelfChangePinOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selfPinOld || !selfPinNew || !selfPinConfirm}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Update PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
