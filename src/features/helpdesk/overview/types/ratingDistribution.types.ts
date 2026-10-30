export interface RatingStarItem {
  stars: number; // 5, 4, 3, 2, 1, 0 (0 = No Rating)
  count: number;
}

export interface RatingsDistribution {
  rating: number; // Average CSAT (e.g., 4.82)
  distTotal: number; // Total tickets with ratings
  dist: RatingStarItem[];
}
