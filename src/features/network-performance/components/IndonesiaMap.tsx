"use client";

import { useSyncExternalStore } from "react";
import IndonesiaMapInner, { MAP_ASPECT } from "./IndonesiaMapInner";
import type { MapPoint } from "../services/mapPoints";

// Peta memakai getBBox() + requestAnimationFrame — wajib client-only.
// Catatan: next/dynamic ssr:false tidak pernah me-resume boundary-nya di
// Next 16.2 dengan cacheComponents:true (marker BAILOUT_TO_CLIENT_SIDE_
// RENDERING tertinggal), jadi gate client-only dilakukan eksplisit:
// server & first client paint merender placeholder ukuran sama, lalu
// IndonesiaMapInner mount hanya di client.
const emptySubscribe = () => () => {};

export default function IndonesiaMap(props: {
  points: MapPoint[];
  /** floor for very narrow columns; height otherwise follows the SVG ratio */
  minHeight: number;
  sig: string;
  onPointClick?: (p: MapPoint) => void;
}) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  if (!mounted) {
    // Same box as the mounted map, so swapping in the real one shifts nothing.
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: String(MAP_ASPECT),
          minHeight:
            "min(" +
            props.minHeight +
            "px, calc((100vw - 64px) / " +
            MAP_ASPECT +
            "))",
        }}
      />
    );
  }
  return <IndonesiaMapInner {...props} />;
}
