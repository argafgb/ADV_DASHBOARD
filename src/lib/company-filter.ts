import type { CompanyCode, CompanyFilterValue } from "@/types/asset-pm.types";

export const ALL_COMPANY_CODES: readonly CompanyCode[] = [
  "ADV",
  "WSS",
  "ETR",
] as const;

export const COMPANY_CODE_MAP: Record<string, CompanyCode> = {
  ADV: "ADV",
  ADVANTAGE: "ADV",
  WSS: "WSS",
  WISESA: "WSS",
  ETR: "ETR",
  ETRAMA: "ETR",
};

export const COMPANY_LABELS: Record<
  CompanyCode,
  { full: string; short: string }
> = {
  ADV: { full: "Advantage (ADV)", short: "ADV" },
  WSS: { full: "Wisesa (WSS)", short: "WSS" },
  ETR: { full: "Etrama (ETR)", short: "ETR" },
};

export interface ParsedCompanyFilter {
  codes: CompanyCode[];
  isAll: boolean;
  canonicalKey: CompanyFilterValue;
  displayLabel: string;
}

/**
 * Parses and canonicalizes company filter string (e.g. "ALL", "WSS", "ADV,WSS").
 */
export function parseCompanyFilter(raw?: string | null): ParsedCompanyFilter {
  if (!raw) {
    return {
      codes: [...ALL_COMPANY_CODES],
      isAll: true,
      canonicalKey: "ALL",
      displayLabel: "Semua",
    };
  }

  const clean = raw.trim().toUpperCase();
  if (!clean || clean === "ALL") {
    return {
      codes: [...ALL_COMPANY_CODES],
      isAll: true,
      canonicalKey: "ALL",
      displayLabel: "Semua",
    };
  }

  const parts = clean.split(/[,+]/).map((p) => p.trim());
  const matchedCodes = new Set<CompanyCode>();

  for (const part of parts) {
    const code = COMPANY_CODE_MAP[part];
    if (code) {
      matchedCodes.add(code);
    }
  }

  if (matchedCodes.size === 0 || matchedCodes.size === ALL_COMPANY_CODES.length) {
    return {
      codes: [...ALL_COMPANY_CODES],
      isAll: true,
      canonicalKey: "ALL",
      displayLabel: "Semua",
    };
  }

  const sortedCodes = Array.from(matchedCodes).sort((a, b) =>
    a.localeCompare(b),
  );
  const canonicalKey = sortedCodes.join(",");
  const displayLabel = sortedCodes
    .map((c) => COMPANY_LABELS[c].short)
    .join(" + ");

  return {
    codes: sortedCodes,
    isAll: false,
    canonicalKey,
    displayLabel,
  };
}

/**
 * Normalizes company filter string to canonical value: "ALL", "ADV", "WSS", "ETR", or comma-separated "ADV,WSS", etc.
 */
export function normalizeCompany(raw?: string | null): CompanyFilterValue {
  return parseCompanyFilter(raw).canonicalKey;
}

/**
 * Toggles a company code in an active filter value and returns the new canonical filter value.
 */
export function toggleCompanyFilter(
  current: CompanyFilterValue,
  code: CompanyCode,
): CompanyFilterValue {
  const parsed = parseCompanyFilter(current);
  let activeSet: Set<CompanyCode>;

  if (parsed.isAll) {
    activeSet = new Set(ALL_COMPANY_CODES);
  } else {
    activeSet = new Set(parsed.codes);
  }

  if (activeSet.has(code)) {
    activeSet.delete(code);
  } else {
    activeSet.add(code);
  }

  if (activeSet.size === 0 || activeSet.size === ALL_COMPANY_CODES.length) {
    return "ALL";
  }

  return Array.from(activeSet).sort((a, b) => a.localeCompare(b)).join(",");
}
