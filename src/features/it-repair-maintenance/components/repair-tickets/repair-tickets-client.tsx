"use client";

import { useRef, useState } from "react";

import { Card } from "../shared/card";
import { CountPill } from "../shared/chips";
import { DataTable } from "../shared/data-table";
import { Donut } from "../shared/donut";
import { TableFilter } from "../shared/dropdown";
import { EmptyState } from "../shared/empty-state";
import { IconAlert, IconCheck, IconClock, IconFlag, IconPackage, IconUser, IconWrench } from "../shared/icons";
import { KpiCard, KpiGrid } from "../shared/kpi-card";
import { LineChart } from "../shared/line-chart";
import { PageHeader } from "../shared/page-header";
import { ProgressList } from "../shared/progress-list";
import { REPAIR_COLS, RecordExpanded, renderRecordCell } from "../shared/record-cells";
import { SearchInput } from "../shared/search-input";
import { StackedBar } from "../shared/stacked-bar";
import { STATUS_SERIES } from "../../utils/series";
import { useUrlUpdater } from "../../hooks/use-url-updater";
import { STATUSES, type RepairData, type RepairQuery } from "../../types/it-repair.types";

/** Lepas semua filter tabel (klik KPI "Total repairs" atau tombol Reset). */
const RESET = { status: null, item: null, pic: null, result: null, branch: null, q: null, page: null };

/**
 * Isi halaman Repair tickets. Klik KPI, potongan donut, segmen batang, dan
 * filter toolbar menyaring tabel lewat URL; pencarian ditunda 300 ms.
 */
export function RepairTicketsClient({ data, query, year }: { data: RepairData; query: RepairQuery; year: string }) {
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

  const tools = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", width: "100%" }}>
      <div className="ir-search" style={{ flex: "1 1 auto", minWidth: 200 }}>
        <SearchInput placeholder="Cari tiket, problem, atau pemilik..." value={q} onChange={onSearch} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none", flexWrap: "nowrap" }}>
        <TableFilter
          label="Status"
          value={query.status}
          options={["Semua", ...STATUSES]}
          icon={<IconFlag />}
          onChange={(v) => update({ status: v, page: null })}
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
        title="Repair tickets"
        subtitle={`Repair perangkat milik user, ${data.periodLabel}`}
      />

      <KpiGrid cols={5}>
        <KpiCard label="Total repairs" value={data.kpi.total} sub={data.kpi.totalSub} tone="blue" icon={<IconWrench />} href={href(RESET)} />
        <KpiCard label="Done" value={data.kpi.done} sub={data.kpi.doneSub} subTone="green" tone="green" icon={<IconCheck />} href={href({ status: "Done", page: null })} />
        <KpiCard label="On progress" value={data.kpi.progress} tone="blue" icon={<IconFlag />} href={href({ status: "On progress", page: null })} />
        <KpiCard label="On queue" value={data.kpi.queue} sub={data.kpi.queueSub} subTone="amber" tone="amber" icon={<IconClock />} href={href({ status: "On queue", page: null })} />
        <KpiCard label="Not usable" value={data.kpi.notUsable} sub={data.kpi.notUsableSub} subTone="red" tone="red" icon={<IconAlert />} href={href({ status: "Not usable", page: null })} />
      </KpiGrid>

      <div className="dd-row dd-row--2">
        <Card title="Result" subtitle="Hasil repair yang sudah selesai">
          <Donut
            data={data.resultDonut}
            centerValue={data.resultTotal}
            centerCaption="repair selesai"
            onSliceClick={(s) => update({ result: s.label, page: null })}
            className="ir-donut-h"
          />
        </Card>
        <Card title="Repairs by branch" subtitle="Cabang atau divisi dengan repair terbanyak">
          <Donut
            data={data.branchDonut}
            centerValue={data.branchTotal}
            centerCaption="repair bercabang"
            onSliceClick={(s) => update({ branch: s.branches.join(","), page: null })}
            className="ir-donut-h"
          />
        </Card>
      </div>

      <div className="dd-row dd-row--2">
        <Card title="Status by item" subtitle="Status repair per jenis barang" className="ir-fill">
          <StackedBar
            rows={data.statusByItem}
            series={STATUS_SERIES}
            onSegmentClick={(row, s) => update({ item: row.items.length === 1 ? row.items[0] : null, status: s.label, page: null })}
          />
        </Card>
        <Card
          title="PIC workload"
          subtitle="Repair selesai dibanding repair yang masih dipegang"
          className="ir-fill"
          actions={<CountPill>{data.workloadCount}</CountPill>}
        >
          <ProgressList rows={data.workload} doneLabel="Selesai" restLabel="Masih terbuka" />
        </Card>
      </div>

      <Card
        title="Monthly repairs"
        subtitle={`Repair user yang masuk per bulan sepanjang ${year}`}
        actions={
          <div className="dd-chart__legend">
            <span className="dd-chart__legenditem">
              <span className="dd-chart__dot dd-chart__dot--round" style={{ background: "var(--chart-blue-primary)" }} />
              User repair
            </span>
          </div>
        }
      >
        <div style={{ minHeight: 250 }}>
          <LineChart
            labels={data.monthly.labels}
            tipLabels={data.monthly.fullLabels}
            data={data.monthly.data}
            color="var(--chart-blue-primary)"
            name="User repair"
          />
        </div>
      </Card>

      <DataTable
        title="Repair tickets"
        count={data.table.count}
        hint="Klik baris untuk melihat penanganan, sparepart, dan tanggal serah terima."
        tools={tools}
        columns={REPAIR_COLS}
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
            title="Tidak ada repair yang cocok"
            message="Longgarkan filter status, item, atau PIC, atau kosongkan kata kunci pencarian."
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
