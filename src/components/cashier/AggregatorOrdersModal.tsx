import {
  AlertCircle,
  Bell,
  Bike,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Phone,
  Printer,
  Sparkles,
  User,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface AggregatorOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MockAggregatorOrder {
  id: string;
  platform: 'swiggy' | 'zomato' | 'magicpin';
  orderCode: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; price: number; notes?: string }>;
  subtotal: number;
  tax: number;
  grandTotal: number;
  riderName: string;
  riderPhone: string;
  riderStatus: 'assigned' | 'arriving' | 'at_restaurant' | 'picked_up';
  pickupOtp: string;
  status: 'new' | 'accepted' | 'food_ready' | 'dispatched';
  prepTimeRemainingMins: number;
  receivedAt: string;
}

const INITIAL_AGGREGATOR_ORDERS: MockAggregatorOrder[] = [
  {
    id: 'agg-1',
    platform: 'zomato',
    orderCode: 'ZOMATO-8492',
    customerName: 'Rahul Verma',
    customerPhone: '+91 98234 11234',
    items: [
      { name: 'Paneer Butter Masala', quantity: 1, price: 260, notes: 'Extra butter, mild spice' },
      { name: 'Butter Naan', quantity: 3, price: 150 },
      { name: 'Jeera Rice', quantity: 1, price: 140 },
    ],
    subtotal: 550,
    tax: 27.5,
    grandTotal: 577.5,
    riderName: 'Vikram Singh (Zomato Valet)',
    riderPhone: '+91 98765 43210',
    riderStatus: 'arriving',
    pickupOtp: '8492',
    status: 'new',
    prepTimeRemainingMins: 15,
    receivedAt: '2 mins ago',
  },
  {
    id: 'agg-2',
    platform: 'swiggy',
    orderCode: 'SWIGGY-3108',
    customerName: 'Priya Sharma',
    customerPhone: '+91 99123 45678',
    items: [
      { name: 'Veg Hakka Noodles', quantity: 2, price: 360, notes: 'Jain preparation, no onion garlic' },
      { name: 'Crispy Veg Manchurian Dry', quantity: 1, price: 220 },
    ],
    subtotal: 580,
    tax: 29,
    grandTotal: 609,
    riderName: 'Amit Patel (Swiggy Delivery)',
    riderPhone: '+91 97234 56789',
    riderStatus: 'at_restaurant',
    pickupOtp: '3108',
    status: 'accepted',
    prepTimeRemainingMins: 8,
    receivedAt: '12 mins ago',
  },
  {
    id: 'agg-3',
    platform: 'swiggy',
    orderCode: 'SWIGGY-1940',
    customerName: 'Ananya Roy',
    customerPhone: '+91 98333 77123',
    items: [
      { name: 'Cold Coffee with Ice Cream', quantity: 2, price: 240 },
      { name: 'Cheese Garlic Bread', quantity: 1, price: 180 },
    ],
    subtotal: 420,
    tax: 21,
    grandTotal: 441,
    riderName: 'Sunil Kumar (Swiggy Delivery)',
    riderPhone: '+91 98111 22334',
    riderStatus: 'assigned',
    pickupOtp: '1940',
    status: 'food_ready',
    prepTimeRemainingMins: 0,
    receivedAt: '22 mins ago',
  },
];

export const AggregatorOrdersModal: React.FC<AggregatorOrdersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, setKOTModalOrder } = useRestaurant();
  const [ordersList, setOrdersList] = useState<MockAggregatorOrder[]>(INITIAL_AGGREGATOR_ORDERS);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'swiggy' | 'zomato'>('all');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  if (!isOpen) return null;

  const filteredOrders =
    selectedPlatform === 'all'
      ? ordersList
      : ordersList.filter((o) => o.platform === selectedPlatform);

  const handleAcceptOrder = (orderId: string) => {
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'accepted' } : o))
    );
    setActionSuccess('Order Accepted! Food is being prepared in kitchen.');
    setTimeout(() => setActionSuccess(''), 2500);
  };

  const handleMarkFoodReady = (orderId: string) => {
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'food_ready', prepTimeRemainingMins: 0 } : o))
    );
    setActionSuccess('Food marked ready! Rider notified for pickup.');
    setTimeout(() => setActionSuccess(''), 2500);
  };

  const handleHandover = (orderId: string) => {
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'dispatched' } : o))
    );
    setActionSuccess('Order handed over to delivery valet!');
    setTimeout(() => setActionSuccess(''), 2500);
  };

  const handlePrintKOT = (order: MockAggregatorOrder) => {
    const tempOrder: Order = {
      id: `agg-kot-${order.id}`,
      orderNumber: parseInt(order.pickupOtp) || 1001,
      kotNumber: parseInt(order.pickupOtp) || 201,
      orderType: 'delivery',
      status: 'kot_generated',
      items: order.items.map((i, idx) => ({
        id: `agg-item-${idx}`,
        menuItemId: `item-${idx}`,
        name: i.name,
        foodType: 'veg',
        basePrice: i.price,
        unitPrice: i.price,
        quantity: i.quantity,
        modifiers: [],
        taxPercent: 5,
        taxAmount: 0,
        totalAmount: i.price * i.quantity,
        kitchenStatus: 'pending',
        notes: i.notes,
      })),
      subtotal: order.subtotal,
      deliveryCharge: 0,
      taxAmount: order.tax,
      discountAmount: 0,
      roundOff: 0,
      grandTotal: order.grandTotal,
      customerName: `${order.customerName} (${order.platform.toUpperCase()})`,
      customerPhone: order.customerPhone,
      paymentStatus: 'paid',
      payments: [{ method: 'online_aggregator' as any, amount: order.grandTotal }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cashierId: 'aggregator-sync',
      cashierName: `${order.platform.toUpperCase()} Integration`,
      terminalId: 'ONLINE-AGGREGATOR-GATEWAY',
    };

    setKOTModalOrder(tempOrder);
  };

  const newOrdersCount = ordersList.filter((o) => o.status === 'new').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Online Aggregators (Swiggy & Zomato)</span>
                {newOrdersCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    {newOrdersCount} NEW
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Petpooja & RoyalPOS direct cloud aggregator live order feed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedPlatform('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedPlatform === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({ordersList.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('swiggy')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  selectedPlatform === 'swiggy'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-orange-400 hover:text-orange-300'
                }`}
              >
                <span>Swiggy</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('zomato')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  selectedPlatform === 'zomato'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <span>Zomato</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Success Toast */}
        {actionSuccess && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center gap-2 animate-in slide-in-from-top">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Orders List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredOrders.map((order) => {
            const isSwiggy = order.platform === 'swiggy';
            return (
              <div
                key={order.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  order.status === 'new'
                    ? 'border-amber-500/70 bg-amber-950/15 ring-1 ring-amber-500/40'
                    : 'border-slate-800 bg-slate-950/80'
                }`}
              >
                {/* Top Row: Brand & ID, Status, OTP */}
                <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                        isSwiggy
                          ? 'bg-orange-500 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {order.platform}
                    </span>
                    <div>
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <span>{order.orderCode}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          • {order.receivedAt}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Customer: <strong className="text-slate-200">{order.customerName}</strong> ({order.customerPhone})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Pickup OTP */}
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Pickup OTP</div>
                      <div className="text-base font-black text-amber-400 font-mono tracking-widest">
                        {order.pickupOtp}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                        order.status === 'new'
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : order.status === 'accepted'
                          ? 'bg-sky-500 text-slate-950'
                          : order.status === 'food_ready'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Items & Cooking Notes */}
                <div className="py-3 grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-7 space-y-2">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Ordered Items:
                    </div>
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60"
                        >
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-400 font-black flex items-center justify-center text-[10px]">
                                {item.quantity}x
                              </span>
                              <span>{item.name}</span>
                            </div>
                            {item.notes && (
                              <div className="text-[10px] text-amber-300 font-medium mt-0.5 ml-7">
                                Note: {item.notes}
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-slate-300 font-bold">
                            {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rider Info & Timing */}
                  <div className="md:col-span-5 bg-slate-900/60 rounded-xl p-3 border border-slate-800/60 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-slate-500" />
                        <span>Delivery Valet Status</span>
                      </div>
                      <div className="text-xs font-bold text-white">{order.riderName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{order.riderPhone}</span>
                      </div>

                      <div className="mt-2 text-xs">
                        <span className="text-slate-400">Valet Position: </span>
                        <span className="font-black text-amber-300 uppercase text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                          {order.riderStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total Order Value:</span>
                      <span className="font-black text-emerald-400 font-mono text-sm">
                        {formatCurrency(order.grandTotal, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintKOT(order)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print Kitchen KOT</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'new' && (
                      <button
                        type="button"
                        onClick={() => handleAcceptOrder(order.id)}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Accept Order & Fire Kitchen</span>
                      </button>
                    )}

                    {order.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => handleMarkFoodReady(order.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>Food Ready for Valet</span>
                      </button>
                    )}

                    {order.status === 'food_ready' && (
                      <button
                        type="button"
                        onClick={() => handleHandover(order.id)}
                        className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Handover & Verify OTP</span>
                      </button>
                    )}

                    {order.status === 'dispatched' && (
                      <span className="text-xs text-slate-500 font-bold px-3 py-1 bg-slate-800 rounded-xl">
                        ✓ Dispatched with Rider
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Swiggy & Zomato Webhook Active • Simulated 2-Way Sync</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
