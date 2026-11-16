import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EntitlementId, EntitlementSnapshot } from '@/types/entitlements';
import {
  FREE_ALTERNATIVES_PREVIEW,
  FREE_DAILY_SCAN_LIMIT,
  PREMIUM_ENTITLEMENTS,
} from '@/types/entitlements';
import { fetchCustomerPremium } from '@/services/purchases';

const CACHE_KEY = 'kora.entitlements.snapshot.v1';
const SCAN_USAGE_KEY = 'kora.usage.scans.v1';
const REFRESH_TTL_MS = 15 * 60 * 1000;

export async function getCachedEntitlements(): Promise<EntitlementSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as EntitlementSnapshot) : null;
  } catch {
    return null;
  }
}

async function saveSnapshot(snap: EntitlementSnapshot) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snap));
}

export async function clearEntitlementsCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

function isExpired(snap: EntitlementSnapshot): boolean {
  if (!snap.isPremium) return false;
  if (!snap.expiresAt) return false;
  const exp = new Date(snap.expiresAt).getTime();
  return Number.isFinite(exp) && exp <= Date.now();
}

function withExpiryGuard(snap: EntitlementSnapshot): EntitlementSnapshot {
  if (!snap.isPremium) return snap;
  if (!isExpired(snap)) return snap;
  return {
    ...snap,
    tier: 'free',
    isPremium: false,
    reason: 'expired',
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Refresh entitlements from RevenueCat when possible.
 * Never invents Premium. Does not write Premium to Supabase from the client
 * (RLS blocks it; StoreKit/RC remains source of truth).
 */
export async function refreshEntitlements(userId?: string | null): Promise<EntitlementSnapshot> {
  const cached = await getCachedEntitlements();
  const rc = await fetchCustomerPremium(userId);

  // Soft failures / Expo Go: keep previously confirmed Premium if still unexpired.
  if (
    !rc.isPremium &&
    rc.softFailure &&
    cached?.isPremium &&
    !isExpired(cached) &&
    cached.source === 'revenuecat'
  ) {
    return cached;
  }

  const snap: EntitlementSnapshot = withExpiryGuard({
    tier: rc.isPremium ? 'premium' : 'free',
    isPremium: rc.isPremium,
    source: rc.source === 'revenuecat' ? 'revenuecat' : 'none',
    productId: rc.productId,
    expiresAt: rc.expiresAt,
    checkedAt: new Date().toISOString(),
    reason: rc.reason,
  });

  await saveSnapshot(snap);
  return snap;
}

export async function getEntitlements(userId?: string | null): Promise<EntitlementSnapshot> {
  const cached = await getCachedEntitlements();
  try {
    return await refreshEntitlements(userId);
  } catch {
    return withExpiryGuard(
      cached ?? {
        tier: 'free',
        isPremium: false,
        source: 'none',
        checkedAt: new Date().toISOString(),
        reason: 'refresh_failed',
      },
    );
  }
}

/** Effective entitlements for gating: refresh if cache stale/expired. */
export async function getEffectiveEntitlements(userId?: string | null): Promise<EntitlementSnapshot> {
  const cached = await getCachedEntitlements();
  if (!cached || isExpired(cached) || Date.now() - new Date(cached.checkedAt).getTime() > REFRESH_TTL_MS) {
    return getEntitlements(userId);
  }
  return withExpiryGuard(cached);
}

export function hasEntitlement(snap: EntitlementSnapshot, id: EntitlementId): boolean {
  if (!snap.isPremium || isExpired(snap)) return false;
  return PREMIUM_ENTITLEMENTS.includes(id);
}

type ScanUsage = { day: string; count: number };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getScanUsage(): Promise<{ count: number; limit: number; remaining: number }> {
  const snap = withExpiryGuard(
    (await getEffectiveEntitlements()) ?? {
      tier: 'free',
      isPremium: false,
      source: 'none',
      checkedAt: new Date().toISOString(),
    },
  );
  if (snap.isPremium) {
    return { count: 0, limit: Number.POSITIVE_INFINITY, remaining: Number.POSITIVE_INFINITY };
  }
  try {
    const raw = await AsyncStorage.getItem(SCAN_USAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ScanUsage) : null;
    const count = parsed?.day === todayKey() ? parsed.count : 0;
    return {
      count,
      limit: FREE_DAILY_SCAN_LIMIT,
      remaining: Math.max(0, FREE_DAILY_SCAN_LIMIT - count),
    };
  } catch {
    return { count: 0, limit: FREE_DAILY_SCAN_LIMIT, remaining: FREE_DAILY_SCAN_LIMIT };
  }
}

export async function canPerformScan(): Promise<{ allowed: boolean; remaining: number }> {
  const usage = await getScanUsage();
  if (!Number.isFinite(usage.limit)) return { allowed: true, remaining: usage.remaining };
  return { allowed: usage.remaining > 0, remaining: usage.remaining };
}

export async function recordScanUsage(): Promise<void> {
  const snap = await getEffectiveEntitlements();
  if (snap.isPremium && !isExpired(snap)) return;
  const day = todayKey();
  try {
    const raw = await AsyncStorage.getItem(SCAN_USAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ScanUsage) : null;
    const count = parsed?.day === day ? parsed.count + 1 : 1;
    await AsyncStorage.setItem(SCAN_USAGE_KEY, JSON.stringify({ day, count }));
  } catch {
    await AsyncStorage.setItem(SCAN_USAGE_KEY, JSON.stringify({ day, count: 1 }));
  }
}

export function alternativesLimit(snap: EntitlementSnapshot): number {
  const guarded = withExpiryGuard(snap);
  return guarded.isPremium ? Number.POSITIVE_INFINITY : FREE_ALTERNATIVES_PREVIEW;
}

export { FREE_DAILY_SCAN_LIMIT, FREE_ALTERNATIVES_PREVIEW, PREMIUM_ENTITLEMENTS };
