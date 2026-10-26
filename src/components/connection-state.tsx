"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { DASHBOARD_CONFIG } from "@/lib/dashboard-config";

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
        background: "#e4e4e7",
        animation: "ds-pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function SkeletonGrid({
  children,
  minWidth = 220,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit,minmax(min(100%,${minWidth}px),1fr))`,
        gap: 16,
      }}
    >
      {children}
    </div>
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
        border: "1px solid #e4e4e7",
        borderRadius: 12,
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
    <div style={{ width, height, borderRadius: 6, background: "#d4d4d8" }} />
  );
}
function KpiSkeleton() {
  return (
    <CardSkeleton height={120}>
      <Line width="45%" />
      <div style={{ marginTop: 18 }}>
        <Line width="28%" height={28} />
      </div>
      <div style={{ marginTop: 12 }}>
        <Line width="70%" />
      </div>
    </CardSkeleton>
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
          borderLeft: "1px solid #d4d4d8",
          borderBottom: "1px solid #d4d4d8",
          backgroundImage: "linear-gradient(#f4f4f5 1px,transparent 1px)",
          backgroundSize: "100% 25%",
        }}
      >
        {Array.from({ length: bars ? 12 : 8 }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${28 + ((i * 19) % 68)}%`,
              borderRadius: "5px 5px 0 0",
              background: "#d4d4d8",
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
          margin: "28px auto 18px",
          width: 140,
          height: 140,
          border: "25px solid #d4d4d8",
          borderRadius: "50%",
        }}
      />
      <SkeletonGrid minWidth={80}>
        {[0, 1, 2].map((i) => (
          <Line key={i} width="100%" />
        ))}
      </SkeletonGrid>
    </CardSkeleton>
  );
}
function ListSkeleton({
  height = 300,
  rows = 7,
}: {
  height?: number;
  rows?: number;
}) {
  return (
    <CardSkeleton height={height}>
      <Line width="42%" height={14} />
      <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(70px,120px) 1fr 30px",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Line width="100%" />
            <Line width={`${55 + ((i * 9) % 45)}%`} height={12} />
            <Line width="100%" />
          </div>
        ))}
      </div>
    </CardSkeleton>
  );
}
function FiltersSkeleton({ count = 4 }: { count?: number }) {
  return (
    <CardSkeleton>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === 0 ? 190 : 110,
              maxWidth: "100%",
              height: 34,
              borderRadius: 8,
              background: "#d4d4d8",
            }}
          />
        ))}
      </div>
    </CardSkeleton>
  );
}
function TableSkeleton({
  height = 480,
  columns = 6,
  rows = 8,
}: {
  height?: number;
  columns?: number;
  rows?: number;
}) {
  return (
    <CardSkeleton height={height}>
      <Line width="35%" height={14} />
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
            background: "#f4f4f5",
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
              borderTop: "1px solid #f4f4f5",
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

function PmOverviewSkeleton() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SkeletonGrid minWidth={320}>
        <SkeletonGrid minWidth={145}>
          {[0, 1, 2, 3].map((i) => (
            <KpiSkeleton key={i} />
          ))}
        </SkeletonGrid>
        <ChartSkeleton height={256} bars />
      </SkeletonGrid>
      <FiltersSkeleton count={5} />
      <SkeletonGrid minWidth={220}>
        {[0, 1, 2].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </SkeletonGrid>
      <SkeletonGrid minWidth={320}>
        <DonutSkeleton />
        <DonutSkeleton />
      </SkeletonGrid>
      <SkeletonGrid minWidth={300}>
        <DonutSkeleton />
        <ChartSkeleton height={300} bars />
      </SkeletonGrid>
      <SkeletonGrid minWidth={320}>
        <ListSkeleton height={280} />
        <DonutSkeleton height={280} />
      </SkeletonGrid>
      <ListSkeleton height={360} rows={8} />
    </div>
  );
}
function PmAssetDistributionSkeleton() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SkeletonGrid minWidth={320}>
        <ListSkeleton height={700} rows={14} />
        <div style={{ display: "grid", gap: 16 }}>
          <ListSkeleton height={220} rows={4} />
          <ListSkeleton height={220} rows={4} />
          <ListSkeleton height={220} rows={4} />
        </div>
      </SkeletonGrid>
      <FiltersSkeleton count={2} />
      <TableSkeleton height={500} columns={7} rows={8} />
    </div>
  );
}
function PmComparisonSkeleton() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ChartSkeleton height={340} bars />
      <FiltersSkeleton count={3} />
      <ChartSkeleton height={380} bars />
      <SkeletonGrid minWidth={320}>
        <ListSkeleton height={340} rows={7} />
        <ListSkeleton height={340} rows={7} />
      </SkeletonGrid>
    </div>
  );
}
function PmCostMaintenanceSkeleton() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SkeletonGrid minWidth={300}>
        <DonutSkeleton height={380} />
        <ChartSkeleton height={380} bars />
      </SkeletonGrid>
      <FiltersSkeleton count={2} />
      <TableSkeleton height={520} columns={6} rows={9} />
      <ChartSkeleton height={360} bars />
    </div>
  );
}
function PmFindingLifecycleSkeleton() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SkeletonGrid minWidth={320}>
        <ListSkeleton height={300} />
        <ChartSkeleton height={300} bars />
      </SkeletonGrid>
      <SkeletonGrid minWidth={320}>
        <DonutSkeleton height={300} />
        <DonutSkeleton height={300} />
      </SkeletonGrid>
      <ChartSkeleton height={320} bars />
      <ListSkeleton height={360} rows={8} />
      <FiltersSkeleton count={2} />
      <TableSkeleton height={520} columns={7} rows={8} />
    </div>
  );
}
function DashboardContentSkeleton({ pathname }: { pathname: string }) {
  switch (pathname) {
    case "/dashboard/asset-maintenance/asset-distribution":
    case "/dashboard/asset-distribution":
      return <PmAssetDistributionSkeleton />;
    case "/dashboard/asset-maintenance/comparison":
    case "/dashboard/comparison":
      return <PmComparisonSkeleton />;
    case "/dashboard/asset-maintenance/cost-maintenance-budget":
    case "/dashboard/cost-maintenance-budget":
      return <PmCostMaintenanceSkeleton />;
    case "/dashboard/asset-maintenance/finding-asset-lifecycle":
    case "/dashboard/finding-asset-lifecycle":
      return <PmFindingLifecycleSkeleton />;
    case "/dashboard/asset-maintenance":
    case "/dashboard":
      return <PmOverviewSkeleton />;
  }
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
 * Layar saat sumber data tidak terjangkau - port dashboard belum menyala,
 * database menolak koneksi, atau permintaan gagal di tengah jalan. Pesan
 * ditulis netral dan selalu menawarkan satu aksi: muat ulang.
 */
export function DataUnavailableScreen({
  message,
  onRetry,
  detail,
  embedded,
}: {
  message?: string;
  onRetry?: () => void;
  detail?: string;
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
      {detail ? (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 10,
            color: "#9ca3af",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Error ID: {detail}
        </p>
      ) : null}
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
