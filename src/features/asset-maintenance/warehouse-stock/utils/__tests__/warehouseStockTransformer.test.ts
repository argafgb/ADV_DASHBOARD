import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateConditionByCategory,
  calculateStockByCondition,
  calculateTopItemTypes,
  calculateTypeStockModalData,
  calculateWarehouseKpis,
  filterBaseWarehouseItems,
  filterTableItems,
  formatIndonesianNumber,
  formatIndonesianPercentage,
  formatWarehouseDate,
  normalizeWarehouseItem,
} from "../warehouseStockTransformer";
import type { WarehouseStockItem } from "../../types";

const SAMPLE_ITEMS: WarehouseStockItem[] = [
  {
    no: 1,
    item: "Switch TP-Link 5 Port",
    category: "Network & CCTV",
    type: "Switch",
    spec: "Gigabit",
    location: "AMPASIT",
    placement: "A1",
    condition: "New",
    qty: 4,
    qty_note: "",
    barcode: "SW001",
    last_edited: "2026-09-22 09:51",
  },
  {
    no: 2,
    item: "Modem ZTE",
    category: "Network & CCTV",
    type: "Modem",
    spec: "",
    location: "AMPASIT",
    placement: "LACI C",
    condition: "Second",
    qty: 10,
    qty_note: "",
    barcode: "",
    last_edited: "2026-08-04 09:40",
  },
  {
    no: 3,
    item: "Laptop Acer Travelmate",
    category: "Laptop & device",
    type: "Laptop",
    spec: "TMP214",
    location: "AMPASIT",
    placement: "B1",
    condition: "Second",
    qty: 2,
    qty_note: "",
    barcode: "WS001",
    last_edited: "2026-08-03 16:35",
  },
  {
    no: 4,
    item: "Tas Ransel Zyrex",
    category: "Laptop bag",
    type: "Laptop bag",
    spec: "",
    location: "Not recorded",
    placement: "",
    condition: "New",
    qty: 80,
    qty_note: "",
    barcode: "",
    last_edited: "",
  },
  {
    no: 5,
    item: "Tas Tenteng ACER",
    category: "Laptop bag",
    type: "Laptop bag",
    spec: "",
    location: "Not recorded",
    placement: "",
    condition: "Etrama-owned",
    qty: 1,
    qty_note: "",
    barcode: "",
    last_edited: "",
  },
];

describe("warehouseStockTransformer", () => {
  it("normalizes Etrama-owned condition to Second", () => {
    const item = normalizeWarehouseItem(SAMPLE_ITEMS[4]);
    assert.equal(item.condition, "Second");
  });

  it("formats Indonesian numbers and percentages correctly", () => {
    assert.equal(formatIndonesianNumber(1250), "1.250");
    assert.equal(formatIndonesianPercentage(50, 200), "25,0%");
  });

  it("formats date strings into friendly Indonesian format", () => {
    assert.equal(
      formatWarehouseDate("2026-09-22 09:51"),
      "22 September 2026 09.51",
    );
    assert.equal(formatWarehouseDate(""), "-");
  });

  it("filters base items by location and month correctly", () => {
    const filteredLoc = filterBaseWarehouseItems(
      SAMPLE_ITEMS,
      "AMPASIT",
      "All Months",
    );
    assert.equal(filteredLoc.length, 3);

    const filteredMonth = filterBaseWarehouseItems(
      SAMPLE_ITEMS,
      "Semua",
      "September",
    );
    assert.equal(filteredMonth.length, 1);
    assert.equal(filteredMonth[0].no, 1);
  });

  it("computes accurate warehouse KPIs", () => {
    const base = filterBaseWarehouseItems(SAMPLE_ITEMS, "Semua", "All Months");
    const kpis = calculateWarehouseKpis(base);

    // Total units: 4 + 10 + 2 + 80 + 1 = 97
    assert.equal(kpis.totalUnits, 97);
    assert.equal(kpis.totalItems, 5);
    // New units: 4 + 80 = 84
    assert.equal(kpis.newUnits, 84);
    // Second units: 10 + 2 + 1 = 13
    assert.equal(kpis.secondUnits, 13);
    // Location not recorded: 80 + 1 = 81
    assert.equal(kpis.noLocationUnits, 81);
    assert.equal(kpis.noLocationItems, 2);
  });

  it("aggregates donut condition shares correctly", () => {
    const base = filterBaseWarehouseItems(SAMPLE_ITEMS, "Semua", "All Months");
    const shares = calculateStockByCondition(base);

    assert.equal(shares.length, 2);
    assert.equal(shares[0].label, "New");
    assert.equal(shares[0].value, 84);
    assert.equal(shares[1].label, "Second");
    assert.equal(shares[1].value, 13);
  });

  it("aggregates category stacks ordered by total units", () => {
    const base = filterBaseWarehouseItems(SAMPLE_ITEMS, "Semua", "All Months");
    const stacks = calculateConditionByCategory(base);

    assert.equal(stacks[0].category, "Laptop bag");
    assert.equal(stacks[0].total, 81);
    assert.equal(stacks[1].category, "Network & CCTV");
    assert.equal(stacks[1].total, 14);
  });

  it("derives top item types and percentage widths", () => {
    const base = filterBaseWarehouseItems(SAMPLE_ITEMS, "Semua", "All Months");
    const topTypes = calculateTopItemTypes(base);

    assert.equal(topTypes[0].type, "Laptop bag");
    assert.equal(topTypes[0].total, 81);
    assert.equal(topTypes[0].percentageWidth, "100%");
  });

  it("calculates type stock modal rows and thresholds", () => {
    const base = filterBaseWarehouseItems(SAMPLE_ITEMS, "Semua", "All Months");
    const modal = calculateTypeStockModalData(base, "Switch");

    assert.ok(modal);
    assert.equal(modal.title, "Switch");
    assert.equal(modal.rows.length, 1);
    // 4 units is <= 5 => Low with red dot
    assert.equal(modal.rows[0].status, "Low");
    assert.equal(modal.rows[0].dotColor, "#DC2626");
  });

  it("filters table items by category, condition, and search", () => {
    const base = filterBaseWarehouseItems(SAMPLE_ITEMS, "Semua", "All Months");

    const searchResult = filterTableItems(base, {
      category: "Semua",
      condition: "Semua",
      type: null,
      tableLocation: null,
      search: "Acer",
    });
    assert.equal(searchResult.length, 2); // Acer Travelmate and Tas ACER

    const condResult = filterTableItems(base, {
      category: "Semua",
      condition: "New",
      type: null,
      tableLocation: null,
      search: "",
    });
    assert.equal(condResult.length, 2); // Switch and Tas Zyrex
  });
});
