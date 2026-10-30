'use client';

import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="feature-header">
      <div className="feature-header-row">
        <div className="feature-header-copy">
          <h1
            style={{
              margin: 0,
              font: '700 26px var(--font-display)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: '5px 0 0',
              font: '400 13.5px/1.5 var(--font-body)',
              color: 'var(--text-muted)',
            }}
          >
            {description}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SectionLabel({ label, readMe }: { label: string; readMe?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 14px' }}>
      <span
        aria-hidden
        style={{
          width: 4,
          height: 18,
          borderRadius: 4,
          background: 'var(--domain-accent)',
        }}
      />
      <span
        style={{
          font: '700 14.5px var(--font-display)',
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
        }}
      >
        {label}
      </span>
      {readMe}
    </div>
  );
}
