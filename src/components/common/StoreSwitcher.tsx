import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  ChevronDown,
  Building2,
  Check,
  TrendingUp,
  MapPin,
  Monitor,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

interface StoreSwitcherProps {
  onNavigateToOutlets?: () => void;
}

export const StoreSwitcher: React.FC<StoreSwitcherProps> = ({ onNavigateToOutlets }) => {
  const {
    outlets,
    activeOutletId,
    activeOutlet,
    accessibleOutlets,
    setActiveOutletId,
    isConsolidatedStoreView,
    setIsConsolidatedStoreView,
    isSuperAdmin,
    isFranchiseOwner,
  } = useRestaurant();

  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Aggregate stats across accessible stores for this user
  const totalCombinedSales = accessibleOutlets.reduce((sum, o) => sum + (o.todaySales || 0), 0);
  const totalCombinedOrders = accessibleOutlets.reduce((sum, o) => sum + (o.todayOrders || 0), 0);

  const handleSelectOutlet = (outletId: string) => {
    setActiveOutletId(outletId);
    setIsConsolidatedStoreView(false);
    setIsOpen(false);
  };

  const handleToggleConsolidated = () => {
    setIsConsolidatedStoreView(!isConsolidatedStoreView);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-left transition-all ${
          isOpen
            ? 'bg-amber-500/10 border-amber-500/40 dark:border-amber-500/50 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
            : isConsolidatedStoreView
            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:border-indigo-300'
            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-slate-800'
        } shadow-2xs`}
        title="Switch between your assigned stores / outlets"
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isConsolidatedStoreView
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-500 text-white'
              : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs shadow-amber-500/20'
          }`}
        >
          {isConsolidatedStoreView ? (
            <Layers className="w-3.5 h-3.5" />
          ) : (
            <Store className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="hidden md:block max-w-[170px] lg:max-w-[210px] text-left">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="text-xs font-bold truncate">
              {isConsolidatedStoreView ? 'All Stores (Consolidated)' : activeOutlet.name}
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {isConsolidatedStoreView ? `${accessibleOutlets.length} Outlets` : activeOutlet.code}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
            {isSuperAdmin ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">Organisation HQ</span>
            ) : isFranchiseOwner ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Franchise Owner</span>
            ) : (
              <span>{activeOutlet.city}</span>
            )}
            <span>•</span>
            <span>{accessibleOutlets.length} Store{accessibleOutlets.length > 1 ? 's' : ''} Managed</span>
          </p>
        </div>

        {/* Mobile-only compact text */}
        <div className="md:hidden text-left">
          <span className="text-xs font-bold block max-w-[90px] truncate">
            {isConsolidatedStoreView ? 'All Stores' : activeOutlet.name.split(' ')[0]}
          </span>
          <span className="text-[9px] text-slate-500 font-mono block">
            {activeOutlet.code}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform ${
            isOpen ? 'rotate-180 text-amber-600' : ''
          }`}
        />
      </button>

      {/* Multi-Store Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[340px] sm:w-[420px] max-w-[92vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-amber-50/50 dark:from-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    Multi-Store Management
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Manage multiple outlets from a single login
                  </p>
                </div>
              </div>

              {/* User Hierarchy Badge */}
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  isSuperAdmin
                    ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {isSuperAdmin ? '🏢 Super Admin (HQ)' : '🏪 Franchise Owner'}
              </span>
            </div>

            {/* Franchise Owner Details */}
            <div className="mt-2 text-xs bg-white/80 dark:bg-slate-800/80 rounded-xl p-2 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Logged In User & Franchise
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {currentUser?.name || 'Franchise Partner'}
                </span>
                {currentUser?.franchiseName && (
                  <span className="block text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    {currentUser.franchiseName}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Assigned Stores
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {accessibleOutlets.length} Store{accessibleOutlets.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Consolidated Overview Card (If multiple stores exist) */}
          {accessibleOutlets.length > 1 && (
            <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
              <button
                onClick={handleToggleConsolidated}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isConsolidatedStoreView
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isConsolidatedStoreView
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        Consolidated Multi-Store View
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                        {accessibleOutlets.length} Stores Total
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Combined Revenue: <strong className="text-slate-900 dark:text-white">{formatCurrency(totalCombinedSales)}</strong> ({totalCombinedOrders} orders today)
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  {isConsolidatedStoreView ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      View All &rarr;
                    </span>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Assigned Stores List */}
          <div className="max-h-[320px] overflow-y-auto p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Select Active Operating Store
            </div>

            {accessibleOutlets.map((outlet) => {
              const isSelected = activeOutletId === outlet.id && !isConsolidatedStoreView;

              return (
                <div
                  key={outlet.id}
                  onClick={() => handleSelectOutlet(outlet.id)}
                  className={`group p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/70 hover:border-amber-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-amber-100 group-hover:text-amber-700'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {outlet.name}
                          </span>
                          {outlet.isMain && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                              Flagship
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-medium px-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {outlet.code}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{outlet.city}</span>
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Today: {formatCurrency(outlet.todaySales || 0)}
                          </span>
                          <span>•</span>
                          <span>{outlet.todayOrders || 0} orders</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Monitor className="w-2.5 h-2.5" />
                            {outlet.terminalCount} Terminals
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" /> Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Active: <strong>{isConsolidatedStoreView ? 'All Stores' : activeOutlet.code}</strong>
            </span>

            {onNavigateToOutlets && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToOutlets();
                }}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold flex items-center gap-1 hover:underline"
              >
                <span>Branch & Outlets Admin</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
