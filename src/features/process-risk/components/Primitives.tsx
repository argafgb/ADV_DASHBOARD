'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Check, Circle, Clock, TrendingDown, TrendingUp, X } from 'lucide-react';
import type { StatusId } from '../types';

/* ---------------------------------------------------------------- tooltips */

export interface TipContent {
  title: string;
  lines: string[];
  footer?: string;
}

interface TipState extends TipContent {
  x: number;
  top: number;
  bottom: number;
}

const TipContext = createContext<{
  show: (el: Element, content: TipContent) => void;
  hide: () => void;
}>({ show: () => {}, hide: () => {} });

export function TooltipLayer({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<TipState | null>(null);

  const show = useCallback((el: Element, content: TipContent) => {
    const r = el.getBoundingClientRect();
    setTip({ ...content, x: r.left + r.width / 2, top: r.top, bottom: r.bottom });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <TipContext.Provider value={value}>
      {children}
      {tip ? <Tooltip tip={tip} /> : null}
    </TipContext.Provider>
  );
}

function Tooltip({ tip }: { tip: TipState }) {
  const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight;
  const headerBottom =
    typeof document === 'undefined'
      ? 0
      : (document.querySelector<HTMLElement>('[data-dashboard-header]')?.getBoundingClientRect()
          .bottom ?? 0);
  const safeTop = headerBottom + 8;
  const estimatedHeight = 54 + tip.lines.length * 25 + (tip.footer ? 38 : 0);
  const fitsAbove = tip.top - estimatedHeight - 10 >= safeTop;
  const fitsBelow = viewportHeight - tip.bottom >= estimatedHeight + 10;
  const below = !fitsAbove && fitsBelow;
  const centered = !fitsAbove && !fitsBelow;
  const tooltipHalfWidth = Math.min(140, Math.max(0, (viewportWidth - 16) / 2));
  const left = Math.min(
    Math.max(tip.x, tooltipHalfWidth + 8),
    viewportWidth - tooltipHalfWidth - 8,
  );

  return (
    <div
      role="tooltip"
      className="chart-tooltip"
      style={{
        left,
        top: centered ? safeTop : below ? Math.max(tip.bottom, safeTop) : tip.top,
        transform: centered
          ? 'translateX(-50%)'
          : below
            ? 'translate(-50%, 10px)'
            : 'translate(-50%, -100%) translateY(-10px)',
      }}
    >
      {centered ? null : (
        <span className={`chart-tooltip-arrow${below ? ' is-above' : ' is-below'}`} />
      )}
      <div className="chart-tooltip-title">{tip.title}</div>
      {tip.lines.map((line, index) => (
        <div key={`${line}-${index}`} className="chart-tooltip-line">
          {line}
        </div>
      ))}
      {tip.footer ? <div className="chart-tooltip-footer">{tip.footer}</div> : null}
    </div>
  );
}

/** Attaches hover + keyboard focus handlers for the shared tooltip layer. */
export function useTip<T extends Element = HTMLElement>(content: TipContent) {
  const { show, hide } = useContext(TipContext);
  useEffect(() => hide, [hide]);
  return {
    tabIndex: 0,
    onMouseEnter: (e: React.MouseEvent<T>) => show(e.currentTarget, content),
    onMouseLeave: hide,
    onFocus: (e: React.FocusEvent<T>) => show(e.currentTarget, content),
    onBlur: hide,
  };
}

/* ---------------------------------------------------------------- popover */

export interface VisualLegendItem {
  label: string;
  color: string;
  glyph?: ReactNode;
}

export function ReadMe({
  lines = [],
  legend,
  notes,
}: {
  lines?: string[];
  legend?: VisualLegendItem[];
  notes?: { swatch?: 'hatch' | 'hatch-soft' | 'ring' | 'dot'; text: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        aria-label="Cara membaca grafik ini"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 9px',
          borderRadius: 999,
          border: `1px solid ${open ? 'var(--domain-accent)' : 'var(--border-divider)'}`,
          background: open ? 'var(--bg-nav-active)' : 'var(--bg-card)',
          color: open ? 'var(--domain-accent)' : 'var(--text-muted)',
          font: '600 10.5px var(--font-body)',
          cursor: 'pointer',
          lineHeight: 1,
          transition: 'color 140ms ease, border-color 140ms ease, background 140ms ease',
        }}
      >
        <svg
          aria-hidden
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        Cara baca
      </button>
      {open ? (
        <div
          className="read-me-popover"
          style={{
            position: 'absolute',
            top: 24,
            left: 0,
            zIndex: 60,
            width: 280,
            padding: 12,
            borderRadius: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-lift)',
          }}
        >
          {legend?.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <span
                style={{
                  font: '600 10px var(--font-body)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Status dokumen
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {legend.map((item) => (
                  <span
                    key={item.label}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 8px',
                      borderRadius: 7,
                      background: `color-mix(in srgb, ${item.color} 9%, white)`,
                      border: `1px solid color-mix(in srgb, ${item.color} 20%, white)`,
                      color: item.color,
                      font: '600 11px var(--font-body)',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        display: 'grid',
                        placeItems: 'center',
                        background: item.color,
                        color: '#fff',
                        fontSize: 8,
                      }}
                    >
                      {item.glyph}
                    </span>
                    {item.label}
                  </span>
                ))}
              </div>
              {notes && notes.length ? (
                <span
                  style={{
                    display: 'grid',
                    gap: 6,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  {notes.map((n) => (
                    <span
                      key={n.text}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        font: '400 11.5px var(--font-body)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {n.swatch === 'dot' ? (
                        <span
                          aria-hidden
                          style={{
                            position: 'relative',
                            width: 16,
                            height: 16,
                            flex: '0 0 16px',
                            borderRadius: 4,
                            background: 'var(--st-done)',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: -3,
                              right: -3,
                              width: 9,
                              height: 9,
                              borderRadius: 999,
                              background: 'var(--st-progress)',
                              border: '1.5px solid #fff',
                            }}
                          />
                        </span>
                      ) : (
                        <span
                          aria-hidden
                          className={
                            n.swatch === 'ring'
                              ? 'cell-now'
                              : n.swatch === 'hatch-soft'
                                ? 'hatch hatch-soft'
                                : 'hatch'
                          }
                          style={{
                            width: 16,
                            height: 16,
                            flex: '0 0 16px',
                            borderRadius: 4,
                            background: n.swatch === 'ring' ? '#fff' : undefined,
                            border:
                              n.swatch === 'ring' ? '1px solid var(--border-default)' : undefined,
                          }}
                        />
                      )}
                      {n.text}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          ) : (
            lines.map((l) => (
              <div
                key={l}
                style={{
                  font: '400 12px/1.5 var(--font-body)',
                  color: 'var(--text-secondary)',
                }}
              >
                • {l}
              </div>
            ))
          )}
        </div>
      ) : null}
    </span>
  );
}

/* ---------------------------------------------------------------- chips */

export function DeltaChip({ delta, tip }: { delta: number | null; tip: TipContent }) {
  const handlers = useTip(tip);
  if (delta === null) return null;
  const glyph =
    delta > 0 ? (
      <TrendingUp size={10} strokeWidth={2.5} />
    ) : delta < 0 ? (
      <TrendingDown size={10} strokeWidth={2.5} />
    ) : (
      '='
    );
  const text = delta === 0 ? '=' : `${delta > 0 ? '+' : ''}${delta}`;
  return (
    <span
      {...handlers}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 7px',
        borderRadius: 999,
        background: 'var(--track)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-secondary)',
        font: '600 10.5px var(--font-body)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{glyph}</span>
      {text}
    </span>
  );
}

/* ---------------------------------------------------------------- glyphs */

const GLYPHS: Record<StatusId, ReactNode> = {
  done: <Check size={12} strokeWidth={3} />,
  recorded: <Circle size={8} fill="currentColor" strokeWidth={0} />,
  progress: <Clock size={12} strokeWidth={3} />,
  notyet: <X size={12} strokeWidth={3} />,
  blank: '',
};

export function statusGlyph(status: StatusId): ReactNode {
  return GLYPHS[status];
}
