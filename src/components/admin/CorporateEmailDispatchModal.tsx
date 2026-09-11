import React, { useState } from 'react';
import {
  Building2,
  Check,
  Clock,
  Copy,
  ExternalLink,
  KeyRound,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  UserCheck,
  X,
} from 'lucide-react';
import { User } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface CorporateEmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onTestLogin?: (user: User) => void;
}

export const CorporateEmailDispatchModal: React.FC<CorporateEmailDispatchModalProps> = ({
  isOpen,
  onClose,
  user,
  onTestLogin,
}) => {
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const dispatch = user.credentialsDispatched || {
    sentAt: user.createdAt || new Date().toISOString(),
    sentToEmail: user.email,
    defaultPassword: user.password || 'Franchise#2026',
    brandSenderName: `${user.organizationName || 'Corporate Brand'} Corporate HQ`,
    brandSenderEmail: `corporate.credentials@${(user.organizationName || 'brand').toLowerCase().replace(/[^a-z0-9]/g, '')}.cafeos.in`,
    status: 'dispatched',
    dispatchSubject: `[${user.organizationName || 'Corporate HQ'}] Welcome to CaféOS - Your Franchise Admin Login & Demo Default Password`,
    assignedStoreNames: user.assignedStoreIds,
  };

  const handleCopyCredentials = () => {
    const text = `🏢 [${dispatch.brandSenderName}] Official Credentials Dispatch
=====================================================
Recipient Franchise: ${user.franchiseName || user.name}
Franchise Admin: ${user.name}
Role: Franchise Partner & Multi-Store Owner
Login Portal URL: https://cafeos.io/login
Official Email ID: ${user.email}
Demo Default Password: ${dispatch.defaultPassword || user.password || 'Franchise#2026'}
Registered Phone: ${user.phone}
Assigned Outlets: ${user.assignedStoreIds?.join(', ') || 'All Franchise Outlets'}
Sent From: ${dispatch.brandSenderName} <${dispatch.brandSenderEmail}>
Dispatched At: ${formatDateTime(dispatch.sentAt)}
-----------------------------------------------------
*Note: Please use this demo default password for initial setup. You will be prompted to set your personal admin credentials on first sign-in.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResendEmail = () => {
    setResending(true);
    setResendSuccess(false);
    setTimeout(() => {
      setResending(false);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Corporate Credentials Email Dispatch</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Dispatched to Franchise
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official onboarding email sent from {dispatch.brandSenderName} to Franchise Partner
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

        {/* Email Client Simulated View */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Metadata Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs font-mono">
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" /> From:
              </span>
              <span className="text-indigo-300 font-semibold text-right">
                {dispatch.brandSenderName}{' '}
                <span className="text-slate-400 font-normal">&lt;{dispatch.brandSenderEmail}&gt;</span>
              </span>
            </div>
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
                <Store className="w-3.5 h-3.5 text-amber-400" /> To (Franchise Email):
              </span>
              <span className="text-amber-300 font-bold text-right">
                {user.email}{' '}
                <span className="text-slate-400 font-normal">({user.name})</span>
              </span>
            </div>
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Dispatched At:
              </span>
              <span className="text-slate-300 text-right">{formatDateTime(dispatch.sentAt)}</span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
                Subject:
              </span>
              <span className="text-white font-bold text-right font-sans">
                {dispatch.dispatchSubject || `Welcome to ${user.organizationName || 'Corporate'} - Your Franchise Admin Credentials`}
              </span>
            </div>
          </div>

          {/* Email Body Preview Container */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-200 space-y-4 shadow-inner">
            {/* Corporate Header Banner */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
                  {user.organizationName ? user.organizationName.substring(0, 2).toUpperCase() : 'HQ'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    {user.organizationName || 'Corporate Organisation HQ'}
                  </h4>
                  <p className="text-[11px] text-slate-400">Franchise & Partner Operations Division</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                Ref: {user.franchiseGroupId || 'FG-DEFAULT'}
              </span>
            </div>

            {/* Salutation & Welcome */}
            <div className="space-y-2 text-xs leading-relaxed text-slate-300">
              <p>
                Dear <strong className="text-white font-bold">{user.name}</strong>,
              </p>
              <p>
                Welcome to the <span className="text-amber-300 font-bold">{user.organizationName || 'Brand'}</span> franchise network. 
                Your multi-store Franchise Admin account for{' '}
                <strong className="text-white">{user.franchiseName || 'Your Franchise Entity'}</strong> has been formally provisioned by Corporate Organisation.
              </p>
              <p>
                As a designated Franchise Owner, you can oversee your store outlets, manage branch managers, review nationwide menu synchronization, and recruit store staff (billers, cashiers, and delivery boys) with device PIN logins.
              </p>
            </div>

            {/* Highlighted Credentials Box */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Franchise Admin Login Credentials
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Demo Default Password
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Login Portal URL</span>
                  <span className="text-white font-bold break-all">https://cafeos.io/login</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Franchise Email ID</span>
                  <span className="text-amber-300 font-bold break-all">{user.email}</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Demo Default Password</span>
                    <span className="text-emerald-400 font-extrabold text-sm tracking-wider">
                      {dispatch.defaultPassword || user.password || 'Franchise#2026'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCredentials}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Password'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                <p className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <strong>First-Time Login Instruction:</strong>
                </p>
                <p className="pl-5 text-slate-400">
                  Please log in with this demo default password sent by Corporate. Upon initial access, you will have full multi-store administrative permissions.
                </p>
              </div>
            </div>

            {/* Assigned Outlets */}
            {user.assignedStoreIds && user.assignedStoreIds.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 block mb-1 font-semibold">
                  Authorized Multi-Store Outlets ({user.assignedStoreIds.length} stores):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {user.assignedStoreIds.map((storeId) => (
                    <span
                      key={storeId}
                      className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono"
                    >
                      {storeId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sign-off */}
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p>Warm regards,</p>
              <p className="font-bold text-white">{dispatch.brandSenderName}</p>
              <p className="text-[11px] text-slate-500">Corporate Portal Administration Desk &bull; CaféOS Ecosystem</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{resendSuccess ? 'Dispatched Again!' : 'Resend to Franchise Email'}</span>
            </button>
            <button
              onClick={handleCopyCredentials}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy All Details'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onTestLogin && (
              <button
                onClick={() => {
                  onTestLogin(user);
                  onClose();
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Test Login as Franchise Admin</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
