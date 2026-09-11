import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownUp,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  CloudOff,
  Database,
  Download,
  FileJson,
  Flame,
  HardDrive,
  History,
  Info,
  Layers,
  Percent,
  Power,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Upload,
  Utensils,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const CatalogSyncModal: React.FC = () => {
  const {
    isCatalogSyncModalOpen,
    setIsCatalogSyncModalOpen,
    catalogManifest,
    hasCatalogUpdate,
    isCatalogSyncing,
    lastCatalogSyncResult,
    syncCatalogFromAdmin,
    isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    syncStats,
    syncNow,
    exportCatalogPackage,
    importCatalogPackage,
    categories,
    menuItems,
    modifiers,
    coupons,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'overview' | 'changelog' | 'airgap' | 'offline_guide'>('overview');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isPushingOrders, setIsPushingOrders] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isCatalogSyncModalOpen) return null;

  const handleSyncClick = async () => {
    setSyncFeedback(null);
    try {
      const res = await syncCatalogFromAdmin(true);
      setSyncFeedback(
        `Synced with Admin successfully! (${res.itemsCount} Items, ${res.variantsCount} Variants, ${res.categoriesCount} Categories, ${res.modifiersCount} Add-ons, ${res.couponsCount} Active Offers). Local IndexedDB cache updated!`
      );
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Sync failed.');
    }
  };

  const handlePushOrdersClick = async () => {
    setIsPushingOrders(true);
    try {
      await syncNow();
      setSyncFeedback('Pending offline orders pushed to Admin successfully!');
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Order sync failed');
    } finally {
      setIsPushingOrders(false);
    }
  };

  const handleImportPackage = async () => {
    if (!importJsonText.trim()) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const res = await importCatalogPackage(importJsonText);
      setSyncFeedback(`Imported catalog package ${res.version} successfully!`);
      setImportJsonText('');
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setImportError(err?.message || 'Failed to import catalog package.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  const totalActiveCoupons = coupons.filter((c) => c.isActive).length;
  const totalVariants = menuItems.reduce((acc, i) => acc + (i.variants?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Title Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <RotateCw className={`w-5 h-5 ${isCatalogSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Admin Catalog & Offers Sync Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {catalogManifest.version}
                </span>
                {hasCatalogUpdate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Updates Available
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Bidirectional synchronization between Admin Backoffice and Offline-First Terminals (Windows & Android)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCatalogSyncModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status & Fast Action Bar */}
        <div className="bg-slate-50 dark:bg-slate-950/70 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Online Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold shadow-2xs">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 dark:text-emerald-400">Online (Connected)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400">
                    Offline Mode ({isSimulatedOffline ? 'Simulated' : 'No Network'})
                  </span>
                </>
              )}
            </div>

            {/* Offline Queue Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold shadow-2xs">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>Offline Orders Queue:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[11px]">
                {syncStats.queuedCount} pending
              </span>
            </div>

            {/* Last Admin Update Info */}
            <div className="hidden md:flex items-center gap-1 text-slate-500 text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>Admin Updated: {formatDateTime(catalogManifest.lastUpdatedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Simulate Offline */}
            <button
              type="button"
              onClick={() => toggleSimulatedOffline()}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer text-xs ${
                isSimulatedOffline
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
              title="Toggle simulated offline state to test billing with 0% network"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isSimulatedOffline ? 'Exit Offline Sim' : 'Simulate Offline Mode'}</span>
            </button>

            {/* Sync Now Button */}
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isCatalogSyncing}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isCatalogSyncing ? 'animate-spin' : ''}`} />
              <span>{isCatalogSyncing ? 'Syncing...' : 'Sync from Admin Now'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Message Banner */}
        {syncFeedback && (
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Updates Available Notification */}
        {hasCatalogUpdate && !syncFeedback && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>
                New updates published by Admin ({catalogManifest.summary}). Click &quot;Sync from Admin Now&quot; to update your local terminal catalog.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSyncClick}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
            >
              Sync Update
            </button>
          </div>
        )}

        {/* 4 Metric Badges of Synced Catalog */}
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          {/* Offers & Coupons */}
          <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
              <span className="text-[11px] font-bold">Active Offers & Coupons</span>
              <Tag className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalActiveCoupons}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Discounts, BOGO & Promos
            </div>
          </div>

          {/* Categories */}
          <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/20">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
              <span className="text-[11px] font-bold">Menu Categories</span>
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {categories.length}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Active Dish Taxonomies
            </div>
          </div>

          {/* Items & Variants */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-[11px] font-bold">Dishes & Variants</span>
              <Utensils className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {menuItems.length}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({totalVariants} variants)
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Sizes, Regular & Combos
            </div>
          </div>

          {/* Add-ons & Modifiers */}
          <div className="p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/20">
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
              <span className="text-[11px] font-bold">Add-ons & Modifiers</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {modifiers.length}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Toppings, Extra Cheese, Dips
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sync Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'changelog'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Admin Changelog ({catalogManifest.recentChanges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('airgap')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'airgap'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Air-Gapped Package (USB / JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offline_guide')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'offline_guide'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Offline Architecture Guide</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs bg-slate-50/50 dark:bg-slate-950/30">
          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-600" />
                    <span>Local Offline Cache Status</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Engine: IndexedDB (Store: database_snapshots)
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300">
                  Every category, dish, variant pricing, modifier add-on, and active promotional offer is saved directly into local IndexedDB and localStorage on this terminal. Even if the internet cable is cut or Wi-Fi goes down completely, the Cashier can continue punch-in, apply coupons, select variants, and print thermal KOTs without interruption.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Synced Catalog Version</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {catalogManifest.version}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Author: {catalogManifest.updatedBy}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Pending Offline Transactions</span>
                    <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm flex items-center justify-between">
                      <span>{syncStats.queuedCount} orders queued</span>
                      {syncStats.queuedCount > 0 && isOnline && (
                        <button
                          type="button"
                          onClick={handlePushOrdersClick}
                          disabled={isPushingOrders}
                          className="text-xs px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold cursor-pointer"
                        >
                          {isPushingOrders ? 'Pushing...' : 'Push Now'}
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Will automatically drain when online connection is active
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Offers Preview */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>Active Admin Offers Cached on Terminal</span>
                  </h4>
                  <span className="text-xs font-bold text-amber-600">{totalActiveCoupons} Active</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {coupons
                    .filter((c) => c.isActive)
                    .map((coupon) => (
                      <div
                        key={coupon.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-amber-600 text-xs">
                            {coupon.code}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            {coupon.discountType === 'percent'
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue} FLAT`}
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-1">
                          {coupon.title}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Min: ₹{coupon.minOrderAmount || 0}</span>
                          <span>Cap: {coupon.maxDiscountAmount ? `₹${coupon.maxDiscountAmount}` : 'No Cap'}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Changelog */}
          {activeTab === 'changelog' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Audit Feed of Admin Catalog Modifications
                </h4>
                <span className="text-[11px] text-slate-500">
                  Showing last {catalogManifest.recentChanges.length} events
                </span>
              </div>

              <div className="space-y-2">
                {catalogManifest.recentChanges.map((change) => {
                  const getBadge = () => {
                    switch (change.type) {
                      case 'offer':
                        return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30';
                      case 'category':
                        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
                      case 'item':
                        return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
                      case 'variant':
                        return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30';
                      case 'modifier':
                        return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
                      default:
                        return 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30';
                    }
                  };

                  return (
                    <div
                      key={change.id}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getBadge()}`}
                          >
                            {change.type}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {change.title}
                          </span>
                        </div>
                        {change.details && (
                          <p className="text-slate-500 text-[11px] font-mono line-clamp-2">
                            {change.details}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-400">
                          By: {change.actor} • {formatDateTime(change.timestamp)}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {change.action.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Air-Gapped Package (USB / JSON) */}
          {activeTab === 'airgap' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-600" />
                    <span>Export Air-Gapped Catalog Package (.json)</span>
                  </h4>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  For franchise outlets, food trucks, or remote highway locations operating without internet connectivity, the Admin can export a full standalone Catalog Package (.json). You can copy this file to a USB flash drive and import it directly on any cashier station.
                </p>
                <button
                  type="button"
                  onClick={exportCatalogPackage}
                  className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download Standalone Catalog (.json)</span>
                </button>
              </div>

              {/* Import Section */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Import Offline Catalog Package</span>
                  </h4>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Upload a Catalog JSON package exported from Admin to update all dishes, variants, modifier add-ons, and offers on this terminal without any internet connection.
                </p>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select .json file from USB</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <span className="text-[11px] text-slate-400">or paste JSON payload below</span>
                </div>

                <textarea
                  rows={4}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste exported catalog package JSON here..."
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                />

                {importError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleImportPackage}
                    disabled={!importJsonText.trim() || isImporting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-40"
                  >
                    {isImporting ? 'Importing...' : 'Apply Catalog Package'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Offline Guide */}
          {activeTab === 'offline_guide' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  How CaféOS Offline-First Architecture Operates
                </h4>
                <div className="space-y-3 text-slate-600 dark:text-slate-300 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      1. Offline Cashier Billing & Printing
                    </div>
                    <p>
                      When the terminal loses internet or is in an offline venue, the cashier can continue punching orders, selecting variants (e.g. Regular/Large), applying add-on toppings, and calculating active discount offers. Thermal receipts and KOTs print directly over USB/LAN without contacting the cloud.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      2. Admin Catalog Updates & Versioning
                    </div>
                    <p>
                      Whenever an Admin adds a new menu item, creates a category, configures new variants, adds modifier toppings, or creates an offer in the Admin Dashboard, CaféOS automatically increments the catalog version (e.g. v1.1 → v1.2) and broadcasts the update.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      3. One-Click Synchronization
                    </div>
                    <p>
                      The terminal displays an &quot;Updates Available&quot; indicator. Clicking &quot;Sync from Admin Now&quot; pulls the latest catalog into the local IndexedDB cache in milliseconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-mono text-[11px]">
            CaféOS Version: {catalogManifest.version} • Status:{' '}
            <span className={hasCatalogUpdate ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
              {hasCatalogUpdate ? 'Out of Sync with Admin' : 'In Sync with Admin'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCatalogSyncModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isCatalogSyncing}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isCatalogSyncing ? 'animate-spin' : ''}`} />
              <span>Sync from Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
