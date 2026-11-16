import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { getGuestKey } from '@/services/guestId';
import type {
  BrandImprovementRequest,
  CosmeticReview,
  ContributionSource,
  ModerationStatus,
  ProductContribution,
  ProductCorrection,
} from '@/types/community';

const LOCAL_KEY = 'kora.community.local.v1';
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LocalBundle = {
  contributions: ProductContribution[];
  corrections: ProductCorrection[];
  reviews: CosmeticReview[];
  brandRequests: BrandImprovementRequest[];
  votedReviewIds: string[];
  reportedReviewIds: string[];
  lastBrandRequestAt?: string;
};

const emptyBundle = (): LocalBundle => ({
  contributions: [],
  corrections: [],
  reviews: [],
  brandRequests: [],
  votedReviewIds: [],
  reportedReviewIds: [],
});

async function readLocal(): Promise<LocalBundle> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return emptyBundle();
    return { ...emptyBundle(), ...(JSON.parse(raw) as LocalBundle) };
  } catch {
    return emptyBundle();
  }
}

async function writeLocal(bundle: LocalBundle): Promise<void> {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(bundle));
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isRemoteUuid(id: string): boolean {
  return UUID_RE.test(id);
}

function isSchemaMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? '';
  return (
    error.code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('Could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

/** Only http(s) URIs are useful remotely; file:// paths stay on-device. */
function splitPhotoUris(photoUris: string[]): { remote: string[]; local: string[] } {
  const remote: string[] = [];
  const local: string[] = [];
  for (const uri of photoUris) {
    if (/^https?:\/\//i.test(uri)) remote.push(uri);
    else local.push(uri);
  }
  return { remote, local };
}

export type CommunitySubmitResult =
  | {
      ok: true;
      id: string;
      status: ModerationStatus;
      localOnly: boolean;
      photosPendingUpload?: boolean;
    }
  | { ok: false; reason: string };

async function mirrorContribution(row: ProductContribution) {
  const bundle = await readLocal();
  bundle.contributions = [row, ...bundle.contributions.filter((c) => c.id !== row.id)].slice(0, 100);
  await writeLocal(bundle);
}

async function mirrorCorrection(row: ProductCorrection) {
  const bundle = await readLocal();
  bundle.corrections = [row, ...bundle.corrections.filter((c) => c.id !== row.id)].slice(0, 100);
  await writeLocal(bundle);
}

async function mirrorReview(row: CosmeticReview) {
  const bundle = await readLocal();
  bundle.reviews = [row, ...bundle.reviews.filter((r) => r.id !== row.id)].slice(0, 200);
  await writeLocal(bundle);
}

async function mirrorBrand(row: BrandImprovementRequest) {
  const bundle = await readLocal();
  bundle.brandRequests = [row, ...bundle.brandRequests.filter((b) => b.id !== row.id)].slice(0, 50);
  await writeLocal(bundle);
}

/** Persist contribution: Supabase when schema exists, else local draft/submitted queue. */
export async function submitProductContribution(input: {
  barcode?: string;
  name?: string;
  brand?: string;
  category?: 'food' | 'beauty' | 'unknown';
  ocrText?: string;
  ocrConfirmed: boolean;
  photoUris: string[];
  notes?: string;
  source: ContributionSource;
  asDraft?: boolean;
}): Promise<CommunitySubmitResult> {
  const guestKey = await getGuestKey();
  const status: ModerationStatus = input.asDraft ? 'draft' : 'submitted';
  const now = new Date().toISOString();
  const { remote, local } = splitPhotoUris(input.photoUris);
  const photosPendingUpload = local.length > 0;
  const notes = [
    input.notes?.trim(),
    photosPendingUpload
      ? `[Kora] ${local.length} foto(s) quedan en el dispositivo (sin Storage aún).`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  if (isSupabaseConfigured && supabase) {
    // Client UUID: guest-only rows are insertable but not selectable under RLS,
    // so insert().select() would look like a miss and create a duplicate local copy.
    const remoteId = Crypto.randomUUID();
    const { data, error } = await supabase
      .from('product_contributions')
      .insert({
        id: remoteId,
        guest_key: guestKey,
        barcode: input.barcode ?? null,
        name: input.name ?? null,
        brand: input.brand ?? null,
        category: input.category ?? 'unknown',
        ocr_text: input.ocrText ?? null,
        ocr_confirmed: input.ocrConfirmed,
        // Never send file:// paths as if they were remote assets.
        photo_uris: remote,
        notes: notes || null,
        source: input.source,
        status,
      })
      .select('id, status')
      .maybeSingle();

    if (!error) {
      const id = data?.id ?? remoteId;
      const remoteStatus = (data?.status as ModerationStatus | undefined) ?? status;
      await mirrorContribution({
        id,
        barcode: input.barcode,
        name: input.name,
        brand: input.brand,
        category: input.category ?? 'unknown',
        ocrText: input.ocrText,
        ocrConfirmed: input.ocrConfirmed,
        photoUris: input.photoUris,
        notes,
        source: input.source,
        status: remoteStatus,
        createdAt: now,
        updatedAt: now,
        localOnly: false,
      });
      return {
        ok: true,
        id,
        status: remoteStatus,
        localOnly: false,
        photosPendingUpload,
      };
    }
    if (!isSchemaMissing(error)) {
      return { ok: false, reason: error.message };
    }
  }

  const row: ProductContribution = {
    id: newId('contrib'),
    barcode: input.barcode,
    name: input.name,
    brand: input.brand,
    category: input.category ?? 'unknown',
    ocrText: input.ocrText,
    ocrConfirmed: input.ocrConfirmed,
    photoUris: input.photoUris,
    notes,
    source: input.source,
    status,
    createdAt: now,
    updatedAt: now,
    localOnly: true,
  };
  await mirrorContribution(row);
  return { ok: true, id: row.id, status, localOnly: true, photosPendingUpload };
}

export async function submitProductCorrection(input: {
  barcode: string;
  field: string;
  currentValue?: string;
  proposedValue: string;
  reason?: string;
}): Promise<CommunitySubmitResult> {
  const guestKey = await getGuestKey();
  const now = new Date().toISOString();
  const status: ModerationStatus = 'submitted';

  if (isSupabaseConfigured && supabase) {
    const remoteId = Crypto.randomUUID();
    const { data, error } = await supabase
      .from('product_corrections')
      .insert({
        id: remoteId,
        guest_key: guestKey,
        barcode: input.barcode,
        field: input.field,
        current_value: input.currentValue ?? null,
        proposed_value: input.proposedValue,
        reason: input.reason ?? null,
        status,
      })
      .select('id, status')
      .maybeSingle();
    if (!error) {
      const id = data?.id ?? remoteId;
      const remoteStatus = (data?.status as ModerationStatus | undefined) ?? status;
      await mirrorCorrection({
        id,
        barcode: input.barcode,
        field: input.field,
        currentValue: input.currentValue,
        proposedValue: input.proposedValue,
        reason: input.reason,
        status: remoteStatus,
        createdAt: now,
        localOnly: false,
      });
      return { ok: true, id, status: remoteStatus, localOnly: false };
    }
    if (!isSchemaMissing(error)) return { ok: false, reason: error.message };
  }

  const row: ProductCorrection = {
    id: newId('corr'),
    barcode: input.barcode,
    field: input.field,
    currentValue: input.currentValue,
    proposedValue: input.proposedValue,
    reason: input.reason,
    status,
    createdAt: now,
    localOnly: true,
  };
  await mirrorCorrection(row);
  return { ok: true, id: row.id, status, localOnly: true };
}

export async function listLocalContributions(): Promise<ProductContribution[]> {
  return (await readLocal()).contributions;
}

export async function submitCosmeticReview(input: {
  barcode: string;
  stars: number;
  body: string;
}): Promise<CommunitySubmitResult> {
  const guestKey = await getGuestKey();
  const stars = Math.max(1, Math.min(5, Math.round(input.stars)));
  const body = input.body.trim();
  if (body.length < 3) return { ok: false, reason: 'body_too_short' };
  const status: ModerationStatus = 'submitted';
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('cosmetic_reviews')
      .insert({
        guest_key: guestKey,
        barcode: input.barcode,
        stars,
        body,
        status,
      })
      .select('id, status')
      .maybeSingle();
    if (!error && data) {
      await mirrorReview({
        id: data.id,
        barcode: input.barcode,
        stars,
        body,
        helpfulCount: 0,
        reportCount: 0,
        status: data.status as ModerationStatus,
        createdAt: now,
        localOnly: false,
      });
      return { ok: true, id: data.id, status: data.status as ModerationStatus, localOnly: false };
    }
    if (error && !isSchemaMissing(error)) return { ok: false, reason: error.message };
  }

  const row: CosmeticReview = {
    id: newId('rev'),
    barcode: input.barcode,
    stars,
    body,
    helpfulCount: 0,
    reportCount: 0,
    status,
    createdAt: now,
    localOnly: true,
  };
  await mirrorReview(row);
  return { ok: true, id: row.id, status, localOnly: true };
}

export async function listCosmeticReviews(barcode: string): Promise<CosmeticReview[]> {
  const local = (await readLocal()).reviews.filter((r) => r.barcode === barcode);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('cosmetic_reviews')
      .select('id, barcode, stars, body, helpful_count, report_count, status, created_at')
      .eq('barcode', barcode)
      .in('status', ['approved', 'submitted', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(40);
    if (!error && data) {
      const remote: CosmeticReview[] = data.map((r) => ({
        id: r.id,
        barcode: r.barcode,
        stars: r.stars,
        body: r.body,
        helpfulCount: r.helpful_count ?? 0,
        reportCount: r.report_count ?? 0,
        status: r.status as ModerationStatus,
        createdAt: r.created_at,
        localOnly: false,
      }));
      const map = new Map<string, CosmeticReview>();
      for (const r of [...remote, ...local]) map.set(r.id, r);
      return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }
  return local;
}

export async function voteReviewHelpful(reviewId: string): Promise<CommunitySubmitResult> {
  const guestKey = await getGuestKey();
  const bundle = await readLocal();
  if (bundle.votedReviewIds.includes(reviewId)) {
    return { ok: false, reason: 'already_voted' };
  }

  // Local queue ids are not UUIDs — stay on the local path.
  if (isRemoteUuid(reviewId) && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('vote_cosmetic_review_helpful', {
      p_review_id: reviewId,
      p_guest_key: guestKey,
    });
    if (!error) {
      if (data !== true) {
        bundle.votedReviewIds.push(reviewId);
        await writeLocal(bundle);
        return { ok: false, reason: 'already_voted' };
      }
      bundle.votedReviewIds.push(reviewId);
      await writeLocal(bundle);
      return { ok: true, id: reviewId, status: 'submitted', localOnly: false };
    }
    if (!isSchemaMissing(error)) return { ok: false, reason: error.message };
  }

  bundle.votedReviewIds.push(reviewId);
  bundle.reviews = bundle.reviews.map((r) =>
    r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r,
  );
  await writeLocal(bundle);
  return { ok: true, id: reviewId, status: 'submitted', localOnly: true };
}

export async function reportReview(reviewId: string, reason?: string): Promise<CommunitySubmitResult> {
  const guestKey = await getGuestKey();
  const bundle = await readLocal();
  if (bundle.reportedReviewIds.includes(reviewId)) {
    return { ok: false, reason: 'already_reported' };
  }

  if (isRemoteUuid(reviewId) && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('report_cosmetic_review', {
      p_review_id: reviewId,
      p_guest_key: guestKey,
      p_reason: reason ?? null,
    });
    if (!error) {
      if (data !== true) {
        bundle.reportedReviewIds.push(reviewId);
        await writeLocal(bundle);
        return { ok: false, reason: 'already_reported' };
      }
      bundle.reportedReviewIds.push(reviewId);
      bundle.reviews = bundle.reviews.map((r) =>
        r.id === reviewId
          ? { ...r, reportCount: r.reportCount + 1, status: 'under_review' }
          : r,
      );
      await writeLocal(bundle);
      return { ok: true, id: reviewId, status: 'under_review', localOnly: false };
    }
    if (!isSchemaMissing(error)) return { ok: false, reason: error.message };
  }

  bundle.reportedReviewIds.push(reviewId);
  bundle.reviews = bundle.reviews.map((r) =>
    r.id === reviewId ? { ...r, reportCount: r.reportCount + 1, status: 'under_review' } : r,
  );
  await writeLocal(bundle);
  return { ok: true, id: reviewId, status: 'under_review', localOnly: true };
}

const BRAND_RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

export async function submitBrandImprovementRequest(input: {
  brand: string;
  barcode?: string;
  message: string;
}): Promise<CommunitySubmitResult> {
  const brand = input.brand.trim();
  const message = input.message.trim();
  if (brand.length < 2) return { ok: false, reason: 'brand_required' };
  if (message.length < 10) return { ok: false, reason: 'message_too_short' };

  const bundle = await readLocal();
  if (bundle.lastBrandRequestAt) {
    const elapsed = Date.now() - new Date(bundle.lastBrandRequestAt).getTime();
    if (elapsed < BRAND_RATE_LIMIT_MS) {
      return { ok: false, reason: 'rate_limited' };
    }
  }

  const guestKey = await getGuestKey();
  const status: ModerationStatus = 'submitted';
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const remoteId = Crypto.randomUUID();
    const { data, error } = await supabase
      .from('brand_improvement_requests')
      .insert({
        id: remoteId,
        guest_key: guestKey,
        brand,
        barcode: input.barcode ?? null,
        message,
        status,
      })
      .select('id, status')
      .maybeSingle();
    if (!error) {
      const id = data?.id ?? remoteId;
      const remoteStatus = (data?.status as ModerationStatus | undefined) ?? status;
      bundle.lastBrandRequestAt = now;
      await writeLocal(bundle);
      await mirrorBrand({
        id,
        brand,
        barcode: input.barcode,
        message,
        status: remoteStatus,
        createdAt: now,
        localOnly: false,
      });
      return { ok: true, id, status: remoteStatus, localOnly: false };
    }
    if (!isSchemaMissing(error)) return { ok: false, reason: error.message };
  }

  const row: BrandImprovementRequest = {
    id: newId('brand'),
    brand,
    barcode: input.barcode,
    message,
    status,
    createdAt: now,
    localOnly: true,
  };
  bundle.brandRequests = [row, ...bundle.brandRequests].slice(0, 50);
  bundle.lastBrandRequestAt = now;
  await writeLocal(bundle);
  return { ok: true, id: row.id, status, localOnly: true };
}

export async function listMyCommunityActivity(): Promise<{
  contributions: ProductContribution[];
  corrections: ProductCorrection[];
  reviews: CosmeticReview[];
  brandRequests: BrandImprovementRequest[];
}> {
  // Activity is the local mirror of both offline queue and successful remote submits.
  const bundle = await readLocal();
  return {
    contributions: bundle.contributions,
    corrections: bundle.corrections,
    reviews: bundle.reviews,
    brandRequests: bundle.brandRequests,
  };
}
