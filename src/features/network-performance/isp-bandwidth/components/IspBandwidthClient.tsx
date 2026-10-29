"use client";

import { useState } from "react";
import { TooltipLayerProvider } from "@/features/network-performance/context/TooltipLayer";
import {
  NetworkDataProvider,
  type NetworkDataProps,
} from "@/features/network-performance/context/NetworkDataContext";
import IspView from "@/features/network-performance/components/views/IspView";
import CostBudgetTab from "./CostBudgetTab";

export default function IspBandwidthClient(props: NetworkDataProps) {
  const [activeTab, setActiveTab] = useState<"unit" | "cost">("unit");

  return (
    <NetworkDataProvider {...props}>
      <TooltipLayerProvider>
        <div className="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-x-hidden font-sans">
          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              gap: "28px",
              borderBottom: "1px solid var(--border-default)",
              marginBottom: "-4px",
            }}
          >
            <button
              onClick={() => setActiveTab("unit")}
              style={{
                position: "relative",
                height: "38px",
                padding: "0 4px",
                border: "none",
                background: "none",
                fontFamily: "var(--font-body)",
                fontSize: "13.5px",
                cursor: "pointer",
                fontWeight: activeTab === "unit" ? 700 : 600,
                color:
                  activeTab === "unit" ? "var(--accent)" : "var(--text-muted)",
                transition: "color .15s ease",
              }}
            >
              Unit & Network
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: "-1px",
                  height: "2px",
                  borderRadius: "2px",
                  background:
                    activeTab === "unit" ? "var(--accent)" : "transparent",
                  transition: "background .15s ease",
                }}
              />
            </button>

            <button
              onClick={() => setActiveTab("cost")}
              style={{
                position: "relative",
                height: "38px",
                padding: "0 4px",
                border: "none",
                background: "none",
                fontFamily: "var(--font-body)",
                fontSize: "13.5px",
                cursor: "pointer",
                fontWeight: activeTab === "cost" ? 700 : 600,
                color:
                  activeTab === "cost" ? "var(--accent)" : "var(--text-muted)",
                transition: "color .15s ease",
              }}
            >
              Cost & Budget
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: "-1px",
                  height: "2px",
                  borderRadius: "2px",
                  background:
                    activeTab === "cost" ? "var(--accent)" : "transparent",
                  transition: "background .15s ease",
                }}
              />
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "unit" ? <IspView /> : <CostBudgetTab />}
        </div>
      </TooltipLayerProvider>
    </NetworkDataProvider>
  );
}

export { IspBandwidthClient };
