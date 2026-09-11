import { Coupon, CouponValidationResult, MenuItem, OrderItem, OrderType } from '../types';

export interface CouponValidationContext {
  subtotal: number;
  items: OrderItem[];
  orderType: OrderType;
  customerPhone?: string;
  menuItemsMap?: Map<string, MenuItem>;
}

/**
 * Validates a coupon against current cart / order context and calculates exact discount amount.
 */
export const validateAndCalculateCoupon = (
  coupon: Coupon,
  context: CouponValidationContext
): CouponValidationResult => {
  if (!coupon.isActive) {
    return {
      isValid: false,
      reason: 'This coupon offer is currently inactive.',
      calculatedDiscount: 0,
      coupon,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (coupon.validFrom && todayStr < coupon.validFrom) {
    return {
      isValid: false,
      reason: `Offer starts on ${coupon.validFrom}.`,
      calculatedDiscount: 0,
      coupon,
    };
  }

  if (coupon.validUntil && todayStr > coupon.validUntil) {
    return {
      isValid: false,
      reason: `Offer expired on ${coupon.validUntil}.`,
      calculatedDiscount: 0,
      coupon,
    };
  }

  // Check time & day restrictions (Happy Hour)
  if (coupon.timeRestrictions) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (
      coupon.timeRestrictions.daysOfWeek &&
      coupon.timeRestrictions.daysOfWeek.length > 0 &&
      !coupon.timeRestrictions.daysOfWeek.includes(currentDay)
    ) {
      return {
        isValid: false,
        reason: 'This promotion is not available on this day of the week.',
        calculatedDiscount: 0,
        coupon,
      };
    }

    if (
      currentHour < coupon.timeRestrictions.startHour ||
      currentHour >= coupon.timeRestrictions.endHour
    ) {
      const startStr = `${coupon.timeRestrictions.startHour % 12 || 12}:00 ${
        coupon.timeRestrictions.startHour >= 12 ? 'PM' : 'AM'
      }`;
      const endStr = `${coupon.timeRestrictions.endHour % 12 || 12}:00 ${
        coupon.timeRestrictions.endHour >= 12 ? 'PM' : 'AM'
      }`;
      return {
        isValid: false,
        reason: `Happy Hour active only between ${startStr} and ${endStr}.`,
        calculatedDiscount: 0,
        coupon,
      };
    }
  }

  // Check overall usage limit
  if (coupon.usageLimitTotal && coupon.usageCount >= coupon.usageLimitTotal) {
    return {
      isValid: false,
      reason: 'Maximum total redemptions for this coupon have been reached.',
      calculatedDiscount: 0,
      coupon,
    };
  }

  // Check Order Type restrictions (e.g. Delivery only or Dine-in only)
  if (coupon.orderTypeRestrictions && coupon.orderTypeRestrictions.length > 0) {
    if (!coupon.orderTypeRestrictions.includes(context.orderType)) {
      const formattedTypes = coupon.orderTypeRestrictions.map((t) => t.replace('_', ' ')).join(', ');
      return {
        isValid: false,
        reason: `Valid only for ${formattedTypes} orders.`,
        calculatedDiscount: 0,
        coupon,
      };
    }
  }

  // Check Minimum Order Subtotal
  if (coupon.minOrderValue > 0 && context.subtotal < coupon.minOrderValue) {
    const needed = (coupon.minOrderValue - context.subtotal).toFixed(2);
    return {
      isValid: false,
      reason: `Minimum order spend is $${coupon.minOrderValue.toFixed(2)} (Add $${needed} more to unlock).`,
      calculatedDiscount: 0,
      coupon,
    };
  }

  // Calculate discount based on type
  let eligibleSubtotal = context.subtotal;
  let hasEligibleItems = true;

  // Filter items if specific categories or menu item IDs are specified
  if (
    (coupon.applicableCategoryIds && coupon.applicableCategoryIds.length > 0) ||
    (coupon.applicableMenuItemIds && coupon.applicableMenuItemIds.length > 0)
  ) {
    const eligibleItems = context.items.filter((item) => {
      const matchItem =
        coupon.applicableMenuItemIds && coupon.applicableMenuItemIds.length > 0
          ? coupon.applicableMenuItemIds.includes(item.menuItemId)
          : false;

      // Note: If we have category map or match, let's check
      return matchItem;
    });

    if (eligibleItems.length > 0) {
      eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.totalAmount, 0);
    } else if (coupon.applicableMenuItemIds && coupon.applicableMenuItemIds.length > 0) {
      return {
        isValid: false,
        reason: 'Cart does not contain eligible items for this specific promotion.',
        calculatedDiscount: 0,
        coupon,
      };
    }
  }

  let calculatedDiscount = 0;
  let freeItemName: string | undefined = undefined;

  switch (coupon.discountType) {
    case 'percentage': {
      const rawDiscount = (eligibleSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountCap && coupon.maxDiscountCap > 0) {
        calculatedDiscount = Math.min(rawDiscount, coupon.maxDiscountCap);
      } else {
        calculatedDiscount = rawDiscount;
      }
      break;
    }

    case 'flat': {
      calculatedDiscount = Math.min(coupon.discountValue, context.subtotal);
      break;
    }

    case 'bogo': {
      // Find eligible items for BOGO in the cart
      if (coupon.bogoTriggerItemId) {
        const triggerItem = context.items.find((i) => i.menuItemId === coupon.bogoTriggerItemId);
        if (!triggerItem) {
          return {
            isValid: false,
            reason: 'Add required promotional item to cart to activate BOGO discount.',
            calculatedDiscount: 0,
            coupon,
          };
        }

        const freeItemTarget = coupon.bogoFreeItemId || coupon.bogoTriggerItemId;
        const targetInCart = context.items.find((i) => i.menuItemId === freeItemTarget);

        if (targetInCart && (targetInCart.quantity >= 2 || targetInCart.id !== triggerItem.id)) {
          calculatedDiscount = targetInCart.unitPrice;
          freeItemName = targetInCart.name;
        } else {
          return {
            isValid: false,
            reason: `Add a 2nd ${triggerItem.name} or target item to receive it free with BOGO!`,
            calculatedDiscount: 0,
            coupon,
          };
        }
      } else {
        // Generic BOGO: Lowest priced eligible item free if 2+ items exist
        if (context.items.length >= 2 || (context.items.length === 1 && context.items[0].quantity >= 2)) {
          const minPriceItem = [...context.items].sort((a, b) => a.unitPrice - b.unitPrice)[0];
          calculatedDiscount = minPriceItem.unitPrice;
          freeItemName = minPriceItem.name;
        } else {
          return {
            isValid: false,
            reason: 'Add at least 2 items to your cart to get 1 free with BOGO.',
            calculatedDiscount: 0,
            coupon,
          };
        }
      }
      break;
    }

    case 'free_item': {
      if (coupon.freeMenuItemId) {
        const freeTarget = context.items.find((i) => i.menuItemId === coupon.freeMenuItemId);
        if (freeTarget) {
          calculatedDiscount = freeTarget.unitPrice;
          freeItemName = freeTarget.name;
        } else {
          return {
            isValid: false,
            reason: 'Add the promotional gift item to your cart to receive it 100% free.',
            calculatedDiscount: 0,
            coupon,
          };
        }
      } else {
        calculatedDiscount = Math.min(coupon.discountValue, context.subtotal);
      }
      break;
    }
  }

  // Ensure discount never exceeds total subtotal
  calculatedDiscount = Math.max(0, Math.min(calculatedDiscount, context.subtotal));

  return {
    isValid: true,
    calculatedDiscount: Math.round(calculatedDiscount * 100) / 100,
    freeItemName,
    coupon,
  };
};

/**
 * Searches coupons list by code (case-insensitive & trimmed)
 */
export const findCouponByCode = (coupons: Coupon[], rawCode: string): Coupon | undefined => {
  const normalized = (rawCode || '').trim().toUpperCase();
  return coupons.find((c) => c.code.toUpperCase() === normalized);
};

/**
 * Evaluates all auto-apply coupons and returns the best valid one (giving highest savings)
 */
export const findBestAutoApplicableCoupon = (
  coupons: Coupon[],
  context: CouponValidationContext
): CouponValidationResult | null => {
  const autoCoupons = coupons.filter((c) => c.isActive && c.isAutoApply);
  let bestResult: CouponValidationResult | null = null;

  for (const coupon of autoCoupons) {
    const res = validateAndCalculateCoupon(coupon, context);
    if (res.isValid && res.calculatedDiscount > 0) {
      if (!bestResult || res.calculatedDiscount > bestResult.calculatedDiscount) {
        bestResult = res;
      }
    }
  }

  return bestResult;
};

/**
 * Returns all active coupons evaluated against the cart with their validation status
 */
export const getEligibleCoupons = (
  coupons: Coupon[],
  context: CouponValidationContext
): { coupon: Coupon; validation: CouponValidationResult }[] => {
  return coupons
    .filter((c) => c.isActive)
    .map((coupon) => ({
      coupon,
      validation: validateAndCalculateCoupon(coupon, context),
    }))
    .sort((a, b) => {
      if (a.validation.isValid && !b.validation.isValid) return -1;
      if (!a.validation.isValid && b.validation.isValid) return 1;
      return (b.validation.calculatedDiscount || 0) - (a.validation.calculatedDiscount || 0);
    });
};

