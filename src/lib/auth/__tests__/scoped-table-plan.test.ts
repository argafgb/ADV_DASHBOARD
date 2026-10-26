import assert from "node:assert/strict";
import { test } from "node:test";
import { DENIED_SCOPE, parseDataScope, type DataScope } from "../data-scope";
import { resolveSiteAccess } from "../site-access";
import { planTableFilter, TABLE_SITE_DIMENSION, type ScopedTableName } from "../scoped-table-plan";

const TABLES = Object.keys(TABLE_SITE_DIMENSION) as ScopedTableName[];
const SITE_TABLES = TABLES.filter((t) => TABLE_SITE_DIMENSION[t] !== null);
const SITELESS_TABLES = TABLES.filter((t) => TABLE_SITE_DIMENSION[t] === null);

const branchScope = (branches: string[], departments: string[] | null = null): DataScope =>
  parseDataScope({ all: false, departments, branches });

test("full scope reads every table unfiltered", () => {
  for (const table of TABLES) {
    assert.deepEqual(planTableFilter(table, { all: true }), { kind: "all" }, table);
  }
});

test("denied scope reads no rows from any table", () => {
  for (const table of TABLES) {
    assert.deepEqual(planTableFilter(table, DENIED_SCOPE), { kind: "none" }, table);
  }
});

test("branch scope filters every site table on its own site column", () => {
  const scope = branchScope(["JAMBI"]);
  for (const table of SITE_TABLES) {
    assert.deepEqual(
      planTableFilter(table, scope),
      { kind: "sites", dimension: TABLE_SITE_DIMENSION[table], sites: ["JAMBI"] },
      table,
    );
  }
});

test("branch scope never sees datasets without a site dimension", () => {
  const scope = branchScope(["JAMBI"]);
  for (const table of SITELESS_TABLES) {
    assert.deepEqual(planTableFilter(table, scope), { kind: "none" }, table);
  }
});

test("department + branch scope is enforced by branch only (department ignored in PM)", () => {
  const scope = branchScope(["JAMBI", "BATAM"], ["IT Support"]);
  assert.deepEqual(resolveSiteAccess(scope), { kind: "sites", sites: ["BATAM", "JAMBI"] });
  assert.deepEqual(planTableFilter("pm_asset_it_summary", scope), {
    kind: "sites",
    dimension: "site",
    sites: ["BATAM", "JAMBI"],
  });
});

test("department-only scope is denied because PM cannot bound it by branch", () => {
  const scope = parseDataScope({ all: false, departments: ["IT Support"], branches: null });
  assert.deepEqual(resolveSiteAccess(scope), { kind: "deny" });
  for (const table of TABLES) {
    assert.deepEqual(planTableFilter(table, scope), { kind: "none" }, table);
  }
});

test("empty or blank branch list is denied", () => {
  assert.deepEqual(planTableFilter("pm_asset_it_summary", branchScope([])), { kind: "none" });
  assert.deepEqual(planTableFilter("pm_asset_it_summary", { all: false, departments: null, branches: ["  "] }), {
    kind: "none",
  });
});

test("JAKARTA, CIDENG and JAKARTA-CIDENG all grant the same Jakarta-Cideng site", () => {
  const expected = ["CIDENG", "JAKARTA", "JAKARTA - CIDENG", "JAKARTA CIDENG", "JAKARTA-CIDENG"];
  for (const branch of ["JAKARTA-CIDENG", "JAKARTA", "CIDENG", "Jakarta - Cideng"]) {
    assert.deepEqual(resolveSiteAccess(branchScope([branch])), { kind: "sites", sites: expected }, branch);
  }
  // Neighbouring Jakarta sites are separate grants.
  const ampasit = resolveSiteAccess(branchScope(["JAKARTA-CIDENG"]));
  assert.ok(ampasit.kind === "sites" && !ampasit.sites.includes("AMPASIT"));
  assert.ok(ampasit.kind === "sites" && !ampasit.sites.includes("IT"));
});

test("restricted sites never include branches outside the grant", () => {
  const plan = planTableFilter("pm_asset_it_summary", branchScope(["WIRA CARITA"]));
  assert.equal(plan.kind, "sites");
  if (plan.kind !== "sites") return;
  for (const site of plan.sites) {
    assert.ok(["WIRA CARITA", "WIRA CERITA", "WIRACARITA"].includes(site), site);
  }
});
