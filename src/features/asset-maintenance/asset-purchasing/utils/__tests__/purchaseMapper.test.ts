import assert from "node:assert/strict";
import test from "node:test";
import type { AssetPurchasingDbRow } from "../../types";
import { mapAssetPurchasingRows } from "../purchaseMapper";

const rows: AssetPurchasingDbRow[] = [
  { source_category: "WORKSTATION", item_type: "Laptop", purchase_year: 2026, purchase_month: 2, quantity: 3 },
  { source_category: "WORKSTATION", item_type: "Laptop", purchase_year: "2026", purchase_month: "2", quantity: "4" },
  { source_category: "PERIPHERAL", item_type: "Mouse", purchase_year: 2026, purchase_month: 1, quantity: 5 },
];

test("maps normalized purchasing rows into the shared UI dataset", () => {
  const result = mapAssetPurchasingRows(rows, "2026-08-01T00:00:00.000Z");

  assert.deepEqual(result.months.map(({ year, month, label }) => ({ year, month, label })), [
    { year: 2026, month: 1, label: "Jan" },
    { year: 2026, month: 2, label: "Feb" },
  ]);
  assert.deepEqual(result.items, [
    { name: "Mouse", category: "Peripheral", unitsByPeriod: { "2026-1": 5 } },
    { name: "Laptop", category: "Workstation", unitsByPeriod: { "2026-2": 7 } },
  ]);
  assert.equal(result.syncedAt, "2026-08-01T00:00:00.000Z");
});

test("ignores malformed periods and quantities", () => {
  const result = mapAssetPurchasingRows([
    ...rows,
    { source_category: "PERIPHERAL", item_type: "Bad month", purchase_year: 2026, purchase_month: 13, quantity: 2 },
    { source_category: "PERIPHERAL", item_type: "Bad quantity", purchase_year: 2026, purchase_month: 3, quantity: "unknown" },
  ], null);

  assert.equal(result.items.length, 2);
  assert.equal(result.syncedAt, null);
});
