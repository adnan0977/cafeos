import { Check, Copy, Download, Printer, QrCode, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import { Order, RestaurantSettings } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface CashierReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  settings: RestaurantSettings;
  paperWidth?: '58mm' | '80mm';
  cashTendered?: number;
  changeDue?: number;
}

export const CashierReceiptModal: React.FC<CashierReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  settings,
  paperWidth = '80mm',
  cashTendered,
  changeDue,
}) => {
  const [selectedWidth, setSelectedWidth] = useState<'58mm' | '80mm'>(paperWidth);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    // Standard clean browser print with @media print styling
    window.print();
  };

  const handleCopy = () => {
    const text = [
      `================================`,
      `       ${settings.name.toUpperCase()}       `,
      `   ${settings.address || 'Restaurant Street'}   `,
      `Phone: ${settings.phone || '9876543210'}`,
      `GSTIN: ${settings.gstNumber || '27AADCB2230M1Z2'}`,
      `================================`,
      `TAX INVOICE: #${order.orderNumber}`,
      `Date: ${formatDateTime(order.createdAt)}`,
      `Type: ${order.orderType.toUpperCase()} ${order.tableNumber ? `| Table: ${order.tableNumber}` : ''}`,
      `Cashier: ${order.cashierName || 'Cashier Desk'}`,
      `--------------------------------`,
      ...(order.items || []).map(
        (it) => `${it.quantity}x ${it.name.padEnd(18).slice(0, 18)} ₹${it.totalAmount.toFixed(2)}`
      ),
      `--------------------------------`,
      `Subtotal:        ₹${order.subtotal.toFixed(2)}`,
      order.discountAmount > 0 ? `Discount:       -₹${order.discountAmount.toFixed(2)}` : null,
      `CGST (2.5%):     ₹${(order.taxAmount / 2).toFixed(2)}`,
      `SGST (2.5%):     ₹${(order.taxAmount / 2).toFixed(2)}`,
      `TOTAL AMOUNT:    ₹${order.grandTotal.toFixed(2)}`,
      `--------------------------------`,
      ...(order.paymentMethod === 'split' || (order.payments && order.payments.length > 1)
        ? [
            `Payment Mode:    SPLIT PAYMENT`,
            ...(order.payments || []).map(
              (p) =>
                `  - ${p.method === 'credit_card' ? 'CARD' : p.method.toUpperCase()}: ₹${p.amount.toFixed(2)}${
                  p.transactionRef ? ` [Ref: ${p.transactionRef}]` : ''
                }`
            ),
          ]
        : [`Payment Mode:    ${order.paymentMethod?.toUpperCase() || 'CASH'}`]),
      cashTendered ? `Cash Tendered:   ₹${cashTendered.toFixed(2)}` : null,
      changeDue !== undefined && changeDue > 0 ? `Change Returned: ₹${changeDue.toFixed(2)}` : null,
      `================================`,
      `   THANK YOU! VISIT US AGAIN    `,
      `================================`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-6 flex flex-col">
        {/* Controls Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-sm">Thermal Invoice #{order.orderNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-bold">
              <button
                onClick={() => setSelectedWidth('80mm')}
                className={`px-2 py-0.5 rounded ${
                  selectedWidth === '80mm' ? 'bg-amber-600 text-white' : 'text-slate-400'
                }`}
              >
                80mm
              </button>
              <button
                onClick={() => setSelectedWidth('58mm')}
                className={`px-2 py-0.5 rounded ${
                  selectedWidth === '58mm' ? 'bg-amber-600 text-white' : 'text-slate-400'
                }`}
              >
                58mm
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Body (Visual preview mimicking real thermal paper roll) */}
        <div className="p-6 bg-slate-100 dark:bg-slate-950/80 flex justify-center overflow-y-auto max-h-[60vh]">
          <div
            className={`bg-white text-slate-900 font-mono text-xs p-5 shadow-lg border border-slate-200 rounded-lg transition-all print:border-none print:shadow-none print:p-0 ${
              selectedWidth === '58mm' ? 'w-56 text-[10px]' : 'w-72 text-xs'
            }`}
          >
            {/* Restaurant Logo & Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <div className="font-extrabold text-sm tracking-tight text-slate-950">
                {settings.name.toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-600 leading-tight">
                {settings.address || 'High Street Commercial Center'}
              </div>
              <div className="text-[10px] text-slate-600">Tel: {settings.phone || '+91 9876543210'}</div>
              {settings.gstNumber && (
                <div className="text-[10px] text-slate-800 font-bold">GSTIN: {settings.gstNumber}</div>
              )}
              {settings.fssaiNumber && (
                <div className="text-[9px] text-slate-500">FSSAI: {settings.fssaiNumber}</div>
              )}
            </div>

            {/* Bill Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold text-slate-950">
                <span>INVOICE #{order.orderNumber}</span>
                <span className="uppercase">{order.orderType}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>{formatDateTime(order.createdAt)}</span>
                {order.tableNumber && <span className="font-bold text-slate-800">Table: {order.tableNumber}</span>}
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>Cashier: {order.cashierName || 'Counter 01'}</span>
                <span>POS-01</span>
              </div>
              {order.customerName && (
                <div className="text-[10px] text-slate-700 font-bold truncate">
                  Customer: {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase pb-1 border-b border-slate-200">
                <span>Item</span>
                <span className="text-right">Amt</span>
              </div>
              {(order.items || []).map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span className="truncate pr-1">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="shrink-0 text-right">₹{it.totalAmount.toFixed(2)}</span>
                  </div>
                  {it.notes && (
                    <div className="text-[9px] text-slate-500 italic pl-3">* {it.notes}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Discount:</span>
                  <span>-₹{order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>CGST (2.5%):</span>
                <span>₹{(order.taxAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>SGST (2.5%):</span>
                <span>₹{(order.taxAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-300 text-slate-950">
                <span>NET PAYABLE:</span>
                <span>₹{order.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Settlement Details */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
              <div className="flex justify-between font-bold">
                <span>Mode of Payment:</span>
                <span className="uppercase text-amber-700 font-extrabold">
                  {order.paymentMethod === 'split' || (order.payments && order.payments.length > 1)
                    ? 'SPLIT PAYMENT'
                    : (order.paymentMethod || 'CASH')}
                </span>
              </div>

              {/* If Split Payment: List each method & allocated amount */}
              {order.payments && order.payments.length > 1 && (
                <div className="pl-2 space-y-0.5 border-l border-slate-300">
                  {order.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 font-medium text-[9px]">
                      <span>
                        • {p.method === 'credit_card' ? 'CARD' : p.method.toUpperCase()}
                        {p.transactionRef ? ` (${p.transactionRef})` : ''}:
                      </span>
                      <span className="font-bold">₹{p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {cashTendered !== undefined && cashTendered > 0 && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash Tendered:</span>
                    <span>₹{cashTendered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Change Returned:</span>
                    <span>₹{(changeDue || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-600 space-y-1">
              <div className="font-bold tracking-wider">*** THANK YOU! ***</div>
              <div className="text-[9px]">Have a wonderful day ahead!</div>
              <div className="text-[8px] text-slate-400 pt-1">Printed via CaféOS Windows POS Terminal</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill (Ctrl+P / Enter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
