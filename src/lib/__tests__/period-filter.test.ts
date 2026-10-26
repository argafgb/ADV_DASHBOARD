import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalPeriod,
  maxMonthForYear,
  normalizeMonth,
} from "../period-filter";

const june2026 = new Date(2026, 5, 10);

test("maxMonthForYear bounds past, current, and future years", () => {
  assert.equal(maxMonthForYear("2025", june2026), 12);
  assert.equal(maxMonthForYear("2026", june2026), 6);
  assert.equal(maxMonthForYear("2027", june2026), 0);
});

test("normalizeMonth preserves valid single and cumulative month selections", () => {
  assert.equal(normalizeMonth("4", "2026", june2026), "4");
  assert.equal(normalizeMonth("5-2", "2026", june2026), "2-5");
  assert.equal(normalizeMonth("ALL", "2026", june2026), "ALL");
});

test("normalizeMonth rejects future and malformed selections", () => {
  assert.equal(normalizeMonth("7", "2026", june2026), "ALL");
  assert.equal(normalizeMonth("quarter-2", "2026", june2026), "ALL");
});

test("canonicalPeriod normalizes year before month", () => {
  assert.deepEqual(canonicalPeriod("invalid", "12", june2026), {
    year: "2026",
    month: "ALL",
  });
});
