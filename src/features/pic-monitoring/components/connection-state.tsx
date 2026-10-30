"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { DASHBOARD_CONFIG } from "../utils/dashboard-config";

/**
 * Layar status koneksi & rute yang dipakai seluruh dashboard.
 *
 * File ini sengaja identik di semua repo dan sengaja tidak memakai satu pun
 * design token milik dashboard tertentu: seluruh warna, radius, dan animasi
 * ditulis inline. Alasannya, layar ini justru muncul saat data, tema, atau
 * halaman gagal dimuat - bergantung pada token repo bikin layar error ikut
 * rusak persis ketika ia paling dibutuhkan.
 */

const BRAND = "#2563eb";
const BRAND_DARK = "#1d4ed8";
const PAGE_BG = "#f5f6fa";

const KEYFRAMES = `
@keyframes ds-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes ds-spin { to { transform: rotate(360deg); } }
@keyframes ds-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.85; } }
@keyframes ds-orb {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.22; }
  50% { transform: translate(-50%, -50%) scale(1.14); opacity: 0.34; }
}
@keyframes ds-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes ds-glitch {
  0%, 100% { text-shadow: 2px 0 ${BRAND}, -2px 0 ${BRAND_DARK}; transform: none; }
  20% { text-shadow: -3px 2px ${BRAND}, 3px -1px ${BRAND_DARK}; transform: translate(-2px, 1px); }
  40% { text-shadow: 3px -2px ${BRAND}, -2px 2px ${BRAND_DARK}; transform: translate(1px, -1px); }
  60% { text-shadow: -1px 2px ${BRAND}, 2px -2px ${BRAND_DARK}; transform: translate(2px, 1px); }
  80% { text-shadow: 2px -1px ${BRAND}, -3px 1px ${BRAND_DARK}; transform: translate(-1px, -1px); }
}
@keyframes ds-cable-left { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes ds-cable-right { 0%, 100% { transform: rotate(3deg); } 50% { transform: rotate(-3deg); } }
@keyframes ds-spark { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
@keyframes ds-float-a { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(-8deg); } }
@keyframes ds-float-b { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-22px) rotate(4deg); } }
@media (prefers-reduced-motion: reduce) {
  .ds-motion, .ds-motion * { animation: none !important; }
}
`;

/**
 * `embedded` dipakai saat layar dirender di dalam shell dashboard (sidebar dan
 * navbar sudah tampil), misalnya lewat `loading.tsx` atau `error.tsx` pada
 * segmen /dashboard. Tanpa ini layar setinggi 100vh bikin halaman punya dua
 * scrollbar dan latar solidnya menabrak latar shell.
 */
function screenStyleFor(embedded: boolean): CSSProperties {
  return {
    position: "relative",
    display: "flex",
    minHeight: embedded ? "60vh" : "100vh",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 24,
    background: embedded ? "transparent" : PAGE_BG,
    // Nama font ditulis langsung, bukan token. Bila Plus Jakarta Sans gagal
    // dimuat, layar tetap terbaca dengan font sistem di belakangnya.
    fontFamily:
      '"Plus Jakarta Sans", "Plus Jakarta Sans Fallback", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };
}

const cardStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  width: "100%",
  maxWidth: 520,
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: "52px 44px",
  textAlign: "center",
  boxShadow:
    "0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -12px rgba(37,99,235,0.18)",
  animation: "ds-enter 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
};

const headingStyle: CSSProperties = {
  margin: "20px 0 0",
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: "-0.01em",
  color: "#111827",
};

const bodyStyle: CSSProperties = {
  margin: "6px 0 0",
  maxWidth: 390,
  fontSize: 14,
  lineHeight: 1.6,
  color: "#6b7280",
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  marginTop: 24,
  borderRadius: 10,
  border: "none",
  padding: "12px 24px",
  fontSize: 13,
  fontWeight: 700,
  color: "#ffffff",
  cursor: "pointer",
  background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
  boxShadow: "0 4px 14px -2px rgba(37,99,235,0.4)",
  textDecoration: "none",
};

function Styles() {
  return <style>{KEYFRAMES}</style>;
}

function Orbs() {
  const orb = (
    top: string | undefined,
    left: string | undefined,
    size: number,
    alpha: number,
    duration: string,
  ): CSSProperties => ({
    position: "absolute",
    top,
    left,
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle, rgba(37,99,235,${alpha}) 0%, transparent 70%)`,
    filter: "blur(80px)",
    transform: "translate(-50%, -50%)",
    animation: `ds-orb ${duration} ease-in-out infinite`,
    pointerEvents: "none",
  });

  return (
    <div aria-hidden className="ds-motion">
      <div style={orb("18%", "22%", 500, 0.2, "8s")} />
      <div style={orb("82%", "78%", 450, 0.18, "10s")} />
      <div style={orb("60%", "65%", 350, 0.14, "12s")} />
    </div>
  );
}

function WarningMark() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        height: 48,
        width: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "#fffbeb",
        color: "#d97706",
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  );
}

function RetryIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function Screen({
  children,
  embedded = false,
}: {
  children: ReactNode;
  embedded?: boolean;
}) {
  return (
    <div style={screenStyleFor(embedded)}>
      <Styles />
      <Orbs />
      <section style={cardStyle} role="status" aria-live="polite">
        {children}
      </section>
    </div>
  );
}

function SkeletonBlock({ height = 96 }: { height?: number }) {
  return (
    <div
      aria-hidden
      className="ds-motion"
      style={{
        height,
        borderRadius: 12,
        background: "#e9edf3",
        animation: "ds-pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function CardSkeleton({
  children,
  height,
}: {
  children: ReactNode;
  height?: number;
}) {
  return (
    <div
      className="ds-motion"
      style={{
        minWidth: 0,
        height,
        padding: 18,
        border: "1px solid #e2e6ec",
        borderRadius: 16,
        background: "#fff",
        animation: "ds-pulse 1.4s ease-in-out infinite",
      }}
    >
      {children}
    </div>
  );
}
function Line({
  width = "45%",
  height = 10,
}: {
  width?: string;
  height?: number;
}) {
  return (
    <div style={{ width, height, borderRadius: 6, background: "#dfe4eb" }} />
  );
}
function ChartSkeleton({
  height = 300,
  bars = false,
}: {
  height?: number;
  bars?: boolean;
}) {
  return (
    <CardSkeleton height={height}>
      <Line width="38%" height={14} />
      <Line width="55%" height={8} />
      <div
        style={{
          height: height - 90,
          marginTop: 20,
          display: "flex",
          alignItems: "end",
          gap: 8,
          borderLeft: "1px solid #dfe4eb",
          borderBottom: "1px solid #dfe4eb",
          backgroundImage: "linear-gradient(#eef1f5 1px,transparent 1px)",
          backgroundSize: "100% 25%",
        }}
      >
        {Array.from({ length: bars ? 10 : 7 }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${28 + ((i * 19) % 68)}%`,
              borderRadius: "5px 5px 0 0",
              background: "#d8dee7",
            }}
          />
        ))}
      </div>
    </CardSkeleton>
  );
}
function DonutSkeleton({ height = 300 }: { height?: number }) {
  return (
    <CardSkeleton height={height}>
      <Line width="42%" height={14} />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          marginTop: 30,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            border: "25px solid #dfe4eb",
            borderRadius: "50%",
          }}
        />
        <div style={{ minWidth: 130, display: "grid", gap: 14 }}>
          {[0, 1, 2, 3].map((i) => (
            <Line key={i} width="100%" />
          ))}
        </div>
      </div>
    </CardSkeleton>
  );
}
function TableSkeleton({
  height = 480,
  columns = 6,
  rows = 7,
}: {
  height?: number;
  columns?: number;
  rows?: number;
}) {
  return (
    <CardSkeleton height={height}>
      <Line width="34%" height={14} />
      <div
        style={{
          marginTop: 18,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns},minmax(70px,1fr))`,
            gap: 10,
            padding: 12,
            background: "#eef1f5",
          }}
        >
          {Array.from({ length: columns }, (_, i) => (
            <Line key={i} width="75%" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns},minmax(70px,1fr))`,
              gap: 10,
              padding: 12,
              borderTop: "1px solid #eef1f5",
            }}
          >
            {Array.from({ length: columns }, (_, c) => (
              <Line key={c} width={`${55 + (((r + c) * 11) % 40)}%`} />
            ))}
          </div>
        ))}
      </div>
    </CardSkeleton>
  );
}

function PicOverviewSkeleton() {
  return (
    <div className="grid gap-6">
      {/* Executive summary heading */}
      <div className="flex min-h-11 items-end justify-between border-b border-zinc-200 pb-3">
        <div className="grid gap-2">
          <Line width="210px" height={13} />
          <Line width="300px" height={9} />
        </div>
        <Line width="120px" height={24} />
      </div>

      {/* Satisfaction panel + three summary metrics */}
      <div className="grid min-h-37 grid-cols-1 gap-5 rounded-2xl border border-zinc-200 bg-white p-5 md:grid-cols-[minmax(220px,1.15fr)_minmax(0,2.4fr)]">
        <div className="grid content-center gap-2 border-b border-zinc-100 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
          <Line width="145px" height={9} />
          <div className="flex items-end gap-2">
            <Line width="105px" height={38} />
            <Line width="28px" height={13} />
          </div>
          <Line width="112px" height={12} />
          <Line width="190px" height={8} />
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex min-h-25 flex-col justify-between rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3.5"
            >
              <Line width="48px" height={25} />
              <Line width={item === 1 ? "120px" : "105px"} height={9} />
            </div>
          ))}
        </div>
      </div>

      {/* Five operational KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex min-h-36 flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div className="grid gap-2">
                <Line width="75px" height={10} />
                <Line width="38px" height={31} />
              </div>
              <div className="h-10 w-10 rounded-xl bg-zinc-100" />
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 pt-3.5">
              <Line width="82px" height={8} />
              <Line width="42px" height={8} />
            </div>
          </div>
        ))}
      </div>

      {/* Milestone SLA card */}
      <div className="min-h-75 rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
        <div className="grid gap-2">
          <Line width="185px" height={14} />
          <Line width="460px" height={8} />
        </div>
        <div className="relative mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="absolute left-[10%] right-[10%] top-16 hidden border-b-2 border-dashed border-zinc-200 lg:block" />
          {[0, 1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="relative z-10 grid justify-items-center gap-2"
            >
              <div className="h-32 w-32 rounded-full border-12 border-zinc-200 bg-white" />
              <Line width="55px" height={11} />
              <Line width="75px" height={8} />
              <Line width="92px" height={8} />
            </div>
          ))}
        </div>
      </div>

      {/* Next visible dashboard section */}
      <ChartSkeleton height={360} bars />
    </div>
  );
}
function RouteHeaderSkeleton({ actions = 2 }: { actions?: number }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 md:flex-row md:items-center">
      <div className="grid gap-2">
        <Line width="245px" height={18} />
        <Line width="310px" height={9} />
      </div>
      {actions > 0 && (
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          {actions > 2 && <Line width="256px" height={36} />}
          {Array.from({ length: Math.min(actions, 2) }, (_, i) => (
            <Line key={i} width="38px" height={38} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Mirrors the `KpiCard` shell so the Kategori and SLA rows keep their height
 * when the skeleton is swapped for real data: same 190px floor, same 36px
 * header, and a footer pinned to the bottom by the divider.
 */
function CompactKpiSkeleton() {
  return (
    <div className="flex min-h-[190px] flex-col rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex h-9 shrink-0 items-center justify-between gap-2">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-zinc-100" />
        <div className="h-4.5 w-21 shrink-0 rounded-full bg-zinc-100" />
      </div>

      <div className="mt-4">
        <Line width="84px" height={30} />
      </div>

      <div className="mt-2">
        <Line width="120px" height={11} />
      </div>

      <div className="mt-auto border-t border-zinc-100 pt-2.5">
        <Line width="105px" height={10} />
        <div className="mt-1">
          <Line width="78px" height={10} />
        </div>
      </div>
    </div>
  );
}

function HorizontalBarsSkeleton({
  height = 300,
  rows = 6,
}: {
  height?: number;
  rows?: number;
}) {
  return (
    <CardSkeleton height={height}>
      <Line width="42%" height={14} />
      <Line width="58%" height={8} />
      <div className="mt-6 grid gap-4">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="grid grid-cols-[minmax(70px,130px)_1fr_30px] items-center gap-3"
          >
            <Line width="100%" />
            <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-300"
                style={{ width: `${45 + ((i * 13) % 50)}%` }}
              />
            </div>
            <Line width="100%" />
          </div>
        ))}
      </div>
    </CardSkeleton>
  );
}

function PipelineChipsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex min-h-18 items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
        >
          <div className="grid gap-2">
            <Line width="95px" height={9} />
            <Line width="42px" height={20} />
          </div>
          <div className="h-8 w-8 rounded-lg bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

function QueueSkeleton() {
  return (
    <CardSkeleton height={600}>
      <Line width="48%" height={14} />
      <Line width="72%" height={8} />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <SkeletonBlock key={i} height={62} />
        ))}
      </div>
      <div className="mt-5">
        <Line width="42%" height={9} />
      </div>
      <div className="mt-2 grid gap-0">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex h-11 items-center justify-between border-b border-zinc-100"
          >
            <Line width={`${48 + i * 6}%`} />
            <Line width="70px" height={20} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
        <Line width="72px" />
        <div className="flex gap-2">
          <Line width="64px" height={28} />
          <Line width="48px" height={28} />
        </div>
      </div>
    </CardSkeleton>
  );
}

function PicCategorySkeleton() {
  return (
    <div className="grid gap-6">
      <RouteHeaderSkeleton actions={3} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <CompactKpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HorizontalBarsSkeleton height={330} rows={5} />
        <DonutSkeleton height={330} />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HorizontalBarsSkeleton height={310} rows={5} />
        <HorizontalBarsSkeleton height={310} rows={8} />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HorizontalBarsSkeleton height={440} rows={10} />
        <TableSkeleton height={440} columns={5} rows={7} />
      </div>
    </div>
  );
}
function PicPipelinesSkeleton() {
  return (
    <div className="grid gap-6">
      <PipelineChipsSkeleton />
      <ChartSkeleton height={415} bars />
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <QueueSkeleton />
        </div>
        <div className="grid gap-5 lg:col-span-7">
          <ChartSkeleton height={285} bars />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <HorizontalBarsSkeleton height={295} rows={5} />
            <HorizontalBarsSkeleton height={295} rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
function PicProjectsSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4.5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <Line width="420px" height={40} />
          <div className="flex flex-wrap gap-2">
            <Line width="145px" height={40} />
            <Line width="88px" height={40} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="grid gap-2">
              <Line width="72px" height={8} />
              <Line width="100%" height={36} />
            </div>
          ))}
        </div>
      </div>
      <TableSkeleton height={690} columns={8} rows={10} />
    </div>
  );
}
function PicSlaSkeleton() {
  return (
    <div className="grid gap-6">
      <RouteHeaderSkeleton actions={2} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <CompactKpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HorizontalBarsSkeleton height={330} rows={5} />
        <DonutSkeleton height={330} />
      </div>
      <ChartSkeleton height={380} bars />
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="grid gap-2">
          <Line width="190px" />
          <Line width="330px" height={8} />
        </div>
        <div className="grid gap-2">
          <Line width="320px" height={36} />
          <Line width="140px" height={8} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TableSkeleton height={480} columns={5} rows={7} />
        <TableSkeleton height={480} columns={5} rows={5} />
      </div>
    </div>
  );
}
function PicSyncLogSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Line width="270px" height={22} />
        <Line width="320px" height={9} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid min-h-23 gap-2 rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <Line width="105px" height={8} />
            <div className="flex items-baseline gap-2">
              <Line width="72px" height={24} />
              <Line width="90px" height={9} />
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid gap-2 p-5">
          <Line width="150px" height={14} />
          <Line width="310px" height={8} />
        </div>
        <div className="flex justify-end border-y border-zinc-100 bg-zinc-50 p-4">
          <Line width="320px" height={40} />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-180">
            <TableSkeleton height={405} columns={4} rows={7} />
          </div>
        </div>
      </div>
    </div>
  );
}
function DashboardContentSkeleton({ pathname }: { pathname: string }) {
  switch (pathname) {
    case "/dashboard/kategori":
      return <PicCategorySkeleton />;
    case "/dashboard/pipelines":
      return <PicPipelinesSkeleton />;
    case "/dashboard/projects":
      return <PicProjectsSkeleton />;
    case "/dashboard/sla":
      return <PicSlaSkeleton />;
    case "/dashboard/sync-log":
      return <PicSyncLogSkeleton />;
    case "/dashboard":
    default:
      return <PicOverviewSkeleton />;
  }
}

export type PicRoute =
  "overview" | "kategori" | "pipelines" | "projects" | "sla" | "sync-log";

const PATHNAME_BY_ROUTE: Readonly<Record<PicRoute, string>> = {
  overview: "/dashboard",
  kategori: "/dashboard/kategori",
  pipelines: "/dashboard/pipelines",
  projects: "/dashboard/projects",
  sla: "/dashboard/sla",
  "sync-log": "/dashboard/sync-log",
};

/**
 * Skeleton satu rute, dipilih lewat prop dan bukan lewat `usePathname`.
 *
 * Dipakai sebagai fallback `<Suspense>` di dalam Server Component, yang tidak
 * bisa membaca pathname dari hook. Isinya skeleton yang sama persis dengan
 * yang dipakai `LoadingScreen`, jadi tampilannya tidak bercabang.
 */
export function PicPageSkeleton({ route }: { route: PicRoute }) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Memuat dashboard"
      style={{ width: "100%" }}
    >
      <Styles />
      <DashboardContentSkeleton pathname={PATHNAME_BY_ROUTE[route]} />
    </section>
  );
}

export function LoadingScreen({
  embedded = false,
}: {
  message?: string;
  embedded?: boolean;
}) {
  const pathname = usePathname();
  const content = (
    <section
      role="status"
      aria-live="polite"
      aria-label="Memuat dashboard"
      style={{ width: "100%" }}
    >
      <DashboardContentSkeleton pathname={pathname} />
    </section>
  );
  if (embedded)
    return (
      <div style={{ width: "100%", padding: "24px clamp(16px, 3vw, 32px)" }}>
        <Styles />
        {content}
      </div>
    );
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        background: "#f7f8fa",
      }}
    >
      <Styles />
      <aside
        style={{
          padding: 20,
          borderRight: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <SkeletonBlock height={32} />
        <div style={{ marginTop: 32, display: "grid", gap: 12 }}>
          {[0, 1, 2, 3, 4].map((item) => (
            <SkeletonBlock key={item} height={40} />
          ))}
        </div>
      </aside>
      <main style={{ minWidth: 0 }}>
        <div
          style={{
            height: 64,
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "#ffffff",
          }}
        >
          <SkeletonBlock height={32} />
        </div>
        <div style={{ padding: "24px clamp(16px, 3vw, 32px)" }}>{content}</div>
      </main>
    </div>
  );
}

/**
 * Layar saat sumber data tidak terjangkau atau permintaan gagal. Pesan
 * ditulis netral dan selalu menawarkan satu aksi: muat ulang.
 */
export function DataUnavailableScreen({
  message,
  onRetry,
  embedded,
}: {
  message?: string;
  onRetry?: () => void;
  embedded?: boolean;
}) {
  return (
    <Screen embedded={embedded}>
      <WarningMark />
      <h1 style={headingStyle}>Data belum dapat ditampilkan</h1>
      <p style={bodyStyle}>
        {message ??
          `Koneksi ke layanan data ${DASHBOARD_CONFIG.subtitle} belum tersedia.`}{" "}
        Kami akan mencoba menghubungkan kembali secara otomatis.
      </p>
      <button
        type="button"
        onClick={() => (onRetry ? onRetry() : window.location.reload())}
        style={buttonStyle}
      >
        <RetryIcon />
        Muat ulang
      </button>
      <p style={{ margin: "12px 0 0", fontSize: 10.5, color: "#9ca3af" }}>
        Jika masalah berlanjut, hubungi tim IT.
      </p>
    </Screen>
  );
}

function DisconnectedCable() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ilustrasi kabel terputus"
    >
      <g
        style={{
          transformOrigin: "80px 60px",
          animation: "ds-cable-left 3s ease-in-out infinite",
        }}
      >
        <path
          d="M10 60 Q 40 55, 70 58"
          stroke={BRAND}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect
          x="66"
          y="50"
          width="18"
          height="18"
          rx="4"
          fill={BRAND}
          opacity="0.9"
        />
        <rect x="68" y="54" width="4" height="3" rx="1" fill={PAGE_BG} />
        <rect x="68" y="60" width="4" height="3" rx="1" fill={PAGE_BG} />
      </g>
      <g
        style={{
          transformOrigin: "120px 60px",
          animation: "ds-cable-right 3s ease-in-out infinite",
        }}
      >
        <path
          d="M130 62 Q 160 65, 190 60"
          stroke={BRAND_DARK}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect
          x="116"
          y="52"
          width="18"
          height="18"
          rx="4"
          fill={BRAND_DARK}
          opacity="0.9"
        />
        <rect x="128" y="56" width="4" height="3" rx="1" fill={PAGE_BG} />
        <rect x="128" y="62" width="4" height="3" rx="1" fill={PAGE_BG} />
      </g>
      <g style={{ animation: "ds-spark 1.5s ease-in-out infinite" }}>
        <path
          d="M88 56 L92 60 L87 62 L93 67"
          stroke="#facc15"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g style={{ animation: "ds-spark 1.5s ease-in-out infinite 0.75s" }}>
        <path
          d="M98 53 L102 58 L97 60 L103 65"
          stroke="#fbbf24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g style={{ animation: "ds-float-a 5s ease-in-out infinite" }}>
        <rect
          x="20"
          y="20"
          width="22"
          height="28"
          rx="3"
          fill="#fff"
          stroke="#e5e7eb"
        />
        <path
          d="M25 27h12M25 32h9M25 37h11"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
      </g>
      <g style={{ animation: "ds-float-b 6s ease-in-out infinite" }}>
        <rect
          x="160"
          y="15"
          width="22"
          height="28"
          rx="3"
          fill="#fff"
          stroke="#e5e7eb"
          transform="rotate(8 171 29)"
        />
        <path
          d="M165 23h12M165 28h9"
          stroke="#d1d5db"
          strokeWidth="1.5"
          transform="rotate(8 171 29)"
        />
      </g>
    </svg>
  );
}

const numeralStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 140,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: "-0.06em",
};

/** Layar 404 - rute tidak dikenal, bukan kegagalan data. */
export function NotFoundScreen({
  homeHref = "/",
  embedded = false,
}: {
  homeHref?: string;
  embedded?: boolean;
}) {
  return (
    <div style={screenStyleFor(embedded)}>
      <Styles />
      <Orbs />
      <div
        className="ds-motion"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          width: "100%",
          maxWidth: 448,
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            animation: "ds-enter 800ms cubic-bezier(0.16,1,0.3,1) 100ms both",
          }}
        >
          <DisconnectedCable />
        </div>

        <div
          aria-hidden
          style={{
            position: "relative",
            margin: "8px 0 16px",
            userSelect: "none",
            animation: "ds-enter 800ms cubic-bezier(0.16,1,0.3,1) 250ms both",
          }}
        >
          <span style={{ ...numeralStyle, color: "rgba(37,99,235,0.04)" }}>
            404
          </span>
          <span
            style={{
              ...numeralStyle,
              color: "rgba(37,99,235,0.06)",
              mixBlendMode: "multiply",
              animation: "ds-glitch 4s ease-in-out infinite",
            }}
          >
            404
          </span>
          <span
            style={{
              ...numeralStyle,
              position: "relative",
              background: `linear-gradient(90deg, ${BRAND} 0%, ${BRAND_DARK} 25%, #60a5fa 50%, ${BRAND_DARK} 75%, ${BRAND} 100%)`,
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "ds-shimmer 3s linear infinite",
            }}
          >
            404
          </span>
        </div>

        <div
          style={{
            ...cardStyle,
            maxWidth: 448,
            animation: "ds-enter 800ms cubic-bezier(0.16,1,0.3,1) 400ms both",
          }}
        >
          <h1
            style={{
              ...headingStyle,
              marginTop: 0,
              fontSize: 24,
              letterSpacing: "-0.03em",
            }}
          >
            Halaman Tidak Ditemukan
          </h1>
          <p style={{ ...bodyStyle, fontSize: 13.5, maxWidth: 320 }}>
            Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
          <Link
            href={homeHref}
            style={{ ...buttonStyle, height: 44, padding: "0 24px" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M10 3 5 8l5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>

        <p
          style={{
            marginTop: 32,
            fontSize: 11,
            letterSpacing: "0.04em",
            color: "#9ca3af",
            animation: "ds-enter 800ms cubic-bezier(0.16,1,0.3,1) 550ms both",
          }}
        >
          ERROR 404 &middot; NOT FOUND
        </p>
      </div>
    </div>
  );
}
