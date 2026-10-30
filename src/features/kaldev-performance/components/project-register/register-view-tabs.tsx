"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { IconBoard, IconTable } from "../shared/icons";
import { Tabs } from "../shared/tabs";

/** Toggle Kanban / Table di baris judul Project register (state di URL `view`). */
export function RegisterViewTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "table" ? "table" : "kanban";

  const hrefFor = (next: "kanban" | "table") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "kanban") params.delete("view");
    else params.set("view", "table");
    params.delete("page");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const icon = (node: React.ReactNode) => (
    <span style={{ display: "inline-flex", width: 15, height: 15, flex: "0 0 auto" }}>{node}</span>
  );

  return (
    <Tabs
      value={view}
      scrollable={false}
      style={{ marginLeft: "auto", borderBottom: 0 }}
      items={[
        {
          value: "kanban",
          href: hrefFor("kanban"),
          label: (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {icon(<IconBoard />)}Kanban
            </span>
          ),
        },
        {
          value: "table",
          href: hrefFor("table"),
          label: (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {icon(<IconTable />)}Table
            </span>
          ),
        },
      ]}
    />
  );
}
