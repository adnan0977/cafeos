import { Printer, Utensils, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { generateKOTHTML } from '../../utils/exportUtils';
import { formatDateTime } from '../../utils/formatters';

export const KOTPrintModal: React.FC = () => {
  const { kotModalOrder, setKOTModalOrder, settings } = useRestaurant();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(settings.kotPrinterWidth || '80mm');

  if (!kotModalOrder) return null;

  const handlePrint = () => {
    const html = generateKOTHTML(kotModalOrder, paperWidth);
    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden my-8">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Kitchen Order Ticket (KOT)
            </h3>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => setKOTModalOrder(null)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-100 dark:bg-slate-950 flex justify-center max-h-[60vh] overflow-y-auto">
          <div
            className={`bg-white text-slate-900 font-mono shadow-md border-2 border-slate-800 p-4 text-xs rounded-sm ${
              paperWidth === '58mm' ? 'w-[230px] text-[11px]' : 'w-[290px] text-[12px]'
            }`}
          >
            <div className="text-center font-black text-base tracking-widest border-b-2 border-slate-900 pb-1">
              KITCHEN TICKET
            </div>
            <div className="text-center font-bold text-sm my-1">
              KOT #{kotModalOrder.kotNumber || kotModalOrder.orderNumber}
            </div>

            <div className="border-t border-dashed border-slate-500 my-1" />

            <div className="flex justify-between font-bold">
              <span>TYPE: {kotModalOrder.orderType.toUpperCase()}</span>
              <span>{kotModalOrder.tableName || 'N/A'}</span>
            </div>
            <div>Time: {formatDateTime(kotModalOrder.createdAt)}</div>
            <div>Waiter: {kotModalOrder.waiterName || kotModalOrder.cashierName}</div>
            {kotModalOrder.guestCount && <div>Guests: {kotModalOrder.guestCount}</div>}

            <div className="border-t-2 border-slate-900 my-2" />

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-900 font-bold">
                  <th className="pb-1">Item</th>
                  <th className="text-right pb-1">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-300">
                {(kotModalOrder.items || []).map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="py-2">
                      <div className="font-bold text-sm">{item.name}</div>
                      {item.variantName && <div className="text-xs text-slate-700 font-semibold">[{item.variantName}]</div>}
                      {(item.modifiers || []).map((m) => (
                        <div key={m.modifierId} className="text-xs text-slate-600 font-medium">
                          + {m.name}
                        </div>
                      ))}
                      {item.notes && (
                        <div className="mt-1 bg-amber-100 text-amber-900 px-1 py-0.5 text-[11px] font-bold rounded">
                          NOTE: {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="text-right py-2 font-black text-base">x{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {kotModalOrder.notes && (
              <div className="border-t-2 border-slate-900 mt-2 pt-1 font-bold text-xs bg-slate-100 p-1">
                Order Notes: {kotModalOrder.notes}
              </div>
            )}

            <div className="border-t border-dashed border-slate-500 mt-3 pt-1 text-center text-[10px] text-slate-500">
              CaféOS Real-Time KDS
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={() => setKOTModalOrder(null)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print KOT Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
