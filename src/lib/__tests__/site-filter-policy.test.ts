import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NO_SITE_VALUE,
  normalizeSiteSelection,
  siteOptionsForRole,
} from "../site-filter-policy";

const sites = [
  { value: "SOLO", label: "SOLO" },
  { value: "YOGYAKARTA", label: "YOGYAKARTA" },
];

test("regional heads and IT roles can select all sites", () => {
  for (const role of ["regional-head", "it-admin", "it-product"]) {
    const options = siteOptionsForRole(sites, role);
    assert.equal(options[0].value, "ALL");
    assert.equal(normalizeSiteSelection(null, options), "ALL");
    assert.equal(normalizeSiteSelection("SOLO", options), "SOLO");
  }
});

test("other roles cannot select all sites through the URL", () => {
  for (const role of ["staff", "branch-manager", "management", null]) {
    const options = siteOptionsForRole(sites, role);
    assert.deepEqual(options, sites);
    assert.equal(normalizeSiteSelection("ALL", options), "SOLO");
    assert.equal(normalizeSiteSelection(null, options), "SOLO");
    assert.equal(normalizeSiteSelection("OTHER", options), "SOLO");
  }
});

test("empty site list cannot turn into all-site access", () => {
  const options = siteOptionsForRole([], "staff");
  assert.equal(normalizeSiteSelection("ALL", options), NO_SITE_VALUE);
});
