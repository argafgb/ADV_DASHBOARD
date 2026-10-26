import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeCompany,
  parseCompanyFilter,
  toggleCompanyFilter,
} from "../company-filter";

test("parseCompanyFilter parses empty and ALL input", () => {
  const empty = parseCompanyFilter();
  assert.equal(empty.isAll, true);
  assert.equal(empty.canonicalKey, "ALL");
  assert.equal(empty.displayLabel, "Semua");
  assert.deepEqual(empty.codes, ["ADV", "WSS", "ETR"]);

  const all = parseCompanyFilter("ALL");
  assert.equal(all.isAll, true);
  assert.equal(all.canonicalKey, "ALL");
  assert.equal(all.displayLabel, "Semua");
});

test("parseCompanyFilter parses single company and maps legacy names", () => {
  const wss = parseCompanyFilter("WISESA");
  assert.equal(wss.isAll, false);
  assert.equal(wss.canonicalKey, "WSS");
  assert.equal(wss.displayLabel, "WSS");
  assert.deepEqual(wss.codes, ["WSS"]);

  const adv = parseCompanyFilter("ADVANTAGE");
  assert.equal(adv.canonicalKey, "ADV");
  assert.equal(adv.displayLabel, "ADV");

  const etr = parseCompanyFilter("ETR");
  assert.equal(etr.canonicalKey, "ETR");
  assert.equal(etr.displayLabel, "ETR");
});

test("parseCompanyFilter parses and canonicalizes multi-select companies", () => {
  const multi = parseCompanyFilter("WSS,ADV");
  assert.equal(multi.isAll, false);
  assert.equal(multi.canonicalKey, "ADV,WSS");
  assert.equal(multi.displayLabel, "ADV + WSS");
  assert.deepEqual(multi.codes, ["ADV", "WSS"]);

  const multiFull = parseCompanyFilter("WISESA,ADVANTAGE");
  assert.equal(multiFull.canonicalKey, "ADV,WSS");
  assert.equal(multiFull.displayLabel, "ADV + WSS");

  const allThree = parseCompanyFilter("ADV,WSS,ETR");
  assert.equal(allThree.isAll, true);
  assert.equal(allThree.canonicalKey, "ALL");
  assert.equal(allThree.displayLabel, "Semua");
});

test("normalizeCompany returns canonicalKey", () => {
  assert.equal(normalizeCompany("WISESA"), "WSS");
  assert.equal(normalizeCompany("WSS,ADV"), "ADV,WSS");
  assert.equal(normalizeCompany(""), "ALL");
});

test("toggleCompanyFilter handles checking and unchecking states correctly", () => {
  // When ALL is active, clicking ETR unchecks it and leaves ADV + WSS
  assert.equal(toggleCompanyFilter("ALL", "ETR"), "ADV,WSS");

  // When ADV,WSS is active, clicking WSS unchecks it, leaving ADV
  assert.equal(toggleCompanyFilter("ADV,WSS", "WSS"), "ADV");

  // When ADV is active, clicking WSS checks it, giving ADV,WSS
  assert.equal(toggleCompanyFilter("ADV", "WSS"), "ADV,WSS");

  // When ADV,WSS is active, clicking ETR checks it, completing all 3 -> resets to ALL
  assert.equal(toggleCompanyFilter("ADV,WSS", "ETR"), "ALL");

  // When only ADV is active, unchecking ADV leaves empty -> resets to ALL
  assert.equal(toggleCompanyFilter("ADV", "ADV"), "ALL");
});
