import React, { useState } from 'react';
import { Utensils, Plus, Edit2, Trash2, QrCode, Users, CheckCircle2, AlertCircle, Sparkles, Printer, Download, Eye } from 'lucide-react';
import { RestaurantTable, TableStatus, Order } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface TableManagementProps {
  tables: RestaurantTable[];
  orders: Order[];
  onAddTable: (table: Omit<RestaurantTable, 'id'>) => void;
  onUpdateTable: (id: string, updates: Partial<RestaurantTable>) => void;
  onDeleteTable: (id: string) => void;
  currencySymbol: string;
  onOpenOrderReceipt?: (order: Order) => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  tables = [],
  orders = [],
  onAddTable,
  onUpdateTable,
  onDeleteTable,
  currencySymbol = '₹',
  onOpenOrderReceipt,
}) => {
  const safeTables = Array.isArray(tables) ? tables : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [qrModalTable, setQrModalTable] = useState<RestaurantTable | null>(null);

  // Form states
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [section, setSection] = useState('Ground Floor');
  const [capacity, setCapacity] = useState('4');
  const [status, setStatus] = useState<TableStatus>('available');

  const sections = Array.from(new Set(safeTables.map((t) => t.section || 'General')));

  const filteredTables = safeTables.filter((t) => {
    if (selectedSection !== 'all' && (t.section || 'General') !== selectedSection) return false;
    return true;
  });

  const handleOpenModal = (t?: RestaurantTable) => {
    if (t) {
      setEditingTable(t);
      setNumber(t.number);
      setName(t.name);
      setSection(t.section || 'Ground Floor');
      setCapacity(String(t.capacity));
      setStatus(t.status);
    } else {
      setEditingTable(null);
      setNumber(String(safeTables.length + 1));
      setName(`Table ${safeTables.length + 1}`);
      setSection('Ground Floor');
      setCapacity('4');
      setStatus('available');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim() || !name.trim()) return;

    if (editingTable) {
      onUpdateTable(editingTable.id, {
        number,
        name,
        section,
        capacity: parseInt(capacity) || 4,
        status,
      });
    } else {
      onAddTable({
        number,
        name,
        section,
        capacity: parseInt(capacity) || 4,
        status: 'available',
      });
    }
    setIsModalOpen(false);
  };

  const getStatusColor = (st: TableStatus) => {
    switch (st) {
      case 'available':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'occupied':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'reserved':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'cleaning':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Dining Floor Layout & QR Code Self-Ordering
            </h3>
            <p className="text-xs text-slate-500">
              Manage dine-in tables, live occupancy status & customer self-ordering QR stands
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Section filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedSection('all')}
              className={`px-3 py-1 rounded-lg ${
                selectedSection === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Sections ({safeTables.length})
            </button>
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1 rounded-lg ${
                  selectedSection === sec
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {sec} ({safeTables.filter((t) => (t.section || 'General') === sec).length})
              </button>
            ))}
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTables.map((t) => {
          const activeOrder = t.currentOrderId ? safeOrders.find((o) => o.id === t.currentOrderId) : null;
          return (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-amber-500/50 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-800 dark:text-slate-200 text-sm">
                      #{t.number}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {t.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {t.section || 'Ground Floor'} • {t.capacity} Pax
                      </p>
                    </div>
                  </div>

                  <select
                    value={t.status}
                    onChange={(e) => onUpdateTable(t.id, { status: e.target.value as TableStatus })}
                    className={`text-[10px] font-bold uppercase rounded-full px-2.5 py-1 border outline-hidden cursor-pointer ${getStatusColor(
                      t.status
                    )}`}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>

                {activeOrder ? (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                    <div className="flex justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                      <span>Live Order #{activeOrder.orderNumber}</span>
                      <span>{formatCurrency(activeOrder.grandTotal, currencySymbol)}</span>
                    </div>
                    <div className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-1 flex justify-between">
                      <span>{activeOrder.items?.length || 0} items</span>
                      <span className="capitalize">{activeOrder.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-400 font-medium">
                    No active bill on table
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => setQrModalTable(t)}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-slate-700 dark:text-slate-300 hover:text-amber-700 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(t)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${t.name}?`)) onDeleteTable(t.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingTable ? 'Edit Table Settings' : 'Add New Table'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Table Number</label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Capacity (Pax)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Section / Floor</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="Ground Floor">Ground Floor Main AC Hall</option>
                  <option value="First Floor">First Floor Lounge</option>
                  <option value="Rooftop Garden">Rooftop Garden Terrace</option>
                  <option value="Outdoor Patio">Outdoor Patio</option>
                  <option value="Bar Counter">Bar Counter</option>
                </select>
              </div>
              {editingTable && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Live Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TableStatus)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
              )}
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Stand Preview Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden text-center p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                Digital Self-Ordering QR
              </span>
              <button onClick={() => setQrModalTable(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-md">
                {/* SVG QR Code Simulation */}
                <div className="w-36 h-36 border-4 border-slate-900 p-2 flex flex-col justify-between bg-white">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-4 border-slate-900 bg-slate-900 p-1">
                      <div className="w-full h-full bg-white" />
                    </div>
                    <div className="w-8 h-8 border-4 border-slate-900 bg-slate-900 p-1">
                      <div className="w-full h-full bg-white" />
                    </div>
                  </div>
                  <div className="flex justify-center items-center py-2">
                    <Utensils className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-4 border-slate-900 bg-slate-900 p-1">
                      <div className="w-full h-full bg-white" />
                    </div>
                    <div className="w-8 h-8 bg-slate-900" />
                  </div>
                </div>
              </div>

              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">
                {qrModalTable.name} (Section: {qrModalTable.section || 'Ground Floor'})
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Scan to browse interactive food menu, customize add-ons, and place orders directly from table.
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  alert(`Printing Table Stand QR Badge for ${qrModalTable.name}`);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Table Tent</span>
              </button>
              <button
                onClick={() => setQrModalTable(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
