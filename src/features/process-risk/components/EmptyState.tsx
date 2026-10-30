'use client';

import { CalendarClock, Inbox } from 'lucide-react';
import { PageHeader } from './PageHeader';

export function EmptyYearState({
  title,
  description,
  year,
}: {
  title: string;
  description: string;
  year: number;
}) {
  return (
    <div className="feature-page">
      <PageHeader title={title} description={description} />
      <div className="feature-content">
        <section
          className="card"
          style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 10,
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--domain-accent)',
              background: 'color-mix(in srgb, var(--domain-accent) 10%, white)',
              border: '1px solid color-mix(in srgb, var(--domain-accent) 20%, white)',
            }}
          >
            <CalendarClock size={24} strokeWidth={1.8} />
          </span>
          <span style={{ font: '700 16px var(--font-display)', color: 'var(--text-primary)' }}>
            Belum ada data {year}
          </span>
          <span
            style={{
              maxWidth: 420,
              font: '400 13px/1.6 var(--font-body)',
              color: 'var(--text-muted)',
            }}
          >
            Belum ada dokumen untuk tahun {year}. Ringkasan akan muncul otomatis setelah data
            periode tersebut tersedia.
          </span>
        </section>
      </div>
    </div>
  );
}

export function EmptyProgramState({
  name,
  color,
  description,
  message,
}: {
  name: string;
  color: string;
  description: string;
  message: string;
}) {
  return (
    <div className="feature-page">
      <PageHeader title={name} description={description} />
      <div className="feature-content">
        <section
          className="card"
          style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 10,
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              color: color,
              background: `color-mix(in srgb, ${color} 10%, white)`,
              border: `1px solid color-mix(in srgb, ${color} 20%, white)`,
            }}
          >
            <Inbox size={24} strokeWidth={1.8} />
          </span>
          <span style={{ font: '700 16px var(--font-display)', color: 'var(--text-primary)' }}>
            Belum ada data
          </span>
          <span
            style={{
              maxWidth: 420,
              font: '400 13px/1.6 var(--font-body)',
              color: 'var(--text-muted)',
            }}
          >
            {message}
          </span>
        </section>
      </div>
    </div>
  );
}
