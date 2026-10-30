import type { CSSProperties, ReactNode } from "react";

/**
 * Kartu `.dd-card` design system: kepala (judul 14/700, subjudul 11.5 muted,
 * aksi rata kanan) + badan. Padding, jarak, dan tipografi datang dari
 * design-system.css; komponen tidak menulis ulang angkanya.
 */
export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  style,
  bodyStyle,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}) {
  const hasHead = Boolean(title || actions);
  return (
    <section className={className ? `dd-card ${className}` : "dd-card"} style={style}>
      {hasHead && (
        <div className="dd-card__head">
          <div style={{ minWidth: 0 }}>
            {title && <div className="dd-card__title">{title}</div>}
            {subtitle && <div className="dd-card__subtitle">{subtitle}</div>}
          </div>
          {actions && <div className="dd-card__actions">{actions}</div>}
        </div>
      )}
      {hasHead ? (
        <div className="dd-card__body" style={bodyStyle}>
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
