import assert from "node:assert/strict";
import { test } from "node:test";
import { DENIED_SCOPE, parseDataScope, scopeKey } from "../data-scope";
import { resolveSiteAccess } from "../site-access";

test("missing and malformed JWT scope is denied", () => {
  assert.deepEqual(parseDataScope(undefined), DENIED_SCOPE);
  assert.deepEqual(parseDataScope({ all: false, branches: ["JAMBI"] }), DENIED_SCOPE);
  assert.deepEqual(parseDataScope({ all: false, departments: null, branches: null }), DENIED_SCOPE);
  assert.deepEqual(parseDataScope({ all: "true" }), DENIED_SCOPE);
});

test("branch scope is normalized and cache key does not depend on order", () => {
  const first = parseDataScope({ all: false, departments: null, branches: [" Jambi ", "BATAM"] });
  const second = parseDataScope({ all: false, departments: null, branches: ["BATAM", "JAMBI"] });
  assert.deepEqual(first, { all: false, departments: null, branches: ["JAMBI", "BATAM"] });
  assert.equal(scopeKey(first), scopeKey(second));
  assert.notEqual(scopeKey(first), scopeKey({ all: true }));
});

test("PM site access expands aliases and denies scopes it cannot enforce", () => {
  const access = resolveSiteAccess({ all: false, departments: null, branches: ["WIRA CARITA"] });
  assert.equal(access.kind, "sites");
  if (access.kind === "sites") assert.ok(access.sites.includes("WIRA CERITA"));

  const itAccess = resolveSiteAccess({ all: false, departments: null, branches: ["WSS"] });
  assert.deepEqual(itAccess, { kind: "sites", sites: ["WSS"] });

  assert.deepEqual(
    resolveSiteAccess({ all: false, departments: ["IT Support"], branches: ["JAMBI"] }),
    { kind: "sites", sites: ["JAMBI"] },
  );
  assert.deepEqual(
    resolveSiteAccess({ all: false, departments: ["IT Support"], branches: null }),
    { kind: "deny" },
  );
  assert.deepEqual(resolveSiteAccess({ all: false, departments: null, branches: [] }), { kind: "deny" });
});
