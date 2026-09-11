import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, resetUserPIN } = useAuth();

  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Check current PIN
    const isCurrentValid =
      currentUser.pin === currentPinInput.trim() ||
      (currentPinInput.trim() === '1234' && !currentUser.pin);

    if (!isCurrentValid) {
      setErrorMessage('Current PIN is incorrect. Please re-enter your current 4-digit PIN.');
      return;
    }

    // 2. Validate New PIN format
    const cleanNewPin = newPinInput.trim();
    if (!/^\d{4,6}$/.test(cleanNewPin)) {
      setErrorMessage('New PIN must be 4 to 6 digits numeric.');
      return;
    }

    // 3. Confirm match
    if (cleanNewPin !== confirmPinInput.trim()) {
      setErrorMessage('New PIN and Confirmation PIN do not match.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      resetUserPIN(currentUser.id, cleanNewPin);
      setSuccessMessage('Your access PIN has been updated successfully!');
      setIsSubmitting(false);
      setTimeout(() => {
        onClose();
        setCurrentPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
        setSuccessMessage('');
      }, 1200);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Change Security PIN
              </h3>
              <p className="text-xs text-slate-500">
                Update personal quick login PIN for {currentUser.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Current PIN Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Current PIN
            </label>
            <div className="relative">
              <input
                type={showPins ? 'text' : 'password'}
                required
                maxLength={6}
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter current 4-digit PIN"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New PIN Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              New 4-Digit PIN
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              required
              maxLength={6}
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 5678"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 outline-hidden font-mono"
            />
          </div>

          {/* Confirm New PIN Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New PIN
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              required
              maxLength={6}
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Re-enter new PIN"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 outline-hidden font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentPinInput || !newPinInput || !confirmPinInput}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Update My PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
