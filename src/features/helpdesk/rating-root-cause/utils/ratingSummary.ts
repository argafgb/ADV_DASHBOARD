import type { RatingsDistribution } from "../../overview/types/ratingDistribution.types";

export function buildRatingSummary(rows: { stars: number; count: number }[]): RatingsDistribution {
  const counts = new Map<number, number>();
  for (const row of rows) {
    const stars = Number.isInteger(row.stars) && row.stars >= 1 && row.stars <= 5 ? row.stars : 0;
    counts.set(stars, (counts.get(stars) ?? 0) + Number(row.count));
  }
  const dist = [5, 4, 3, 2, 1, 0].map(stars => ({ stars, count: counts.get(stars) ?? 0 }));
  const rated = dist.filter(row => row.stars > 0).reduce((sum, row) => sum + row.count, 0);
  return {
    dist,
    distTotal: dist.reduce((sum, row) => sum + row.count, 0),
    rating: rated ? dist.reduce((sum, row) => sum + row.stars * row.count, 0) / rated : 0,
  };
}
