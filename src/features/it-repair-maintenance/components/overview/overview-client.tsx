"use client";

import { Card } from "../shared/card";
import { Chip } from "../shared/chips";
import { DataTable } from "../shared/data-table";
import { Donut } from "../shared/donut";
import { IconClock, IconDoc, IconWrench } from "../shared/icons";
import { KpiCard, KpiGrid } from "../shared/kpi-card";
import { Modal } from "../shared/modal";
import { PageHeader } from "../shared/page-header";
import { RankedBar } from "../shared/ranked-bar";
import { AGE_COLS, MODAL_COLS, RecordExpanded, renderRecordCell } from "../shared/record-cells";
import { SegmentedTabs } from "../shared/segmented-tabs";
import { StackedColumn } from "../shared/stacked-column";
import { useUrlUpdater } from "../../hooks/use-url-updater";
import type { ModalKind, OverviewData } from "../../types/it-repair.types";

/**
 * Isi halaman Overview. Semua interaksi (segmen By item/By PIC, klik chart,
 * paginasi modal) menulis ke URL sehingga data dihitung ulang di server.
 */
export function OverviewClient({ data }: { data: OverviewData }) {
  const { href, update } = useUrlUpdater();
  const openModal = (kind: ModalKind, value: string) => update({ modal: kind, mv: value, mpage: null });
  const closeModal = () => update({ modal: null, mv: null, mpage: null });
  const m = data.modal;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`Seluruh pekerjaan repair dan pengecekan Golden Unit, ${data.periodLabel}`}
      />

      <KpiGrid cols={3}>
        <KpiCard
          variant="accent"
          label="Total records"
          value={data.kpi.total}
          sub={data.kpi.totalSub}
          icon={<IconDoc />}
          info={data.infoText}
          delta={data.kpi.totalDelta}
        />
        <KpiCard
          label="User repairs"
          value={data.kpi.ur}
          sub={data.kpi.urSub}
          subTone="amber"
          tone="blue"
          icon={<IconWrench />}
          info={data.infoText}
          delta={data.kpi.urDelta}
          href={href({ modal: "age", mv: null, mpage: null })}
        />
        <KpiCard
          label="Avg turnaround"
          value={data.kpi.ta}
          sub={data.kpi.taSub}
          tone="green"
          icon={<IconClock />}
          info={data.infoText}
          delta={data.kpi.taDelta}
        />
      </KpiGrid>

      <div className="ir-row-ms">
        <Card title="Monthly volume" subtitle="Pekerjaan per bulan menurut jenis pekerjaan">
          <StackedColumn
            categories={data.monthly.categories}
            series={data.monthly.series}
            height={280}
            onColumnClick={(i) => openModal("month", String(i))}
          />
        </Card>
        <Card title="Status composition" subtitle="Posisi seluruh pekerjaan pada periode aktif">
          <Donut
            data={data.statusMix}
            centerValue={data.statusTotal}
            centerCaption="total pekerjaan"
            onSliceClick={(s) => openModal("status", s.label)}
            className="ir-donut-sv"
          />
        </Card>
      </div>

      <Card
        title="Volume & result"
        subtitle="Volume per jenis barang atau PIC, dan hasil pekerjaan yang sudah selesai"
        actions={
          <SegmentedTabs
            value={data.seg}
            items={[
              { value: "item", label: "By item", href: href({ seg: null }) },
              { value: "pic", label: "By PIC", href: href({ seg: "pic" }) },
            ]}
          />
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,65fr) minmax(0,35fr)", gap: 32, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <div style={{ alignSelf: "flex-end", font: "600 11px/1.2 var(--dd-font-sans)", color: "var(--text-muted)" }}>
              Jumlah pekerjaan
            </div>
            <RankedBar
              rows={data.ranked}
              color="var(--chart-blue-primary)"
              onRowClick={(row) => openModal(data.seg === "item" ? "item" : "pic", row.label)}
            />
          </div>
          <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: 32, minWidth: 0, position: "relative", top: -16 }}>
            <Donut
              data={data.resultDonut}
              centerValue={data.resultTotal}
              centerCaption="pekerjaan selesai"
              onSliceClick={(s) => openModal("result", s.label)}
              className="ir-donut-h"
            />
          </div>
        </div>
      </Card>

      {m && (
        <Modal
          title={m.title}
          context={
            <>
              {m.chips.map((c) => (
                <Chip key={c} variant="entity">
                  {c}
                </Chip>
              ))}
            </>
          }
          onClose={closeModal}
        >
          <DataTable
            title="Records"
            count={m.table.count}
            hint="Record yang cocok dengan potongan yang diklik."
            columns={m.kind === "age" ? AGE_COLS : MODAL_COLS}
            rows={m.table.rows}
            rowKey={(r) => r.id}
            renderCell={(row, col) => renderRecordCell(row, col)}
            renderExpanded={(row) => <RecordExpanded row={row} />}
            minWidth={880}
            page={m.table.page}
            totalPages={m.table.totalPages}
            onPageChange={(p) => update({ mpage: p === 1 ? null : p })}
            rangeLabel={m.table.rangeLabel}
          />
        </Modal>
      )}
    </>
  );
}
