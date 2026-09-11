import React, { useState } from 'react';
import { Building2, Phone, Mail, MapPin, Plus, Edit2, Trash2, Search, CheckCircle2, XCircle, Package } from 'lucide-react';
import { Supplier, Ingredient } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SupplierManagementProps {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (id: string, updates: Partial<Supplier>) => void;
  onDeleteSupplier?: (id: string) => void;
}

export const SupplierManagement: React.FC<SupplierManagementProps> = ({
  suppliers = [],
  ingredients = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
}) => {
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [notes, setNotes] = useState('');

  const filteredSuppliers = safeSuppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  const handleOpenModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setName(sup.name);
      setContactPerson(sup.contactPerson);
      setPhone(sup.phone);
      setEmail(sup.email);
      setAddress(sup.address);
      setPaymentTerms(sup.paymentTerms || 'Net 15');
      setNotes(sup.notes || '');
    } else {
      setEditingSupplier(null);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setPaymentTerms('Net 15');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      onUpdateSupplier(editingSupplier.id, {
        name,
        contactPerson,
        phone,
        email,
        address,
        paymentTerms,
        notes,
      });
    } else {
      onAddSupplier({
        name,
        contactPerson,
        phone,
        email,
        address,
        suppliedIngredients: [],
        paymentTerms,
        isActive: true,
        notes,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Authorized Vendors & Suppliers ({suppliers.length})
            </h3>
            <p className="text-xs text-slate-500">
              Procurement contacts, payment terms & live raw material associations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vendor or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-48 sm:w-64"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((sup) => {
          const suppliedItems = ingredients.filter(
            (i) => i.supplierId === sup.id || sup.suppliedIngredients?.includes(i.id)
          );
          return (
            <div
              key={sup.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                      {sup.id}
                    </span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mt-1">
                      {sup.name}
                    </h4>
                    <p className="text-xs font-semibold text-amber-600">Contact: {sup.contactPerson}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sup.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {sup.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.address || 'Local Hub'}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Package className="w-3 h-3 text-amber-500" /> Supplied Items ({suppliedItems.length})
                    </span>
                    <span className="text-amber-600">{sup.paymentTerms}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suppliedItems.slice(0, 4).map((i) => (
                      <span
                        key={i.id}
                        className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-medium"
                      >
                        {i.name}
                      </span>
                    ))}
                    {suppliedItems.length > 4 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                        +{suppliedItems.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => handleOpenModal(sup)}
                  className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingSupplier ? 'Edit Vendor Profile' : 'Add New Supplier'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company / Vendor Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="Immediate Cash">Immediate Cash</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Physical Hub / Warehouse Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
