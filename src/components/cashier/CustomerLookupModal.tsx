import { Award, Check, Crown, Plus, Search, ShieldCheck, Sparkles, Star, User, UserPlus, X } from 'lucide-react';
import React, { useState } from 'react';
import { Customer } from '../../types';
import { getCustomerTierInfo } from '../../utils/loyaltyUtils';

interface CustomerLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSelectCustomer: (customer: Customer | { name: string; phone: string }) => void;
  onRegisterNewCustomer: (name: string, phone: string, email?: string) => void;
}

export const CustomerLookupModal: React.FC<CustomerLookupModalProps> = ({
  isOpen,
  onClose,
  customers,
  onSelectCustomer,
  onRegisterNewCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim() || !newName.trim()) return;
    onRegisterNewCustomer(newName.trim(), newPhone.trim(), newEmail.trim());
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-400" />
            <h3 className="font-extrabold text-sm">Customer & Loyalty Lookup [F3]</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!isCreating ? (
            <>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by phone number or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filtered.length > 0 ? (
                  filtered.map((cust) => {
                    const pts = cust.loyaltyPoints ?? (cust as any).points ?? 0;
                    const tierInfo = getCustomerTierInfo(pts);
                    return (
                      <button
                        key={cust.id}
                        onClick={() => {
                          onSelectCustomer(cust);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 bg-slate-50/50 dark:bg-slate-800/40 text-left flex items-center justify-between transition-colors group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-sky-400 transition-colors">
                              {cust.name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                tierInfo.tier === 'platinum'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30'
                                  : tierInfo.tier === 'gold'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                  : tierInfo.tier === 'silver'
                                  ? 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30'
                                  : 'bg-orange-500/10 text-orange-600 dark:text-amber-400 border-orange-500/30'
                              }`}
                            >
                              {tierInfo.tier === 'platinum' && <Sparkles className="w-2.5 h-2.5" />}
                              {tierInfo.tier === 'gold' && <Crown className="w-2.5 h-2.5" />}
                              {tierInfo.tier === 'silver' && <ShieldCheck className="w-2.5 h-2.5" />}
                              {tierInfo.tier === 'bronze' && <Award className="w-2.5 h-2.5" />}
                              <span>{tierInfo.label}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{cust.phone}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{pts} pts</span>
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {cust.totalOrders || 0} visits
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No customers found matching "{search}"
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (search.match(/^\d+$/)) {
                      setNewPhone(search);
                    } else {
                      setNewName(search);
                    }
                    setIsCreating(true);
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Register New Customer</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
                >
                  Cancel (ESC)
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-sky-500" />
                <span>Register New Loyalty Member</span>
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Customer Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Save &amp; Link Customer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
