/* ═══════════════════════════════════════════════════════════
   Dynamic Pricing Engine
   Gold rate calculations, gemstone costs, making charges
   ═══════════════════════════════════════════════════════════ */

export interface PricingConfig {
  goldRate22K: number;    // Per gram in INR
  goldRate24K: number;
  goldRate18K: number;
  gstRate: number;        // 3% for gold jewelry
  hallmarkCharge: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  goldRate22K: 7200,
  goldRate24K: 7800,
  goldRate18K: 5900,
  gstRate: 0.03,
  hallmarkCharge: 50,
};

/**
 * Calculate total price for a bangle based on weight, material, and charges
 */
export function calculateBanglePrice(params: {
  goldWeightGrams: number;
  goldKarat: 18 | 22 | 24;
  gemstoneCost: number;
  makingChargePerGram: number;
  pricing?: PricingConfig;
}): {
  goldCost: number;
  makingCharge: number;
  gemstoneCost: number;
  subtotal: number;
  gst: number;
  hallmarkCharge: number;
  total: number;
} {
  const config = params.pricing || DEFAULT_PRICING;

  let goldRatePerGram: number;
  switch (params.goldKarat) {
    case 24:
      goldRatePerGram = config.goldRate24K;
      break;
    case 18:
      goldRatePerGram = config.goldRate18K;
      break;
    default:
      goldRatePerGram = config.goldRate22K;
  }

  const goldCost = params.goldWeightGrams * goldRatePerGram;
  const makingCharge = params.goldWeightGrams * params.makingChargePerGram;
  const gemstoneCost = params.gemstoneCost;
  const subtotal = goldCost + makingCharge + gemstoneCost;
  const gst = subtotal * config.gstRate;
  const hallmarkCharge = params.goldWeightGrams > 0 ? config.hallmarkCharge : 0;
  const total = subtotal + gst + hallmarkCharge;

  return {
    goldCost,
    makingCharge,
    gemstoneCost,
    subtotal,
    gst,
    hallmarkCharge,
    total,
  };
}

/**
 * Calculate stack total for multiple bangles
 */
export function calculateStackPrice(
  bangles: Array<{
    basePrice: number;
    goldWeightGrams: number;
    makingCharge: number;
  }>,
  goldRate: number = DEFAULT_PRICING.goldRate22K,
  taxRate: number = DEFAULT_PRICING.gstRate
): {
  subtotal: number;
  goldValue: number;
  totalMakingCharge: number;
  tax: number;
  total: number;
  itemCount: number;
} {
  let subtotal = 0;
  let goldValue = 0;
  let totalMakingCharge = 0;

  bangles.forEach((bangle) => {
    const goldCost = bangle.goldWeightGrams * goldRate;
    goldValue += goldCost;
    totalMakingCharge += bangle.makingCharge;
    subtotal += bangle.basePrice + (goldCost > 0 ? goldCost : 0);
  });

  subtotal += totalMakingCharge;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal,
    goldValue,
    totalMakingCharge,
    tax,
    total,
    itemCount: bangles.length,
  };
}

/**
 * Format price in INR
 */
export function formatPrice(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
