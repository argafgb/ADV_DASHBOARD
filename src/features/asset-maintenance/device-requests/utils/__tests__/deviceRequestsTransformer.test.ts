import assert from "node:assert/strict";
import test from "node:test";
import type { DeviceRequestItem } from "../../types";
import {
  deriveDeviceRequestsModel,
  resolveRegion,
  cleanSiteName,
  resolveItemCompany,
  normalizeDeviceType,
} from "../deviceRequestsTransformer";

const items: DeviceRequestItem[] = [
  {
    id: "1",
    year: 2026,
    month: 1,
    quarter: 1,
    date: "2026-01-08",
    barcode: "WS24000803",
    assetName: "Switch D-Link DES-1016",
    intended: "ADV Semarang",
    site: "Semarang",
    company: "Advantage",
    region: "R5",
    status: "Penambahan",
    type: "switch",
  },
  {
    id: "2",
    year: 2026,
    month: 1,
    quarter: 1,
    date: "2026-01-09",
    barcode: "WS25000386",
    assetName: "Router RB750Gr3",
    intended: "ADV Medan",
    site: "Medan",
    company: "Advantage",
    region: "R1",
    status: "Pergantian",
    type: "router",
  },
  {
    id: "3",
    year: 2026,
    month: 3,
    quarter: 1,
    date: "2026-03-07",
    barcode: "WS26000114",
    assetName: "Access Point RG-RAP2200(E)",
    intended: "COS Semarang",
    site: "COS Semarang",
    company: "Wisesa",
    region: "R5",
    status: "Penambahan",
    type: "ap",
  },
  {
    id: "4",
    year: 2025,
    month: 3,
    quarter: 1,
    date: "2025-03-01",
    barcode: "WS25000111",
    assetName: "Router RB450",
    intended: "ADV Medan",
    site: "Medan",
    company: "Advantage",
    region: "R1",
    status: "Penambahan",
    type: "router",
  },
];

const base = {
  items,
  year: "2026",
  month: "ALL",
  site: "ALL",
  company: "ALL",
  region: "ALL",
  status: "all" as const,
  type: "all" as const,
};

test("resolveRegion maps branches and unit fallbacks", () => {
  assert.equal(resolveRegion("Jambi"), "R1");
  assert.equal(resolveRegion("Semarang"), "R5");
  assert.equal(resolveRegion("Unknown"), "Lainnya");
});

test("cleanSiteName strips ADV/WSS prefix and normalizes", () => {
  assert.equal(cleanSiteName("ADV Semarang"), "SEMARANG");
  assert.equal(cleanSiteName("ADV Balikpapan\u00a0"), "BALIKPAPAN");
  assert.equal(cleanSiteName("Wiracarita"), "WIRA CARITA");
});

test("resolveItemCompany detects company from intended or barcode", () => {
  assert.equal(resolveItemCompany("ADV Medan", "WS25000386"), "Advantage");
  assert.equal(resolveItemCompany("COS Semarang", "WS25000386"), "Wisesa");
  assert.equal(resolveItemCompany("ETRAMA", "WS25000386"), "Etrama");
});

test("normalizeDeviceType maps raw device strings to type keys", () => {
  assert.equal(normalizeDeviceType("Router Mikrotik"), "router");
  assert.equal(normalizeDeviceType("Acces Point Ruijie"), "ap");
  assert.equal(normalizeDeviceType("Switch TP-Link"), "switch");
});

test("deriveDeviceRequestsModel computes KPIs, statuses, and type cards correctly", () => {
  const m = deriveDeviceRequestsModel(base);
  assert.equal(m.total, 3);
  assert.equal(m.penambahanCount, 2);
  assert.equal(m.pergantianCount, 1);
  assert.equal(m.siteCount, 3);
  assert.deepEqual(
    m.typeCards.map((c) => ({ type: c.type, val: c.value })),
    [
      { type: "router", val: 1 },
      { type: "ap", val: 1 },
      { type: "switch", val: 1 },
    ],
  );
});

test("filtering by company and status works as expected", () => {
  const mAdv = deriveDeviceRequestsModel({ ...base, company: "ADVANTAGE" });
  assert.equal(mAdv.total, 2);

  const mPenambahan = deriveDeviceRequestsModel({
    ...base,
    status: "Penambahan",
  });
  assert.equal(mPenambahan.total, 2);

  const mPergantian = deriveDeviceRequestsModel({
    ...base,
    status: "Pergantian",
  });
  assert.equal(mPergantian.total, 1);
});

test("filtering by month narrows KPIs and details but preserves 12-month trend", () => {
  const m = deriveDeviceRequestsModel({ ...base, month: "1" });
  assert.equal(m.total, 2);
  assert.equal(m.details.length, 2);
  assert.equal(m.monthly.length, 12);
  assert.equal(m.monthly[0].switch, 1);
  assert.equal(m.monthly[0].router, 1);
});
