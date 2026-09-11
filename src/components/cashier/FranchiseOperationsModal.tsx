import React, { useState } from 'react';
import {
  X,
  ChefHat,
  Receipt,
  User,
  HelpCircle,
  LogOut,
  Headphones,
  Mail,
  FileText,
  Check,
  Send,
  Printer,
  QrCode,
  DollarSign,
  Laptop,
  Wifi,
  Keyboard,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Search,
  MessageSquareQuote,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';

interface FranchiseOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onStartNewOrder: () => void;
  initialTab?: 'launcher' | 'help' | 'support' | 'quote';
}

interface SupportTicket {
  id: string;
  category: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  status: 'open' | 'investigating' | 'resolved';
}

export const FranchiseOperationsModal: React.FC<FranchiseOperationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onStartNewOrder,
  initialTab = 'launcher',
}) => {
  const { currentUser, logout } = useAuth();
  const { activeOutlet, settings } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'launcher' | 'help' | 'support' | 'quote'>(initialTab);

  // Support Ticket Form State
  const [ticketCategory, setTicketCategory] = useState('Billing & Order Register');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: 'TCK-8821',
      category: 'Printer & Hardware Connection',
      message: 'Configured 80mm ESC/POS USB thermal printer with auto-cutter.',
      priority: 'low',
      createdAt: 'Yesterday, 04:30 PM',
      status: 'resolved',
    },
  ]);

  // Hardware Requisition / Quote State
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'Touch POS All-in-One Terminal (15.6")',
    '80mm ESC/POS High-Speed Thermal Printer',
  ]);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  // Help search
  const [helpSearch, setHelpSearch] = useState('');

  if (!isOpen) return null;

  const outletName = activeOutlet?.name || settings?.name || 'Main Branch';

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      category: ticketCategory,
      message: ticketMessage.trim(),
      priority: ticketPriority,
      createdAt: 'Just now',
      status: 'open',
    };

    setSupportTickets([newTicket, ...supportTickets]);
    setTicketSuccess(true);
    setTicketMessage('');
  };

  const KEYBOARD_SHORTCUTS = [
    { key: 'F1', label: 'Settle Cash', description: 'Instantly settle bill in exact cash amount' },
    { key: 'F2', label: 'Settle UPI QR', description: 'Generate dynamic UPI QR code on billing display' },
    { key: 'F3', label: 'Settle Card', description: 'Initiate card swipe terminal settlement' },
    { key: 'F4', label: 'Print Kitchen KOT', description: 'Print order ticket to kitchen line printers' },
    { key: 'F5', label: 'Hold / Recall Bill', description: 'Temporarily park active bill or recall parked order' },
    { key: 'F6', label: 'Table Management', description: 'Transfer, split or assign dining floor tables' },
    { key: 'F7', label: 'Petty Cash Register', description: 'Log cash in/out expense from the cashier drawer' },
    { key: 'F8', label: 'Day-End Audit Summary', description: 'View shift sales, cash drawer closing, and Z-report' },
    { key: 'F9', label: 'Add Custom Item', description: 'Add open ad-hoc price/item to active bill' },
    { key: 'F10', label: 'Operations & Hub', description: 'Open this store operations and support hub' },
    { key: 'F11', label: 'Toggle Fullscreen', description: 'Switch in and out of Windows Kiosk mode' },
    { key: 'F12', label: 'Kick Cash Drawer', description: 'Send RJ11 electric pulse to open cash drawer' },
  ];

  const filteredShortcuts = KEYBOARD_SHORTCUTS.filter(
    (s) =>
      s.key.toLowerCase().includes(helpSearch.toLowerCase()) ||
      s.label.toLowerCase().includes(helpSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(helpSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
        {/* Header Bar */}
        <div className="bg-[#00897b] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-white text-base">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide leading-tight">
                Store Operations & Support Hub
              </h2>
              <p className="text-xs text-teal-100 font-medium">
                {outletName} • Staff: {currentUser?.name || 'Cashier'} ({currentUser?.role || 'operator'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('launcher');
              setTicketSuccess(false);
              setQuoteSuccess(false);
            }}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'launcher'
                ? 'border-[#00897b] text-[#00897b] dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Operations Launcher</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'help'
                ? 'border-[#00897b] text-[#00897b] dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Hotkeys & POS Help</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('support');
              setTicketSuccess(false);
            }}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'support'
                ? 'border-[#00897b] text-[#00897b] dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Support & Inquiries</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('quote');
              setQuoteSuccess(false);
            }}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'quote'
                ? 'border-[#00897b] text-[#00897b] dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Hardware & Add-ons</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OPERATIONS LAUNCHER */}
          {activeTab === 'launcher' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* 1. Start / Resume Order */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartNewOrder();
                  }}
                  className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 hover:border-teal-500 flex flex-col items-center justify-center text-center group hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Receipt className="w-7 h-7 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    Start Order
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">Billing Register</span>
                </button>

                {/* 2. Kitchen KDS */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateTab) onNavigateTab('kds');
                  }}
                  className="p-5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 hover:border-sky-500 flex flex-col items-center justify-center text-center group hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ChefHat className="w-7 h-7 text-sky-700 dark:text-sky-400" />
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    Kitchen
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">Live KDS Display</span>
                </button>

                {/* 3. Admin Dashboard */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateTab) onNavigateTab('admin');
                  }}
                  className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 hover:border-amber-500 flex flex-col items-center justify-center text-center group hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <User className="w-7 h-7 text-amber-700 dark:text-amber-400" />
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    Admin
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">Store Backoffice</span>
                </button>

                {/* 4. Help & Hotkeys */}
                <button
                  type="button"
                  onClick={() => setActiveTab('help')}
                  className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 hover:border-purple-500 flex flex-col items-center justify-center text-center group hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-7 h-7 text-purple-700 dark:text-purple-400" />
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    Help & Shortcuts
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">POS Reference</span>
                </button>
              </div>

              {/* Support & Quick Action Banners */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Support Helpline Pill */}
                <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-600 text-white">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-teal-800 dark:text-teal-300">
                        Franchise Support Helpline
                      </div>
                      <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        +91 7291077919 / +91 8780228978
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('support')}
                    className="text-xs font-bold text-[#00897b] dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    Write Us →
                  </button>
                </div>

                {/* Hardware Requisition */}
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-600 text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        Hardware & Printer Add-ons
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Request touch terminals & thermal printers
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('quote')}
                    className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Get Quote →
                  </button>
                </div>
              </div>

              {/* Bottom Quick Row: Shift Logout & Close */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                    if (onNavigateTab) onNavigateTab('login');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-bold text-xs flex items-center gap-2 hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Staff Shift</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                  Return to Billing Screen
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HOTKEYS & POS HELP */}
          {activeTab === 'help' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search shortcuts (e.g. cash, print, drawer, F1)..."
                    value={helpSearch}
                    onChange={(e) => setHelpSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden text-slate-800 dark:text-slate-100"
                  />
                </div>
                <span className="text-xs text-slate-500 shrink-0">
                  {filteredShortcuts.length} Shortcuts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredShortcuts.map((s) => (
                  <div
                    key={s.key}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3"
                  >
                    <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono font-black text-xs rounded-lg shrink-0">
                      {s.key}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {s.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {s.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-teal-900 dark:text-teal-300">
                  Thermal Printer & Cash Drawer Tip
                </div>
                <p>
                  Ensure your ESC/POS thermal printer is turned on and connected via USB/LAN. To trigger the cash drawer automatically on cash settlement, keep the Cash Drawer pulse toggle enabled in the header bar.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SUPPORT & INQUIRIES */}
          {activeTab === 'support' && (
            <div className="space-y-5">
              {ticketSuccess ? (
                <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Inquiry / Ticket Dispatched Successfully!
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your query has been logged for {outletName}. Our store support desk usually responds within 15 minutes.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTicketSuccess(false)}
                    className="px-4 py-2 bg-[#00897b] text-white font-bold text-xs rounded-xl"
                  >
                    Submit Another Query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                        Inquiry Category:
                      </label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold outline-hidden"
                      >
                        <option value="Billing & Order Register">Billing & Order Register</option>
                        <option value="Printer & Hardware Connection">Printer & Cash Drawer</option>
                        <option value="Menu Sync & Pricing">Menu Sync & Pricing Discrepancy</option>
                        <option value="GST & Tax Calculation">GST & Tax Calculation</option>
                        <option value="Franchise License & Account">Franchise License & Account</option>
                        <option value="Other Feedback">Other Inquiries & Suggestions</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                        Priority Level:
                      </label>
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setTicketPriority(p)}
                            className={`flex-1 py-2 rounded-xl font-bold uppercase text-[10px] border transition-all cursor-pointer ${
                              ticketPriority === p
                                ? p === 'high'
                                  ? 'bg-rose-500 text-white border-rose-500'
                                  : p === 'medium'
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-teal-600 text-white border-teal-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      Query Details:
                    </label>
                    <textarea
                      rows={3}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Explain the problem or question you have regarding this outlet..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-hidden resize-none text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!ticketMessage.trim()}
                    className="w-full py-2.5 bg-[#d97706] hover:bg-[#b45309] disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Query to Support Desk</span>
                  </button>
                </form>
              )}

              {/* Logged Tickets History */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Recent Tickets for {outletName}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {supportTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                            {t.id}
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {t.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-md">{t.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400">{t.createdAt}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            t.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HARDWARE & ADD-ONS */}
          {activeTab === 'quote' && (
            <div className="space-y-4">
              {quoteSuccess ? (
                <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Requisition Quote Dispatched!
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    The requested hardware list and pricing estimate has been logged for {outletName}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuoteSuccess(false)}
                    className="px-4 py-2 bg-[#00897b] text-white font-bold text-xs rounded-xl"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="text-slate-600 dark:text-slate-400 font-bold">
                    Select Equipment & Licenses for {outletName}:
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { name: 'Touch POS All-in-One Terminal (15.6")', est: '₹22,000' },
                      { name: '80mm ESC/POS High-Speed Thermal Printer', est: '₹5,500' },
                      { name: 'Heavy-Duty Cash Drawer (RJ11 Electric Kick)', est: '₹3,200' },
                      { name: '2D Barcode & QR Scanner with Hands-free Stand', est: '₹2,800' },
                      { name: 'Kitchen Display System (KDS) 10.1" Android Terminal', est: '₹9,500' },
                      { name: 'Dual Display Customer Facing Screen (10.1")', est: '₹6,000' },
                    ].map((eq) => {
                      const isSelected = selectedEquipment.includes(eq.name);
                      return (
                        <label
                          key={eq.name}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-[#00796b] dark:text-teal-300 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedEquipment(selectedEquipment.filter((x) => x !== eq.name));
                                } else {
                                  setSelectedEquipment([...selectedEquipment, eq.name]);
                                }
                              }}
                              className="rounded text-[#00897b] focus:ring-[#00897b]"
                            />
                            <span>{eq.name}</span>
                          </div>
                          <span className="font-mono text-[11px] opacity-80">{eq.est}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      Additional Requirements / Notes:
                    </label>
                    <input
                      type="text"
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      placeholder="e.g. Need expedited dispatch for counter #2..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-hidden"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuoteSuccess(true)}
                    className="w-full py-2.5 bg-[#00897b] hover:bg-[#00796b] text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                  >
                    Submit Hardware Requisition Quote
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
