import { DailyClosing, Order, RestaurantSettings } from '../types';
import { formatCurrency, formatDateTime } from './formatters';

export const exportToCSV = (filename: string, rows: Record<string, any>[]): void => {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let val = row[header];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') val = JSON.stringify(val);
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateThermalReceiptHTML = (
  order: Order,
  settings: RestaurantSettings,
  width: '58mm' | '80mm' = '80mm'
): string => {
  const is58 = width === '58mm';
  const widthPx = is58 ? '220px' : '300px';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - Order #${order.orderNumber}</title>
        <style>
          @page { margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: ${widthPx};
            margin: 0 auto;
            padding: 10px;
            font-size: ${is58 ? '11px' : '12px'};
            line-height: 1.3;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 1px double #000; margin: 6px 0; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .item-desc { font-size: 0.9em; padding-left: 8px; color: #333; }
          .total-row { display: flex; justify-content: space-between; font-size: 1.1em; font-weight: bold; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="text-center">
          <div class="text-bold" style="font-size: 1.3em;">${settings.name}</div>
          <div>${settings.tagline}</div>
          <div>${settings.address}</div>
          <div>${settings.city}</div>
          <div>Ph: ${settings.phone}</div>
          <div>GSTIN: ${settings.gstNumber}</div>
        </div>

        <div class="divider"></div>

        <div style="display: flex; justify-content: space-between;">
          <span>Order: #${order.orderNumber}</span>
          <span>Type: ${order.orderType.toUpperCase()}</span>
        </div>
        ${order.tableName ? `<div>Table: ${order.tableName}</div>` : ''}
        ${order.customerName ? `<div>Customer: ${order.customerName} (${order.customerPhone || 'N/A'})</div>` : ''}
        <div>Date: ${formatDateTime(order.createdAt)}</div>
        <div>Cashier: ${order.cashierName}</div>

        <div class="divider"></div>

        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span style="flex: 2;">Item</span>
          <span style="flex: 1; text-align: center;">Qty</span>
          <span style="flex: 1; text-align: right;">Price</span>
        </div>
        <div class="divider"></div>

        ${(order.items || [])
          .map(
            (item) => `
          <div>
            <div style="display: flex; justify-content: space-between;">
              <span style="flex: 2; font-weight: bold;">${item.name} ${item.variantName ? `(${item.variantName})` : ''}</span>
              <span style="flex: 1; text-align: center;">${item.quantity}</span>
              <span style="flex: 1; text-align: right;">${formatCurrency(item.totalAmount, settings.currencySymbol)}</span>
            </div>
            ${item.modifiers && item.modifiers.length > 0 ? item.modifiers.map((m) => `<div class="item-desc">+ ${m.name} (${formatCurrency(m.price, settings.currencySymbol)})</div>`).join('') : ''}
            ${item.notes ? `<div class="item-desc">Note: ${item.notes}</div>` : ''}
          </div>
        `
          )
          .join('')}

        <div class="divider"></div>

        <div class="item-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(order.subtotal, settings.currencySymbol)}</span>
        </div>

        ${
          order.discountAmount > 0
            ? `<div class="item-row">
                <span>Discount (${order.discountPercent || ''}%):</span>
                <span>-${formatCurrency(order.discountAmount, settings.currencySymbol)}</span>
              </div>`
            : ''
        }

        <div class="item-row">
          <span>Taxes (GST 5%):</span>
          <span>${formatCurrency(order.taxAmount, settings.currencySymbol)}</span>
        </div>

        ${
          order.deliveryCharge > 0
            ? `<div class="item-row">
                <span>Delivery Charge:</span>
                <span>${formatCurrency(order.deliveryCharge, settings.currencySymbol)}</span>
              </div>`
            : ''
        }

        ${
          order.roundOff !== 0
            ? `<div class="item-row">
                <span>Round Off:</span>
                <span>${formatCurrency(order.roundOff, settings.currencySymbol)}</span>
              </div>`
            : ''
        }

        <div class="double-divider"></div>

        <div class="total-row">
          <span>GRAND TOTAL:</span>
          <span>${formatCurrency(order.grandTotal, settings.currencySymbol)}</span>
        </div>

        <div class="divider"></div>

        <div class="item-row">
          <span>Payment:</span>
          <span style="text-transform: uppercase;">${order.paymentMethod || 'CASH'} (${order.paymentStatus})</span>
        </div>

        ${
          order.pointsEarned || order.pointsRedeemed
            ? `<div class="item-row" style="font-weight: bold; margin-top: 4px; color: #b45309;">
                <span>Loyalty Points:</span>
                <span>${order.pointsRedeemed ? `Redeemed: -${order.pointsRedeemed} pts ` : ''}${order.pointsEarned ? `Earned: +${order.pointsEarned} pts` : ''}</span>
              </div>`
            : ''
        }

        <div class="divider"></div>
        <div class="text-center" style="margin-top: 10px;">
          <div>*** Thank You! Visit Again ***</div>
          <div style="font-size: 0.8em; margin-top: 4px;">Powered by CaféOS Intelligence</div>
        </div>
      </body>
    </html>
  `;
};

export const generateKOTHTML = (order: Order, width: '58mm' | '80mm' = '80mm'): string => {
  const is58 = width === '58mm';
  const widthPx = is58 ? '220px' : '300px';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>KOT - Order #${order.orderNumber}</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            width: ${widthPx};
            margin: 0 auto;
            padding: 8px;
            font-size: ${is58 ? '12px' : '14px'};
            line-height: 1.3;
          }
          .text-center { text-align: center; }
          .text-bold { font-weight: bold; }
          .divider { border-top: 2px solid #000; margin: 6px 0; }
          .dashed { border-top: 1px dashed #000; margin: 4px 0; }
          .big-header { font-size: 1.4em; font-weight: bold; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="text-center big-header">KITCHEN ORDER TICKET</div>
        <div class="text-center" style="font-size: 1.1em; font-weight: bold;">
          KOT #: ${order.kotNumber || order.orderNumber}
        </div>
        <div class="divider"></div>

        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>TYPE: ${order.orderType.toUpperCase()}</span>
          <span>${order.tableName || ''}</span>
        </div>
        <div>Time: ${formatDateTime(order.createdAt)}</div>
        <div>Server: ${order.waiterName || order.cashierName}</div>
        ${order.guestCount ? `<div>Guests: ${order.guestCount}</div>` : ''}

        <div class="divider"></div>

        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #000; font-weight: bold;">
            <th style="text-align: left; width: 75%;">Item Description</th>
            <th style="text-align: right; width: 25%;">Qty</th>
          </tr>
          ${(order.items || [])
            .map(
              (item) => `
            <tr>
              <td style="padding: 4px 0; font-weight: bold; font-size: 1.1em;">
                ${item.name} ${item.variantName ? `<br><small style="color:#555;">[${item.variantName}]</small>` : ''}
                ${item.modifiers && item.modifiers.length > 0 ? `<br><small style="color:#333;">Modifiers: ${item.modifiers.map((m) => m.name).join(', ')}</small>` : ''}
                ${item.notes ? `<br><span style="background: #eee; padding: 2px 4px; font-size: 0.9em;">*** NOTE: ${item.notes} ***</span>` : ''}
              </td>
              <td style="text-align: right; vertical-align: top; font-size: 1.3em; font-weight: bold;">
                x${item.quantity}
              </td>
            </tr>
            <tr><td colspan="2" class="dashed"></td></tr>
          `
            )
            .join('')}
        </table>

        ${order.notes ? `<div style="margin-top: 8px; font-weight: bold;">Order Instructions: ${order.notes}</div>` : ''}
        
        <div class="divider"></div>
        <div class="text-center" style="font-size: 0.8em;">CaféOS KDS Engine</div>
      </body>
    </html>
  `;
};
