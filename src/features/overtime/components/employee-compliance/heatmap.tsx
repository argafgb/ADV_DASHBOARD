"use client";

import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import { FloatingTip } from "../ds/chart-tooltip";
import { idNum } from "../ds/chart-utils";
import type { HeatmapCell } from "../../types/employee.types";

const LABEL_WIDTH = 62;

function uniqueInOrder(values: string[]) {
  return values.filter((v, i) => values.indexOf(v) === i);
}

type Hover = { day: string; slot: string; value: number; x: number; y: number };

export function HeatmapCard({ data }: { data: HeatmapCell[] }) {
  const [hover, setHover] = useState<Hover | null>(null);

  const days = uniqueInOrder(data.map((c) => c.day));
  const slots = uniqueInOrder(data.map((c) => c.slot));
  const cells = new Map(data.map((c) => [`${c.day}|${c.slot}`, c]));

  const gridTemplate = `${LABEL_WIDTH}px repeat(${slots.length}, minmax(0, 1fr))`;

  return (
    <Card
      title="Pola hari & jam lembur"
      subtitle="Kepadatan jam approved berdasarkan waktu kejadian"
      actions={<span className="dd-chip dd-chip--green">Baru</span>}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="Belum Ada Pola Hari dan Jam"
          description="Data akan muncul setelah sinkronisasi dari HRIS selesai."
          height={240}
        />
      ) : (
        <div className={`dd-heat${hover ? " dd-chart--dim" : ""}`}>
          <div
            className="dd-heat__row"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <span />
            {slots.map((slot) => (
              <span key={slot} className="dd-heat__collabel">
                {slot}
              </span>
            ))}
          </div>

          {days.map((day) => (
            <div
              key={day}
              className="dd-heat__row"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <span className="dd-heat__rowlabel">{day}</span>
              {slots.map((slot) => {
                const cell = cells.get(`${day}|${slot}`);
                const heat = cell?.heat ?? 0;
                const value = cell?.value ?? 0;
                const isHot = hover?.day === day && hover?.slot === slot;

                return (
                  <div
                    key={slot}
                    className={`dd-heat__cell dd-mark${isHot ? " is-hot" : ""}`}
                    style={{
                      background: `color-mix(in srgb, var(--chart-blue-primary) ${Math.max(heat, 6)}%, var(--chart-gray-track))`,
                      color:
                        heat > 55
                          ? "var(--text-on-accent)"
                          : "var(--text-secondary)",
                    }}
                    onMouseMove={(e) =>
                      setHover({
                        day,
                        slot,
                        value,
                        x: e.clientX,
                        y: e.clientY - 12,
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                  >
                    {idNum(value)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {hover && (
        <FloatingTip
          x={hover.x}
          y={hover.y}
          title={`${hover.day} · ${hover.slot}`}
          rows={[
            {
              color: "var(--chart-blue-primary)",
              label: "Jam approved",
              value: `${idNum(hover.value)} jam`,
            },
          ]}
        />
      )}
    </Card>
  );
}
