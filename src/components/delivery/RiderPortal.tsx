import {
  Bike,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Navigation,
  Package,
  Phone,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const RiderPortal: React.FC = () => {
  const { orders, updateDeliveryStatus, updateOrderStatus, processPayment, riders, setReceiptModalOrder, settings } = useRestaurant();
  const { currentUser } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'assigned' | 'in_transit' | 'delivered'>('assigned');
  const [selectedRiderId, setSelectedRiderId] = useState<string>(
    currentUser?.role === 'delivery_rider' ? currentUser.id : riders[0]?.id || 'usr-rider-1'
  );

  // Delivery orders for this rider
  const deliveryOrders = orders.filter((o) => {
    if (o.orderType !== 'delivery') return false;
    if (o.deliveryRiderId && o.deliveryRiderId !== selectedRiderId) return false;

    if (activeFilter === 'assigned') {
      return !o.deliveryStatus || o.deliveryStatus === 'pending' || o.deliveryStatus === 'assigned';
    } else if (activeFilter === 'in_transit') {
      return o.deliveryStatus === 'picked_up' || o.deliveryStatus === 'in_transit';
    } else {
      return o.deliveryStatus === 'delivered';
    }
  });

  // Calculate rider metrics
  const activeRider = riders.find((r) => r.id === selectedRiderId) || riders[0];
  const deliveredToday = orders.filter(
    (o) => o.orderType === 'delivery' && o.deliveryRiderId === selectedRiderId && o.deliveryStatus === 'delivered'
  );
  const codCollected = deliveredToday
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const handleStatusChange = (order: Order, nextStatus: Order['deliveryStatus']) => {
    updateDeliveryStatus(order.id, nextStatus);
    if (nextStatus === 'picked_up') {
      updateOrderStatus(order.id, 'out_for_delivery');
    } else if (nextStatus === 'delivered') {
      updateOrderStatus(order.id, 'delivered');
      // If COD pending, mark payment settled
      if (order.paymentStatus === 'pending') {
        processPayment(order.id, [{ method: 'cash', amount: order.grandTotal }]);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 space-y-6">
      {/* Top Rider Header & Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Rider Delivery Command
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">Active Rider Profile:</span>
              <select
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                className="text-xs font-bold text-amber-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-700"
              >
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.vehicleNumber}) - {r.status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rider shift stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
            <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
              Completed Trips
            </div>
            <div className="text-lg font-extrabold text-emerald-900 dark:text-emerald-100">
              {deliveredToday.length} Deliveries
            </div>
          </div>

          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
            <div className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">
              COD Cash to Handover
            </div>
            <div className="text-lg font-extrabold text-amber-900 dark:text-amber-100">
              {formatCurrency(codCollected, settings.currencySymbol)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md">
        <button
          onClick={() => setActiveFilter('assigned')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeFilter === 'assigned'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Pickup Queue ({orders.filter((o) => o.orderType === 'delivery' && (!o.deliveryStatus || o.deliveryStatus === 'pending' || o.deliveryStatus === 'assigned')).length})
        </button>
        <button
          onClick={() => setActiveFilter('in_transit')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeFilter === 'in_transit'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          On the Way ({orders.filter((o) => o.orderType === 'delivery' && (o.deliveryStatus === 'picked_up' || o.deliveryStatus === 'in_transit')).length})
        </button>
        <button
          onClick={() => setActiveFilter('delivered')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeFilter === 'delivered'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Delivered Today ({deliveredToday.length})
        </button>
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveryOrders.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Bike className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            No delivery orders in this queue.
          </div>
        ) : (
          deliveryOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      Order #{order.orderNumber}
                    </span>
                    <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right font-black text-sm text-amber-600">
                    {formatCurrency(order.grandTotal, settings.currencySymbol)}
                  </div>
                </div>

                {/* Customer & Location */}
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {order.customerName || 'Customer'}
                      </div>
                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="text-amber-600 font-semibold flex items-center gap-1 mt-0.5 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.customerPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {order.deliveryAddress || 'Address on file'}
                      </div>
                      {order.deliveryLandmark && (
                        <div className="text-[11px] text-slate-400">
                          Landmark: {order.deliveryLandmark}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-500 text-[10px] uppercase">
                    Order Food Items:
                  </div>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-800 dark:text-slate-200">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">{formatCurrency(item.totalAmount)}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Tag */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Payment Method:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800'
                    }`}
                  >
                    {order.paymentStatus === 'paid' ? `PREPAID (${order.paymentMethod?.toUpperCase()})` : 'CASH ON DELIVERY (COD)'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setReceiptModalOrder(order)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100"
                >
                  Bill
                </button>

                {(!order.deliveryStatus || order.deliveryStatus === 'pending' || order.deliveryStatus === 'assigned') && (
                  <button
                    onClick={() => handleStatusChange(order, 'picked_up')}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Package className="w-4 h-4" />
                    <span>Pickup From Kitchen</span>
                  </button>
                )}

                {order.deliveryStatus === 'picked_up' && (
                  <button
                    onClick={() => handleStatusChange(order, 'in_transit')}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Start Navigation</span>
                  </button>
                )}

                {order.deliveryStatus === 'in_transit' && (
                  <button
                    onClick={() => handleStatusChange(order, 'delivered')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Delivered & Paid</span>
                  </button>
                )}

                {order.deliveryStatus === 'delivered' && (
                  <div className="flex-1 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Delivered Successfully</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
