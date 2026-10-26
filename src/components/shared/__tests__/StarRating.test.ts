import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAssetFeedbackScore,
  calculateAssetRatingSummary,
} from "../StarRating";

test("calculateAssetFeedbackScore handles perfect 3 'Ya' responses", () => {
  const score = calculateAssetFeedbackScore("Ya", "Ya", "Ya");
  assert.equal(score, 5.0);

  const booleanScore = calculateAssetFeedbackScore(true, true, true);
  assert.equal(booleanScore, 5.0);
});

test("calculateAssetFeedbackScore handles partial and negative responses", () => {
  // 2 Ya = 2/3 * 5 = 3.33
  const twoScore = calculateAssetFeedbackScore("Ya", "Ya", "Tidak");
  assert.equal(twoScore, 3.33);

  // 1 Ya = 1/3 * 5 = 1.67
  const oneScore = calculateAssetFeedbackScore("Ya", "Tidak", "Tidak");
  assert.equal(oneScore, 1.67);

  // 0 Ya = 0.0
  const zeroScore = calculateAssetFeedbackScore("Tidak", "Tidak", "Tidak");
  assert.equal(zeroScore, 0.0);

  // Null or empty handling
  const nullScore = calculateAssetFeedbackScore(null, undefined, "");
  assert.equal(nullScore, 0.0);
});

test("calculateAssetRatingSummary aggregates survey metrics accurately", () => {
  const sampleData = [
    { performa_ok: "Ya", aplikasi_ok: "Ya", baterai_ok: "Ya" }, // 5.0
    { performa_ok: "Ya", aplikasi_ok: "Ya", baterai_ok: "Ya" }, // 5.0
    { performa_ok: "Ya", aplikasi_ok: "Ya", baterai_ok: "Tidak" }, // 3.33
    { performa_ok: "Tidak", aplikasi_ok: "Tidak", baterai_ok: "Tidak" }, // 0.0
  ];

  const summary = calculateAssetRatingSummary(sampleData);

  assert.equal(summary.totalResponses, 4);
  // (5.0 + 5.0 + 3.33 + 0.0) / 4 = 13.33 / 4 = 3.33
  assert.equal(summary.avgStars, 3.33);
  assert.equal(summary.satisfactionPct, 66.6);

  // Performa: 3/4 = 75% -> 3.75 stars
  assert.equal(summary.breakdown.performaPct, 75.0);
  assert.equal(summary.breakdown.performaStars, 3.75);

  // Aplikasi: 3/4 = 75% -> 3.75 stars
  assert.equal(summary.breakdown.aplikasiPct, 75.0);
  assert.equal(summary.breakdown.aplikasiStars, 3.75);

  // Baterai: 2/4 = 50% -> 2.50 stars
  assert.equal(summary.breakdown.bateraiPct, 50.0);
  assert.equal(summary.breakdown.bateraiStars, 2.50);
});

test("calculateAssetRatingSummary returns safe empty summary on zero responses", () => {
  const empty = calculateAssetRatingSummary([]);
  assert.equal(empty.totalResponses, 0);
  assert.equal(empty.avgStars, 0);
  assert.equal(empty.satisfactionPct, 0);
  assert.equal(empty.breakdown.performaStars, 0);
});
