import {
  CheckCircle,
  Cpu,
  Database,
  HardDrive,
  Monitor,
  Printer,
  RefreshCw,
  Signal,
  Wifi,
  X,
} from 'lucide-react';
import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';

interface DeviceSummaryModalProps {
  onClose: () => void;
}

export const DeviceSummaryModal: React.FC<DeviceSummaryModalProps> = ({ onClose }) => {
  const { isOnline, syncStats } = useRestaurant();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">POS Terminal Device & Hardware Summary</h3>
              <p className="text-xs text-slate-400">System diagnostics, thermal printers, database cache</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Info */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Main Terminal Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-900 dark:text-white">RoyalPOS Terminal #01</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[10px]">
                Active & Operational
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>App Version: <strong className="text-slate-900 dark:text-white">RoyalPOS 6.4.7</strong></div>
              <div>Device ID: <strong className="text-amber-600 font-mono">45768-T01</strong></div>
              <div>Platform: <strong className="text-slate-900 dark:text-white">Web / PWA Cloud Ingress</strong></div>
              <div>Screen DPI: <strong className="text-slate-900 dark:text-white">1920x1080 (Retina)</strong></div>
            </div>
          </div>

          {/* Network & Local DB */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span>Network Ingress</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {isOnline ? 'Online (50ms ping)' : 'Offline (Simulated / Standalone)'}
              </p>
              <div className="text-[10px] text-emerald-600 font-bold">Port 3000 Secured</div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Database className="w-4 h-4 text-cyan-500" />
                <span>IndexedDB Storage</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {syncStats.offlineQueueCount} pending offline queue
              </p>
              <div className="text-[10px] text-cyan-600 font-bold">LocalStorage Synced</div>
            </div>
          </div>

          {/* Peripheral Hardware Status */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">Connected POS Peripherals</h4>
            <div className="space-y-2">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">EPSON TM-T82X (Thermal 80mm)</div>
                    <div className="text-[11px] text-slate-400">USB / Ethernet • Kitchen KOT Printer</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Citizen CT-S310II (Cash Counter)</div>
                    <div className="text-[11px] text-slate-400">Bluetooth / RJ11 Cash Drawer Kick</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Electronic Cash Drawer (RJ11)</div>
                    <div className="text-[11px] text-slate-400">Auto-triggers on cash receipt print</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                  Armed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 font-bold text-xs rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
