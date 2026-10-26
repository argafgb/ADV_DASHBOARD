import type { AssetPurchasingData, PurchaseItem } from "../../types";
import { purchaseMonth } from "../purchaseMapper";

const units = (values: readonly number[]) =>
  Object.fromEntries(
    values.map((value, index) => [`2026-${index + 1}`, value]),
  );

const item = (
  name: string,
  category: PurchaseItem["category"],
  values: readonly number[],
): PurchaseItem => ({ name, category, unitsByPeriod: units(values) });

/** Static extraction retained exclusively as deterministic test input. */
export const PURCHASE_TEST_FIXTURE: AssetPurchasingData = {
  months: Array.from({ length: 7 }, (_, index) =>
    purchaseMonth(2026, index + 1),
  ),
  syncedAt: "2026-07-31T00:00:00.000Z",
  items: [
    item("Laptop", "Workstation", [29, 34, 24, 18, 70, 19, 30]),
    item("Mini PC", "Workstation", [0, 4, 5, 2, 0, 5, 0]),
    item("PC", "Workstation", [0, 0, 0, 0, 0, 0, 0]),
    item("Mouse", "Peripheral", [20, 60, 30, 20, 20, 40, 40]),
    item("Router", "Peripheral", [15, 11, 0, 0, 10, 1, 11]),
    item("SSD", "Peripheral", [25, 0, 1, 0, 0, 10, 0]),
    item("Printer", "Peripheral", [1, 2, 3, 1, 12, 3, 2]),
    item("Keyboard", "Peripheral", [1, 0, 0, 10, 0, 0, 0]),
    item("Paket Mouse + Keyboard", "Peripheral", [0, 0, 5, 0, 0, 0, 5]),
    item("Access Point", "Peripheral", [0, 8, 0, 0, 0, 0, 2]),
    item("DVD RW", "Peripheral", [0, 0, 0, 2, 4, 0, 1]),
    item("Switch", "Peripheral", [0, 6, 0, 0, 0, 0, 0]),
    item("Scanner", "Peripheral", [0, 0, 0, 0, 0, 0, 0]),
    item("RAM", "Peripheral", [0, 0, 0, 0, 0, 0, 0]),
  ],
};
