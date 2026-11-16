import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { IAP_PRODUCT_IDS, REVENUECAT_ENTITLEMENT_ID } from '@/types/entitlements';

export type PurchaseEnvironment = {
  /** react-native-purchases linked (Dev Client / production build). */
  nativeModuleAvailable: boolean;
  /** Running inside Expo Go — StoreKit / RC purchases will not work. */
  isExpoGo: boolean;
  /** EXPO_PUBLIC_REVENUECAT_API_KEY present. */
  apiKeyConfigured: boolean;
  canPurchase: boolean;
  reasonSpanish: string;
};

export type OfferingPackageInfo = {
  identifier: string;
  productId: string;
  title: string;
  description: string;
  priceString: string;
};

type PurchasesModule = typeof import('react-native-purchases');

let Purchases: PurchasesModule['default'] | null = null;
let LOG_LEVEL: PurchasesModule['LOG_LEVEL'] | null = null;
let configured = false;

function detectExpoGo(): boolean {
  // Expo Go app ownership is 'expo'; standalone / dev-client is 'standalone' or null.
  return Constants.appOwnership === 'expo';
}

function tryLoadPurchases(): boolean {
  if (Purchases) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases') as PurchasesModule;
    Purchases = mod.default;
    LOG_LEVEL = mod.LOG_LEVEL;
    return true;
  } catch {
    Purchases = null;
    return false;
  }
}

export function getPurchaseEnvironment(): PurchaseEnvironment {
  const isExpoGo = detectExpoGo();
  const nativeModuleAvailable = tryLoadPurchases();
  const apiKey =
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim() ||
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() ||
    '';
  const apiKeyConfigured = Boolean(apiKey);

  let reasonSpanish = '';
  if (isExpoGo) {
    reasonSpanish =
      'Las compras in-app no funcionan en Expo Go. Usa un Development Build (EAS / expo-dev-client) en iPhone.';
  } else if (!nativeModuleAvailable) {
    reasonSpanish =
      'Módulo nativo de compras no vinculado. Reconstruye con EAS incluyendo react-native-purchases.';
  } else if (!apiKeyConfigured) {
    reasonSpanish =
      'Falta EXPO_PUBLIC_REVENUECAT_API_KEY en .env. Sin clave no se consultan suscripciones reales.';
  }

  return {
    nativeModuleAvailable,
    isExpoGo,
    apiKeyConfigured,
    canPurchase: !isExpoGo && nativeModuleAvailable && apiKeyConfigured,
    reasonSpanish,
  };
}

export async function configurePurchases(appUserId?: string | null): Promise<PurchaseEnvironment> {
  const env = getPurchaseEnvironment();
  if (!env.canPurchase || !Purchases) return env;

  const apiKey =
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim() ||
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() ||
    '';

  if (!configured) {
    if (__DEV__ && LOG_LEVEL) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({
      apiKey,
      appUserID: appUserId ?? undefined,
    });
    configured = true;
  } else if (appUserId) {
    try {
      await Purchases.logIn(appUserId);
    } catch (e) {
      console.warn('[purchases] logIn', e);
    }
  }
  return env;
}

export async function getOfferings(): Promise<OfferingPackageInfo[]> {
  const env = await configurePurchases();
  if (!env.canPurchase || !Purchases) return [];

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    return current.availablePackages.map((pkg) => ({
      identifier: pkg.identifier,
      productId: pkg.product.identifier,
      title: pkg.product.title,
      description: pkg.product.description,
      priceString: pkg.product.priceString,
    }));
  } catch (e) {
    console.warn('[purchases] getOfferings', e);
    return [];
  }
}

export type PurchaseResult =
  | { ok: true; isPremium: boolean; productId?: string }
  | { ok: false; reason: string };

/** Never invents Premium — returns inactive if RC/StoreKit unavailable or no entitlement. */
export async function purchasePackage(packageIdentifier: string): Promise<PurchaseResult> {
  const env = await configurePurchases();
  if (!env.canPurchase || !Purchases) {
    return { ok: false, reason: env.reasonSpanish || 'purchases_unavailable' };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p) => p.identifier === packageIdentifier);
    if (!pkg) {
      // Fallback: try matching known product ids
      const byProduct = offerings.current?.availablePackages.find(
        (p) =>
          p.product.identifier === packageIdentifier ||
          p.product.identifier === IAP_PRODUCT_IDS.monthly ||
          p.product.identifier === IAP_PRODUCT_IDS.yearly,
      );
      if (!byProduct) return { ok: false, reason: 'package_not_found' };
      const { customerInfo } = await Purchases.purchasePackage(byProduct);
      const active = Boolean(customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]);
      return {
        ok: true,
        isPremium: active,
        productId: byProduct.product.identifier,
      };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = Boolean(customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]);
    return { ok: true, isPremium: active, productId: pkg.product.identifier };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) return { ok: false, reason: 'cancelled' };
    return { ok: false, reason: err.message || 'purchase_failed' };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  const env = await configurePurchases();
  if (!env.canPurchase || !Purchases) {
    return { ok: false, reason: env.reasonSpanish || 'purchases_unavailable' };
  }
  try {
    const info = await Purchases.restorePurchases();
    const ent = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
    return {
      ok: true,
      isPremium: Boolean(ent),
      productId: ent?.productIdentifier,
    };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, reason: err.message || 'restore_failed' };
  }
}

export async function fetchCustomerPremium(): Promise<{
  isPremium: boolean;
  productId?: string | null;
  expiresAt?: string | null;
  source: 'revenuecat' | 'none';
  reason?: string;
}> {
  const env = await configurePurchases();
  if (!env.canPurchase || !Purchases) {
    return {
      isPremium: false,
      source: 'none',
      reason: env.reasonSpanish || 'purchases_unavailable',
    };
  }
  try {
    const info = await Purchases.getCustomerInfo();
    const ent = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
    if (!ent) {
      return { isPremium: false, source: 'revenuecat', reason: 'no_active_entitlement' };
    }
    return {
      isPremium: true,
      productId: ent.productIdentifier,
      expiresAt: ent.expirationDate,
      source: 'revenuecat',
    };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return {
      isPremium: false,
      source: 'none',
      reason: err.message || 'customer_info_failed',
    };
  }
}

export function platformStoreLabel(): string {
  return Platform.OS === 'ios' ? 'App Store' : 'Google Play';
}
