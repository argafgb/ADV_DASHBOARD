export type SystemKey = "dct" | "email" | "cencon" | "centran";

export const SYSTEM_KEYS: SystemKey[] = ["dct", "email", "cencon", "centran"];

export const SYSTEM_META: Record<
  SystemKey,
  { label: string; color: string; serviceIds: number[] }
> = {
  dct: { label: "DCT", color: "#2563EB", serviceIds: [2] },
  email: { label: "Email", color: "#3B82F6", serviceIds: [3] },
  cencon: { label: "Cencon", color: "#10B981", serviceIds: [10004] },
  centran: { label: "Centran", color: "#8B5CF6", serviceIds: [831746440722] },
};

export function mapServiceToKey(serviceId: number, serviceName?: string): SystemKey {
  if (serviceId === 2) return "dct";
  if (serviceId === 3) return "email";
  if (serviceId === 10004) return "cencon";
  if (serviceId === 831746440722) return "centran";

  if (serviceName) {
    const lower = serviceName.toLowerCase();
    if (lower.includes("dct")) return "dct";
    if (lower.includes("email")) return "email";
    if (lower.includes("cencon")) return "cencon";
    if (lower.includes("centran")) return "centran";
  }

  return "dct";
}
