export type ModerationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type ContributionSource = 'missing_product' | 'failed_visual' | 'manual';

export type ProductContribution = {
  id: string;
  barcode?: string | null;
  name?: string | null;
  brand?: string | null;
  category: 'food' | 'beauty' | 'unknown';
  ocrText?: string | null;
  ocrConfirmed: boolean;
  photoUris: string[];
  notes?: string | null;
  source: ContributionSource;
  status: ModerationStatus;
  createdAt: string;
  updatedAt: string;
  localOnly?: boolean;
};

export type ProductCorrection = {
  id: string;
  barcode: string;
  field: string;
  currentValue?: string | null;
  proposedValue: string;
  reason?: string | null;
  status: ModerationStatus;
  createdAt: string;
  localOnly?: boolean;
};

export type CosmeticReview = {
  id: string;
  barcode: string;
  stars: number;
  body: string;
  helpfulCount: number;
  reportCount: number;
  status: ModerationStatus;
  createdAt: string;
  localOnly?: boolean;
};

export type BrandImprovementRequest = {
  id: string;
  brand: string;
  barcode?: string | null;
  message: string;
  status: ModerationStatus;
  createdAt: string;
  localOnly?: boolean;
};
