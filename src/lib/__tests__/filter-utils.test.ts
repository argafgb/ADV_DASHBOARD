import assert from "node:assert/strict";
import test from "node:test";
import { formatMonthRangeLabel, parseMonthFilter } from "../filter-utils";

test("parseMonthFilter correctly parses single month", () => {
  const res = parseMonthFilter("9");
  assert.deepEqual(res.months, [9]);
  assert.equal(res.startMonth, 9);
  assert.equal(res.endMonth, 9);
  assert.equal(res.isAll, false);
});

test("parseMonthFilter correctly parses month range", () => {
  const res = parseMonthFilter("6-9");
  assert.deepEqual(res.months, [6, 7, 8, 9]);
  assert.equal(res.startMonth, 6);
  assert.equal(res.endMonth, 9);
  assert.equal(res.isAll, false);
});

test("parseMonthFilter correctly parses ALL months", () => {
  const res = parseMonthFilter("ALL");
  assert.equal(res.months.length, 12);
  assert.equal(res.startMonth, 1);
  assert.equal(res.endMonth, 12);
  assert.equal(res.isAll, true);
});

test("formatMonthRangeLabel formats single month and range correctly", () => {
  assert.equal(formatMonthRangeLabel("9", "2026"), "Sep 2026");
  assert.equal(formatMonthRangeLabel("6-9", "2026"), "Jun – Sep 2026");
  assert.equal(formatMonthRangeLabel("ALL", "2026"), "Jan – Des 2026");
});
