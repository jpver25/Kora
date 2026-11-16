export type PlanTier = 'free' | 'premium';

export type EntitlementId =
  | 'unlimited_scans'
  | 'healthier_alternatives'
  | 'offline_catalog'
  | 'detailed_breakdown'
  | 'unlimited_visual';

export type EntitlementSnapshot = {
  tier: PlanTier;
  /** True only when StoreKit/RevenueCat (or server) confirmed an active entitlement. Never invented. */
  isPremium: boolean;
  source: 'none' | 'revenuecat' | 'supabase' | 'dev_override';
  productId?: string | null;
  expiresAt?: string | null;
  checkedAt: string;
  /** Why Premium is inactive / unavailable (Spanish-safe key). */
  reason?: string;
};

export const FREE_DAILY_SCAN_LIMIT = 12;
export const FREE_ALTERNATIVES_PREVIEW = 1;

export const PREMIUM_ENTITLEMENTS: EntitlementId[] = [
  'unlimited_scans',
  'healthier_alternatives',
  'offline_catalog',
  'detailed_breakdown',
  'unlimited_visual',
];

/** RevenueCat / App Store product identifiers (configure in App Store Connect + RC). */
export const IAP_PRODUCT_IDS = {
  monthly: 'kora_premium_monthly',
  yearly: 'kora_premium_yearly',
} as const;

export const REVENUECAT_ENTITLEMENT_ID = 'kora_premium';
