import assert from "node:assert/strict";
import { test } from "node:test";

import { getMenuList } from "../../menu-list";
import {
  canViewAssetPmMenu,
  firstAllowedAssetPmPath,
  menuPermissionForPath,
} from "../menu-access";

test("an explicit empty permission list hides every PM Asset menu", () => {
  assert.deepEqual(getMenuList("/dashboard", "management", []), []);
  assert.equal(canViewAssetPmMenu("/dashboard/comparison", []), false);
});

test("managed users see only allowed menus, including nested routes", () => {
  const permissions = ["menu.asset-pm.comparison.view"];
  assert.deepEqual(
    getMenuList("/dashboard/comparison", "management", permissions).map((menu) => menu.href),
    ["/dashboard/comparison"],
  );
  assert.equal(menuPermissionForPath("/dashboard/comparison/detail"), permissions[0]);
  assert.equal(firstAllowedAssetPmPath(permissions), "/dashboard/comparison");
  assert.equal(canViewAssetPmMenu("/dashboard/device-requests", permissions), false);
});

test("legacy sessions retain role-based menu access", () => {
  assert.equal(getMenuList("/dashboard", "management").length, 8);
});
