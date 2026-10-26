import assert from "node:assert/strict";
import test from "node:test";
import { PURCHASE_TEST_FIXTURE } from "./purchaseFixtures";
import {
  assetPurchasingCsv,
  deriveAssetPurchasingModel,
} from "../purchaseModel";

const model = (overrides = {}) =>
  deriveAssetPurchasingModel({
    year: "2026",
    month: "ALL",
    category: "all",
    search: "",
    data: PURCHASE_TEST_FIXTURE,
    ...overrides,
  });

test("derives extracted totals and monthly totals", () => {
  const result = model();
  assert.equal(result.totalUnits, 622);
  assert.deepEqual(result.categoryTotals, {
    Workstation: 240,
    Peripheral: 382,
  });
  assert.deepEqual(
    result.monthly.map((item) => item.total),
    [91, 125, 68, 53, 116, 78, 91],
  );
  assert.deepEqual(result.peak, { label: "February", units: 125 });
});

test("applies category filters while retaining global category KPIs", () => {
  const ws = model({ category: "Workstation" });
  assert.equal(ws.totalUnits, 240);
  assert.equal(ws.tableRows.length, 3);
  assert.ok(ws.tableRows.every((row) => row.category === "Workstation"));
  assert.deepEqual(ws.categoryTotals, { Workstation: 240, Peripheral: 382 });
});

test("intersects selected month and range with Jan-Jul", () => {
  assert.equal(model({ month: "2" }).totalUnits, 125);
  assert.equal(model({ month: "6-9" }).totalUnits, 169);
  assert.deepEqual(
    model({ month: "6-9" }).selectedMonths.map(({ month }) => month),
    [6, 7],
  );
});

test("keeps annual peak independent from the selected month", () => {
  assert.deepEqual(model({ month: "4" }).peak, {
    label: "February",
    units: 125,
  });
  assert.deepEqual(model({ month: "7" }).peak, {
    label: "February",
    units: 125,
  });
});

test("returns honest empty model for unsupported periods", () => {
  const result = model({ year: "2025", month: "ALL" });
  assert.equal(result.supportedPeriod, false);
  assert.equal(result.totalUnits, 0);
  assert.deepEqual(result.monthly, []);
  assert.equal(result.tableRows.length, 14);
  assert.ok(result.tableRows.every((row) => row.isZero));
});

test("excludes zero items from top list and includes them in table", () => {
  const result = model();
  assert.ok(!result.topItems.some((item) => item.name === "PC"));
  assert.ok(result.tableRows.some((item) => item.name === "PC" && item.isZero));
  assert.ok(
    result.tableRows.some((item) => item.name === "RAM" && item.isZero),
  );
});

test("search filters table rows only", () => {
  const result = model({ search: "mouse" });
  assert.deepEqual(
    result.searchedRows.map((row) => row.name),
    ["Mouse", "Paket Mouse + Keyboard"],
  );
  assert.equal(result.totalUnits, 622);
});

test("CSV is category and period scoped but ignores search", () => {
  const result = model({
    category: "Peripheral",
    month: "2-3",
    search: "router",
  });
  const csv = assetPurchasingCsv(result);
  assert.match(csv, /^No,Item Type,Category,Feb,Mar,Total/m);
  assert.match(csv, /Mouse,Peripheral,60,30,90/);
  assert.match(csv, /RAM,Peripheral,0,0,0/);
  assert.doesNotMatch(csv, /Laptop/);
});
