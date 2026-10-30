import type { SVGProps } from "react";

/**
 * Ikon garis 24x24 yang dipakai artefak desain (port dari `icons` di
 * skrip desain). Mengisi ukuran wadahnya (width/height 100%) supaya tile,
 * chip, dan tombol yang menentukan dimensinya.
 */
function Svg({
  sw = 1.8,
  children,
  ...rest
}: SVGProps<SVGSVGElement> & { sw?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
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

export const IconList = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h10" />
  </Svg>
);
export const IconAlert = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <path d="M12 4 21 19H3Z" />
    <path d="M12 10v4" />
    <path d="M12 16.4v.2" />
  </Svg>
);
export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3.5 2" />
  </Svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M5 12.5l4.2 4.2L19 7" />
  </Svg>
);
export const IconUserX = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="10" cy="8" r="3.2" />
    <path d="M3.5 20c0-3.3 2.9-5.4 6.5-5.4.9 0 1.8.1 2.6.4" />
    <path d="M16.5 14.5l4.5 4.5" />
    <path d="M21 14.5l-4.5 4.5" />
  </Svg>
);
export const IconQueue = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </Svg>
);
export const IconHold = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5v7" />
    <path d="M14 8.5v7" />
  </Svg>
);
export const IconTeam = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.4 6-5.4s6 2.1 6 5.4" />
    <path d="M16 5.2A3.2 3.2 0 0 1 16 11" />
    <path d="M18 14.9c2 .7 3 2.5 3 5.1" />
  </Svg>
);
export const IconBoard = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 4.5h4.5v15H4z" />
    <path d="M10.5 4.5H15v10h-4.5z" />
    <path d="M17 4.5h3.5v7H17z" />
  </Svg>
);
export const IconTable = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 5h16v14H4z" />
    <path d="M4 10h16" />
    <path d="M10 10v9" />
  </Svg>
);
export const IconGrid = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 4.5h6v6H4z" />
    <path d="M14 4.5h6v6h-6z" />
    <path d="M4 13.5h6v6H4z" />
    <path d="M14 13.5h6v6h-6z" />
  </Svg>
);
export const IconChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const IconChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </Svg>
);
export const IconTick = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={3.5} {...p}>
    <path d="M5 13l5 5 9-12" />
  </Svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Svg>
);
export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <Svg sw={2} {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Svg>
);
