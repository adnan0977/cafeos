import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, X, Check, Delete, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Admin Authorization Required',
  description = 'Enter Store Manager or Super Admin password / PIN to access Admin Dashboard',
}) => {
  const { verifyAdminPassword } = useAuth();
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    if (passwordInput.length < 20) {
      setPasswordInput((prev) => prev + digit);
      setErrorMessage('');
    }
  };

  const handleBackspace = () => {
    setPasswordInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPasswordInput('');
    setErrorMessage('');
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMessage('Please enter the admin password or PIN');
      return;
    }

    setIsVerifying(true);
    const isValid = verifyAdminPassword(passwordInput.trim());

    if (isValid) {
      setIsVerifying(false);
      setPasswordInput('');
      setErrorMessage('');
      onSuccess();
    } else {
      setIsVerifying(false);
      setErrorMessage('Incorrect admin password or PIN. Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleVerify} className="space-y-4">
            {/* Input Field */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Admin Password or 4-Digit PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Enter admin password or PIN (e.g. 1234, 2222)"
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-mono text-center tracking-widest text-lg font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Touch Keypad for POS Terminals */}
            <div className="pt-2">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigitClick(digit)}
                    className="py-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-lg rounded-2xl transition-all active:scale-95 cursor-pointer shadow-xs border border-slate-200 dark:border-slate-700/60"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-black uppercase rounded-2xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleDigitClick('0')}
                  className="py-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-lg rounded-2xl transition-all active:scale-95 cursor-pointer shadow-xs border border-slate-200 dark:border-slate-700/60"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Demo Hint */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                Demo Admin PINs: <strong>1234</strong> (Super Admin) or <strong>2222</strong> (Store Admin)
              </span>
              <button
                type="button"
                onClick={() => setPasswordInput('1234')}
                className="text-amber-600 hover:text-amber-500 font-bold underline cursor-pointer"
              >
                Autofill 1234
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Unlock Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
