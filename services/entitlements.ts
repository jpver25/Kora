import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EntitlementId, EntitlementSnapshot } from '@/types/entitlements';
import {
  FREE_ALTERNATIVES_PREVIEW,
  FREE_DAILY_SCAN_LIMIT,
  PREMIUM_ENTITLEMENTS,
} from '@/types/entitlements';
import { fetchCustomerPremium } from '@/services/purchases';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

const CACHE_KEY = 'kora.entitlements.snapshot.v1';
const SCAN_USAGE_KEY = 'kora.usage.scans.v1';

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

/**
 * Refresh entitlements from RevenueCat when possible.
 * Never invents Premium. Optional Supabase mirror is read-only confirmation only if RC already active.
 */
export async function refreshEntitlements(userId?: string | null): Promise<EntitlementSnapshot> {
  const rc = await fetchCustomerPremium();
  let snap: EntitlementSnapshot = {
    tier: rc.isPremium ? 'premium' : 'free',
    isPremium: rc.isPremium,
    source: rc.source === 'revenuecat' ? 'revenuecat' : 'none',
    productId: rc.productId,
    expiresAt: rc.expiresAt,
    checkedAt: new Date().toISOString(),
    reason: rc.reason,
  };

  // Optional server mirror — never upgrade free→premium from DB alone (prevents fake Premium).
  if (rc.isPremium && userId && isSupabaseConfigured && supabase) {
    await supabase.from('user_entitlements').upsert({
      user_id: userId,
      tier: 'premium',
      product_id: rc.productId ?? null,
      expires_at: rc.expiresAt ?? null,
      updated_at: new Date().toISOString(),
    });
  }

  await saveSnapshot(snap);
  return snap;
}

export async function getEntitlements(userId?: string | null): Promise<EntitlementSnapshot> {
  const cached = await getCachedEntitlements();
  // Prefer a fresh check when online path is available; fall back to cache for offline UX.
  try {
    return await refreshEntitlements(userId);
  } catch {
    return (
      cached ?? {
        tier: 'free',
        isPremium: false,
        source: 'none',
        checkedAt: new Date().toISOString(),
        reason: 'refresh_failed',
      }
    );
  }
}

export function hasEntitlement(snap: EntitlementSnapshot, id: EntitlementId): boolean {
  if (!snap.isPremium) return false;
  return PREMIUM_ENTITLEMENTS.includes(id);
}

type ScanUsage = { day: string; count: number };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getScanUsage(): Promise<{ count: number; limit: number; remaining: number }> {
  const snap = (await getCachedEntitlements()) ?? {
    isPremium: false,
  };
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
  const snap = await getCachedEntitlements();
  if (snap?.isPremium) return;
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
  return snap.isPremium ? Number.POSITIVE_INFINITY : FREE_ALTERNATIVES_PREVIEW;
}

export { FREE_DAILY_SCAN_LIMIT, FREE_ALTERNATIVES_PREVIEW, PREMIUM_ENTITLEMENTS };
