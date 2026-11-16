/**
 * Secondary English strings (structure for future locale toggle).
 * Primary UI remains Spanish via `strings.es.ts`.
 */
export const stringsEn = {
  appName: 'Kora',
  tagline: 'Know what you’re buying.',
  common: {
    loading: 'Loading…',
    error: 'Something went wrong',
    tryAgain: 'Try again',
    cancel: 'Cancel',
    ok: 'OK',
    back: 'Back',
  },
  tabs: {
    home: 'Home',
    explore: 'Explore',
    scan: 'Scan',
    history: 'History',
    profile: 'Profile',
  },
  premium: {
    title: 'Kora Premium',
    statusFree: 'Free plan',
    statusPremium: 'Premium active',
    cta: 'View Premium',
  },
} as const;
