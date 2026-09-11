import React, { useState } from 'react';
import {
  Bike,
  Power,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  Store,
  Sliders,
  BellRing,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { AggregatorChannel } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const DEFAULT_CHANNELS: AggregatorChannel[] = [
  {
    id: 'ch-swiggy',
    name: 'Swiggy',
    code: 'SWIGGY-REST-401',
    isEnabled: true,
    commissionPercent: 18,
    markupPercent: 10,
    autoAcceptOrders: true,
    status: 'online',
    ordersToday: 28,
    salesToday: 14250,
    rating: 4.6,
  },
  {
    id: 'ch-zomato',
    name: 'Zomato',
    code: 'ZOMATO-IND-902',
    isEnabled: true,
    commissionPercent: 22,
    markupPercent: 10,
    autoAcceptOrders: true,
    status: 'online',
    ordersToday: 34,
    salesToday: 18900,
    rating: 4.5,
  },
  {
    id: 'ch-magicpin',
    name: 'MagicPin',
    code: 'MAGIC-5501',
    isEnabled: false,
    commissionPercent: 12,
    markupPercent: 5,
    autoAcceptOrders: false,
    status: 'offline',
    ordersToday: 6,
    salesToday: 2400,
    rating: 4.2,
  },
  {
    id: 'ch-direct',
    name: 'Direct Online Store & QR Delivery',
    code: 'DIRECT-WEB-01',
    isEnabled: true,
    commissionPercent: 0,
    markupPercent: 0,
    autoAcceptOrders: false,
    status: 'online',
    ordersToday: 15,
    salesToday: 8300,
    rating: 4.9,
  },
];

export const AggregatorManagement: React.FC = () => {
  const { menuItems = [] } = useRestaurant();

  const [channels, setChannels] = useState<AggregatorChannel[]>(() => {
    const saved = localStorage.getItem('royalpos_aggregator_channels');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_CHANNELS;
  });

  const [allPaused, setAllPaused] = useState(false);
  const [notification, setNotification] = useState('');

  const totalOnlineOrders = channels.reduce((sum, c) => sum + (c.ordersToday || 0), 0);
  const totalOnlineSales = channels.reduce((sum, c) => sum + (c.salesToday || 0), 0);
  const totalCommissionDeducted = channels.reduce(
    (sum, c) => sum + ((c.salesToday || 0) * (c.commissionPercent / 100)),
    0
  );
  const netBankPayout = totalOnlineSales - totalCommissionDeducted;

  const handleToggleChannelStatus = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'online' ? 'offline' : 'online';
          const nextEnabled = nextStatus === 'online';
          return { ...c, status: nextStatus, isEnabled: nextEnabled };
        }
        return c;
      })
    );
  };

  const handleToggleAutoAccept = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, autoAcceptOrders: !c.autoAcceptOrders } : c))
    );
  };

  const handleUpdateMarkup = (id: string, newMarkup: number) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, markupPercent: newMarkup } : c))
    );
    setNotification('Aggregator menu price markup updated!');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleToggleEmergencyPause = () => {
    const nextState = !allPaused;
    setAllPaused(nextState);
    setChannels((prev) =>
      prev.map((c) => ({
        ...c,
        status: nextState ? 'offline' : 'online',
        isEnabled: !nextState,
      }))
    );
    setNotification(
      nextState
        ? 'EMERGENCY RUSH: All online delivery channels paused! Kitchen will not receive new aggregator orders.'
        : 'Store Resumed: Swiggy, Zomato & Direct Delivery portals reopened for orders.'
    );
    setTimeout(() => setNotification(''), 4500);
  };

  const handlePushCatalogToPortals = () => {
    setNotification(
      `Instant Catalog Broadcast: Pushed ${menuItems.length} live items, modified prices (+markup), and in-stock statuses to Swiggy & Zomato APIs.`
    );
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Swiggy, Zomato &amp; Online Aggregator Hub
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                RoyalPOS Omnichannel
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live aggregator store toggle, channel-specific price markups to recover commissions, auto-accept dispatch, and bank payout reconciliation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePushCatalogToPortals}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
            <span>Push Menu to Portals</span>
          </button>

          <button
            type="button"
            onClick={handleToggleEmergencyPause}
            className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${
              allPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{allPaused ? 'Resume All Portals' : 'Kitchen Rush Pause (All)'}</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300 animate-in fade-in">
          <BellRing className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Online Sales & Payout KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Aggregator Sales</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalOnlineSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across {totalOnlineOrders} online orders today</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Platform Commissions</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            - {formatCurrency(totalCommissionDeducted)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Avg 18-22% platform cut</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Bank Payout Expected</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(netBankPayout)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">After commission deduction</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Integration Status</div>
          <div className="text-sm font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !allPaused ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{!allPaused ? 'Kitchen Receiving Orders' : 'Portals Paused'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Automatic KOT printing ready</div>
        </div>
      </div>

      {/* Aggregator Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((channel) => {
          const isOnline = channel.status === 'online';
          const commissionVal = (channel.salesToday * channel.commissionPercent) / 100;
          const netChannelPayout = channel.salesToday - commissionVal;

          return (
            <div
              key={channel.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 shadow-xs transition-all space-y-4 ${
                isOnline
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              {/* Top Bar */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
                      channel.name.includes('Swiggy')
                        ? 'bg-orange-500 text-white'
                        : channel.name.includes('Zomato')
                        ? 'bg-rose-600 text-white'
                        : channel.name.includes('MagicPin')
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {channel.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-base text-slate-900 dark:text-white">
                        {channel.name}
                      </h4>
                      {channel.rating && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          ★ {channel.rating}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{channel.code}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleChannelStatus(channel.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isOnline
                      ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </button>
              </div>

              {/* Today's Sales Box */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Today Sales</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {formatCurrency(channel.salesToday)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Commission</span>
                  <span className="font-black text-rose-600">
                    -{formatCurrency(commissionVal)} ({channel.commissionPercent}%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Net Payout</span>
                  <span className="font-black text-emerald-600">{formatCurrency(netChannelPayout)}</span>
                </div>
              </div>

              {/* RoyalPOS Feature: Price Markup & Auto Accept */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                      Menu Price Inflation Markup
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Offset commission by marking up portal prices
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={channel.markupPercent}
                      onChange={(e) => handleUpdateMarkup(channel.id, parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-black text-xs text-center text-amber-600"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                      Auto-Accept Online Orders
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Instantly accept orders and fire KOT to kitchen printer
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={channel.autoAcceptOrders}
                    onChange={() => handleToggleAutoAccept(channel.id)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
