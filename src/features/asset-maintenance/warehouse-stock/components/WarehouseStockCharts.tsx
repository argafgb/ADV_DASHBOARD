"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { TipRows, useChartTooltip } from "@/components/chart-tooltip";
import type {
  CategoryConditionStack,
  ConditionShare,
  TopItemType,
  TypeStockModalData,
} from "../types";
import {
  COLOR_NEW,
  COLOR_SECOND,
  formatIndonesianNumber,
} from "../utils/warehouseStockTransformer";

interface WarehouseStockChartsProps {
  conditionShares: ConditionShare[];
  totalUnits: number;
  categoryStacks: CategoryConditionStack[];
  topItemTypes: TopItemType[];
  typeModalData: TypeStockModalData | null;
  activeCondition: string;
  activeCategory: string;
  onSelectCondition: (cond: string) => void;
  onSelectCategory: (cat: string) => void;
  onSelectCategoryAndCondition: (cat: string, cond: string) => void;
  onOpenTypeModal: (type: string) => void;
  onCloseTypeModal: () => void;
}

export default function WarehouseStockChartsComponent({
  conditionShares,
  totalUnits,
  categoryStacks,
  topItemTypes,
  typeModalData,
  activeCondition,
  activeCategory,
  onSelectCondition,
  onSelectCategory,
  onSelectCategoryAndCondition,
  onOpenTypeModal,
  onCloseTypeModal,
}: WarehouseStockChartsProps) {
  const tip = useChartTooltip();
  const [hoveredCondition, setHoveredCondition] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top and lock body scroll whenever modal opens
  useEffect(() => {
    if (typeModalData) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = 0;
      }
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [typeModalData]);

  // Donut SVG calculations
  const donutSize = 160;
  const donutCenter = donutSize / 2;
  const radius = 60;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  const donutSegments = conditionShares.reduce<
    Array<ConditionShare & { length: number; offset: number }>
  >((acc, share) => {
    const prevOffset =
      acc.length > 0
        ? acc[acc.length - 1].offset + acc[acc.length - 1].length
        : 0;
    const len = totalUnits > 0 ? (share.value / totalUnits) * circumference : 0;
    acc.push({
      ...share,
      length: len,
      offset: prevOffset,
    });
    return acc;
  }, []);

  // Stacked category calculations
  const maxCategoryTotal = Math.max(1, ...categoryStacks.map((c) => c.total));
  const step =
    maxCategoryTotal > 800
      ? 200
      : maxCategoryTotal > 400
        ? 100
        : maxCategoryTotal > 200
          ? 50
          : maxCategoryTotal > 80
            ? 20
            : 10;
  const chartMax = Math.ceil(maxCategoryTotal / step) * step;
  const yTicks: number[] = [];
  for (let v = 0; v <= chartMax; v += step) {
    yTicks.push(v);
  }
  const chartHeightPx = 300;
  const axisWidthPx = 30;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* ================= CARD 1: STOCK BY CONDITION (DONUT) ================= */}
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Stock by condition
          </div>
          <div className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            Pangsa unit per kondisi barang
          </div>

          <div className="flex flex-1 flex-col justify-between pt-4">
            {/* Donut SVG */}
            <div className="flex justify-center">
              <svg
                width={donutSize}
                height={donutSize}
                viewBox={`0 0 ${donutSize} ${donutSize}`}
                className="overflow-visible"
              >
                {donutSegments.length === 0 && (
                  <circle
                    cx={donutCenter}
                    cy={donutCenter}
                    r={radius}
                    fill="none"
                    stroke="#EEF1F6"
                    strokeWidth={strokeWidth}
                  />
                )}
                {donutSegments.map((seg) => {
                  const isHovered =
                    hoveredCondition === seg.label ||
                    activeCondition === seg.label;
                  const isDimmed =
                    (hoveredCondition !== null &&
                      hoveredCondition !== seg.label) ||
                    (hoveredCondition === null &&
                      activeCondition !== "Semua" &&
                      activeCondition !== seg.label);
                  return (
                    <circle
                      key={seg.label}
                      cx={donutCenter}
                      cy={donutCenter}
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                      strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                      strokeDashoffset={-seg.offset}
                      transform={`rotate(-90 ${donutCenter} ${donutCenter})`}
                      className="cursor-pointer transition-all duration-150"
                      opacity={isDimmed ? 0.45 : 1}
                      onMouseEnter={(e) => {
                        setHoveredCondition(seg.label);
                        tip.show(
                          e,
                          <TipRows
                            title={seg.label}
                            rows={[
                              {
                                color: seg.color,
                                label: "Jumlah",
                                value: `${formatIndonesianNumber(seg.value)} (${seg.percentage})`,
                              },
                            ]}
                          />,
                          seg.label,
                        );
                      }}
                      onMouseMove={tip.move}
                      onMouseLeave={() => {
                        setHoveredCondition(null);
                        tip.hide();
                      }}
                      onClick={() =>
                        onSelectCondition(
                          activeCondition === seg.label ? "Semua" : seg.label,
                        )
                      }
                    />
                  );
                })}
                <text
                  x={donutCenter}
                  y={donutCenter - 2}
                  textAnchor="middle"
                  className="font-display text-2xl font-semibold fill-zinc-900 dark:fill-zinc-50 tabular-nums"
                >
                  {formatIndonesianNumber(totalUnits)}
                </text>
                <text
                  x={donutCenter}
                  y={donutCenter + 16}
                  textAnchor="middle"
                  className="text-[11px] font-semibold fill-zinc-500 dark:fill-zinc-400"
                >
                  unit tercatat
                </text>
              </svg>
            </div>

            {/* Donut Legend */}
            <div className="mt-4 flex flex-col gap-0.5">
              {conditionShares.map((share) => {
                const isSelected = activeCondition === share.label;
                const isDimmed =
                  (hoveredCondition !== null &&
                    hoveredCondition !== share.label) ||
                  (hoveredCondition === null &&
                    activeCondition !== "Semua" &&
                    !isSelected);
                return (
                  <div
                    key={share.label}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      onSelectCondition(isSelected ? "Semua" : share.label)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        onSelectCondition(isSelected ? "Semua" : share.label);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredCondition(share.label);
                      tip.show(
                        e,
                        <TipRows
                          title={share.label}
                          rows={[
                            {
                              color: share.color,
                              label: "Jumlah",
                              value: `${formatIndonesianNumber(share.value)} (${share.percentage})`,
                            },
                          ]}
                        />,
                        share.label,
                      );
                    }}
                    onMouseMove={tip.move}
                    onMouseLeave={() => {
                      setHoveredCondition(null);
                      tip.hide();
                    }}
                    style={{
                      opacity: isDimmed ? 0.45 : 1,
                      transition: "opacity 150ms ease",
                    }}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                      isSelected
                        ? "bg-blue-50/80 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: share.color }}
                    />
                    <span className="flex-1 truncate text-[12.5px]">
                      {share.label}
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                      {formatIndonesianNumber(share.value)}
                    </span>
                    <span className="w-11 text-right text-[11.5px] text-zinc-400 tabular-nums dark:text-zinc-500">
                      {share.percentage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= CARD 2: TOP ITEM TYPES (BAR CHART) ================= */}
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Top item types
          </div>
          <div className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            Tipe barang dengan unit terbanyak
          </div>

          <div className="flex flex-1 flex-col justify-center gap-2 pt-4">
            {topItemTypes.map((item) => {
              const isDimmed =
                hoveredType !== null && hoveredType !== item.type;
              return (
                <div
                  key={item.type}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenTypeModal(item.type)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      onOpenTypeModal(item.type);
                  }}
                  onMouseEnter={(e) => {
                    setHoveredType(item.type);
                    tip.show(
                      e,
                      <TipRows
                        title={item.type}
                        rows={[
                          {
                            color: "#2563EB",
                            label: "Jumlah",
                            value: `${formatIndonesianNumber(item.total)} unit`,
                          },
                        ]}
                      />,
                      item.type,
                    );
                  }}
                  onMouseMove={tip.move}
                  onMouseLeave={() => {
                    setHoveredType(null);
                    tip.hide();
                  }}
                  style={{
                    opacity: isDimmed ? 0.45 : 1,
                    transition: "opacity 150ms ease",
                  }}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md p-1 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="w-4 shrink-0 text-right text-[11px] text-zinc-400 tabular-nums dark:text-zinc-500">
                    {item.rank}
                  </span>
                  <span className="w-[88px] shrink-0 truncate text-[12.5px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {item.type}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEF1F6] dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-[#2563EB] transition-all duration-400"
                      style={{ width: item.percentageWidth }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[12.5px] font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                    {formatIndonesianNumber(item.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= CARD 3: CONDITION BY CATEGORY (STACKED BAR) ================= */}
        <div className="col-span-full rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Condition by category
              </div>
              <div className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
                Jumlah unit per kategori, dipisah per kondisi
              </div>
            </div>

            {/* Standalone Legend */}
            <div className="flex items-center gap-3.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{ backgroundColor: COLOR_NEW }}
                />
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  New
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{ backgroundColor: COLOR_SECOND }}
                />
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Second
                </span>
              </div>
            </div>
          </div>

          {/* Stacked Chart Grid & Bars */}
          <div className="mt-5 flex flex-col gap-2 font-sans">
            <div className="flex">
              {/* Y Axis Labels (pinned exactly to each tick line) */}
              <div
                className="relative shrink-0"
                style={{
                  height: `${chartHeightPx}px`,
                  width: `${axisWidthPx}px`,
                }}
              >
                {yTicks.map((v) => (
                  <div
                    key={v}
                    className="absolute right-2 text-[11px] leading-[12px] text-zinc-400 tabular-nums dark:text-zinc-500"
                    style={{
                      bottom: `${(v / chartMax) * chartHeightPx - 6}px`,
                    }}
                  >
                    {formatIndonesianNumber(v)}
                  </div>
                ))}
              </div>

              {/* Chart Grid Lines & Columns */}
              <div
                className="relative flex-1"
                style={{ height: `${chartHeightPx}px` }}
              >
                {/* Horizontal Lines (Solid line on Y=0, Dashed lines above) */}
                {yTicks.map((tick) => {
                  const bottomPx = (tick / chartMax) * chartHeightPx;
                  const isZero = tick === 0;
                  return (
                    <div
                      key={tick}
                      className={`absolute left-0 right-0 ${
                        isZero
                          ? "border-t border-solid border-[#9CA3AF] dark:border-zinc-500"
                          : "border-t border-dashed border-[#E5E7EB] dark:border-zinc-800"
                      }`}
                      style={{ bottom: `${bottomPx}px`, height: 0 }}
                    />
                  );
                })}

                {/* Bars */}
                <div className="absolute inset-0 flex items-end gap-1.5">
                  {categoryStacks.map((col) => {
                    const newHeightPx = (col.newQty / chartMax) * chartHeightPx;
                    const secondHeightPx =
                      (col.secondQty / chartMax) * chartHeightPx;
                    const isSelected = activeCategory === col.category;
                    const isDimmed =
                      (hoveredCategory !== null &&
                        hoveredCategory !== col.category) ||
                      (hoveredCategory === null &&
                        activeCategory !== "Semua" &&
                        !isSelected);

                    const tooltipRows = [
                      ...(col.newQty > 0
                        ? [
                            {
                              color: COLOR_NEW,
                              label: "New",
                              value: `${formatIndonesianNumber(col.newQty)} unit`,
                            },
                          ]
                        : []),
                      ...(col.secondQty > 0
                        ? [
                            {
                              color: COLOR_SECOND,
                              label: "Second",
                              value: `${formatIndonesianNumber(col.secondQty)} unit`,
                            },
                          ]
                        : []),
                      {
                        label: "Total",
                        value: `${formatIndonesianNumber(col.total)} unit`,
                      },
                    ];

                    return (
                      <div
                        key={col.category}
                        style={{
                          opacity: isDimmed ? 0.45 : 1,
                          transition: "opacity 150ms ease",
                        }}
                        className="group relative flex h-full flex-1 min-w-0 flex-col items-center justify-end"
                        onMouseEnter={(e) => {
                          setHoveredCategory(col.category);
                          tip.show(
                            e,
                            <TipRows title={col.category} rows={tooltipRows} />,
                            col.category,
                          );
                        }}
                        onMouseMove={tip.move}
                        onMouseLeave={() => {
                          setHoveredCategory(null);
                          tip.hide();
                        }}
                      >
                        {/* Total Label on Top of Bar */}
                        <div className="mb-1 text-xs font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                          {formatIndonesianNumber(col.total)}
                        </div>

                        {/* Stacked segments: New on bottom, Second on top (flex-col-reverse) */}
                        <div className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-[4px]">
                          {/* Segment: New */}
                          {col.newQty > 0 && (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                onSelectCategoryAndCondition(
                                  col.category,
                                  "New",
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  onSelectCategoryAndCondition(
                                    col.category,
                                    "New",
                                  );
                              }}
                              className="flex w-full cursor-pointer items-center justify-center text-[11px] font-semibold text-white tabular-nums hover:opacity-90"
                              style={{
                                height: `${Math.max(newHeightPx, 1)}px`,
                                backgroundColor: COLOR_NEW,
                              }}
                            >
                              {newHeightPx >= 18 ? col.newQty : null}
                            </div>
                          )}

                          {/* Segment: Second */}
                          {col.secondQty > 0 && (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                onSelectCategoryAndCondition(
                                  col.category,
                                  "Second",
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  onSelectCategoryAndCondition(
                                    col.category,
                                    "Second",
                                  );
                              }}
                              className="flex w-full cursor-pointer items-center justify-center text-[11px] font-semibold text-white tabular-nums hover:opacity-90"
                              style={{
                                height: `${Math.max(secondHeightPx, 1)}px`,
                                backgroundColor: COLOR_SECOND,
                              }}
                            >
                              {secondHeightPx >= 18 ? col.secondQty : null}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Category Labels (matching exact column alignment) */}
            <div
              className="flex gap-1.5"
              style={{ marginLeft: `${axisWidthPx}px` }}
            >
              {categoryStacks.map((col) => {
                const isSelected = activeCategory === col.category;
                const isDimmed =
                  (hoveredCategory !== null &&
                    hoveredCategory !== col.category) ||
                  (hoveredCategory === null &&
                    activeCategory !== "Semua" &&
                    !isSelected);

                const tooltipRows = [
                  ...(col.newQty > 0
                    ? [
                        {
                          color: COLOR_NEW,
                          label: "New",
                          value: `${formatIndonesianNumber(col.newQty)} unit`,
                        },
                      ]
                    : []),
                  ...(col.secondQty > 0
                    ? [
                        {
                          color: COLOR_SECOND,
                          label: "Second",
                          value: `${formatIndonesianNumber(col.secondQty)} unit`,
                        },
                      ]
                    : []),
                  {
                    label: "Total",
                    value: `${formatIndonesianNumber(col.total)} unit`,
                  },
                ];

                return (
                  <button
                    key={col.category}
                    type="button"
                    onClick={() =>
                      onSelectCategory(isSelected ? "Semua" : col.category)
                    }
                    onMouseEnter={(e) => {
                      setHoveredCategory(col.category);
                      tip.show(
                        e,
                        <TipRows title={col.category} rows={tooltipRows} />,
                        col.category,
                      );
                    }}
                    onMouseMove={tip.move}
                    onMouseLeave={() => {
                      setHoveredCategory(null);
                      tip.hide();
                    }}
                    className={`flex-1 min-w-0 text-center text-[11px] leading-[13px] transition-colors cursor-pointer whitespace-normal break-words ${
                      isSelected
                        ? "font-bold text-blue-600 dark:text-blue-400"
                        : "font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                    style={{
                      opacity: isDimmed ? 0.45 : 1,
                      transition: "opacity 150ms ease",
                      textWrap: "balance",
                    }}
                  >
                    {col.category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {tip.node}

      {/* ================= STANDALONE MODAL (TYPE STOCK LEVEL) ================= */}
      {typeof document !== "undefined" &&
        typeModalData &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
            onClick={onCloseTypeModal}
          >
            <div
              className="flex max-h-[min(640px,90vh)] w-[600px] max-w-[92vw] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {typeModalData.title}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {typeModalData.itemCount} item
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseTypeModal}
                  className="cursor-pointer p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Table Content */}
              <div
                ref={modalScrollRef}
                className="flex-1 overflow-y-auto px-5 pt-1 pb-4"
              >
                <table className="w-full border-collapse text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="sticky top-0 z-10 bg-white py-3 text-left text-xs font-bold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        Item
                      </th>
                      <th className="sticky top-0 z-10 w-20 bg-white py-3 text-right text-xs font-bold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        Stok
                      </th>
                      <th className="sticky top-0 z-10 w-28 bg-white py-3 text-right text-xs font-bold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        Minimum
                      </th>
                      <th className="sticky top-0 z-10 w-24 bg-white py-3 pl-8 text-left text-xs font-bold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {typeModalData.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                      >
                        <td className="py-3 pr-3 text-[13px] font-normal text-zinc-900 dark:text-zinc-100">
                          {row.item}
                        </td>
                        <td className="py-3 text-right text-[13px] font-normal text-zinc-900 tabular-nums dark:text-zinc-100">
                          {row.stok}
                        </td>
                        <td className="py-3 text-right text-[13px] font-normal text-zinc-900 tabular-nums dark:text-zinc-100">
                          {row.min}
                        </td>
                        <td className="py-3 pl-8">
                          <div className="flex items-center gap-2 text-[13px] font-normal text-zinc-900 dark:text-zinc-100">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: row.dotColor }}
                            />
                            <span>{row.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
