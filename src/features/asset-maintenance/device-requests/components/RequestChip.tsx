import { Router, Wifi, Network, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceRequestType } from "../types";
import { TYPE_META } from "../utils/deviceRequestsTransformer";

const ICONS: Record<DeviceRequestType, LucideIcon> = {
  router: Router,
  ap: Wifi,
  switch: Network,
};

const CHIP_STYLE: Record<DeviceRequestType, string> = {
  router: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  ap: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  switch: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

export default function RequestChip({
  type,
  value,
}: {
  type: DeviceRequestType;
  value?: number;
}) {
  const Icon = ICONS[type];
  return (
    <span
      title={TYPE_META[type].label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
        CHIP_STYLE[type],
      )}
    >
      <Icon size={12} />
      {value ?? TYPE_META[type].label}
    </span>
  );
}

export function RequestLegend() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(["router", "ap", "switch"] as const).map((t) => (
        <RequestChip key={t} type={t} />
      ))}
    </div>
  );
}
