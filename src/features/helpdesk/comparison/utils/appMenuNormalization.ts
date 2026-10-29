import "server-only";
import { sql } from "@/lib/db";

/**
 * Normalises raw `category_problem` into consistent Application name:
 * - Android variations -> DCT ANDROID
 * - Specific software keywords -> SOFTWARE
 * - CCTV -> SOFTWARE
 * - VIRUS -> SOFTWARE
 * - VPN -> INFRASTRUCTURE
 * - PRINTER -> HARDWARE
 * - Fallback to UPPER(TRIM(category_problem))
 */
export function appSql() {
  return sql`
    CASE 
      WHEN category_problem ILIKE '%ANDROID%' THEN 'DCT ANDROID'
      WHEN category_problem ILIKE '%WPS%' THEN 'SOFTWARE'
      WHEN category_problem ILIKE '%CCTV%' THEN 'SOFTWARE'
      WHEN category_problem ILIKE '%VIRUS%' THEN 'SOFTWARE'
      WHEN category_problem ILIKE '%VPN%' THEN 'INFRASTRUCTURE'
      WHEN category_problem ILIKE '%PRINTER%' THEN 'HARDWARE'
      ELSE UPPER(TRIM(category_problem))
    END
  `;
}

/**
 * Normalises raw `problem_lvl1` (preferring master analisa lvl1) and `problem_type` into Feature / Menu name:
 * - Deterministic priority: problem_lvl1 > problem_type
 * - UPPER and TRIM
 * - Strips prefixes: ANDROID DCT, DCT ANDROID, KENDALA ANDROID, DCT WEB, DCT 4, DCT 3, DCT
 */
export function featureSql() {
  return sql`
    CASE 
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%FLM%' THEN 'FLM'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%CDC%' THEN 'CDC'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%E-HR%' THEN 'E-HR'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%PETTYCASH%' THEN 'PETTYCASH'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%KHASANAH%' THEN 'KHASANAH'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%VISITOR%' THEN 'VISITOR'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%STOCK OPNAME%' 
        OR UPPER(TRIM(COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')))) = 'SO' THEN 'STOCK OPNAME (SO)'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%SECURITY%' 
        OR UPPER(TRIM(COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')))) = 'SSS' THEN 'SECURITY (SSS)'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%WPS%' THEN 'WPS OFFICE'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%CCTV%' THEN 'PLAYER CCTV'
      WHEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), '')) ILIKE '%PRINTER%' THEN 'PRINTER'
      ELSE COALESCE(
        NULLIF(
          UPPER(TRIM(REGEXP_REPLACE(
            COALESCE(NULLIF(TRIM(problem_lvl1), ''), NULLIF(TRIM(problem_type), ''), 'Lain-lain'),
            '^(ANDROID DCT |DCT ANDROID |KENDALA ANDROID |DCT WEB |DCT 4 |DCT 3 |DCT )',
            '',
            'i'
          ))),
          ''
        ),
        'Lain-lain'
      )
    END
  `;
}
