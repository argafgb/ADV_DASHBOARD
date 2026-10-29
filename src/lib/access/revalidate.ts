import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Daftar tag cache yang perlu di-revalidate saat ada perubahan hak akses,
 * role, atau cakupan data organisasi.
 */
const ACCESS_REVALIDATION_TAGS = [
  "access-branch-options",
  "overview-sla-v2",
  "overview-total-ticket-dist-v2",
  "overview-rating-dist-v2",
  "sla-performance-main-v2",
  "sla-performance-problem-v2",
  "sla-performance-response-v2",
  "dispatcher-reopen-stats-v2",
  "comparison-frequency-v2",
  "comparison-monthly-summary-v2",
  "comparison-volume-by-dept-v2",
  "comparison-category-v2",
  "comparison-summary-problem-v2",
  "comparison-app-menu-v2",
  "leaderboard-eom-v2",
  "leaderboard-productivity-v2",
  "leaderboard-absences-v2",
  "leaderboard-low-ratings-v2",
  "leaderboard-over-sla-v2",
  "leaderboard-oversla-detail-v2",
  "rating-root-cause-v2",
  "rating-root-cause-detail-v2",
  "rating-root-cause-hierarchy-v2",
  "rating-feedback-summary-v2",
  "rating-detail-tickets-v2",
  "ticket-arrival-schedule-v2",
  "fsd-blueprint-list",
];

/**
 * Membersihkan cache server Next.js (layout & query tags) secara otomatis
 * setiap kali terjadi mutasi pada modul Access Management.
 */
export function revalidateAccessChanges(): void {
  try {
    revalidatePath("/dashboard", "layout");
  } catch (err) {
    console.warn("[revalidateAccessChanges] Gagal me-revalidatePath '/dashboard':", err);
  }

  for (const tag of ACCESS_REVALIDATION_TAGS) {
    try {
      revalidateTag(tag, "default");
    } catch (err) {
      console.warn(`[revalidateAccessChanges] Gagal me-revalidateTag '${tag}':`, err);
    }
  }

  console.log(
    `[revalidateAccessChanges] Berhasil me-revalidate layout dan ${ACCESS_REVALIDATION_TAGS.length} cache tags pada ${new Date().toISOString()}`,
  );
}
