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
  Eye,
  Layers,
  Power,
  RefreshCw,
  RotateCw,
  Server,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { OfflineTransaction, OfflineTransactionStatus } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const OfflineSyncModal: React.FC = () => {
  const {
    isSyncModalOpen,
    setIsSyncModalOpen,
    isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    syncStats,
    offlineQueue,
    syncNow,
    retryTransaction,
    deleteOfflineTransaction,
    clearSyncedTransactions,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'queue' | 'diagnostics' | 'guide'>('queue');
  const [statusFilter, setStatusFilter] = useState<OfflineTransactionStatus | 'all'>('all');
  const [selectedTxForInspect, setSelectedTxForInspect] = useState<OfflineTransaction | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isSyncModalOpen) return null;

  const filteredQueue = offlineQueue.filter((tx) => {
    if (statusFilter === 'all') return true;
    return tx.status === statusFilter;
  });

  const handleSyncClick = async () => {
    setIsManualSyncing(true);
    setSyncFeedback(null);
    try {
      await syncNow();
      setSyncFeedback('Background synchronization completed successfully!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Sync failed');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getStatusBadge = (status: OfflineTransactionStatus) => {
    switch (status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Queued
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <RotateCw className="w-3 h-3 animate-spin" />
            Syncing...
          </span>
        );
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Synced
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('ORDER')) return '🛍️';
    if (type.includes('PAYMENT')) return '💳';
    if (type.includes('SHIFT')) return '💰';
    if (type.includes('STOCK') || type.includes('PURCHASE')) return '📦';
    if (type.includes('SOP')) return '📋';
    if (type.includes('REFUND')) return '↩️';
    return '⚡';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl border ${
                isOnline
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Offline Sync & IndexedDB Engine
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    isOnline
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                  }`}
                >
                  {isOnline ? '🟢 Live Online' : '🟠 Offline Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Service Worker shell caching & IndexedDB transaction queuing during internet outages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulate Outage Button */}
            <button
              onClick={() => toggleSimulatedOffline()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                isSimulatedOffline
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/20'
                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
              title="Toggle simulated network drop to test queuing without unplugging router"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isSimulatedOffline ? 'Simulating Outage (Click to Restore)' : 'Test Offline Outage'}</span>
            </button>

            <button
              onClick={() => setIsSyncModalOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="p-4 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Pending Queue</span>
              <ArrowDownUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              <span>{syncStats.queuedCount}</span>
              {syncStats.queuedCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  Ready to Sync
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Synced Transactions</span>
              <Cloud className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {syncStats.syncedCount}
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>IndexedDB Storage</span>
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {syncStats.storageUsageBytes
                ? syncStats.storageUsageBytes > 1024 * 1024
                  ? `${(syncStats.storageUsageBytes / (1024 * 1024)).toFixed(1)} MB`
                  : `${Math.round(syncStats.storageUsageBytes / 1024)} KB`
                : '142 KB'}
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Last Background Sync</span>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 truncate">
              {syncStats.lastSyncTime ? formatDateTime(syncStats.lastSyncTime) : 'Never synced yet'}
            </div>
          </div>
        </div>

        {/* Sync Feedback Alert */}
        {syncFeedback && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{syncFeedback}</span>
            </div>
            <button onClick={() => setSyncFeedback(null)} className="text-emerald-400 hover:text-emerald-600">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs & Actions */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>Transaction Queue ({offlineQueue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'diagnostics'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>System & Storage Diagnostics</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Offline Architecture</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {syncStats.syncedCount > 0 && (
              <button
                onClick={clearSyncedTransactions}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1"
                title="Clear already synchronized transactions"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Synced</span>
              </button>
            )}

            <button
              onClick={handleSyncClick}
              disabled={isManualSyncing || !isOnline}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium mr-1">Filter:</span>
                {(['all', 'queued', 'syncing', 'synced', 'failed'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors ${
                      statusFilter === filter
                        ? 'bg-slate-800 text-white dark:bg-slate-700'
                        : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              {filteredQueue.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {statusFilter === 'all'
                      ? 'Offline Transaction Queue Is Empty'
                      : `No transactions found with status "${statusFilter}"`}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    When orders, payments, or kitchen updates are executed offline, they will immediately appear
                    here and be held securely in IndexedDB until internet access is restored.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQueue.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-[280px]">
                        <div className="text-2xl select-none pt-0.5">{getTypeIcon(tx.type)}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {tx.description}
                            </span>
                            {getStatusBadge(tx.status)}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            <span>ID: {tx.id.slice(-8)}</span>
                            <span>•</span>
                            <span>By: {tx.actor.name} ({tx.actor.role})</span>
                            <span>•</span>
                            <span>{formatDateTime(tx.createdAt)}</span>
                          </div>
                          {tx.error && (
                            <div className="mt-1 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Error: {tx.error}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {tx.amount !== undefined && (
                          <div className="text-right mr-2">
                            <div className="text-xs font-black text-slate-900 dark:text-white">
                              {formatCurrency(tx.amount)}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Value</div>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedTxForInspect(tx)}
                          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Inspect JSON Payload"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {tx.status === 'failed' && (
                          <button
                            onClick={() => retryTransaction(tx.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}

                        <button
                          onClick={() => deleteOfflineTransaction(tx.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Discard transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Service Worker Status */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Smartphone className="w-4 h-4 text-amber-500" />
                    <span>Service Worker (App Shell & PWA)</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">Registration State:</span>
                      <span className="font-bold text-emerald-500">Active & Running</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">Cache Strategy:</span>
                      <span className="font-mono">Stale-While-Revalidate</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">Background Sync API:</span>
                      <span className="font-bold text-emerald-500">Supported (cafeos-sync-queue)</span>
                    </div>
                  </div>
                </div>

                {/* IndexedDB Engine Status */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>IndexedDB Persistence Store</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">Database Name:</span>
                      <span className="font-mono font-bold text-amber-500">CafeOS_IndexedDB_v1</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">Object Stores:</span>
                      <span className="font-mono">offline_transactions, snapshots, sync_logs</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">Snapshot Backup:</span>
                      <span className="font-bold text-emerald-500">Automatic on State Change</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offline Resiliency Highlights */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span>Continuous Outage Resilience</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Even during complete internet disconnections or router failure, CaféOS never halts front-of-house
                  order taking, KDS prep tickets, table seatings, or cash drawer settlements. All changes are committed
                  locally and mirrored to IndexedDB immediately.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>How Offline Sync Works in CaféOS</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li>
                    <strong className="text-slate-900 dark:text-white">Local-First Execution:</strong> Every order,
                    KOT, payment, and shift change writes directly to local memory and IndexedDB. Front-of-house and
                    kitchen operations continue with zero latency.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Transaction Enqueuing:</strong> Outage
                    transactions are stamped with user ID, role, exact timestamp, and JSON payloads and placed in the
                    IndexedDB queue.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Auto-Recovery & Background Sync:</strong> The
                    Service Worker detects connection recovery and automatically syncs the queue in strict
                    chronological order.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Conflict Resolution:</strong> Timestamps and
                    actor IDs prevent race conditions during multi-terminal reconciliation.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>CaféOS Offline Sync Engine • IndexedDB & Service Worker v1.0</span>
          <button
            onClick={() => setIsSyncModalOpen(false)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedTxForInspect && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-black text-sm text-slate-900 dark:text-white">
                Transaction Inspector: {selectedTxForInspect.type}
              </div>
              <button
                onClick={() => setSelectedTxForInspect(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] max-h-80 overflow-auto">
              {JSON.stringify(selectedTxForInspect, null, 2)}
            </pre>
            <div className="text-right">
              <button
                onClick={() => setSelectedTxForInspect(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
