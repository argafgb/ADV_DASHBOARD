/**
 * Satu-satunya tempat yang boleh berbeda antar dashboard.
 *
 * Seluruh file di src/components/dashboard-panel/ dan BrowseDashboardModal
 * sengaja dibuat identik di semua repo dashboard supaya tidak drift lagi;
 * apapun yang khas per dashboard dibaca dari sini.
 */
export const DASHBOARD_CONFIG = {
  /** Huruf di kotak gradient sidebar. Sama untuk semua dashboard. */
  logoInitial: "A",
  /** Nama perusahaan di sidebar dan sheet menu. */
  brandName: "Advantage SCM",
  /** URL IT Dashboard Hub yang dituju saat logo diklik. */
  hubUrl:
    process.env.NEXT_PUBLIC_DASHBOARD_HUB_URL || "http://103.76.204.104:5777/",
  /** Nama dashboard ini, tampil di bawah brand. Ikut katalog Browse Dashboards. */
  subtitle: "IT & DCT Helpdesk Dashboard",
  /** Judul header saat menu aktif tidak punya label. */
  pageTitleFallback: "Helpdesk & Ticketing",
  /** Nama entri dashboard ini di dalam katalog Browse Dashboards. */
  catalogName: "IT & DCT Helpdesk Dashboard",
  /**
   * Opsi filter tahun. Satu-satunya tempat yang perlu disunting saat
   * tahun berganti; elemen pertama dipakai sebagai default.
   */
  years: ["2026", "2025"] as const,
  /** Bulan default saat URL tidak membawa filter bulan. */
  defaultMonth: "ALL",
} as const;

/** Tahun yang dipilih saat URL belum membawa parameter `year`. */
export const DEFAULT_YEAR = DASHBOARD_CONFIG.years[0];

/** Opsi siap pakai untuk FilterChip di navbar. */
export const YEAR_OPTIONS = DASHBOARD_CONFIG.years.map((y) => ({ v: y, t: y }));

/** Bulan yang dipilih saat URL belum membawa parameter `month`. */
export const DEFAULT_MONTH = DASHBOARD_CONFIG.defaultMonth;

/** DEFAULT_MONTH sebagai indeks 0-based, untuk view yang mengindeks MONTHS[]. */
export const DEFAULT_MONTH_INDEX = Number(DASHBOARD_CONFIG.defaultMonth) - 1;

/**
 * Tahun pembanding untuk `year`: tepat satu entri setelahnya di `years`.
 *
 * Mengembalikan null bila pembandingnya tidak ada, dan halaman lalu tampil satu
 * tahun saja. Ini disengaja: memaksakan pembanding yang datanya belum ada bikin
 * seluruh chart terbaca seolah turun ke nol. Karena urutannya diambil dari
 * `years`, menambah tahun baru di config sekaligus mempromosikan tahun lama
 * jadi pembanding tanpa menyentuh satu pun file lain.
 */
export function comparisonYearOf(year: string): string | null {
  const years: readonly string[] = DASHBOARD_CONFIG.years;
  const index = years.indexOf(year);
  return index < 0 ? null : (years[index + 1] ?? null);
}

/** Pembanding untuk DEFAULT_YEAR; null bila tahun sebelumnya belum ada datanya. */
export const COMPARISON_YEAR = comparisonYearOf(DEFAULT_YEAR);
