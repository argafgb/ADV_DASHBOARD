"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

/** Data tooltip — struktur persis sumber (tipEnter di app_logic.js). */
export interface TipData {
  title: string;
  primary: string;
  secondary?: string | null;
  meta?: string | null;
  tone?: string;
}

export type RingShape = "dot" | "rect" | "none";

interface TooltipApi {
  tipEnter: (
    e: React.MouseEvent | MouseEvent,
    d: TipData,
    shape: RingShape,
    anchorEl?: Element | null,
  ) => void;
  tipMove: (e: React.MouseEvent | MouseEvent) => void;
  tipLeave: () => void;
}

const TooltipContext = createContext<TooltipApi | null>(null);

/** Warna aksen tooltip per tone — persis tipTone() sumber. */
export function tipTone(t?: string): string {
  return (
    (
      {
        green: "#059669",
        amber: "#D97706",
        red: "#DC2626",
        blue: "#2563EB",
        gray: "#9CA3AF",
      } as Record<string, string>
    )[t ?? ""] || "#9CA3AF"
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Provider tooltip + focus ring — port ensureTip/tipEnter/tipMove/tipLeave/
 * ringOn/ringOff dari sumber. Node tooltip dimanipulasi imperatif (bukan
 * state React) agar mousemove tidak memicu re-render, sama seperti sumber.
 * Koordinat relatif terhadap container provider (scale = 1, tanpa stage 1440).
 */
export function TooltipLayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const tailRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  const ringOff = useCallback(() => {
    if (ringRef.current) ringRef.current.style.opacity = "0";
  }, []);

  const ringOn = useCallback(
    (el: Element | null, tone: string, shape: RingShape) => {
      const ring = ringRef.current;
      if (!ring) return;
      if (shape === "none" || !el) {
        ringOff();
        return;
      }
      const stage = stageRef.current;
      if (!stage) return;
      const sr = stage.getBoundingClientRect();
      let tr: DOMRect;
      try {
        tr = el.getBoundingClientRect();
      } catch {
        ringOff();
        return;
      }
      ring.style.left = tr.left - sr.left + "px";
      ring.style.top = tr.top - sr.top + "px";
      ring.style.width = tr.width + "px";
      ring.style.height = tr.height + "px";
      ring.style.borderRadius = shape === "dot" ? "50%" : "5px";
      ring.style.boxShadow = "0 0 0 2px #fff, 0 0 0 4px " + tone;
      ring.style.opacity = "1";
    },
    [ringOff],
  );

  const tipMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    const tip = tipRef.current;
    if (!tip || tip.style.opacity === "0") return;
    const stage = stageRef.current;
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    const px = e.clientX - sr.left;
    const py = e.clientY - sr.top;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let x = px + 14;
    let y = py + 14;
    let flip = false;
    if (x + tw > sr.width - 8) {
      x = px - 14 - tw;
      flip = true;
    }
    if (
      (typeof window !== "undefined" && e.clientY + th + 24 > window.innerHeight) ||
      y + th > sr.height - 8
    ) {
      y = py - th - 12;
    }
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
    const tail = tailRef.current;
    if (tail) {
      if (flip) {
        tail.style.left = "auto";
        tail.style.right = "-5px";
      } else {
        tail.style.right = "auto";
        tail.style.left = "-5px";
      }
    }
  }, []);

  const tipEnter = useCallback(
    (
      e: React.MouseEvent | MouseEvent,
      d: TipData,
      shape: RingShape,
      anchorEl?: Element | null,
    ) => {
      const tip = tipRef.current;
      const body = bodyRef.current;
      if (!tip || !body) return;
      const tone = tipTone(d.tone);
      let html =
        '<div style="font-size:11.5px;font-weight:600;color:#374151;margin-bottom:4px">' +
        escapeHtml(d.title) +
        "</div>";
      html +=
        '<div style="display:flex;align-items:baseline;flex-wrap:wrap;gap:6px;font-size:11.5px;font-variant-numeric:tabular-nums;word-break:break-word">';
      html +=
        '<span style="width:8px;height:8px;border-radius:50%;flex:none;background:' +
        tone +
        ';align-self:center"></span>';
      html +=
        '<span style="font-weight:600;color:#111827">' +
        escapeHtml(d.primary) +
        "</span>";
      if (d.secondary) {
        html +=
          '<span style="opacity:0.6;margin:0 2px">:</span><span style="font-weight:500;color:#4B5563">' +
          escapeHtml(d.secondary) +
          "</span>";
      }
      html += "</div>";
      if (d.meta) {
        html +=
          '<div style="font-size:10.5px;color:#64748B;margin-top:4px;line-height:1.4;word-break:break-word">' +
          escapeHtml(d.meta) +
          "</div>";
      }
      body.innerHTML = html;
      tip.style.opacity = "1";
      tip.style.transform = "scale(1)";
      const anchor =
        anchorEl ?? ((e as React.MouseEvent).currentTarget as Element | null);
      ringOn(anchor, tone, shape);
      tipMove(e);
    },
    [ringOn, tipMove],
  );

  const tipLeave = useCallback(() => {
    const tip = tipRef.current;
    if (tip) {
      tip.style.opacity = "0";
      tip.style.transform = "scale(.96)";
    }
    ringOff();
  }, [ringOff]);

  const api = useMemo(
    () => ({ tipEnter, tipMove, tipLeave }),
    [tipEnter, tipMove, tipLeave],
  );

  return (
    <TooltipContext.Provider value={api}>
      <div
        ref={stageRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {children}
        <div
          ref={ringRef}
          style={{
            position: "absolute",
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity .1s",
            zIndex: 70,
          }}
        />
        <div
          ref={tipRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
            transform: "scale(.96)",
            transformOrigin: "top left",
            transition:
              "opacity .12s cubic-bezier(.4,0,.2,1),transform .12s cubic-bezier(.4,0,.2,1)",
            zIndex: 80,
            width: "max-content",
            maxWidth: "min(320px, calc(100% - 16px))",
            boxSizing: "border-box",
            overflowWrap: "anywhere",
            background: "#fff",
            border: "1px solid #f1f3f7",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(17,24,39,.12)",
            padding: "8px 11px",
            fontFamily: "var(--font-body)",
          }}
        >
          <div ref={bodyRef} />
        </div>
      </div>
    </TooltipContext.Provider>
  );
}

/** Hook akses tooltip — dipakai semua chart, peta, tabel, dan KPI. */
export function useHoverTip(): TooltipApi {
  const ctx = useContext(TooltipContext);
  if (!ctx) {
    throw new Error("useHoverTip must be used within a TooltipLayerProvider");
  }
  return ctx;
}
