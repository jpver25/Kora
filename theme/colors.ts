/** Kora brand + semantic color tokens */
export const colors = {
  primary: '#163B35',
  secondary: '#537C65',
  cream: '#FAF8F4',
  lime: '#C8E77B',
  white: '#FFFFFF',
  ink: '#17211D',

  /** Soft surfaces */
  surface: '#F3F0E8',
  surfaceElevated: '#FFFFFF',
  muted: '#8A948C',
  border: '#E2DDD2',
  overlay: 'rgba(23, 33, 29, 0.55)',

  /** Mascot accent */
  mascot: '#F4A04A',
  mascotLeaf: '#63C759',

  /** Score bands */
  scoreExcellent: '#1B6B4A',
  scoreGood: '#6FBF73',
  scoreMediocre: '#E39B3A',
  scoreBad: '#D64545',

  /** Feedback */
  danger: '#D64545',
  warning: '#E39B3A',
  success: '#1B6B4A',
  info: '#3D6E8C',
} as const;

export type ScoreBand = 'excellent' | 'good' | 'mediocre' | 'bad' | 'unknown';

export function scoreBandColor(band: ScoreBand): string {
  switch (band) {
    case 'excellent':
      return colors.scoreExcellent;
    case 'good':
      return colors.scoreGood;
    case 'mediocre':
      return colors.scoreMediocre;
    case 'bad':
      return colors.scoreBad;
    default:
      return colors.muted;
  }
}
