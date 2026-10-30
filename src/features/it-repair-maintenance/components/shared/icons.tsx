import type { SVGProps } from "react";

/**
 * Ikon garis 24x24 yang dipakai artefak desain (port dari `icons` di skrip
 * desain dan ikon internal design system). Ukurannya diatur CSS wadahnya
 * (`.dd-kpi__tile svg`, `.dd-tfilter__icon svg`, `.dd-empty svg`, dsb.).
 */
function Svg({ sw = 1.8, children, ...rest }: SVGProps<SVGSVGElement> & { sw?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconGrid = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
  </Svg>
);
export const IconWrench = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M14.7 6.3a4 4 0 0 0 5 5L13 18a2.1 2.1 0 0 1-3-3l6.7-6.7Zm0 0L20 3M4 20l4-4" />
  </Svg>
);
export const IconPackage = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 3 20 7v10l-8 4-8-4V7Z" />
    <path d="M4 7l8 4 8-4M12 11v10" />
  </Svg>
);
export const IconDoc = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <polyline points="14 3 14 8 19 8" />
  </Svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12.5 11 15.5 16 9" />
  </Svg>
);
export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7.5 12 12 15.5 14" />
  </Svg>
);
export const IconAlert = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <path d="M12 4 21 19H3Z" />
    <line x1="12" y1="10" x2="12" y2="14" />
    <line x1="12" y1="16.5" x2="12" y2="16.6" />
  </Svg>
);
export const IconFlag = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <path d="M5 4v16" />
    <path d="M5 5h11l-1.5 4L16 13H5Z" />
  </Svg>
);
export const IconTag = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <path d="M20 12.5 12.5 20 4 11.5V4h7.5Z" />
    <circle cx="8" cy="8" r="1.2" />
  </Svg>
);
export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
  </Svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} strokeLinejoin={undefined} {...p}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </Svg>
);
export const IconTick = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={3.5} {...p}>
    <path d="M5 13l5 5 9-12" />
  </Svg>
);
export const IconBox = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 8 12 4l9 4-9 4Z" />
    <path d="M3 8v8l9 4 9-4V8" />
  </Svg>
);
export const IconChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <polyline points="6 9 12 15 18 9" />
  </Svg>
);
export const IconChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <polyline points="9 6 15 12 9 18" />
  </Svg>
);
