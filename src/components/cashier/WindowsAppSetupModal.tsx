import {
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  HardDrive,
  Monitor,
  Printer,
  QrCode,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  Usb,
  Wifi,
  X,
  PackageCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useWindowsPWAInstall } from '../../hooks/useWindowsPWAInstall';

interface WindowsAppSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  terminalStationName?: string;
  onSaveTerminalStation?: (name: string) => void;
  paperWidth?: '58mm' | '80mm';
  onChangePaperWidth?: (w: '58mm' | '80mm') => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  drawerPulseEnabled?: boolean;
  onToggleDrawerPulse?: () => void;
}

export const WindowsAppSetupModal: React.FC<WindowsAppSetupModalProps> = ({
  isOpen,
  onClose,
  terminalStationName = 'POS-TERMINAL-01',
  onSaveTerminalStation,
  paperWidth = '80mm',
  onChangePaperWidth,
  soundEnabled = true,
  onToggleSound,
  drawerPulseEnabled = true,
  onToggleDrawerPulse,
}) => {
  const { activeOrganization } = useRestaurant();
  const orgName = activeOrganization?.name || 'CafeOS';

  const {
    isInstallable,
    isInstalled,
    isWindowsOS,
    promptInstall,
    downloadCashierLauncherBatch,
    downloadCashierShortcutScript,
    downloadStockistLauncherBatch,
    downloadStockistShortcutScript,
  } = useWindowsPWAInstall();

  const [activeTab, setActiveTab] = useState<'install' | 'hardware' | 'shortcuts' | 'electron'>('install');
  const [stationName, setStationName] = useState(terminalStationName);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/?tab=windows_cashier` : '';

  const kioskCommand = `start msedge.exe --app="${currentUrl}" --window-size=1280,800 --start-maximized`;

  const copyKioskCommand = () => {
    navigator.clipboard.writeText(kioskCommand);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Windows Fluent Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            {/* Windows 11 Icon */}
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center p-1.5 border border-sky-400/40">
              <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                <div className="bg-sky-400 rounded-xs" />
                <div className="bg-sky-400 rounded-xs" />
                <div className="bg-sky-400 rounded-xs" />
                <div className="bg-sky-400 rounded-xs" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Windows Cashier App Setup & Terminal Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Windows 10 / 11
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Install as a native desktop application, configure thermal printers, and setup cashier station
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('install')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'install'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Windows Installation</span>
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'hardware'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>POS Hardware & Printer</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'shortcuts'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Cashier Hotkeys (F1–F12)</span>
          </button>
          <button
            onClick={() => setActiveTab('electron')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'electron'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Standalone EXE Build</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-700 dark:text-slate-300">
          {activeTab === 'install' && (
            <div className="space-y-5">
              {/* Option A: Direct 1-Click PWA Desktop Install */}
              <div className="p-5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-600 text-white">
                        Recommended
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Method 1: 1-Click Install into Windows (Edge / Chrome)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Installs directly into Windows 10 &amp; 11 as a standalone desktop application. Adds a desktop icon,
                      Start Menu pin, taskbar badge, and opens in a clean window without browser address bars.
                    </p>
                  </div>
                  {isInstalled ? (
                    <span className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Installed on PC
                    </span>
                  ) : (
                    <button
                      onClick={() => promptInstall()}
                      className="shrink-0 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install Windows App</span>
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-sky-100 dark:border-sky-900/40 space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    How it works on your Cashier PC:
                  </div>
                  <div>1. Click the button above or look for the <strong>Install App icon (⊕)</strong> in your Edge or Chrome address bar.</div>
                  <div>2. Select <strong>"Install CaféOS POS"</strong> when prompted by Windows.</div>
                  <div>3. Right-click the app icon in Windows and select <strong>"Pin to Taskbar"</strong> for immediate cashier counter access.</div>
                </div>
              </div>

              {/* Option B: Windows Desktop Batch Launchers for Cashier & Stockist */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    <span>Method 2: Standalone Windows App Launchers (Cashier &amp; Stockist)</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Download customized Windows scripts for <strong>{orgName}</strong>. Double-clicking starts the POS terminal or Stockist inventory in dedicated full-screen desktop windows without browser address bars (Powered by CafeOS).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Cashier Launcher Card */}
                  <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/40 bg-white dark:bg-slate-900/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-500 flex items-center justify-center font-bold">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {orgName} Cashier POS App
                        </div>
                        <div className="text-[10px] text-slate-500">For Billing Counters</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => downloadCashierLauncherBatch(orgName)}
                        className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Cashier .bat</span>
                      </button>
                      <button
                        onClick={() => downloadCashierShortcutScript(orgName)}
                        className="w-full py-1.5 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Terminal className="w-3 h-3 text-sky-500" />
                        <span>Create Desktop .lnk</span>
                      </button>
                    </div>
                  </div>

                  {/* Stockist Launcher Card */}
                  <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-slate-900/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {orgName} Stockist Inventory App
                        </div>
                        <div className="text-[10px] text-slate-500">For Warehouse &amp; Storekeeper</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => downloadStockistLauncherBatch(orgName)}
                        className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Stockist .bat</span>
                      </button>
                      <button
                        onClick={() => downloadStockistShortcutScript(orgName)}
                        className="w-full py-1.5 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Terminal className="w-3 h-3 text-amber-500" />
                        <span>Create Desktop .lnk</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Command Preview */}
                <div className="bg-slate-950 p-3 rounded-lg text-emerald-400 font-mono text-[11px] flex items-center justify-between border border-slate-800">
                  <span className="truncate pr-2">{kioskCommand}</span>
                  <button
                    onClick={copyKioskCommand}
                    className="p-1 text-slate-400 hover:text-white rounded transition-colors shrink-0 cursor-pointer"
                    title="Copy command"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Station Configuration */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-sky-500" />
                  <span>Cashier Counter Station Identity</span>
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Terminal Station ID (Printed on Receipts)
                    </label>
                    <input
                      type="text"
                      value={stationName}
                      onChange={(e) => setStationName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                      placeholder="e.g. POS-COUNTER-01"
                    />
                  </div>
                  <button
                    onClick={() => onSaveTerminalStation && onSaveTerminalStation(stationName)}
                    className="mt-5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Save Station
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thermal Printer Settings */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        ESC/POS Thermal Bill Printer
                      </div>
                      <div className="text-[11px] text-slate-500">USB, LAN / Network IP, or Bluetooth</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Receipt Paper Width
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onChangePaperWidth && onChangePaperWidth('80mm')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition-all ${
                          paperWidth === '80mm'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        80mm (Standard POS)
                      </button>
                      <button
                        onClick={() => onChangePaperWidth && onChangePaperWidth('58mm')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition-all ${
                          paperWidth === '58mm'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        58mm (Compact Roll)
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <div className="font-bold text-slate-700 dark:text-slate-300">Supported Windows Drivers:</div>
                    <div>Compatible with Epson TM-T82, Star Micronics, Posiflex, NGX, TVS Electronics, Everycom, Rongta &amp; generic ESC/POS printers.</div>
                  </div>
                </div>

                {/* Cash Drawer Settings */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Usb className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        RJ11 Automatic Cash Drawer Kick
                      </div>
                      <div className="text-[11px] text-slate-500">24V Solenoid Trigger via Printer Port</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Auto-Kick on Cash Settlement
                      </div>
                      <div className="text-[10px] text-slate-400">Sends ESC p 0 25 250 pulse when cash bill is paid</div>
                    </div>
                    <button
                      onClick={onToggleDrawerPulse}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        drawerPulseEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                          drawerPulseEnabled ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Cashier Sound Chimes
                      </div>
                      <div className="text-[10px] text-slate-400">Barcode beep, numpad click &amp; cash register ring</div>
                    </div>
                    <button
                      onClick={onToggleSound}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        soundEnabled ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                          soundEnabled ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Barcode & Peripherals banner */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <QrCode className="w-6 h-6 text-sky-400" />
                  <div>
                    <div className="font-bold text-xs">Barcode Scanner &amp; Keyboard Wedge</div>
                    <div className="text-[11px] text-slate-400">
                      Plug-and-play USB 1D/2D Barcode scanners work instantly. Focus with <strong>[F2]</strong> to scan item SKU barcodes.
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 text-[11px] font-bold border border-sky-400/30">
                  Ready
                </span>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                The Windows Cashier App is engineered for maximum speed. Cashiers can complete 100% of billing operations using the keyboard without reaching for the mouse:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'F1', label: 'New / Clear Bill', desc: 'Resets the ticket register to start fresh order' },
                  { key: 'F2', label: 'Focus Search / Barcode', desc: 'Focus cursor into item search & barcode reader' },
                  { key: 'F3', label: 'Customer Lookup', desc: 'Find or register customer by mobile number & points' },
                  { key: 'F4', label: 'Apply Discount', desc: 'Quickly open discount (% or flat ₹) dialog' },
                  { key: 'F5', label: 'Hold Current Bill', desc: 'Parks the bill so you can serve the next customer' },
                  { key: 'F6', label: 'Recall Parked Bill', desc: 'Browse and resume held counter tickets' },
                  { key: 'F7', label: 'Order Type (Dine/Takeaway)', desc: 'Cycles through Dine-in, Takeaway, and Delivery' },
                  { key: 'F8', label: 'Add Open / Custom Item', desc: 'Punch unlisted items with custom price & title' },
                  { key: 'F9', label: 'Print Kitchen KOT', desc: 'Sends live ticket to kitchen display/KOT printer' },
                  { key: 'F10', label: 'Settle & Print Receipt', desc: 'Completes checkout, prints thermal bill & opens drawer' },
                  { key: 'F11', label: 'Toggle Fullscreen Kiosk', desc: 'Locks window to borderless cashier station mode' },
                  { key: 'F12', label: 'Kick Cash Drawer', desc: 'Manual pulse to open physical cash drawer' },
                  { key: 'ESC', label: 'Close Dialog / Cancel', desc: 'Dismiss active modals and search popovers' },
                ].map((sc) => (
                  <div
                    key={sc.key}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-700 font-mono font-black text-xs shadow-xs">
                        {sc.key}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{sc.label}</div>
                        <div className="text-[10px] text-slate-400">{sc.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'electron' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Compile Native Windows .exe Setup Installer
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  If you prefer an offline native <strong>.exe installer</strong> (compiled with Electron &amp; electron-builder),
                  the project codebase includes an <code>electron-main.cjs</code> entry point.
                </p>

                <div className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs space-y-2 border border-slate-800">
                  <div className="text-slate-500"># 1. Install electron packager on your Windows machine:</div>
                  <div className="text-emerald-400">npm install -D electron electron-builder</div>
                  <div className="text-slate-500 mt-2"># 2. Build Windows executable:</div>
                  <div className="text-emerald-400">npx electron-builder --windows nsis:ia32</div>
                  <div className="text-slate-500 mt-2"># 3. The installer .exe will be generated in /dist-electron/</div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Note: The Progressive Web App (Method 1) provides identical native Windows desktop integration, automatic background updates, and zero installation overhead.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Windows 11 / 10 Fluent Cashier Terminal Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
