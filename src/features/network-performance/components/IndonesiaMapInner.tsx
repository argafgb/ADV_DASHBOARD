"use client";

import { useEffect, useRef, useState } from "react";
import { useHoverTip } from "../context/TooltipLayer";
import { toneColor } from "../services/slaService";
import type { MapPoint } from "../services/mapPoints";

/**
 * Intrinsic ratio of public/maps/indonesia-districts.svg (viewBox
 * "0 0 818.1 353.47"). The SVG uses preserveAspectRatio="xMidYMid meet", so a
 * container that is not this shape letterboxes it — with a fixed height the
 * map stopped growing at 440 x 1018 and sat centred in the middle of a wider
 * card. Driving the container from this ratio keeps it edge to edge.
 */
export const MAP_ASPECT = 818.1 / 353.47;

let svgCache: string | null = null;
let svgPromise: Promise<string> | null = null;
function loadSvg(): Promise<string> {
  if (svgCache) return Promise.resolve(svgCache);
  if (!svgPromise) {
    svgPromise = fetch("/maps/indonesia-districts.svg")
      .then((r) => r.text())
      .then((t) => {
        svgCache = t;
        return t;
      });
  }
  return svgPromise;
}

interface TipApi {
  tipEnter: (
    e: MouseEvent,
    d: MapPoint["tip"],
    shape: "dot" | "rect" | "none",
  ) => void;
  tipMove: (e: MouseEvent) => void;
  tipLeave: () => void;
}

/** Render peta + titik cabang — port renderMap() sumber. */
function renderMap(
  el: HTMLDivElement,
  svgText: string,
  points: MapPoint[],
  tip: TipApi,
  onPointClick?: (p: MapPoint) => void,
) {
  const NS = "http://www.w3.org/2000/svg";
  el.innerHTML = "";
  const holder = document.createElement("div");
  holder.style.cssText = "position:absolute;inset:0";
  holder.innerHTML = svgText;
  const svg = holder.querySelector("svg");
  if (!svg) return;
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.display = "block";
  // Style district paths directly (an SVG <style> would leak globally and
  // blank out every icon)
  svg.querySelectorAll("path").forEach((p) => {
    p.setAttribute("fill", "#EEF1F6");
    p.setAttribute("stroke", "#FFFFFF");
    p.setAttribute("stroke-width", ".28");
  });
  el.appendChild(holder);
  requestAnimationFrame(() => {
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / 818.1 || 1;
    const rUnits = Math.max(3, 5 / scale);
    // Spread key is the district id: mapPointsDowntime() already collapses
    // every incident at a branch into one point, so by the time points reach
    // here each branch is unique — the only remaining overlap is several
    // branches sharing one district polygon (e.g. Kota_Jakarta_Pusat holds
    // Cideng, Senen and Tanah Abang 5), which still needs spreading apart.
    const groupKey = (p: MapPoint) => p.district;
    const dupSeen: Record<string, number> = {};
    points.forEach((p) => {
      const k = groupKey(p);
      dupSeen[k] = (dupSeen[k] || 0) + 1;
    });
    const dupIdx: Record<string, number> = {};
    points.forEach((p) => {
      const path = svg.querySelector('[id="' + p.district + '"]');
      if (!path) return;
      let bb: DOMRect;
      try {
        bb = (path as SVGGraphicsElement).getBBox();
      } catch {
        return;
      }
      let cx = bb.x + bb.width / 2;
      let cy = bb.y + bb.height / 2;
      const k = groupKey(p);
      if (dupSeen[k] > 1) {
        dupIdx[k] = dupIdx[k] || 0;
        const n = dupSeen[k];
        const i = dupIdx[k]++;
        const ang = (i / n) * Math.PI * 2;
        // A bit more than the old 1.5x: grouped markers render as squares
        // (~2.2x rUnits wide) rather than the smaller circles this offset
        // was originally tuned for, so tight clusters need extra clearance.
        const off = rUnits * 1.9;
        cx += Math.cos(ang) * off;
        cy += Math.sin(ang) * off;
      }
      const count = p.incidentIds?.length ?? 0;
      const grouped = count > 1;
      // Grouped branches render as a square so they read as visually
      // distinct from single-incident circles at a glance, with the count
      // set directly inside the shape rather than a separate badge dot.
      const marker: SVGElement = grouped
        ? document.createElementNS(NS, "rect")
        : document.createElementNS(NS, "circle");
      if (grouped) {
        const side = rUnits * 2.2;
        marker.setAttribute("x", String(cx - side / 2));
        marker.setAttribute("y", String(cy - side / 2));
        marker.setAttribute("width", String(side));
        marker.setAttribute("height", String(side));
        marker.setAttribute("rx", String(side * 0.18));
      } else {
        marker.setAttribute("cx", String(cx));
        marker.setAttribute("cy", String(cy));
        marker.setAttribute("r", String(rUnits));
      }
      marker.setAttribute("fill", toneColor(p.tone));
      marker.setAttribute("stroke", "#fff");
      marker.setAttribute(
        "stroke-width",
        String(rUnits * (grouped ? 0.22 : 0.3)),
      );
      if (p.dim) marker.setAttribute("opacity", "0.18");
      marker.style.cursor = "pointer";
      marker.addEventListener("mouseenter", (ev) => {
        tip.tipEnter(ev as MouseEvent, p.tip, "dot");
      });
      marker.addEventListener("mousemove", (ev) => {
        tip.tipMove(ev as MouseEvent);
      });
      marker.addEventListener("mouseleave", () => {
        tip.tipLeave();
      });
      if (onPointClick && p.incidentIds?.length) {
        marker.addEventListener("click", () => onPointClick(p));
      }
      svg.appendChild(marker);

      if (grouped) {
        const label = document.createElementNS(NS, "text");
        label.setAttribute("x", String(cx));
        label.setAttribute("y", String(cy));
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "central");
        label.setAttribute("font-size", String(rUnits * 1.3));
        label.setAttribute("font-weight", "700");
        label.setAttribute("fill", "#fff");
        label.style.pointerEvents = "none";
        if (p.dim) label.setAttribute("opacity", "0.18");
        label.textContent = String(count);
        svg.appendChild(label);
      }
    });
  });
}

export default function IndonesiaMapInner({
  points,
  minHeight,
  sig,
  onPointClick,
}: {
  points: MapPoint[];
  /** floor for very narrow columns; height otherwise follows MAP_ASPECT */
  minHeight: number;
  /** Signature re-render: view|tahun|bulan|scope|mapRegion|dtCause|len (sumber). */
  sig: string;
  onPointClick?: (p: MapPoint) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { tipEnter, tipMove, tipLeave } = useHoverTip();
  const [svgText, setSvgText] = useState<string | null>(svgCache);

  useEffect(() => {
    let alive = true;
    loadSvg()
      .then((t) => {
        if (alive && t !== svgText) setSvgText(t);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !svgText) return;
    if (el.dataset.sig === sig) return; // guard dataset.sig — persis sumber
    el.dataset.sig = sig;
    renderMap(
      el,
      svgText,
      points,
      { tipEnter, tipMove, tipLeave },
      onPointClick,
    );
  }, [svgText, sig, points, tipEnter, tipMove, tipLeave, onPointClick]);

  // Marker radius is derived from the rendered width (rUnits = 5 / scale) and
  // measured once, so without this the dots keep the size they had at first
  // paint. Now that the map grows with its container, a resize is visible.
  useEffect(() => {
    const el = ref.current;
    if (!el || !svgText || typeof ResizeObserver === "undefined") return;
    let lastWidth = el.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (w === 0 || Math.abs(w - lastWidth) < 8) return; // ignore jitter
      lastWidth = w;
      renderMap(
        el,
        svgText,
        points,
        { tipEnter, tipMove, tipLeave },
        onPointClick,
      );
      el.dataset.sig = sig;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [svgText, sig, points, tipEnter, tipMove, tipLeave, onPointClick]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: String(MAP_ASPECT),
        minHeight:
          "min(" + minHeight + "px, calc((100vw - 64px) / " + MAP_ASPECT + "))",
      }}
    >
      {!svgText && (
        <div
          role="status"
          aria-label="Loading map"
          className="animate-pulse"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 40,
            background:
              "linear-gradient(145deg, transparent 15%, #e5e7eb 15% 28%, transparent 28% 36%, #d1d5db 36% 63%, transparent 63% 70%, #e5e7eb 70% 84%, transparent 84%)",
          }}
        />
      )}
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
