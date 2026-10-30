// ISP_COLORS lived here until the vendor palette moved to
// isp_vendors.color_hex, where a new vendor gets a colour by being seeded
// rather than by editing the app. See queries/isp.ts.

// Keyed on incident_categories.code — stable machine enum identifiers
// (e.g. "ISP_OUTAGE", "HUMAN_ERROR") so renaming display text in the database
// (name_id) never breaks the color palette mapping.
export const CAUSE_COLORS: Record<string, string> = {
  CABLING_ERROR: "#B45309",
  SWITCH_FAILURE: "#475569",
  AP_OFFLINE: "#10B981",
  ROUTER_FAILURE: "#059669",
  MISCONFIGURATION: "#1D4ED8",
  ISP_OUTAGE: "#DC2626",
  FIREWALL_ISSUE: "#8B5CF6",
  IP_CONFLICT: "#2563EB",
  WIFI_INTERFERENCE: "#0D9488",
  HUMAN_ERROR: "#D97706",
  LAN_LOOPING: "#F59E0B",
  POWER_OUTAGE: "#7C3AED",
  PERFORMANCE_DEGRADATION: "#0891B2",
  HARDWARE_FAILURE: "#1E3A8A",
  PLANNED_MAINTENANCE: "#9CA3AF",
  OTHER: "#6B7280",
};
