import { Category, Expense, MenuItem, Order, RestaurantSettings, WastageRecord } from '../types';
import { formatCurrency, formatDate, formatTime } from './formatters';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_7_days'
  | 'this_month'
  | 'last_30_days'
  | 'all_time'
  | 'custom';

export interface DateFilterOption {
  id: DateRangePreset;
  label: string;
}

export const DATE_PRESETS: DateFilterOption[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'all_time', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' },
];

export interface DateRangeResult {
  start: Date;
  end: Date;
  label: string;
}

export const getDateRange = (
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): DateRangeResult => {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'today': {
      const s = startOfDay(now);
      const e = endOfDay(now);
      return { start: s, end: e, label: `Today (${formatDate(s.toISOString())})` };
    }
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const s = startOfDay(y);
      const e = endOfDay(y);
      return { start: s, end: e, label: `Yesterday (${formatDate(s.toISOString())})` };
    }
    case 'this_week': {
      const s = startOfDay(now);
      const day = s.getDay();
      const diff = s.getDate() - day + (day === 0 ? -6 : 1); // Monday
      s.setDate(diff);
      const e = endOfDay(now);
      return { start: s, end: e, label: `This Week (${formatDate(s.toISOString())} - ${formatDate(e.toISOString())})` };
    }
    case 'last_7_days': {
      const s = startOfDay(now);
      s.setDate(s.getDate() - 6);
      const e = endOfDay(now);
      return { start: s, end: e, label: `Last 7 Days (${formatDate(s.toISOString())} - ${formatDate(e.toISOString())})` };
    }
    case 'this_month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const e = endOfDay(now);
      return {
        start: s,
        end: e,
        label: `This Month (${now.toLocaleString('default', { month: 'long', year: 'numeric' })})`,
      };
    }
    case 'last_30_days': {
      const s = startOfDay(now);
      s.setDate(s.getDate() - 29);
      const e = endOfDay(now);
      return { start: s, end: e, label: `Last 30 Days (${formatDate(s.toISOString())} - ${formatDate(e.toISOString())})` };
    }
    case 'all_time': {
      const s = new Date(2020, 0, 1, 0, 0, 0, 0);
      const e = new Date(2030, 11, 31, 23, 59, 59, 999);
      return { start: s, end: e, label: 'All Historic Records' };
    }
    case 'custom': {
      const s = customStart ? startOfDay(new Date(customStart)) : startOfDay(now);
      const e = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now);
      return {
        start: s,
        end: e,
        label: `${formatDate(s.toISOString())} to ${formatDate(e.toISOString())}`,
      };
    }
  }
};

export const filterOrdersByRange = (
  orders: Order[],
  range: DateRangeResult,
  orderTypeFilter: string = 'all'
): Order[] => {
  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    if (isNaN(orderDate.getTime())) return false;
    const inRange = orderDate >= range.start && orderDate <= range.end;
    if (!inRange) return false;

    if (orderTypeFilter !== 'all' && order.orderType !== orderTypeFilter) {
      return false;
    }
    return true;
  });
};

export interface SalesSummaryMetrics {
  totalOrdersCount: number;
  paidOrdersCount: number;
  cancelledOrdersCount: number;
  pendingOrdersCount: number;
  grossSubtotal: number;
  totalDiscounts: number;
  totalTaxes: number;
  totalDeliveryCharges: number;
  totalRoundOff: number;
  netRevenue: number;
  avgOrderValue: number;
  totalItemsSold: number;
  avgItemsPerOrder: number;
  guestCountTotal: number;
}

export const computeSalesSummary = (orders: Order[]): SalesSummaryMetrics => {
  let paidCount = 0;
  let cancelledCount = 0;
  let pendingCount = 0;
  let grossSubtotal = 0;
  let totalDiscounts = 0;
  let totalTaxes = 0;
  let totalDeliveryCharges = 0;
  let totalRoundOff = 0;
  let netRevenue = 0;
  let totalItemsSold = 0;
  let guestCountTotal = 0;

  orders.forEach((o) => {
    if (o.status === 'cancelled') {
      cancelledCount++;
      return;
    }

    if (o.paymentStatus === 'paid' || o.status === 'completed') {
      paidCount++;
      grossSubtotal += o.subtotal || 0;
      totalDiscounts += o.discountAmount || 0;
      totalTaxes += o.taxAmount || 0;
      totalDeliveryCharges += o.deliveryCharge || 0;
      totalRoundOff += o.roundOff || 0;
      netRevenue += o.grandTotal || 0;
      guestCountTotal += o.guestCount || 1;

      (o.items || []).forEach((item) => {
        totalItemsSold += item.quantity || 0;
      });
    } else {
      pendingCount++;
    }
  });

  const avgOrderValue = paidCount > 0 ? netRevenue / paidCount : 0;
  const avgItemsPerOrder = paidCount > 0 ? totalItemsSold / paidCount : 0;

  return {
    totalOrdersCount: orders.length,
    paidOrdersCount: paidCount,
    cancelledOrdersCount: cancelledCount,
    pendingOrdersCount: pendingCount,
    grossSubtotal,
    totalDiscounts,
    totalTaxes,
    totalDeliveryCharges,
    totalRoundOff,
    netRevenue,
    avgOrderValue,
    totalItemsSold,
    avgItemsPerOrder,
    guestCountTotal,
  };
};

export interface PaymentBreakdownItem {
  method: string;
  label: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export const computePaymentBreakdown = (orders: Order[]): PaymentBreakdownItem[] => {
  const methodMap: Record<string, { total: number; count: number; label: string }> = {
    cash: { total: 0, count: 0, label: 'Cash' },
    upi: { total: 0, count: 0, label: 'UPI / QR' },
    card: { total: 0, count: 0, label: 'Debit / Credit Card' },
    online: { total: 0, count: 0, label: 'Online / Gateway' },
    other: { total: 0, count: 0, label: 'Other Methods' },
  };

  let grandPaidTotal = 0;

  orders.forEach((o) => {
    if (o.status === 'cancelled' || (o.paymentStatus !== 'paid' && o.status !== 'completed')) return;

    if (o.payments && o.payments.length > 0) {
      o.payments.forEach((p) => {
        grandPaidTotal += p.amount;
        let key = 'other';
        if (p.method === 'cash') key = 'cash';
        else if (p.method === 'upi') key = 'upi';
        else if (p.method === 'credit_card' || p.method === 'debit_card') key = 'card';
        else if (p.method === 'online' || p.method === 'bank_transfer') key = 'online';

        methodMap[key].total += p.amount;
        methodMap[key].count += 1;
      });
    } else {
      const amt = o.grandTotal || 0;
      grandPaidTotal += amt;
      let key = 'cash';
      if (o.paymentMethod === 'upi') key = 'upi';
      else if (o.paymentMethod === 'credit_card' || o.paymentMethod === 'debit_card') key = 'card';
      else if (o.paymentMethod === 'online' || o.paymentMethod === 'bank_transfer') key = 'online';
      else if (o.paymentMethod === 'cash') key = 'cash';
      else key = 'other';

      methodMap[key].total += amt;
      methodMap[key].count += 1;
    }
  });

  return Object.keys(methodMap).map((key) => {
    const item = methodMap[key];
    const pct = grandPaidTotal > 0 ? (item.total / grandPaidTotal) * 100 : 0;
    return {
      method: key,
      label: item.label,
      totalAmount: item.total,
      count: item.count,
      percentage: Math.round(pct * 10) / 10,
    };
  });
};

export interface OrderTypeBreakdownItem {
  type: string;
  label: string;
  totalSales: number;
  orderCount: number;
  percentage: number;
}

export const computeOrderTypeBreakdown = (orders: Order[]): OrderTypeBreakdownItem[] => {
  const typeMap: Record<string, { label: string; sales: number; count: number }> = {
    dine_in: { label: 'Dine-In', sales: 0, count: 0 },
    takeaway: { label: 'Takeaway / Counter', sales: 0, count: 0 },
    delivery: { label: 'Home Delivery', sales: 0, count: 0 },
    online: { label: 'Online Orders', sales: 0, count: 0 },
  };

  let totalRevenue = 0;

  orders.forEach((o) => {
    if (o.status === 'cancelled' || (o.paymentStatus !== 'paid' && o.status !== 'completed')) return;
    const type = o.orderType in typeMap ? o.orderType : 'dine_in';
    const amount = o.grandTotal || 0;
    typeMap[type].sales += amount;
    typeMap[type].count += 1;
    totalRevenue += amount;
  });

  return Object.keys(typeMap).map((key) => {
    const item = typeMap[key];
    const pct = totalRevenue > 0 ? (item.sales / totalRevenue) * 100 : 0;
    return {
      type: key,
      label: item.label,
      totalSales: item.sales,
      orderCount: item.count,
      percentage: Math.round(pct * 10) / 10,
    };
  });
};

export interface ItemSalesRow {
  menuItemId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  foodType: string;
  quantitySold: number;
  totalRevenue: number;
  avgUnitPrice: number;
  orderCount: number;
  percentOfRevenue: number;
  percentOfVolume: number;
}

export const computeItemSalesReport = (
  orders: Order[],
  menuItems: MenuItem[],
  categories: Category[]
): ItemSalesRow[] => {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const menuItemMetaMap = new Map<string, MenuItem>();
  menuItems.forEach((m) => menuItemMetaMap.set(m.id, m));

  const aggMap = new Map<
    string,
    {
      name: string;
      categoryId: string;
      categoryName: string;
      foodType: string;
      qty: number;
      revenue: number;
      orderIds: Set<string>;
    }
  >();

  let grandRevenue = 0;
  let grandQty = 0;

  orders.forEach((order) => {
    if (order.status === 'cancelled' || (order.paymentStatus !== 'paid' && order.status !== 'completed')) return;

    (order.items || []).forEach((item) => {
      const menuItem = menuItemMetaMap.get(item.menuItemId);
      const categoryId = menuItem?.categoryId || 'uncategorized';
      const categoryName = categoryMap.get(categoryId) || 'Other';
      const foodType = item.foodType || menuItem?.foodType || 'veg';

      const key = item.menuItemId || item.name;
      let record = aggMap.get(key);
      if (!record) {
        record = {
          name: item.name,
          categoryId,
          categoryName,
          foodType,
          qty: 0,
          revenue: 0,
          orderIds: new Set(),
        };
        aggMap.set(key, record);
      }

      record.qty += item.quantity || 0;
      record.revenue += item.totalAmount || (item.unitPrice || item.basePrice || 0) * (item.quantity || 1);
      record.orderIds.add(order.id);

      grandRevenue += item.totalAmount || 0;
      grandQty += item.quantity || 0;
    });
  });

  const rows: ItemSalesRow[] = [];
  aggMap.forEach((val, id) => {
    const avgPrice = val.qty > 0 ? val.revenue / val.qty : 0;
    const revPct = grandRevenue > 0 ? (val.revenue / grandRevenue) * 100 : 0;
    const volPct = grandQty > 0 ? (val.qty / grandQty) * 100 : 0;

    rows.push({
      menuItemId: id,
      name: val.name,
      categoryId: val.categoryId,
      categoryName: val.categoryName,
      foodType: val.foodType,
      quantitySold: val.qty,
      totalRevenue: Math.round(val.revenue * 100) / 100,
      avgUnitPrice: Math.round(avgPrice * 100) / 100,
      orderCount: val.orderIds.size,
      percentOfRevenue: Math.round(revPct * 10) / 10,
      percentOfVolume: Math.round(volPct * 10) / 10,
    });
  });

  // Sort by revenue descending by default
  return rows.sort((a, b) => b.totalRevenue - a.totalRevenue);
};

export interface HourlySalesItem {
  hour: number;
  hourLabel: string;
  orderCount: number;
  totalSales: number;
  itemsSold: number;
  avgTicket: number;
}

export const computeHourlySalesReport = (orders: Order[]): HourlySalesItem[] => {
  const hours: HourlySalesItem[] = [];

  for (let h = 8; h <= 23; h++) {
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    const nextH = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12;
    const nextAmpm = (h + 1) < 12 ? 'AM' : 'PM';
    const label = `${displayHour} ${ampm} - ${nextH} ${nextAmpm}`;

    hours.push({
      hour: h,
      hourLabel: label,
      orderCount: 0,
      totalSales: 0,
      itemsSold: 0,
      avgTicket: 0,
    });
  }

  orders.forEach((o) => {
    if (o.status === 'cancelled' || (o.paymentStatus !== 'paid' && o.status !== 'completed')) return;
    const d = new Date(o.createdAt);
    const h = d.getHours();
    const entry = hours.find((item) => item.hour === h);
    if (entry) {
      entry.orderCount += 1;
      entry.totalSales += o.grandTotal || 0;
      (o.items || []).forEach((item) => {
        entry.itemsSold += item.quantity || 0;
      });
    }
  });

  hours.forEach((entry) => {
    entry.avgTicket = entry.orderCount > 0 ? Math.round(entry.totalSales / entry.orderCount) : 0;
  });

  return hours;
};

export interface DayOfWeekItem {
  dayIndex: number;
  dayName: string;
  shortName: string;
  orderCount: number;
  totalSales: number;
  avgTicket: number;
}

export const computeWeeklySalesReport = (orders: Order[]): DayOfWeekItem[] => {
  const days: DayOfWeekItem[] = [
    { dayIndex: 1, dayName: 'Monday', shortName: 'Mon', orderCount: 0, totalSales: 0, avgTicket: 0 },
    { dayIndex: 2, dayName: 'Tuesday', shortName: 'Tue', orderCount: 0, totalSales: 0, avgTicket: 0 },
    { dayIndex: 3, dayName: 'Wednesday', shortName: 'Wed', orderCount: 0, totalSales: 0, avgTicket: 0 },
    { dayIndex: 4, dayName: 'Thursday', shortName: 'Thu', orderCount: 0, totalSales: 0, avgTicket: 0 },
    { dayIndex: 5, dayName: 'Friday', shortName: 'Fri', orderCount: 0, totalSales: 0, avgTicket: 0 },
    { dayIndex: 6, dayName: 'Saturday', shortName: 'Sat', orderCount: 0, totalSales: 0, avgTicket: 0 },
    { dayIndex: 0, dayName: 'Sunday', shortName: 'Sun', orderCount: 0, totalSales: 0, avgTicket: 0 },
  ];

  orders.forEach((o) => {
    if (o.status === 'cancelled' || (o.paymentStatus !== 'paid' && o.status !== 'completed')) return;
    const d = new Date(o.createdAt);
    const dayOfWeek = d.getDay();
    const entry = days.find((item) => item.dayIndex === dayOfWeek);
    if (entry) {
      entry.orderCount += 1;
      entry.totalSales += o.grandTotal || 0;
    }
  });

  days.forEach((item) => {
    item.avgTicket = item.orderCount > 0 ? Math.round(item.totalSales / item.orderCount) : 0;
  });

  return days;
};

export interface DailyTrendItem {
  date: string;
  label: string;
  orderCount: number;
  grossSales: number;
  netSales: number;
  discounts: number;
  taxes: number;
  itemsCount: number;
}

export const computeDailyTrend = (orders: Order[]): DailyTrendItem[] => {
  const dateMap = new Map<
    string,
    {
      orderCount: number;
      grossSales: number;
      netSales: number;
      discounts: number;
      taxes: number;
      itemsCount: number;
    }
  >();

  orders.forEach((o) => {
    if (o.status === 'cancelled' || (o.paymentStatus !== 'paid' && o.status !== 'completed')) return;
    const d = new Date(o.createdAt);
    if (isNaN(d.getTime())) return;
    const dateStr = d.toISOString().split('T')[0];

    let entry = dateMap.get(dateStr);
    if (!entry) {
      entry = {
        orderCount: 0,
        grossSales: 0,
        netSales: 0,
        discounts: 0,
        taxes: 0,
        itemsCount: 0,
      };
      dateMap.set(dateStr, entry);
    }

    entry.orderCount += 1;
    entry.grossSales += o.subtotal || 0;
    entry.netSales += o.grandTotal || 0;
    entry.discounts += o.discountAmount || 0;
    entry.taxes += o.taxAmount || 0;
    (o.items || []).forEach((item) => {
      entry!.itemsCount += item.quantity || 0;
    });
  });

  const sortedDates = Array.from(dateMap.keys()).sort();
  return sortedDates.map((dateStr) => {
    const val = dateMap.get(dateStr)!;
    const d = new Date(dateStr);
    const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    return {
      date: dateStr,
      label,
      ...val,
    };
  });
};

export interface CategorySalesItem {
  categoryId: string;
  categoryName: string;
  itemsSold: number;
  revenue: number;
  percentage: number;
}

export const computeCategorySales = (
  orders: Order[],
  menuItems: MenuItem[],
  categories: Category[]
): CategorySalesItem[] => {
  const categoryMap = new Map<string, { name: string; itemsSold: number; revenue: number }>();
  categories.forEach((c) => {
    categoryMap.set(c.id, { name: c.name, itemsSold: 0, revenue: 0 });
  });

  const itemToCategory = new Map<string, string>();
  menuItems.forEach((m) => itemToCategory.set(m.id, m.categoryId));

  let totalRev = 0;

  orders.forEach((o) => {
    if (o.status === 'cancelled' || (o.paymentStatus !== 'paid' && o.status !== 'completed')) return;
    (o.items || []).forEach((item) => {
      const catId = itemToCategory.get(item.menuItemId) || 'other';
      const cat = categoryMap.get(catId) || { name: 'Other Beverages & Sides', itemsSold: 0, revenue: 0 };
      cat.itemsSold += item.quantity || 0;
      cat.revenue += item.totalAmount || 0;
      totalRev += item.totalAmount || 0;
      categoryMap.set(catId, cat);
    });
  });

  const result: CategorySalesItem[] = [];
  categoryMap.forEach((val, id) => {
    if (val.revenue > 0 || val.itemsSold > 0) {
      const pct = totalRev > 0 ? (val.revenue / totalRev) * 100 : 0;
      result.push({
        categoryId: id,
        categoryName: val.name,
        itemsSold: val.itemsSold,
        revenue: Math.round(val.revenue * 100) / 100,
        percentage: Math.round(pct * 10) / 10,
      });
    }
  });

  return result.sort((a, b) => b.revenue - a.revenue);
};

export interface StaffPerformanceItem {
  userId: string;
  userName: string;
  role: string;
  ordersCount: number;
  totalSales: number;
  avgTicket: number;
  totalDiscounts: number;
}

export const computeStaffSalesReport = (orders: Order[]): StaffPerformanceItem[] => {
  const staffMap = new Map<
    string,
    {
      name: string;
      role: string;
      ordersCount: number;
      totalSales: number;
      totalDiscounts: number;
    }
  >();

  orders.forEach((o) => {
    if (o.status === 'cancelled' || (o.paymentStatus !== 'paid' && o.status !== 'completed')) return;
    const staffId = o.cashierId || o.waiterId || 'system';
    const staffName = o.cashierName || o.waiterName || 'Staff Member';

    let entry = staffMap.get(staffId);
    if (!entry) {
      entry = {
        name: staffName,
        role: o.waiterId === staffId ? 'Server' : 'Cashier',
        ordersCount: 0,
        totalSales: 0,
        totalDiscounts: 0,
      };
      staffMap.set(staffId, entry);
    }

    entry.ordersCount += 1;
    entry.totalSales += o.grandTotal || 0;
    entry.totalDiscounts += o.discountAmount || 0;
  });

  const list: StaffPerformanceItem[] = [];
  staffMap.forEach((val, id) => {
    list.push({
      userId: id,
      userName: val.name,
      role: val.role,
      ordersCount: val.ordersCount,
      totalSales: val.totalSales,
      avgTicket: val.ordersCount > 0 ? Math.round(val.totalSales / val.ordersCount) : 0,
      totalDiscounts: val.totalDiscounts,
    });
  });

  return list.sort((a, b) => b.totalSales - a.totalSales);
};

export interface TaxAuditMetrics {
  totalTaxCollected: number;
  cgstAmount: number;
  sgstAmount: number;
  taxableValue: number;
  totalDiscountsGiven: number;
  promotionsCount: number;
}

export const computeTaxDiscountMetrics = (orders: Order[]): TaxAuditMetrics => {
  let totalTaxCollected = 0;
  let taxableValue = 0;
  let totalDiscountsGiven = 0;
  let promotionsCount = 0;

  orders.forEach((o) => {
    if (o.status === 'cancelled' || (o.paymentStatus !== 'paid' && o.status !== 'completed')) return;
    totalTaxCollected += o.taxAmount || 0;
    taxableValue += (o.subtotal || 0) - (o.discountAmount || 0);
    totalDiscountsGiven += o.discountAmount || 0;
    if (o.couponCode || o.discountAmount > 0) {
      promotionsCount++;
    }
  });

  // GST 5% in India is split 50/50 into CGST 2.5% and SGST 2.5%
  const cgstAmount = Math.round((totalTaxCollected / 2) * 100) / 100;
  const sgstAmount = Math.round((totalTaxCollected / 2) * 100) / 100;

  return {
    totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
    cgstAmount,
    sgstAmount,
    taxableValue: Math.round(taxableValue * 100) / 100,
    totalDiscountsGiven: Math.round(totalDiscountsGiven * 100) / 100,
    promotionsCount,
  };
};

export const generateZReportHTML = (
  summary: SalesSummaryMetrics,
  paymentBreakdown: PaymentBreakdownItem[],
  orderTypeBreakdown: OrderTypeBreakdownItem[],
  taxMetrics: TaxAuditMetrics,
  settings: RestaurantSettings,
  dateLabel: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Z-Report / Daily Financial Audit</title>
        <style>
          @page { margin: 5mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 300px;
            margin: 0 auto;
            padding: 12px;
            font-size: 12px;
            line-height: 1.35;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px solid #000; margin: 8px 0; }
          .flex-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .title-header { font-size: 1.3em; font-weight: bold; text-align: center; }
          .sub-header { font-size: 1.1em; font-weight: bold; margin-top: 6px; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="text-center">
          <div class="title-header">${settings.name}</div>
          <div>${settings.tagline || 'Restaurant & Fast Food'}</div>
          <div>${settings.address}</div>
          <div>GSTIN: ${settings.gstNumber}</div>
        </div>

        <div class="double-divider"></div>
        <div class="text-center text-bold" style="font-size: 1.2em;">DAILY AUDIT / Z-REPORT</div>
        <div class="text-center" style="font-size: 0.9em; margin-top: 2px;">PERIOD: ${dateLabel}</div>
        <div class="text-center" style="font-size: 0.85em;">Printed: ${new Date().toLocaleString()}</div>
        <div class="divider"></div>

        <div class="sub-header">1. SALES SUMMARY</div>
        <div class="flex-row">
          <span>Total Paid Orders:</span>
          <span class="text-bold">${summary.paidOrdersCount}</span>
        </div>
        <div class="flex-row">
          <span>Cancelled Orders:</span>
          <span>${summary.cancelledOrdersCount}</span>
        </div>
        <div class="flex-row">
          <span>Total Items Sold:</span>
          <span>${summary.totalItemsSold}</span>
        </div>
        <div class="flex-row">
          <span>Average Order Value:</span>
          <span>${formatCurrency(summary.avgOrderValue, settings.currencySymbol)}</span>
        </div>

        <div class="divider"></div>

        <div class="sub-header">2. FINANCIAL TOTALS</div>
        <div class="flex-row">
          <span>Gross Subtotal:</span>
          <span>${formatCurrency(summary.grossSubtotal, settings.currencySymbol)}</span>
        </div>
        <div class="flex-row">
          <span>Discounts Given:</span>
          <span>-${formatCurrency(summary.totalDiscounts, settings.currencySymbol)}</span>
        </div>
        <div class="flex-row">
          <span>Total GST Taxes:</span>
          <span>+${formatCurrency(summary.totalTaxes, settings.currencySymbol)}</span>
        </div>
        <div class="flex-row">
          <span>Delivery Charges:</span>
          <span>+${formatCurrency(summary.totalDeliveryCharges, settings.currencySymbol)}</span>
        </div>
        <div class="flex-row">
          <span>Round Off:</span>
          <span>${formatCurrency(summary.totalRoundOff, settings.currencySymbol)}</span>
        </div>

        <div class="double-divider"></div>
        <div class="flex-row text-bold" style="font-size: 1.2em;">
          <span>NET REVENUE:</span>
          <span>${formatCurrency(summary.netRevenue, settings.currencySymbol)}</span>
        </div>
        <div class="double-divider"></div>

        <div class="sub-header">3. PAYMENT SETTLEMENT</div>
        ${paymentBreakdown
          .map(
            (p) => `
          <div class="flex-row">
            <span>${p.label} (${p.count}):</span>
            <span class="text-bold">${formatCurrency(p.totalAmount, settings.currencySymbol)}</span>
          </div>
        `
          )
          .join('')}

        <div class="divider"></div>

        <div class="sub-header">4. CHANNELS / ORDER TYPES</div>
        ${orderTypeBreakdown
          .map(
            (o) => `
          <div class="flex-row">
            <span>${o.label} (${o.orderCount}):</span>
            <span>${formatCurrency(o.totalSales, settings.currencySymbol)}</span>
          </div>
        `
          )
          .join('')}

        <div class="divider"></div>

        <div class="sub-header">5. TAXATION AUDIT (GST)</div>
        <div class="flex-row">
          <span>Taxable Net Sales:</span>
          <span>${formatCurrency(taxMetrics.taxableValue, settings.currencySymbol)}</span>
        </div>
        <div class="flex-row">
          <span>CGST (2.5%):</span>
          <span>${formatCurrency(taxMetrics.cgstAmount, settings.currencySymbol)}</span>
        </div>
        <div class="flex-row">
          <span>SGST (2.5%):</span>
          <span>${formatCurrency(taxMetrics.sgstAmount, settings.currencySymbol)}</span>
        </div>
        <div class="flex-row text-bold">
          <span>Total Tax Collected:</span>
          <span>${formatCurrency(taxMetrics.totalTaxCollected, settings.currencySymbol)}</span>
        </div>

        <div class="double-divider"></div>
        <div class="text-center" style="margin-top: 15px;">
          <div>--- END OF AUDIT REPORT ---</div>
          <div style="font-size: 0.85em; margin-top: 4px;">Verified by Store Manager</div>
          <div style="margin-top: 30px; border-bottom: 1px solid #000; width: 60%; margin-left: auto; margin-right: auto;"></div>
          <div style="font-size: 0.8em; margin-top: 4px;">Manager Signature</div>
        </div>
      </body>
    </html>
  `;
};
