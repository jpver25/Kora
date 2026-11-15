import type { KoraScore, ProductAdditive, ProductNutriments } from '@/types/product';
import type { ScoreBand } from '@/theme/colors';

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function bandFromScore(value: number | null): ScoreBand {
  if (value == null || Number.isNaN(value)) return 'unknown';
  if (value >= 75) return 'excellent';
  if (value >= 50) return 'good';
  if (value >= 25) return 'mediocre';
  return 'bad';
}

function nutriScoreToPoints(grade?: string | null): number | null {
  if (!grade) return null;
  switch (grade.toLowerCase()) {
    case 'a':
      return 90;
    case 'b':
      return 75;
    case 'c':
      return 55;
    case 'd':
      return 35;
    case 'e':
      return 15;
    default:
      return null;
  }
}

function nutrimentFallback(n: ProductNutriments): number | null {
  const sugars = n.sugars100g;
  const sat = n.saturatedFat100g;
  const salt = n.salt100g;
  const fiber = n.fiber100g;
  const protein = n.proteins100g;
  if ([sugars, sat, salt, fiber, protein].every((v) => v == null)) return null;

  let points = 60;
  if (sugars != null) points -= Math.min(35, sugars * 1.2);
  if (sat != null) points -= Math.min(25, sat * 2);
  if (salt != null) points -= Math.min(20, salt * 12);
  if (fiber != null) points += Math.min(15, fiber * 2);
  if (protein != null) points += Math.min(10, protein);
  return clamp(Math.round(points));
}

function additivesPenalty(additives: ProductAdditive[]): number {
  const count = additives.length;
  if (count === 0) return 20;
  if (count <= 2) return 10;
  if (count <= 5) return 0;
  if (count <= 8) return -15;
  return -30;
}

function novaPenalty(nova?: number | null): number {
  switch (nova) {
    case 1:
      return 15;
    case 2:
      return 8;
    case 3:
      return -5;
    case 4:
      return -20;
    default:
      return 0;
  }
}

function organicBonus(labels: string[] = []): number {
  // Match whole label tokens only — avoid false positives like "probiotic".
  for (const raw of labels) {
    const label = raw.toLowerCase().replace(/^en:/, '').replace(/-/g, ' ');
    if (
      /\borganic\b/.test(label) ||
      /\borgánico\b/.test(label) ||
      /\borganico\b/.test(label) ||
      /(^|[^a-z])bio([^a-z]|$)/.test(label) ||
      label === 'bio' ||
      label.startsWith('bio ') ||
      label.endsWith(' bio')
    ) {
      return 5;
    }
  }
  return 0;
}

/** Original Kora scoring (not Yuka). Combines Nutri-Score, additives, NOVA, labels. */
export function computeKoraScore(input: {
  nutriscoreGrade?: string | null;
  novaGroup?: number | null;
  additives: ProductAdditive[];
  nutriments: ProductNutriments;
  labels?: string[];
}): KoraScore {
  const nutrition =
    nutriScoreToPoints(input.nutriscoreGrade) ?? nutrimentFallback(input.nutriments);
  const additivesPart = additivesPenalty(input.additives);
  const processing = novaPenalty(input.novaGroup);
  const organic = organicBonus(input.labels);

  const explanation: string[] = [];

  if (nutrition == null && input.additives.length === 0 && input.novaGroup == null) {
    return {
      value: null,
      band: 'unknown',
      breakdown: {
        nutrition: null,
        additives: null,
        processing: null,
        organicBonus: null,
      },
      explanation: ['Aún no hay suficientes datos nutricionales para puntuar este producto.'],
    };
  }

  const base = nutrition ?? 50;
  const value = clamp(Math.round(base + additivesPart + processing + organic));

  if (input.nutriscoreGrade) {
    explanation.push(`Nutri-Score ${input.nutriscoreGrade.toUpperCase()} aporta la base nutricional.`);
  } else if (nutrition != null) {
    explanation.push('Estimamos la nutrición a partir de azúcares, grasas, sal, fibra y proteína.');
  }

  if (input.additives.length === 0) {
    explanation.push('Sin aditivos reportados: buen indicador.');
  } else {
    explanation.push(`Se detectaron ${input.additives.length} aditivos en la ficha.`);
  }

  if (input.novaGroup) {
    explanation.push(`Nivel de procesamiento NOVA ${input.novaGroup}.`);
  }

  if (organic > 0) {
    explanation.push('Etiqueta orgánica/bio suma un pequeño bonus.');
  }

  return {
    value,
    band: bandFromScore(value),
    breakdown: {
      nutrition: nutrition,
      additives: additivesPart,
      processing,
      organicBonus: organic,
    },
    explanation,
  };
}
