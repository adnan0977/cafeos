import { Order } from '../types';

export const generateDemoOrders = (): Order[] => {
  const now = new Date();
  const orders: Order[] = [];

  const itemsPool = [
    {
      id: 'zorko-bgr-mexican-king',
      name: 'Mexican King Burger',
      basePrice: 89,
      unitPrice: 104,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-burger',
    },
    {
      id: 'zorko-bgr-spicy-salsa-bbq',
      name: 'Spicy Salsa Barbeque Burger',
      basePrice: 79,
      unitPrice: 79,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-burger',
    },
    {
      id: 'zorko-fry-peri-peri',
      name: 'Peri Peri French Fries',
      basePrice: 99,
      unitPrice: 99,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-fries',
    },
    {
      id: 'zorko-fry-salted',
      name: 'Salted French Fries',
      basePrice: 79,
      unitPrice: 79,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-fries',
    },
    {
      id: 'zorko-moj-surprise',
      name: 'Surprise Mojito (BEST SELLER)',
      basePrice: 49,
      unitPrice: 49,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-mojito',
    },
    {
      id: 'zorko-moj-mint-curacao',
      name: 'Blue Curacao Mint Mojito',
      basePrice: 59,
      unitPrice: 59,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-mojito',
    },
    {
      id: 'zorko-mgi-cheese-chatori',
      name: 'Cheese Chatori Maggi',
      basePrice: 89,
      unitPrice: 89,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-maggi',
    },
    {
      id: 'zorko-pza-paneer-bbq',
      name: 'Paneer BBQ Pizza (7-inch)',
      basePrice: 169,
      unitPrice: 169,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-pizza',
    },
    {
      id: 'zorko-kul-cheese-loaded-pizza',
      name: 'Kulhad Pizza Cheese Loaded',
      basePrice: 119,
      unitPrice: 119,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-kulhad',
    },
    {
      id: 'zorko-mom-fried-paneer',
      name: 'Fried Paneer Momos (6 Pcs)',
      basePrice: 99,
      unitPrice: 99,
      taxPercent: 5,
      foodType: 'veg' as const,
      categoryId: 'cat-momos',
    },
  ];

  const cashiers = [
    { id: 'usr-3', name: 'Pooja Verma' },
    { id: 'usr-2', name: 'Rahul Sharma' },
    { id: 'usr-4', name: 'Rohan Mehra' },
  ];

  const paymentMethods: ('upi' | 'cash' | 'credit_card' | 'online')[] = [
    'upi',
    'upi',
    'cash',
    'credit_card',
    'upi',
    'cash',
    'online',
  ];

  const orderTypes: ('dine_in' | 'takeaway' | 'delivery')[] = [
    'dine_in',
    'dine_in',
    'takeaway',
    'delivery',
    'dine_in',
  ];

  let orderNum = 200;

  // Generate orders over the past 28 days
  for (let daysAgo = 28; daysAgo >= 0; daysAgo--) {
    // Determine order volume for that day (e.g. 5 to 14 orders, more on weekends)
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() - daysAgo);
    const dayOfWeek = orderDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const ordersCount = isWeekend ? 10 + (orderNum % 5) : 6 + (orderNum % 4);

    for (let o = 0; o < ordersCount; o++) {
      orderNum++;
      // Distribute hours: lunch rush (12-14), evening rush (19-21), snacks (16-18)
      const rushHours = [12, 13, 13, 14, 16, 18, 19, 19, 20, 20, 21, 22];
      const selectedHour = rushHours[o % rushHours.length];
      const minute = (o * 17) % 60;

      const orderTimestamp = new Date(orderDate);
      orderTimestamp.setHours(selectedHour, minute, 0, 0);

      // Select 1 to 4 items
      const numItems = (o % 3) + 1;
      const orderItems = [];
      let subtotal = 0;

      for (let i = 0; i < numItems; i++) {
        const itemTemplate = itemsPool[(o + i * 3) % itemsPool.length];
        const qty = ((o + i) % 2) + 1;
        const total = itemTemplate.unitPrice * qty;
        subtotal += total;

        orderItems.push({
          id: `demo-oi-${orderNum}-${i}`,
          menuItemId: itemTemplate.id,
          name: itemTemplate.name,
          basePrice: itemTemplate.basePrice,
          unitPrice: itemTemplate.unitPrice,
          quantity: qty,
          taxPercent: itemTemplate.taxPercent,
          taxAmount: Math.round(total * 0.05 * 100) / 100,
          totalAmount: total,
          foodType: itemTemplate.foodType,
          modifiers: [],
        });
      }

      // Apply discount on ~25% of orders
      const discount = o % 4 === 0 ? Math.round(subtotal * 0.1) : 0;
      const taxable = subtotal - discount;
      const taxAmount = Math.round(taxable * 0.05 * 100) / 100;
      const rawGrand = taxable + taxAmount;
      const grandTotal = Math.round(rawGrand);
      const roundOff = Math.round((grandTotal - rawGrand) * 100) / 100;

      const payMethod = paymentMethods[o % paymentMethods.length];
      const ordType = orderTypes[o % orderTypes.length];
      const cashier = cashiers[o % cashiers.length];

      orders.push({
        id: `ORD-DEMO-${orderNum}`,
        orderNumber: orderNum,
        kotNumber: orderNum,
        orderType: ordType,
        status: 'completed',
        createdAt: orderTimestamp.toISOString(),
        updatedAt: orderTimestamp.toISOString(),
        tableId: ordType === 'dine_in' ? `tbl-${(o % 5) + 1}` : undefined,
        tableName: ordType === 'dine_in' ? `T-0${(o % 5) + 1}` : undefined,
        waiterName: 'Sameer Joshi',
        cashierId: cashier.id,
        cashierName: cashier.name,
        guestCount: ordType === 'dine_in' ? (o % 3) + 1 : 1,
        customerName: `Customer ${orderNum}`,
        customerPhone: `+91 98200 ${String(orderNum).padStart(5, '0')}`,
        items: orderItems,
        subtotal,
        taxAmount,
        discountAmount: discount,
        couponCode: discount > 0 ? 'WELCOME10' : undefined,
        deliveryCharge: ordType === 'delivery' ? 30 : 0,
        roundOff,
        grandTotal: ordType === 'delivery' ? grandTotal + 30 : grandTotal,
        paymentStatus: 'paid',
        paymentMethod: payMethod,
        payments: [
          {
            method: payMethod,
            amount: ordType === 'delivery' ? grandTotal + 30 : grandTotal,
            transactionRef: `TXN-${orderNum}`,
          },
        ],
        pointsEarned: Math.round(grandTotal / 10),
      });
    }
  }

  return orders;
};
