import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <article className={className ? `dd-card ${className}` : "dd-card"}>
      {(title || subtitle || actions) && (
        <div className="dd-card__head">
          <div>
            {title && <div className="dd-card__title">{title}</div>}
            {subtitle && <div className="dd-card__subtitle">{subtitle}</div>}
          </div>
          {actions && <div className="dd-card__actions">{actions}</div>}
        </div>
      )}
      <div
        className={
          bodyClassName ? `dd-card__body ${bodyClassName}` : "dd-card__body"
        }
      >
        {children}
      </div>
    </article>
  );
}
