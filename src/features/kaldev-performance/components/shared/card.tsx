import type { CSSProperties, ReactNode } from "react";

/**
 * Kartu `.dd-card` dari desain: kepala (judul, subjudul, aksi) + badan.
 * Padding, jarak, dan tipografi datang dari design-system.css.
 */
export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  style,
  headStyle,
  bodyStyle,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  headStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  bodyClassName?: string;
}) {
  return (
    <section className={className ? `dd-card ${className}` : "dd-card"} style={style}>
      {(title || subtitle || actions) && (
        <div className="dd-card__head" style={headStyle}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {title && (
              <div className="dd-card__title" style={{ fontWeight: 600 }}>
                {title}
              </div>
            )}
            {subtitle && <div className="dd-card__subtitle">{subtitle}</div>}
          </div>
          {actions && <div className="dd-card__actions">{actions}</div>}
        </div>
      )}
      <div
        className={bodyClassName ? `dd-card__body ${bodyClassName}` : "dd-card__body"}
        style={bodyStyle}
      >
        {children}
      </div>
    </section>
  );
}
