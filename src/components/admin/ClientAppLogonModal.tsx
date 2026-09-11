import {
  AlertCircle,
  Apple,
  Check,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Lock,
  Monitor,
  Printer,
  QrCode,
  RotateCw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Tv,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { AppLogonType, User } from '../../types';
import { getRoleDetails } from '../../utils/formatters';

interface ClientAppLogonModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp?: (targetTab: string, user: User) => void;
  initialTab?: AppLogonType;
}

export const ClientAppLogonModal: React.FC<ClientAppLogonModalProps> = ({
  user,
  isOpen,
  onClose,
  onLaunchApp,
  initialTab = 'android_app',
}) => {
  const { switchUser } = useAuth();
  const { settings, outlets } = useRestaurant();

  const [activeTab, setActiveTab] = useState<AppLogonType>(initialTab);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSimulatingLogin, setIsSimulatingLogin] = useState(false);

  if (!isOpen || !user) return null;

  const roleInfo = getRoleDetails(user.role);
  const outlet = outlets.find((o) => o.id === user.branchId) || outlets[0];

  const androidCode = user.appLoginCode || `AND-${user.pin || '1234'}`;
  const iosCode = user.appLoginCode?.replace('AND-', 'IOS-') || `IOS-${user.pin || '1234'}`;
  const windowsStation = user.windowsStationId || 'POS-WIN-01';
  const pairingToken = user.devicePairingToken || `ZORKO-PAIR-${user.id}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulateAppLogin = (platform: AppLogonType) => {
    setIsSimulatingLogin(true);
    setTimeout(() => {
      setIsSimulatingLogin(false);
      switchUser(user.id);

      if (onLaunchApp) {
        if (platform === 'windows_app') {
          onLaunchApp('windows_cashier', user);
        } else if (user.role === 'kitchen_staff') {
          onLaunchApp('kds', user);
        } else if (user.role === 'delivery_rider') {
          onLaunchApp('rider', user);
        } else if (user.role === 'biller') {
          onLaunchApp('biller', user);
        } else {
          onLaunchApp('pos', user);
        }
      }
      onClose();
    }, 600);
  };

  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg leading-tight">
                  {user.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${roleInfo.bg} ${roleInfo.text}`}>
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>Outlet: <strong className="text-slate-200">{outlet?.name || 'Main Branch'}</strong></span>
                <span>•</span>
                <span>PIN: <strong className="text-amber-400 font-mono tracking-wider">{user.pin || '1234'}</strong></span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrintBadge}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Print Staff Pass / Badge"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Platform Tabs: Android App, iOS App, Windows App */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-2 gap-2">
          <button
            onClick={() => setActiveTab('android_app')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'android_app'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android App Logon</span>
          </button>
          <button
            onClick={() => setActiveTab('ios_app')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ios_app'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS App Logon</span>
          </button>
          <button
            onClick={() => setActiveTab('windows_app')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'windows_app'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Windows POS Logon</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Alert */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <strong className="font-bold">Admin Security Protocol:</strong> Inside the web Admin portal, non-admin users cannot log in. This user operates exclusively via the{' '}
              <strong className="underline">
                {activeTab === 'android_app'
                  ? 'Android App (Handheld POS / Waiter Captain / Rider)'
                  : activeTab === 'ios_app'
                  ? 'iOS App (iPad Table POS / iPhone Waiter)'
                  : 'Windows Desktop Cashier POS App'}
              </strong>
              .
            </div>
          </div>

          {/* QR Code and Credentials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left Box: Device QR Pairing Scan */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                Instant Device QR Pairing
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 inline-block mb-3">
                {/* SVG-based QR Code representation */}
                <div className="w-36 h-36 relative flex items-center justify-center bg-slate-50 rounded-xl p-2">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                    <rect width="100" height="100" fill="white" />
                    {/* Corners */}
                    <rect x="5" y="5" width="30" height="30" fill="currentColor" rx="4" />
                    <rect x="10" y="10" width="20" height="20" fill="white" rx="2" />
                    <rect x="15" y="15" width="10" height="10" fill="currentColor" rx="1" />

                    <rect x="65" y="5" width="30" height="30" fill="currentColor" rx="4" />
                    <rect x="70" y="10" width="20" height="20" fill="white" rx="2" />
                    <rect x="75" y="15" width="10" height="10" fill="currentColor" rx="1" />

                    <rect x="5" y="65" width="30" height="30" fill="currentColor" rx="4" />
                    <rect x="10" y="70" width="20" height="20" fill="white" rx="2" />
                    <rect x="15" y="75" width="10" height="10" fill="currentColor" rx="1" />

                    {/* Data Matrix Dots */}
                    <rect x="42" y="10" width="6" height="6" fill="currentColor" />
                    <rect x="52" y="10" width="6" height="6" fill="currentColor" />
                    <rect x="42" y="20" width="6" height="6" fill="currentColor" />
                    <rect x="42" y="42" width="16" height="16" fill="currentColor" rx="2" />
                    <rect x="10" y="45" width="6" height="6" fill="currentColor" />
                    <rect x="25" y="45" width="6" height="6" fill="currentColor" />
                    <rect x="65" y="45" width="6" height="6" fill="currentColor" />
                    <rect x="80" y="45" width="6" height="6" fill="currentColor" />
                    <rect x="45" y="68" width="6" height="6" fill="currentColor" />
                    <rect x="68" y="68" width="6" height="6" fill="currentColor" />
                    <rect x="80" y="68" width="6" height="6" fill="currentColor" />
                    <rect x="68" y="80" width="6" height="6" fill="currentColor" />
                    <rect x="52" y="85" width="6" height="6" fill="currentColor" />
                    <rect x="80" y="85" width="6" height="6" fill="currentColor" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="p-1 rounded-md bg-white shadow-xs border border-slate-200">
                      {activeTab === 'android_app' ? (
                        <Smartphone className="w-5 h-5 text-emerald-600" />
                      ) : activeTab === 'ios_app' ? (
                        <Apple className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Tv className="w-5 h-5 text-sky-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Point device camera in the{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {activeTab === 'android_app'
                    ? 'Android App'
                    : activeTab === 'ios_app'
                    ? 'iOS App'
                    : 'Windows App'}
                </strong>{' '}
                to sign in instantly.
              </p>
            </div>

            {/* Right Box: App Logon Details */}
            <div className="space-y-3 flex flex-col justify-between">
              {/* App Logon Code */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    {activeTab === 'android_app'
                      ? 'Android App Logon Code'
                      : activeTab === 'ios_app'
                      ? 'iOS App Logon Code'
                      : 'Windows Station Key'}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        activeTab === 'android_app'
                          ? androidCode
                          : activeTab === 'ios_app'
                          ? iosCode
                          : windowsStation,
                        'code'
                      )
                    }
                    className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'code' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 text-[10px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-lg font-black text-slate-900 dark:text-white tracking-wider">
                  {activeTab === 'android_app'
                    ? androidCode
                    : activeTab === 'ios_app'
                    ? iosCode
                    : windowsStation}
                </div>
              </div>

              {/* 4-Digit Security PIN */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Operator Security PIN
                  </span>
                  <button
                    onClick={() => copyToClipboard(user.pin || '1234', 'pin')}
                    className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'pin' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 text-[10px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xl font-black text-amber-600 dark:text-amber-400 tracking-widest">
                  {user.pin || '1234'}
                </div>
              </div>

              {/* Assigned Outlet & Role */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Role:</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">{user.role.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Branch:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{outlet?.name || 'Main Outlet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Status:</span>
                  <span className={`font-bold ${user.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {user.isActive ? 'Active & Permitted' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Launch Buttons */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Simulate or test launch this staff user on their client app:
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                disabled={isSimulatingLogin}
                onClick={() => handleSimulateAppLogin(activeTab)}
                className={`px-5 py-2 rounded-xl text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'android_app'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : activeTab === 'ios_app'
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
                }`}
              >
                {isSimulatingLogin ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Connecting App...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>
                      {activeTab === 'android_app'
                        ? 'Launch Android App Session →'
                        : activeTab === 'ios_app'
                        ? 'Launch iOS App Session →'
                        : 'Launch Windows POS Station →'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
