/**
 * Device label formatting and normalization utilities.
 */

/**
 * Standardizes raw device type strings into canonical human-readable labels.
 */
export function formatDeviceLabel(device: string): string {
  if (!device) return "";
  const upper = device.toUpperCase().trim();
  if (upper === "MINIPC" || upper === "MINI PC") return "Mini PC";
  if (upper === "NOTEBOOK" || upper === "LAPTOP") return "NoteBook";
  if (upper === "PC" || upper === "DESKTOP") return "PC";
  if (upper === "PRINTER") return "Printer";
  if (upper === "SWITCH") return "Switch";
  if (upper === "ACCESS POINT" || upper === "AP") return "Access Point";
  if (upper === "SCANNER DOC" || upper === "SCAN DOC") return "Scanner Doc";
  if (upper === "SCANNER BARCODE" || upper === "SCAN BARCODE")
    return "Scanner Barcode";
  if (upper === "UPS") return "UPS";
  if (upper === "ROUTER") return "Router";
  if (upper === "REPEATER") return "Repeater";
  if (upper === "MODEM") return "Modem";
  return device;
}
