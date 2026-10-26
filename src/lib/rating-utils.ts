export interface AssetRatingSummaryResult {
  avgStars: number;
  totalResponses: number;
  satisfactionPct: number;
  breakdown: {
    performaStars: number;
    aplikasiStars: number;
    bateraiStars: number;
    performaPct: number;
    aplikasiPct: number;
    bateraiPct: number;
  };
}

/**
 * Calculates a single feedback response score on a 0.0 – 5.0 star scale
 * based on the 3 evaluation pillars: Performa, Aplikasi, and Baterai.
 *
 * Each "Ya" / true response contributes 1/3 (33.33%) of the maximum 5.0 stars (~1.667 stars).
 */
export function calculateAssetFeedbackScore(
  performaOk?: string | boolean | null,
  aplikasiOk?: string | boolean | null,
  bateraiOk?: string | boolean | null,
): number {
  const isOk = (val?: string | boolean | null): boolean => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const clean = val.trim().toLowerCase();
      return clean === "ya" || clean === "yes" || clean === "1" || clean === "true";
    }
    return false;
  };

  let points = 0;
  if (isOk(performaOk)) points += 1;
  if (isOk(aplikasiOk)) points += 1;
  if (isOk(bateraiOk)) points += 1;

  // Scale: (points / 3) * 5.0
  return Number(((points / 3) * 5.0).toFixed(2));
}

/**
 * Aggregates a list of rating survey responses into an overall star average and breakdown per pillar.
 */
export function calculateAssetRatingSummary(
  items: Array<{
    performa_ok?: string | boolean | null;
    aplikasi_ok?: string | boolean | null;
    baterai_ok?: string | boolean | null;
    performaOk?: string | boolean | null;
    aplikasiOk?: string | boolean | null;
    bateraiOk?: string | boolean | null;
  }>,
): AssetRatingSummaryResult {
  const total = items.length;
  if (total === 0) {
    return {
      avgStars: 0,
      totalResponses: 0,
      satisfactionPct: 0,
      breakdown: {
        performaStars: 0,
        aplikasiStars: 0,
        bateraiStars: 0,
        performaPct: 0,
        aplikasiPct: 0,
        bateraiPct: 0,
      },
    };
  }

  let totalScore = 0;
  let performaYes = 0;
  let aplikasiYes = 0;
  let bateraiYes = 0;

  for (const item of items) {
    const pVal = item.performaOk ?? item.performa_ok;
    const aVal = item.aplikasiOk ?? item.aplikasi_ok;
    const bVal = item.bateraiOk ?? item.baterai_ok;

    const score = calculateAssetFeedbackScore(pVal, aVal, bVal);
    totalScore += score;

    const isOk = (val?: string | boolean | null) =>
      typeof val === "boolean"
        ? val
        : typeof val === "string" && ["ya", "yes", "1", "true"].includes(val.trim().toLowerCase());

    if (isOk(pVal)) performaYes += 1;
    if (isOk(aVal)) aplikasiYes += 1;
    if (isOk(bVal)) bateraiYes += 1;
  }

  const avgStars = Number((totalScore / total).toFixed(2));
  const satisfactionPct = Number(((avgStars / 5.0) * 100).toFixed(1));

  const performaPct = Number(((performaYes / total) * 100).toFixed(1));
  const aplikasiPct = Number(((aplikasiYes / total) * 100).toFixed(1));
  const bateraiPct = Number(((bateraiYes / total) * 100).toFixed(1));

  const performaStars = Number(((performaPct / 100) * 5.0).toFixed(2));
  const aplikasiStars = Number(((aplikasiPct / 100) * 5.0).toFixed(2));
  const bateraiStars = Number(((bateraiPct / 100) * 5.0).toFixed(2));

  return {
    avgStars,
    totalResponses: total,
    satisfactionPct,
    breakdown: {
      performaStars,
      aplikasiStars,
      bateraiStars,
      performaPct,
      aplikasiPct,
      bateraiPct,
    },
  };
}
