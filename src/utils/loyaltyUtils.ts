import { Customer, LoyaltyRewardOption, LoyaltyTier, Order } from '../types';

export interface TierInfo {
  tier: LoyaltyTier;
  label: string;
  minPoints: number;
  maxPoints: number;
  multiplier: number; // e.g. 1.0x, 1.2x, 1.5x
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconName: string;
  perks: string[];
  nextTier?: {
    tier: LoyaltyTier;
    label: string;
    pointsNeeded: number;
  };
}

export const LOYALTY_TIERS: Record<LoyaltyTier, Omit<TierInfo, 'nextTier'>> = {
  bronze: {
    tier: 'bronze',
    label: 'Bronze Member',
    minPoints: 0,
    maxPoints: 199,
    multiplier: 1.0,
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-800',
    iconName: 'Award',
    perks: ['1 Point per ₹20 spent', 'Birthday Surprise Offer', 'Standard Promotions'],
  },
  silver: {
    tier: 'silver',
    label: 'Silver Elite',
    minPoints: 200,
    maxPoints: 499,
    multiplier: 1.2,
    badgeBg: 'bg-slate-200 dark:bg-slate-700/70',
    badgeText: 'text-slate-800 dark:text-slate-200',
    borderColor: 'border-slate-400 dark:border-slate-600',
    iconName: 'ShieldCheck',
    perks: ['1.2x Points Multiplier', '5% Off Happy Hour Drinks', 'Free Size Upgrade on Coffee'],
  },
  gold: {
    tier: 'gold',
    label: 'Gold VIP',
    minPoints: 500,
    maxPoints: 999,
    multiplier: 1.5,
    badgeBg: 'bg-yellow-100 dark:bg-yellow-950/70',
    badgeText: 'text-yellow-800 dark:text-yellow-300',
    borderColor: 'border-yellow-400 dark:border-yellow-700',
    iconName: 'Crown',
    perks: ['1.5x Points Multiplier', 'Complimentary Bakery Dessert on ₹600+', 'Priority Dine-in Seating'],
  },
  platinum: {
    tier: 'platinum',
    label: 'Platinum Legend',
    minPoints: 1000,
    maxPoints: Infinity,
    multiplier: 2.0,
    badgeBg: 'bg-purple-100 dark:bg-purple-950/70',
    badgeText: 'text-purple-800 dark:text-purple-300',
    borderColor: 'border-purple-400 dark:border-purple-700',
    iconName: 'Sparkles',
    perks: ['2x Double Points Multiplier', 'Free Delivery Always', 'Chef Tasting Table Access'],
  },
};

/**
 * Calculates a customer's loyalty tier and progress towards the next tier.
 */
export const getCustomerTierInfo = (points: number): TierInfo => {
  const pts = Math.max(0, points || 0);

  if (pts >= 1000) {
    return {
      ...LOYALTY_TIERS.platinum,
    };
  }

  if (pts >= 500) {
    return {
      ...LOYALTY_TIERS.gold,
      nextTier: {
        tier: 'platinum',
        label: LOYALTY_TIERS.platinum.label,
        pointsNeeded: 1000 - pts,
      },
    };
  }

  if (pts >= 200) {
    return {
      ...LOYALTY_TIERS.silver,
      nextTier: {
        tier: 'gold',
        label: LOYALTY_TIERS.gold.label,
        pointsNeeded: 500 - pts,
      },
    };
  }

  return {
    ...LOYALTY_TIERS.bronze,
    nextTier: {
      tier: 'silver',
      label: LOYALTY_TIERS.silver.label,
      pointsNeeded: 200 - pts,
    },
  };
};

/**
 * Standard Catalog of Earned Loyalty Rewards / Coupons redeemable with points
 */
export const STANDARD_LOYALTY_REWARDS: LoyaltyRewardOption[] = [
  {
    id: 'reward-50-off',
    pointsCost: 100,
    discountAmount: 50,
    couponCode: 'LOYALTY50',
    title: '₹50 Off Instant Reward',
    description: 'Redeem 100 loyalty points for a direct ₹50 discount on this order.',
    minSpend: 150,
  },
  {
    id: 'reward-120-off',
    pointsCost: 200,
    discountAmount: 120,
    couponCode: 'LOYALTY120',
    title: '₹120 Off Treat Coupon',
    description: 'Redeem 200 loyalty points for a ₹120 bill discount (Bonus value +₹20).',
    minSpend: 300,
  },
  {
    id: 'reward-260-off',
    pointsCost: 400,
    discountAmount: 260,
    couponCode: 'LOYALTY260',
    title: '₹260 Off Gourmet Feast',
    description: 'Redeem 400 loyalty points for a ₹260 bill deduction (Bonus value +₹60).',
    minSpend: 500,
  },
  {
    id: 'reward-400-off',
    pointsCost: 600,
    discountAmount: 400,
    couponCode: 'LOYALTY400',
    title: '₹400 Off Grand Celebration',
    description: 'Redeem 600 loyalty points for a ₹400 bill deduction (Bonus value +₹100).',
    minSpend: 750,
    tierRequired: 'silver',
  },
  {
    id: 'reward-600-off',
    pointsCost: 800,
    discountAmount: 600,
    couponCode: 'LOYALTY600',
    title: '₹600 Off Gold VIP Coupon',
    description: 'Redeem 800 loyalty points for ₹600 off your party or dining table.',
    minSpend: 1000,
    tierRequired: 'gold',
  },
  {
    id: 'reward-850-off',
    pointsCost: 1000,
    discountAmount: 850,
    couponCode: 'LOYALTY850',
    title: '₹850 Off Platinum Master Voucher',
    description: 'Redeem 1000 points for ₹850 voucher on gourmet food & signature beverages.',
    minSpend: 1200,
    tierRequired: 'platinum',
  },
];

/**
 * Calculates points to be earned based on bill total & customer tier
 * Standard: 1 point per ₹20 spent * tier multiplier
 */
export const calculatePointsToEarn = (
  orderSubtotalOrTotal: number,
  tier: LoyaltyTier = 'bronze'
): number => {
  const base = Math.max(0, orderSubtotalOrTotal || 0);
  const tierInfo = LOYALTY_TIERS[tier] || LOYALTY_TIERS.bronze;
  const rawPoints = (base / 20) * tierInfo.multiplier;
  return Math.floor(rawPoints);
};

/**
 * Calculates discount amount from direct flexible point redemption
 * Rate: 2 points = ₹1.00 (or 1 point = ₹0.50)
 * Max redemption cap: up to 50% of the bill subtotal
 */
export const calculateCustomPointDiscount = (
  points: number,
  subtotal: number
): { pointsUsed: number; discountAmount: number } => {
  const maxDiscountAllowed = Math.floor(subtotal * 0.5); // max 50% of subtotal
  const maxPointsUsable = maxDiscountAllowed * 2;
  const pointsUsed = Math.min(Math.max(0, points), maxPointsUsable);
  const discountAmount = Math.floor(pointsUsed / 2);

  return { pointsUsed, discountAmount };
};

/**
 * Formats a phone number for normalized matching (cleans spaces, dashes, +91)
 */
export const normalizePhone = (phone: string): string => {
  return (phone || '').replace(/[^\d+]/g, '').trim();
};

/**
 * Searches customers by phone or name
 */
export const searchCustomers = (customers: Customer[], query: string): Customer[] => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return customers;

  return customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });
};
