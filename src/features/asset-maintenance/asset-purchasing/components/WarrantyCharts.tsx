"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Info,
  Laptop,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import EmptyState from "@/components/shared/EmptyState";
import { RechartsTip } from "@/components/chart-tooltip";
import { cn } from "@/lib/utils";
import type {
  AssetWarrantyData,
  InvalidWarrantySummary,
  WarrantyUrgentItem,
} from "../types/warranty.types";
import {
  WARRANTY_STATUS_COLORS,
  formatDaysRemaining,
} from "../utils/warrantyModel";

const RESIZE_DEBOUNCE_MS = 80;
const CHART_MARGIN = { top: 20, right: 20, left: 0, bottom: 4 };
const X_AXIS_LINE = { stroke: "#E5E7EB" };
const X_AXIS_TICK = { fill: "#6B7280", fontSize: 12 };
const Y_AXIS_TICK = { fill: "#9CA3AF", fontSize: 11 };

/* ============================================================================
 * 1. KPI CARDS
 * ============================================================================ */

export function WarrantyKpiCards({ data }: { data: AssetWarrantyData }) {
  const { kpis } = data;

  const cards = [
    {
      label: "Total Workstation Aktif",
      value: kpis.totalActive,
      sub: "Unit dengan tanggal beli valid",
      icon: Laptop,
      color: "text-zinc-600 dark:text-zinc-400",
      accent: "border-zinc-200 dark:border-zinc-800",
    },
    {
      label: "Masih Garansi",
      value: `${kpis.activeWarranty}`,
      badge: `${kpis.activeWarrantyPct}%`,
      sub: `${kpis.safeWarranty} unit >6 bln · ${kpis.mediumWarranty} unit 3–6 bln`,
      icon: ShieldCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      accent: "border-emerald-200 dark:border-emerald-900/40",
    },
    {
      label: "Segera Habis (≤90 Hari)",
      value: `${kpis.expiringSoon}`,
      badge: `${kpis.expiringSoonPct}%`,
      sub: `${kpis.expiringCritical} unit kritis (≤30 hr) · ${kpis.expiringWarning} unit (31–90 hr)`,
      icon: AlertTriangle,
      color: "text-amber-500 dark:text-amber-400",
      accent: "border-amber-200 dark:border-amber-900/40",
    },
    {
      label: "Garansi Sudah Habis",
      value: `${kpis.expiredWarranty}`,
      badge: `${kpis.expiredWarrantyPct}%`,
      sub: "Masa garansi resmi vendor telah lewat",
      icon: ShieldAlert,
      color: "text-zinc-500 dark:text-zinc-400",
      accent: "border-zinc-200 dark:border-zinc-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={cn(
              "rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900 transition-colors",
              c.accent,
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={16} className={c.color} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {c.label}
                </span>
              </div>
              {c.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    c.label.includes("Segera")
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
                  )}
                >
                  {c.badge}
                </span>
              )}
            </div>
            <div className="font-display mt-3 text-3xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">
              {c.value}
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {c.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * 2. PROYEKSI HABIS GARANSI 12 BULAN KEDEPAN
 * ============================================================================ */

export function WarrantyExpiryTimeline({ data }: { data: AssetWarrantyData }) {
  const chartData = data.monthlyExpiry;

  if (chartData.length === 0) {
    return (
      <ChartCard
        title="Proyeksi Habis Garansi 12 Bulan Kedepan"
        subtitle="Jumlah unit workstation yang jatuh tempo habis garansi per bulan"
      >
        <EmptyState
          title="Tidak ada jadwal habis garansi"
          description="Tidak ada unit workstation yang habis garansi dalam rentang 12 bulan kedepan."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Proyeksi Habis Garansi 12 Bulan Kedepan"
      subtitle="Jumlah unit workstation yang jatuh tempo habis garansi per bulan"
    >
      <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden pb-1">
        <div className="min-w-150">
          <div className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              debounce={RESIZE_DEBOUNCE_MS}
            >
              <BarChart data={chartData} margin={CHART_MARGIN}>
                <CartesianGrid
                  vertical={false}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="monthLabel"
                  axisLine={X_AXIS_LINE}
                  tickLine={false}
                  tick={X_AXIS_TICK}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={Y_AXIS_TICK}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const val = Number(payload[0]?.value ?? 0);
                    return (
                      <RechartsTip
                        title={label}
                        rows={[
                          {
                            color: "#3B82F6",
                            label: "Habis Garansi",
                            value: `${val} unit`,
                          },
                        ]}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Habis Garansi"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  minPointSize={3}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

/* ============================================================================
 * 3. DISTRIBUSI STATUS GARANSI (DONUT CHART)
 * ============================================================================ */

export function WarrantyStatusDonut({ data }: { data: AssetWarrantyData }) {
  const slices = data.statusDistribution;

  if (slices.length === 0) {
    return (
      <ChartCard
        title="Distribusi Status Garansi"
        subtitle="Proporsi masa garansi workstation aktif saat ini"
      >
        <EmptyState
          title="Data garansi kosong"
          description="Belum ada data distribusi garansi untuk filter saat ini."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Distribusi Status Garansi"
      subtitle="Proporsi masa garansi workstation aktif saat ini"
    >
      <div className="flex h-72 flex-col items-center justify-center">
        <ResponsiveContainer
          width="100%"
          height="75%"
          minWidth={0}
          debounce={RESIZE_DEBOUNCE_MS}
        >
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload as
                  | (typeof slices)[number]
                  | undefined;
                if (!item) return null;
                return (
                  <RechartsTip
                    title={item.name}
                    rows={[
                      {
                        color: item.color,
                        label: "Jumlah Unit",
                        value: `${item.value} unit (${item.percentage}%)`,
                      },
                    ]}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          {slices.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              <span>
                {s.name}: <strong>{s.value}</strong> ({s.percentage}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

/* ============================================================================
 * 4. KOMPOSISI GARANSI BERDASARKAN BRAND (STACKED BAR)
 * ============================================================================ */

export function WarrantyByBrandChart({ data }: { data: AssetWarrantyData }) {
  const chartData = data.brandBreakdown;

  if (chartData.length === 0) {
    return (
      <ChartCard
        title="Status Garansi Berdasarkan Brand"
        subtitle="Perbandingan masa garansi seluruh merk workstation"
      >
        <EmptyState
          title="Data brand tidak tersedia"
          description="Tidak ditemukan data brand workstation untuk filter saat ini."
        />
      </ChartCard>
    );
  }

  // Calculate dynamic container min-width based on brand count so bars remain slim and labels legible
  const containerMinWidth = Math.max(760, chartData.length * 42);

  return (
    <ChartCard
      title="Status Garansi Berdasarkan Brand"
      subtitle="Perbandingan seluruh merk workstation: Masih Panjang (>90 hr), Segera Habis (≤90 hr), dan Sudah Habis"
    >
      <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden pb-1">
        <div style={{ minWidth: `${containerMinWidth}px` }}>
          <div className="h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              debounce={RESIZE_DEBOUNCE_MS}
            >
              <BarChart
                data={chartData}
                margin={{ top: 16, right: 16, left: -8, bottom: 12 }}
                barCategoryGap="16%"
                maxBarSize={16}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="brand"
                  axisLine={X_AXIS_LINE}
                  tickLine={false}
                  interval={0}
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  height={52}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={Y_AXIS_TICK}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <RechartsTip
                        title={`Brand: ${label}`}
                        rows={payload.map((item) => ({
                          color: item.color,
                          label: String(item.name || ""),
                          value: `${Number(item.value ?? 0)} unit`,
                        }))}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="masihPanjang"
                  name="Masih Panjang (>90 hr)"
                  stackId="a"
                  fill={WARRANTY_STATUS_COLORS.safeLong}
                  maxBarSize={16}
                  minPointSize={3}
                />
                <Bar
                  dataKey="segeraHabis"
                  name="Segera Habis (≤90 hr)"
                  stackId="a"
                  fill={WARRANTY_STATUS_COLORS.warning}
                  maxBarSize={16}
                  minPointSize={3}
                />
                <Bar
                  dataKey="sudahHabis"
                  name="Sudah Habis"
                  stackId="a"
                  fill={WARRANTY_STATUS_COLORS.expired}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={16}
                  minPointSize={3}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm"
            style={{ backgroundColor: WARRANTY_STATUS_COLORS.safeLong }}
          />
          <span>Masih Panjang (&gt;90 hr)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm"
            style={{ backgroundColor: WARRANTY_STATUS_COLORS.warning }}
          />
          <span>Segera Habis (≤90 hr)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm"
            style={{ backgroundColor: WARRANTY_STATUS_COLORS.expired }}
          />
          <span>Sudah Habis</span>
        </div>
      </div>
    </ChartCard>
  );
}

/* ============================================================================
 * 5. TABEL ASET SEGERA HABIS GARANSI (≤90 HARI)
 * ============================================================================ */

const URGENT_PAGE_SIZE = 10;

export function WarrantyUrgentTable({
  items,
}: {
  items: WarrantyUrgentItem[];
}) {
  const [search, setSearch] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<"ALL" | "critical" | "warning">("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filterUrgency !== "ALL" && item.urgency !== filterUrgency) return false;
      if (!q) return true;
      return (
        item.barcode.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.site.toLowerCase().includes(q) ||
        item.additionalDisplay.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q)
      );
    });
  }, [items, search, filterUrgency]);

  if (items.length === 0) {
    return null;
  }

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / URGENT_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startEntry = totalCount === 0 ? 0 : (safePage - 1) * URGENT_PAGE_SIZE + 1;
  const endEntry = Math.min(safePage * URGENT_PAGE_SIZE, totalCount);
  const displayed = filtered.slice((safePage - 1) * URGENT_PAGE_SIZE, endEntry);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            <h3 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
              Daftar Aset Segera Habis Garansi (≤90 Hari)
            </h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {items.length} Unit
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Perangkat yang membutuhkan prioritas evaluasi maintenance atau perpanjangan lisensi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari barcode / brand / site..."
              className="h-8 rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-xs text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-900"
            />
          </div>

          <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                setFilterUrgency("ALL");
                setPage(1);
              }}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                filterUrgency === "ALL"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterUrgency("critical");
                setPage(1);
              }}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                filterUrgency === "critical"
                  ? "bg-red-600 text-white"
                  : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
              )}
            >
              ≤30 Hari
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterUrgency("warning");
                setPage(1);
              }}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                filterUrgency === "warning"
                  ? "bg-amber-500 text-white"
                  : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30",
              )}
            >
              31–90 Hari
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="pb-2.5 font-semibold">Barcode</th>
              <th className="pb-2.5 font-semibold">Brand / Model</th>
              <th className="pb-2.5 font-semibold">Site & Company</th>
              <th className="pb-2.5 font-semibold">Tgl Beli</th>
              <th className="pb-2.5 font-semibold">Tgl Habis</th>
              <th className="pb-2.5 text-right font-semibold">Sisa Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {displayed.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400"
                >
                  Tidak ada aset yang sesuai kriteria pencarian.
                </td>
              </tr>
            ) : (
              displayed.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  <td className="py-2.5 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                    {item.barcode}
                  </td>
                  <td className="py-2.5">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {item.brand}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {item.additionalDisplay}
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {item.site}
                    </span>
                    <span className="ml-1.5 text-[10px] text-zinc-400">
                      ({item.company})
                    </span>
                  </td>
                  <td className="py-2.5 text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {item.purchaseDate}
                  </td>
                  <td className="py-2.5 text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {item.warrantyEndDate}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                        item.urgency === "critical"
                          ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
                      )}
                    >
                      {formatDaysRemaining(item.daysRemaining)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Menampilkan{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {startEntry}
          </span>{" "}
          –{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {endEntry}
          </span>{" "}
          dari{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {totalCount}
          </span>{" "}
          aset
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Sebelumnya</span>
          </button>

          <span className="px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Halaman {safePage} dari {totalPages}
          </span>

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <span>Berikutnya</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 6. BANNER ANOMALI / DATA LEGACY (TAHUN < 2000)
 * ============================================================================ */

export function InvalidWarrantyBanner({
  summary,
}: {
  summary: InvalidWarrantySummary;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (summary.total === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              Catatan Integritas Data: {summary.total} Unit Tanggal Pengadaan Legacy
            </div>
            <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
              Sebanyak {summary.total} unit workstation memiliki tanggal pengadaan warisan sistem lama
              (misal 17 Agustus 1945 atau tahun 1900). Data ini dipisahkan dari statistik masa garansi
              agar tidak mendistorsi perhitungan garansi aktif.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {isOpen ? "Tutup Detail" : "Lihat Rincian"}
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-700/60">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Distribusi Brand Terdampak:
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {summary.brands.map((b) => (
                <span
                  key={b.brand}
                  className="rounded bg-zinc-200/70 px-2 py-0.5 text-[11px] font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {b.brand}: {b.count} unit
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Sampel Barcode Legacy (Maks 15):
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              {summary.items.slice(0, 15).map((it) => (
                <span
                  key={it.id}
                  className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {it.barcode} ({it.brand} · {it.purchaseYear})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 7. KOMPONEN UTAMA (WARAPPER MASA GARANSI)
 * ============================================================================ */

export default function WarrantySection({
  data,
  invalidSummary,
}: {
  data: AssetWarrantyData;
  invalidSummary?: InvalidWarrantySummary;
}) {
  return (
    <section className="space-y-4 pt-2">
      <div className="flex flex-col gap-1 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="font-display text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Masa Garansi Workstation
          </h2>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Snapshot status masa garansi armada workstation aktif per hari ini.
          Mengikuti filter Perusahaan dan Site yang dipilih di atas.
        </p>
      </div>

      <WarrantyKpiCards data={data} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <WarrantyExpiryTimeline data={data} />
        </div>
        <div className="lg:col-span-5">
          <WarrantyStatusDonut data={data} />
        </div>
      </div>

      <WarrantyByBrandChart data={data} />

      <WarrantyUrgentTable items={data.urgentItems} />

      {invalidSummary && <InvalidWarrantyBanner summary={invalidSummary} />}
    </section>
  );
}
