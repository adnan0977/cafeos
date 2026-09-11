import { UserRole } from '../types';

export const formatCurrency = (amount: number = 0, currencySymbol = '₹'): string => {
  return `${currencySymbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${mins}`;
};

export const formatTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const getRoleDetails = (role: UserRole): { label: string; bg: string; text: string } => {
  switch (role) {
    case 'super_admin':
      return { label: 'Super Admin / Owner', bg: 'bg-purple-100 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300' };
    case 'admin':
      return { label: 'Admin / Manager', bg: 'bg-indigo-100 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300' };
    case 'cashier':
      return { label: 'Cashier', bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300' };
    case 'biller':
      return { label: 'Biller', bg: 'bg-cyan-100 dark:bg-cyan-950/50', text: 'text-cyan-700 dark:text-cyan-300' };
    case 'kitchen_staff':
      return { label: 'Kitchen Staff', bg: 'bg-amber-100 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300' };
    case 'delivery_rider':
      return { label: 'Delivery Rider', bg: 'bg-blue-100 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300' };
    case 'inventory_staff':
      return { label: 'Store / Inventory', bg: 'bg-orange-100 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-300' };
    case 'employee':
    default:
      return { label: 'Staff / Employee', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' };
  }
};

export const getOrderStatusBadge = (status: string): { label: string; bg: string; text: string; dotColor: string } => {
  switch (status) {
    case 'new':
      return { label: 'New Order', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', dotColor: 'bg-blue-500' };
    case 'confirmed':
    case 'kot_generated':
      return { label: 'KOT Sent', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', dotColor: 'bg-amber-500' };
    case 'kitchen_accepted':
      return { label: 'Kitchen Accepted', bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-700', dotColor: 'bg-yellow-500' };
    case 'preparing':
      return { label: 'Preparing', bg: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-700', dotColor: 'bg-orange-500 animate-pulse' };
    case 'ready':
      return { label: 'Ready for Pickup', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', text: 'text-emerald-700', dotColor: 'bg-emerald-500' };
    case 'bill_generated':
    case 'payment_pending':
      return { label: 'Bill Pending', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', dotColor: 'bg-purple-500' };
    case 'paid':
    case 'completed':
      return { label: 'Completed & Paid', bg: 'bg-green-50 text-green-700 border-green-200', text: 'text-green-700', dotColor: 'bg-green-500' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', dotColor: 'bg-rose-500' };
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', dotColor: 'bg-slate-400' };
  }
};
