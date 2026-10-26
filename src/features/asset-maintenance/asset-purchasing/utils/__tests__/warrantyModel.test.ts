import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateWarrantyKpis,
  buildWarrantyStatusDistribution,
  determineWarrantyUrgency,
  formatDaysRemaining,
  processTopBrandBreakdowns,
} from "../warrantyModel";
import type { WarrantyBrandBreakdown } from "../../types/warranty.types";

describe("warrantyModel", () => {
  describe("determineWarrantyUrgency", () => {
    it("returns critical for days <= 30", () => {
      assert.equal(determineWarrantyUrgency(10), "critical");
      assert.equal(determineWarrantyUrgency(30), "critical");
    });

    it("returns warning for days 31-90", () => {
      assert.equal(determineWarrantyUrgency(31), "warning");
      assert.equal(determineWarrantyUrgency(90), "warning");
    });

    it("returns medium for days 91-180", () => {
      assert.equal(determineWarrantyUrgency(91), "medium");
      assert.equal(determineWarrantyUrgency(180), "medium");
    });

    it("returns safe for days > 180", () => {
      assert.equal(determineWarrantyUrgency(181), "safe");
      assert.equal(determineWarrantyUrgency(365), "safe");
    });
  });

  describe("formatDaysRemaining", () => {
    it("formats negative days as expired", () => {
      assert.equal(formatDaysRemaining(-5), "Lewat 5 hari");
    });

    it("formats 0 days as today", () => {
      assert.equal(formatDaysRemaining(0), "Hari ini");
    });

    it("formats positive days correctly", () => {
      assert.equal(formatDaysRemaining(45), "45 hari lagi");
    });
  });

  describe("calculateWarrantyKpis", () => {
    it("calculates accurate sums and percentages", () => {
      const kpis = calculateWarrantyKpis({
        total: 100,
        safeLong: 30,
        med180: 20,
        warn90: 10,
        crit30: 10,
        expired: 30,
      });

      assert.equal(kpis.totalActive, 100);
      assert.equal(kpis.activeWarranty, 70);
      assert.equal(kpis.activeWarrantyPct, 70);
      assert.equal(kpis.expiredWarranty, 30);
      assert.equal(kpis.expiredWarrantyPct, 30);
      assert.equal(kpis.expiringSoon, 20);
      assert.equal(kpis.expiringSoonPct, 20);
      assert.equal(kpis.expiringCritical, 10);
      assert.equal(kpis.expiringWarning, 10);
      assert.equal(kpis.mediumWarranty, 20);
      assert.equal(kpis.safeWarranty, 30);
    });

    it("handles zero total gracefully without NaN", () => {
      const kpis = calculateWarrantyKpis({
        total: 0,
        safeLong: 0,
        med180: 0,
        warn90: 0,
        crit30: 0,
        expired: 0,
      });

      assert.equal(kpis.totalActive, 0);
      assert.equal(kpis.activeWarrantyPct, 0);
      assert.equal(kpis.expiredWarrantyPct, 0);
      assert.equal(kpis.expiringSoonPct, 0);
    });
  });

  describe("buildWarrantyStatusDistribution", () => {
    it("filters out zero slices and returns percentages", () => {
      const kpis = calculateWarrantyKpis({
        total: 100,
        safeLong: 50,
        med180: 0,
        warn90: 25,
        crit30: 0,
        expired: 25,
      });

      const dist = buildWarrantyStatusDistribution(kpis);
      assert.equal(dist.length, 3);
      assert.equal(dist[0].name, "Masih Panjang (>180 hr)");
      assert.equal(dist[0].percentage, 50);
      assert.equal(dist[1].name, "Segera Habis (31–90 hr)");
      assert.equal(dist[1].percentage, 25);
      assert.equal(dist[2].name, "Sudah Habis");
      assert.equal(dist[2].percentage, 25);
    });
  });

  describe("processTopBrandBreakdowns", () => {
    it("groups brands beyond topCount into LAINNYA when topCount is positive", () => {
      const brands: WarrantyBrandBreakdown[] = [
        { brand: "A", total: 100, masihPanjang: 50, segeraHabis: 20, sudahHabis: 30 },
        { brand: "B", total: 80, masihPanjang: 40, segeraHabis: 10, sudahHabis: 30 },
        { brand: "C", total: 60, masihPanjang: 30, segeraHabis: 10, sudahHabis: 20 },
        { brand: "D", total: 40, masihPanjang: 20, segeraHabis: 5, sudahHabis: 15 },
      ];

      const result = processTopBrandBreakdowns(brands, 2);
      assert.equal(result.length, 3);
      assert.equal(result[0].brand, "A");
      assert.equal(result[1].brand, "B");
      assert.equal(result[2].brand, "LAINNYA");
      assert.equal(result[2].total, 100);
      assert.equal(result[2].masihPanjang, 50);
      assert.equal(result[2].segeraHabis, 15);
      assert.equal(result[2].sudahHabis, 35);
    });

    it("returns all individual brands sorted when topCount is not specified or 0", () => {
      const brands: WarrantyBrandBreakdown[] = [
        { brand: "B", total: 40, masihPanjang: 20, segeraHabis: 5, sudahHabis: 15 },
        { brand: "A", total: 100, masihPanjang: 50, segeraHabis: 20, sudahHabis: 30 },
        { brand: "C", total: 60, masihPanjang: 30, segeraHabis: 10, sudahHabis: 20 },
      ];

      const result = processTopBrandBreakdowns(brands);
      assert.equal(result.length, 3);
      assert.equal(result[0].brand, "A");
      assert.equal(result[1].brand, "C");
      assert.equal(result[2].brand, "B");
      assert.equal(result.some((b) => b.brand === "LAINNYA"), false);
    });
  });
});
