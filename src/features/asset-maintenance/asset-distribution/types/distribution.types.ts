/** A single device type with its unit count, shown in the expanded row. */
export interface InventoryDetailItem {
  label: string;
  value: number;
}

/** A device group (Workstation / Infrastructure / Peripheral) breakdown. */
export interface InventoryDetailGroup {
  label: string;
  items: InventoryDetailItem[];
}

/** One site row in the inventory detail table. */
export interface InventorySiteRow {
  no: number;
  site: string;
  type: string;
  workstation: number;
  infrastructure: number;
  peripheral: number;
  total: number;
  biaya: number;
  /** Per-device-type breakdown revealed when the row is expanded. */
  detail: InventoryDetailGroup[];
}

/** Paginated result payload for inventory table. */
export interface PaginatedInventoryResult {
  rows: InventorySiteRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}
