import {
  Check,
  Cpu,
  Info,
  Network,
  Printer,
  Save,
  Sliders,
  Usb,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { HoinPrinterSettings } from '../../types';

interface HoinSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HoinSettingsModal: React.FC<HoinSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings } = useRestaurant();
  const { currentUser } = useAuth();

  const currentPrinter: HoinPrinterSettings = settings.hoinPrinter || {
    printerName: 'HOIN HOP-H58 / HOP-E801 Thermal Printer',
    printerType: 'hoin_thermal',
    connectionType: 'browser',
    paperWidth: '80mm',
    printerIp: '192.168.1.100',
    printerPort: '9100',
    autoCut: true,
    openDrawer: false,
  };

  const [threshold, setThreshold] = useState<number>(
    settings.lowStockThreshold !== undefined ? settings.lowStockThreshold : 10
  );
  const [printerName, setPrinterName] = useState(currentPrinter.printerName);
  const [printerType, setPrinterType] = useState(currentPrinter.printerType);
  const [connectionType, setConnectionType] = useState(currentPrinter.connectionType);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(currentPrinter.paperWidth);
  const [printerIp, setPrinterIp] = useState(currentPrinter.printerIp || '192.168.1.100');
  const [printerPort, setPrinterPort] = useState(currentPrinter.printerPort || '9100');
  const [autoCut, setAutoCut] = useState(currentPrinter.autoCut ?? true);
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedHoin: HoinPrinterSettings = {
      printerName: printerName.trim() || 'HOIN Thermal Printer',
      printerType,
      connectionType,
      paperWidth,
      printerIp: printerIp.trim(),
      printerPort: printerPort.trim(),
      autoCut,
      openDrawer: false,
    };

    updateSettings({
      lowStockThreshold: Number(threshold) > 0 ? Number(threshold) : 10,
      hoinPrinter: updatedHoin,
    });

    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Inventory Alert & HOIN Printer Config
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Low stock alert threshold and thermal hardware settings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* 1. Low Stock Alert Threshold */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                Low Stock Alert Threshold (Units)
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                Default: 10
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
              Any inventory item whose current stock drops below this number will automatically trigger an alert in the system.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={threshold}
                onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-sm font-black text-amber-900 dark:text-amber-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                units or below
              </span>
            </div>
          </div>

          {/* 2. HOIN Thermal Printer Options */}
          <div className="space-y-4 pt-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-600" />
              <span>HOIN Thermal Hardware Profile</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Printer Model / Display Name
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="e.g. HOIN HOP-H58 / HOP-E801"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Printer Emulation
                </label>
                <select
                  value={printerType}
                  onChange={(e) => setPrinterType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="hoin_thermal">HOIN Thermal (HOP Series)</option>
                  <option value="esc_pos">Standard ESC/POS Protocol</option>
                  <option value="system_default">System Default Driver</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Paper Roll Width
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperWidth('58mm')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paperWidth === '58mm'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    58mm (2 Inch)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperWidth('80mm')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paperWidth === '80mm'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    80mm (3 Inch)
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Communication Protocol
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setConnectionType('browser')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    connectionType === 'browser'
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-xs">Browser Print</div>
                  <div className="text-[10px] text-slate-500">Standard / Fallback</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectionType('usb')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    connectionType === 'usb'
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-center gap-1">
                    <Usb className="w-3.5 h-3.5" /> Direct USB
                  </div>
                  <div className="text-[10px] text-slate-500">HOIN Driver / Raw</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectionType('network')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    connectionType === 'network'
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-center gap-1">
                    <Network className="w-3.5 h-3.5" /> LAN / WiFi
                  </div>
                  <div className="text-[10px] text-slate-500">Ethernet IP</div>
                </button>
              </div>
            </div>

            {connectionType === 'network' && (
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Printer IP Address
                  </label>
                  <input
                    type="text"
                    value={printerIp}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    placeholder="192.168.1.100"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={printerPort}
                    onChange={(e) => setPrinterPort(e.target.value)}
                    placeholder="9100"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoCutCheck"
                checked={autoCut}
                onChange={(e) => setAutoCut(e.target.checked)}
                className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-600"
              />
              <label htmlFor="autoCutCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Trigger Hardware Auto-Cutter (GS V 66 0) at end of receipt
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {savedMessage ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedMessage ? 'Saved Successfully!' : 'Save Configurations'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
