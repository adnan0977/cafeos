import { Check, Copy, Download, Printer, QrCode, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { generateThermalReceiptHTML } from '../../utils/exportUtils';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const ThermalReceiptModal: React.FC = () => {
  const { receiptModalOrder, setReceiptModalOrder, settings } = useRestaurant();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(settings.billPrinterWidth || '80mm');
  const [copied, setCopied] = useState(false);

  if (!receiptModalOrder) return null;

  const handlePrint = () => {
    const html = generateThermalReceiptHTML(receiptModalOrder, settings, paperWidth);
    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleCopyText = () => {
    const lines = [
      `*** ${settings.name} ***`,
      `${settings.address}`,
      `GSTIN: ${settings.gstNumber}`,
      `Order #${receiptModalOrder.orderNumber} | Type: ${receiptModalOrder.orderType.toUpperCase()}`,
      `Date: ${formatDateTime(receiptModalOrder.createdAt)}`,
      `--------------------------------`,
      ...(receiptModalOrder.items || []).map((i) => `${i.quantity}x ${i.name} = ₹${i.totalAmount}`),
      `--------------------------------`,
      `Subtotal: ₹${receiptModalOrder.subtotal}`,
      `Tax: ₹${receiptModalOrder.taxAmount}`,
      `Grand Total: ₹${receiptModalOrder.grandTotal}`,
      `Payment: ${receiptModalOrder.paymentMethod?.toUpperCase() || 'PAID'}`,
      `*** Thank You! ***`,
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden my-8">
        {/* Header with Print Controls */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Receipt: #{receiptModalOrder.orderNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {/* 58mm / 80mm toggle */}
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 text-xs">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  paperWidth === '58mm' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                58mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  paperWidth === '80mm' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                80mm
              </button>
            </div>

            <button
              onClick={() => setReceiptModalOrder(null)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thermal Receipt Visual Preview Box */}
        <div className="p-6 bg-slate-100 dark:bg-slate-950 flex justify-center max-h-[60vh] overflow-y-auto">
          <div
            className={`bg-white text-slate-900 font-mono shadow-md border border-dashed border-slate-300 p-4 text-xs transition-all duration-200 rounded-sm ${
              paperWidth === '58mm' ? 'w-[230px] text-[11px]' : 'w-[290px] text-[12px]'
            }`}
          >
            {/* Header */}
            <div className="text-center space-y-0.5 mb-2">
              <div className="font-extrabold text-sm tracking-tight">{settings.name}</div>
              <div className="text-[10px] text-slate-600">{settings.tagline}</div>
              <div className="text-[10px] text-slate-600">{settings.address}</div>
              <div className="text-[10px] text-slate-600">{settings.city}</div>
              <div className="text-[10px] text-slate-600">Ph: {settings.phone}</div>
              <div className="text-[10px] font-semibold text-slate-700">GSTIN: {settings.gstNumber}</div>
            </div>

            <div className="border-t border-dashed border-slate-400 my-2" />

            <div className="flex justify-between text-[11px]">
              <span>Order: #{receiptModalOrder.orderNumber}</span>
              <span className="font-bold">{receiptModalOrder.orderType.toUpperCase()}</span>
            </div>
            {receiptModalOrder.tableName && <div>Table: {receiptModalOrder.tableName}</div>}
            {receiptModalOrder.customerName && (
              <div>Guest: {receiptModalOrder.customerName} ({receiptModalOrder.customerPhone || 'N/A'})</div>
            )}
            <div>Date: {formatDateTime(receiptModalOrder.createdAt)}</div>
            <div>
              Biller: <span className="font-bold">{receiptModalOrder.billerName || receiptModalOrder.cashierName || 'Biller Staff'}</span>
              {receiptModalOrder.billerUsername ? ` (@${receiptModalOrder.billerUsername})` : ''}
            </div>
            {receiptModalOrder.supervisorAdminName && (
              <div className="text-[10px] text-slate-500">
                Authorized By: {receiptModalOrder.supervisorAdminName}
              </div>
            )}

            <div className="border-t border-dashed border-slate-400 my-2" />

            {/* Itemized Table */}
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dashed border-slate-400 font-bold">
                  <th className="pb-1">Item</th>
                  <th className="text-center pb-1">Qty</th>
                  <th className="text-right pb-1">Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(receiptModalOrder.items || []).map((i) => (
                  <tr key={i.id} className="align-top">
                    <td className="py-1">
                      <span className="font-semibold">{i.name}</span>
                      {i.variantName && <div className="text-[10px] text-slate-600">({i.variantName})</div>}
                      {(i.modifiers || []).map((m) => (
                        <div key={m.modifierId} className="text-[10px] text-slate-500">
                          + {m.name} ({formatCurrency(m.price)})
                        </div>
                      ))}
                      {i.notes && <div className="text-[10px] italic text-slate-500">*{i.notes}</div>}
                    </td>
                    <td className="text-center py-1 font-bold">{i.quantity}</td>
                    <td className="text-right py-1 font-semibold">{formatCurrency(i.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-slate-400 my-2" />

            {/* Calculations */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(receiptModalOrder.subtotal)}</span>
              </div>
              {receiptModalOrder.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>
                    Discount {receiptModalOrder.couponCode ? `(${receiptModalOrder.couponCode})` : ''}
                  </span>
                  <span>-{formatCurrency(receiptModalOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (5%)</span>
                <span>{formatCurrency(receiptModalOrder.taxAmount)}</span>
              </div>
              {receiptModalOrder.deliveryCharge > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(receiptModalOrder.deliveryCharge)}</span>
                </div>
              )}
              {receiptModalOrder.roundOff !== 0 && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Round Off</span>
                  <span>{formatCurrency(receiptModalOrder.roundOff)}</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-double border-slate-800 my-2" />

            <div className="flex justify-between text-sm font-extrabold">
              <span>GRAND TOTAL:</span>
              <span>{formatCurrency(receiptModalOrder.grandTotal)}</span>
            </div>

            <div className="border-t border-dashed border-slate-400 my-2" />

            <div className="text-center space-y-1 my-2">
              <div className="text-xs font-bold uppercase tracking-wider">
                Paid via {receiptModalOrder.paymentMethod || 'CASH'}
              </div>
              <div className="text-[10px] text-slate-500">Status: {receiptModalOrder.paymentStatus.toUpperCase()}</div>
              {(receiptModalOrder.pointsEarned || receiptModalOrder.pointsRedeemed) && (
                <div className="text-[10px] text-amber-700 bg-amber-50 rounded p-1 font-bold border border-amber-200">
                  {receiptModalOrder.pointsRedeemed ? `⭐ Points Redeemed: -${receiptModalOrder.pointsRedeemed} pts ` : ''}
                  {receiptModalOrder.pointsEarned ? `• Points Earned: +${receiptModalOrder.pointsEarned} pts` : ''}
                </div>
              )}
            </div>

            <div className="text-center border-t border-dashed border-slate-300 pt-2 text-[10px] text-slate-500">
              Thank you for dining with us!
              <div className="text-[9px] text-slate-400 mt-0.5">Powered by CaféOS</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Receipt' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReceiptModalOrder(null)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
