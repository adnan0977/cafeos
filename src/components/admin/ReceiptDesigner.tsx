import React, { useState } from 'react';
import {
  Receipt,
  Printer,
  Sliders,
  QrCode,
  Wifi,
  CheckCircle,
  FileText,
  Eye,
  Building,
  Hash,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/formatters';

export const ReceiptDesigner: React.FC = () => {
  const { settings, updateSettings } = useRestaurant();

  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(settings.billPrinterWidth || '80mm');
  const [restaurantName, setRestaurantName] = useState(settings.name);
  const [tagline, setTagline] = useState(settings.tagline || 'Artisanal Roastery & Kitchen');
  const [address, setAddress] = useState(settings.address || 'Plot 42, Sector 29, City Center');
  const [phone, setPhone] = useState(settings.phone || '+91 98101 23456');
  const [gstNumber, setGstNumber] = useState(settings.gstNumber || '07AAAAA0000A1Z5');
  const [fssaiLicense, setFssaiLicense] = useState(settings.fssaiLicense || '10722001000123');
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader || 'Welcome to our table!');
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || 'Thank you! Visit again.');
  const [wifiName, setWifiName] = useState(settings.wifiName || 'CafeRoyal_Guest');
  const [wifiPassword, setWifiPassword] = useState(settings.wifiPassword || 'coffee2026');
  const [showWifi, setShowWifi] = useState(true);
  const [showQr, setShowQr] = useState(settings.showQrOnReceipt ?? true);
  const [qrType, setQrType] = useState<'upi' | 'review' | 'custom'>(settings.qrType || 'upi');
  const [showHsn, setShowHsn] = useState(settings.showHsnOnReceipt ?? true);
  const [savedBanner, setSavedBanner] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: restaurantName,
      tagline,
      address,
      phone,
      gstNumber,
      fssaiLicense,
      receiptHeader,
      receiptFooter,
      wifiName,
      wifiPassword,
      showQrOnReceipt: showQr,
      qrType,
      showHsnOnReceipt: showHsn,
      billPrinterWidth: paperWidth,
    });
    setSavedBanner('Thermal Bill & KOT format preferences saved successfully!');
    setTimeout(() => setSavedBanner(''), 3500);
  };

  const handlePrintTest = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Thermal Receipt &amp; KOT Print Designer
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                ESC/POS Formatter
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize 80mm &amp; 58mm thermal bills, header/footer notes, GSTIN &amp; FSSAI license labels, guest Wi-Fi credentials, and dynamic UPI QR codes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrintTest}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-600" />
            <span>Print Test Bill</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-600/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Receipt Format</span>
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{savedBanner}</span>
        </div>
      )}

      {/* Split Grid: Left = Options, Right = Live Receipt Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>Thermal Printer &amp; Paper Geometry</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Thermal Paper Width
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperWidth('80mm')}
                    className={`p-2.5 rounded-xl border text-center font-bold ${
                      paperWidth === '80mm'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    80mm (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperWidth('58mm')}
                    className={`p-2.5 rounded-xl border text-center font-bold ${
                      paperWidth === '58mm'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    58mm (Compact)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brand / Outlet Display Name
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone on Receipt
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Store Address (Printed below brand name)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  FSSAI License #
                </label>
                <input
                  type="text"
                  value={fssaiLicense}
                  onChange={(e) => setFssaiLicense(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Header Greeting Line
                </label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Footer Farewell Line
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Wi-Fi & QR Code Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-600" />
              <span>Guest Wi-Fi &amp; Thermal QR Codes</span>
            </h4>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-sky-500" /> Print Guest Wi-Fi on Bill
                </span>
                <input
                  type="checkbox"
                  checked={showWifi}
                  onChange={(e) => setShowWifi(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
              </div>

              {showWifi && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Wi-Fi SSID (Name)"
                    value={wifiName}
                    onChange={(e) => setWifiName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Wi-Fi Password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-500" /> Print Interactive QR Code
                </span>
                <input
                  type="checkbox"
                  checked={showQr}
                  onChange={(e) => setShowQr(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
              </div>

              {showQr && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setQrType('upi')}
                    className={`p-2 rounded-lg border text-center font-bold text-[11px] ${
                      qrType === 'upi'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    UPI Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrType('review')}
                    className={`p-2 rounded-lg border text-center font-bold text-[11px] ${
                      qrType === 'review'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Google Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrType('custom')}
                    className={`p-2 rounded-lg border text-center font-bold text-[11px] ${
                      qrType === 'custom'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Instagram / Web
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Print Item HSN / SAC Code on Tax Line
              </span>
              <input
                type="checkbox"
                checked={showHsn}
                onChange={(e) => setShowHsn(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
            </div>
          </div>
        </form>

        {/* Right Column: Live Thermal Bill Visual Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span>Live {paperWidth} ESC/POS Thermal Print Simulator</span>
          </div>

          <div
            className={`bg-white dark:bg-slate-950 p-6 rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-2xl font-mono text-[11px] text-slate-900 dark:text-slate-100 space-y-3 ${
              paperWidth === '80mm' ? 'w-full max-w-sm' : 'w-full max-w-xs'
            }`}
          >
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-0.5">
              <div className="font-black text-sm uppercase tracking-wide">{restaurantName}</div>
              <div className="text-[10px] text-slate-500">{tagline}</div>
              <div className="text-[10px]">{address}</div>
              <div className="text-[10px]">Ph: {phone}</div>
              <div className="text-[10px] font-bold">GSTIN: {gstNumber}</div>
              <div className="text-[10px]">FSSAI: {fssaiLicense}</div>
              <div className="text-[10px] italic mt-1 font-sans">"{receiptHeader}"</div>
            </div>

            {/* Bill Info */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
              <div className="flex justify-between">
                <span>Invoice: #INV-2026-0842</span>
                <span>Table: T-04 (Dine-in)</span>
              </div>
              <div className="flex justify-between">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div>Server: Vikram S. | Station: POS-01</div>
            </div>

            {/* Items Table */}
            <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-2">
              <div className="flex justify-between font-bold border-b border-slate-200 dark:border-slate-800 pb-1">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span>AMOUNT</span>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>Wild Mushroom Pizza</span>
                  <span>1 x 495.00</span>
                  <span>495.00</span>
                </div>
                {showHsn && <div className="text-[9px] text-slate-500">HSN: 996331 | +Extra Cheese</div>}
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>Signature Flat White</span>
                  <span>2 x 240.00</span>
                  <span>480.00</span>
                </div>
                {showHsn && <div className="text-[9px] text-slate-500">HSN: 996331 | Oat Milk</div>}
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>Belgian Truffle Brownie</span>
                  <span>1 x 220.00</span>
                  <span>220.00</span>
                </div>
                {showHsn && <div className="text-[9px] text-slate-500">HSN: 2106</div>}
              </div>
            </div>

            {/* Totals & Tax */}
            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹1,195.00</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span>₹29.88</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span>₹29.88</span>
              </div>
              <div className="flex justify-between font-black text-sm border-t border-slate-300 dark:border-slate-700 pt-1">
                <span>GRAND TOTAL:</span>
                <span>₹1,255.00</span>
              </div>
              <div className="text-[9px] text-slate-500">
                Payment: Settled via UPI (Ref: 402910842)
              </div>
            </div>

            {/* Wi-Fi Details */}
            {showWifi && (
              <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-center text-[9px] space-y-0.5 border border-slate-200 dark:border-slate-800">
                <div className="font-bold">FREE GUEST WI-FI</div>
                <div>Network: {wifiName} | Pass: {wifiPassword}</div>
              </div>
            )}

            {/* QR Code Placeholder */}
            {showQr && (
              <div className="text-center py-1">
                <div className="w-20 h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-950 mx-auto rounded-lg flex flex-col items-center justify-center p-1 text-[8px] font-black">
                  <QrCode className="w-12 h-12" />
                  <span>{qrType === 'upi' ? 'SCAN TO PAY' : 'SCAN FOR MENU'}</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  {qrType === 'upi' ? 'BHIM / GooglePay / PhonePe' : 'Rate us on Google!'}
                </div>
              </div>
            )}

            {/* Footer Farewell */}
            <div className="text-center text-[10px] italic pt-1 border-t border-dashed border-slate-400">
              "{receiptFooter}"
              <div className="text-[8px] text-slate-400 mt-0.5">Powered by RoyalPOS Enterprise</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
