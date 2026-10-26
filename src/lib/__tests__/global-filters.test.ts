import assert from "node:assert/strict";
import test from "node:test";

import {
  assetFilterInput,
  dashboardHref,
  globalFilterParams,
} from "../global-filters";

const january2026 = new Date(2026, 0, 15);

test("dashboardHref persists only dashboard filter state", () => {
  const params = new URLSearchParams({
    year: "2025",
    month: "6",
    site: "JAKARTA",
    company: "ADVANTAGE",
    monthTouched: "1",
    unrelated: "discard-me",
  });

  assert.equal(
    dashboardHref("/dashboard/comparison", params),
    "/dashboard/comparison?year=2025&month=6&site=JAKARTA&company=ADVANTAGE",
  );
});

test("globalFilterParams omits empty values", () => {
  const params = new URLSearchParams("year=2025&month=&site=ALL&company=");

  assert.equal(globalFilterParams(params).toString(), "year=2025&site=ALL");
});

test("assetFilterInput accepts Next search-param arrays and canonicalizes period", () => {
  assert.deepEqual(
    assetFilterInput(
      {
        year: ["2025", "2024"],
        month: ["12", "1"],
        site: ["BANDUNG"],
        company: ["WISESA"],
      },
      january2026,
    ),
    { year: "2025", month: "12", site: "BANDUNG", company: "WSS" },
  );
});

test("assetFilterInput uses pure empty backend fallbacks", () => {
  assert.deepEqual(assetFilterInput({}, january2026), {
    year: "2026",
    month: "ALL",
    site: "ALL",
    company: "ALL",
  });
});
