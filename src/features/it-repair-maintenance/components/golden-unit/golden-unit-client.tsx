"use client";

import { useRef, useState } from "react";

import { Card } from "../shared/card";
import { DataTable } from "../shared/data-table";
import { Donut } from "../shared/donut";
import { TableFilter } from "../shared/dropdown";
import { EmptyState } from "../shared/empty-state";
import { GroupedBar } from "../shared/grouped-bar";
import { IconAlert, IconCheck, IconClock, IconPackage, IconTag, IconUser } from "../shared/icons";
import { KpiCard, KpiGrid } from "../shared/kpi-card";
import { PageHeader } from "../shared/page-header";
import { GOLDEN_COLS, RecordExpanded, renderRecordCell } from "../shared/record-cells";
import { SearchInput } from "../shared/search-input";
import { StackedBar } from "../shared/stacked-bar";
import { RESULT_SERIES } from "../../utils/series";
import { useUrlUpdater } from "../../hooks/use-url-updater";
import { RESULTS, type GoldenData, type GoldenQuery } from "../../types/it-repair.types";

/** Lepas semua filter tabel (klik KPI "Units checked" atau tombol Reset). */
const RESET = { result: null, item: null, pic: null, status: null, q: null, page: null };

/**
 * Isi halaman Golden Unit. Klik KPI, potongan donut, segmen batang, batang
 * PIC, dan filter toolbar menyaring tabel lewat URL; pencarian ditunda 300 ms.
 */
export function GoldenUnitClient({ data, query }: { data: GoldenData; query: GoldenQuery }) {
  const { href, update } = useUrlUpdater();
  const [q, setQ] = useState(query.q);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearch = (value: string) => {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => update({ q: value.trim(), page: null }, "replace"), 300);
  };
  const reset = () => {
    setQ("");
    update(RESET);
  };
  const unitLabel = <span className="ir-unit">Jumlah unit</span>;

  const tools = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", width: "100%" }}>
      <div className="ir-search" style={{ flex: "1 1 auto", minWidth: 200 }}>
        <SearchInput placeholder="Cari barcode, model, atau problem..." value={q} onChange={onSearch} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none", flexWrap: "nowrap" }}>
        <TableFilter
          label="Result"
          value={query.result}
          options={["Semua", ...RESULTS]}
          icon={<IconTag />}
          onChange={(v) => update({ result: v, page: null })}
        />
        <TableFilter
          label="Item"
          value={query.item}
          options={["Semua", ...data.options.items]}
          icon={<IconPackage />}
          onChange={(v) => update({ item: v, page: null })}
        />
        <TableFilter
          label="Repair PIC"
          value={query.pic}
          options={["Semua", ...data.options.pics]}
          icon={<IconUser />}
          align="right"
          onChange={(v) => update({ pic: v, page: null })}
        />
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Golden Unit"
        subtitle={`Hasil pengecekan aset Golden Unit untuk dipakai ulang atau dijual, ${data.periodLabel}`}
      />

      <KpiGrid cols={5}>
        <KpiCard label="Units checked" value={data.kpi.total} sub={data.kpi.totalSub} tone="blue" icon={<IconPackage />} href={href(RESET)} />
        <KpiCard label="Ready to sell" value={data.kpi.ready} sub={data.kpi.readySub} subTone="blue" tone="blue" icon={<IconTag />} href={href({ result: "Ready to sell", page: null })} />
        <KpiCard label="Usable" value={data.kpi.usable} sub={data.kpi.usableSub} subTone="green" tone="green" icon={<IconCheck />} href={href({ result: "Usable", page: null })} />
        <KpiCard label="Damaged" value={data.kpi.damaged} sub={data.kpi.damagedSub} subTone="red" tone="red" icon={<IconAlert />} href={href({ result: "Damaged", page: null })} />
        <KpiCard label="On queue" value={data.kpi.queue} sub={data.kpi.queueSub} subTone="amber" tone="amber" icon={<IconClock />} href={href({ status: "On queue", result: null, page: null })} />
      </KpiGrid>

      <div className="dd-row dd-row--2">
        <Card title="Result" subtitle="Hasil pengecekan unit yang sudah selesai">
          <Donut
            data={data.resultDonut}
            centerValue={data.resultTotal}
            centerCaption="unit selesai dicek"
            onSliceClick={(s) => update({ result: s.label, page: null })}
            className="ir-donut-v"
          />
        </Card>
        <Card title="Result by item" subtitle="Hasil pengecekan per jenis barang" actions={unitLabel} className="ir-fill">
          <StackedBar
            rows={data.resultByItem}
            series={RESULT_SERIES}
            onSegmentClick={(row, s) => update({ item: row.items.length === 1 ? row.items[0] : null, result: s.label, page: null })}
          />
        </Card>
      </div>

      <Card title="Checks by PIC" subtitle="Unit yang dicek per PIC" actions={unitLabel}>
        <GroupedBar
          categories={data.byPic.categories}
          series={[{ key: "unit", label: "Unit dicek", color: "var(--chart-blue-primary)", data: data.byPic.data }]}
          height={250}
          barWidth={40}
          onBarClick={(cat) => update({ pic: cat, page: null })}
        />
      </Card>

      <DataTable
        title="Golden Unit records"
        count={data.table.count}
        hint="Klik baris untuk melihat catatan pengecekan dan barcode."
        tools={tools}
        columns={GOLDEN_COLS}
        rows={data.table.rows}
        rowKey={(r) => r.id}
        renderCell={(row, col) => renderRecordCell(row, col)}
        renderExpanded={(row) => <RecordExpanded row={row} />}
        minWidth={1080}
        page={data.table.page}
        totalPages={data.table.totalPages}
        onPageChange={(p) => update({ page: p === 1 ? null : p })}
        rangeLabel={data.table.rangeLabel}
        emptyState={
          <EmptyState
            title="Tidak ada unit yang cocok"
            message="Longgarkan filter result, item, atau PIC, atau kosongkan kata kunci pencarian."
            action={
              <button type="button" className="dd-btn dd-btn--soft dd-btn--sm" onClick={reset}>
                Reset filter
              </button>
            }
          />
        }
      />
    </>
  );
}
