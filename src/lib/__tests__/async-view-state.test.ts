import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesDetailIdentity,
  resolveViewData,
} from "../async-view-state";

test("resolveViewData follows initial data while the default view is active", () => {
  const initial = ["latest parent result"];
  const request = ["stale local result"];

  assert.equal(resolveViewData(true, initial, request, []), initial);
});

test("resolveViewData uses request data for a locally filtered view", () => {
  const initial = ["default result"];
  const request = ["filtered result"];

  assert.equal(resolveViewData(false, initial, request, []), request);
});

test("resolveViewData falls back while the selected request has no result", () => {
  const fallback: string[] = [];

  assert.equal(resolveViewData(false, ["default result"], null, fallback), fallback);
});

test("matchesDetailIdentity rejects a response for a previously selected cell", () => {
  const selected = {
    site: "Jakarta",
    region: "West",
    type: "Cabang",
    month: "Feb",
  };

  assert.equal(matchesDetailIdentity({ ...selected, month: "Jan" }, selected), false);
  assert.equal(matchesDetailIdentity(selected, selected), true);
  assert.equal(matchesDetailIdentity(null, selected), false);
});
