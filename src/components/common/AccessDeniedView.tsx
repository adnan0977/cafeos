import {
  AlertOctagon,
  ArrowRight,
  ChevronRight,
  KeyRound,
  Lock,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Tv,
  Users,
} from 'lucide-react';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { getRoleDetails } from '../../utils/formatters';

interface AccessDeniedViewProps {
  requiredRoleLabel?: string;
  requiredRoles?: UserRole[];
  currentPortalName: string;
  onNavigate: (tabId: string) => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredRoleLabel = 'Store Manager or Super Admin',
  requiredRoles = ['super_admin', 'admin'],
  currentPortalName,
  onNavigate,
}) => {
  const { currentUser, logout, quickLoginAs } = useAuth();
  const roleDetails = currentUser ? getRoleDetails(currentUser.role) : null;

  // Determine user's designated primary portal
  const getDefaultPortalForUser = (role?: UserRole): { id: string; label: string } => {
    switch (role) {
      case 'cashier':
        return { id: 'pos', label: 'POS Terminal' };
      case 'kitchen_staff':
        return { id: 'kds', label: 'Kitchen Display (KDS)' };
      case 'biller':
        return { id: 'biller', label: 'Billing Counter' };
      case 'inventory_staff':
        return { id: 'inventory', label: 'Inventory & Store' };
      case 'delivery_rider':
        return { id: 'rider', label: 'Rider Delivery Portal' };
      case 'employee':
        return { id: 'sop', label: 'SOP & Operations' };
      case 'admin':
      case 'super_admin':
        return { id: 'admin', label: 'Admin Dashboard' };
      default:
        return { id: 'login', label: 'Login Station' };
    }
  };

  const defaultPortal = getDefaultPortalForUser(currentUser?.role);

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-slate-100 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Shield Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
          <span className="absolute -bottom-1 -right-1 p-1 bg-rose-600 text-white rounded-full">
            <Lock className="w-3 h-3" />
          </span>
        </div>

        {/* Heading */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-xs font-black uppercase tracking-wider mb-2">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Admin Protected Area</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Access Restricted: Admin Only
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inside Admin, no one else is permitted to log in. Non-admin staff operate exclusively through their assigned <strong className="text-slate-800 dark:text-slate-200">Android App, iOS App, or Windows POS App</strong>.
          </p>
        </div>

        {/* Current User Role Identity Pill */}
        {currentUser && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Logged in User:</span>
              <div className="flex items-center gap-1.5">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-extrabold text-slate-900 dark:text-white">{currentUser.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Assigned Role:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${roleDetails?.bg} ${roleDetails?.text}`}>
                {roleDetails?.label}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 font-medium">Required Authorization:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px]">
                {requiredRoleLabel}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Primary Action: Go to user's assigned portal */}
          <button
            onClick={() => onNavigate(defaultPortal.id)}
            className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
          >
            <span>Return to {defaultPortal.label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary Action: Switch Account / Open Login Station */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('login')}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Login Station</span>
            </button>

            <button
              onClick={() => {
                logout();
                onNavigate('login');
              }}
              className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Quick Manager Override for Demo / Testing */}
          <div className="pt-2">
            <button
              onClick={() => {
                quickLoginAs('super_admin');
                onNavigate('admin');
              }}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold"
            >
              👑 Quick Switch to Store Manager / Admin Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
