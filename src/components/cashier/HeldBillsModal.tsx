import { Clock, PauseCircle, Play, Trash2, User, Utensils, X } from 'lucide-react';
import React from 'react';
import { formatCurrency, formatTime } from '../../utils/formatters';

export interface HeldBill {
  id: string;
  heldAt: string;
  orderType: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    id: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
    itemTotal: number;
  }>;
  subtotal: number;
  discount: number;
  grandTotal: number;
  note?: string;
}

interface HeldBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldBills: HeldBill[];
  onResumeBill: (bill: HeldBill) => void;
  onDeleteHeldBill: (billId: string) => void;
}

export const HeldBillsModal: React.FC<HeldBillsModalProps> = ({
  isOpen,
  onClose,
  heldBills,
  onResumeBill,
  onDeleteHeldBill,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm">Parked / Held Bills Queue [F6]</h3>
              <p className="text-[11px] text-slate-400">Select any held bill to restore and complete payment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {heldBills.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <PauseCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <div className="font-bold text-slate-700 dark:text-slate-300">No Held Bills in Counter Queue</div>
              <p className="text-[11px] max-w-xs mx-auto">
                Press <strong>[F5]</strong> while ringing up a customer to park the ticket and serve other customers.
              </p>
            </div>
          ) : (
            heldBills.map((bill) => (
              <div
                key={bill.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-sky-400 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {bill.orderType.replace('_', ' ')}
                    </span>
                    {bill.tableNumber && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {bill.tableNumber}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(bill.heldAt)}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {formatCurrency(bill.grandTotal)}
                  </div>
                </div>

                {bill.customerName && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                    <User className="w-3.5 h-3.5 text-sky-500" />
                    <span>{bill.customerName}</span>
                    {bill.customerPhone && <span className="text-slate-400 text-[11px]">({bill.customerPhone})</span>}
                  </div>
                )}

                {/* Items preview */}
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                  {bill.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{it.quantity}x {it.name}</span>
                      <span>{formatCurrency(it.itemTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <button
                    onClick={() => onDeleteHeldBill(bill.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>
                  <button
                    onClick={() => {
                      onResumeBill(bill);
                      onClose();
                    }}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Bill</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Close (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
