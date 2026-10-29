import { sql } from "@/lib/db";

// Match CheckHD's TimeInputTrx/status population. Stored period columns can be stale.
export const comparisonDataset = sql`(
  SELECT EXTRACT(YEAR FROM (time_input - INTERVAL '7 hours'))::int AS year,
    EXTRACT(MONTH FROM (time_input - INTERVAL '7 hours'))::int AS month,
    EXTRACT(QUARTER FROM (time_input - INTERVAL '7 hours'))::int AS quarter,
    ticket_no, (time_input - INTERVAL '7 hours') AS time_input, category_problem, problem_type, problem_lvl1, problem_lvl2,
    department_name, branch_name, subject, resolve_reason, status_ticket, status_ticket_descs
  FROM helpdesk.helpdesk_datachat
  WHERE status_ticket <> '5'
) AS comparison_data`;

// Use the source hierarchy consistently. Do not infer menus from substring matches.
export const comparisonApp = sql`COALESCE(NULLIF(UPPER(TRIM(category_problem)), ''), 'LAIN-LAIN')`;
export const comparisonFeature = sql`COALESCE(NULLIF(UPPER(TRIM(problem_lvl1)), ''), NULLIF(UPPER(TRIM(problem_type)), ''), 'LAIN-LAIN')`;
export const comparisonProblemLevel2 = sql`CASE 
  WHEN UPPER(TRIM(problem_lvl2)) IN ('QUICK CHECK', 'ADVANCED CHECK', 'NO FEEDBACK', 'NO FEEEDBACK', 'FULL HANDLING', 'NO ACTION', '-', '')
    THEN COALESCE(NULLIF(UPPER(TRIM(problem_lvl1)), ''), 'BELUM DIISI (PROBLEM LEVEL 2)')
  ELSE COALESCE(
    NULLIF(NULLIF(UPPER(REGEXP_REPLACE(TRIM(problem_lvl2), '[[:space:]]+', ' ', 'g')), ''), '-'),
    NULLIF(NULLIF(UPPER(REGEXP_REPLACE(TRIM(problem_lvl1), '[[:space:]]+', ' ', 'g')), ''), '-'),
    'BELUM DIISI (PROBLEM LEVEL 2)'
  )
END`;
