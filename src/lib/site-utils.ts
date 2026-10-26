/**
 * Canonical site mapping and normalization helper.
 * Standardizes site names across database tables and global filters according to SOP.
 */

const CANONICAL_SITE_ALIASES: Record<string, string> = {
  "FRAUD MGMT": "FRAUD MANAGEMENT",
  "LEGAL MGMT": "LEGAL",
  "LEGAL - COMPLIANCE": "LEGAL",
  "OPS LOGISTIK": "OPERATIONAL LOGISTIC",
  "OPERATION LOGISTIC": "OPERATIONAL LOGISTIC",
  RISK: "RISK MANAGEMENT",
  "RISK MGMT": "RISK MANAGEMENT",
  RISKMGT: "RISK MANAGEMENT",
  "DIV-RISKMGT": "RISK MANAGEMENT",
  "FLEET MANAGEMENT": "FLEET",
  "CARGO & GUARD": "CARGO",
  "WIRA CERITA": "WIRA CARITA",
  WIRACARITA: "WIRA CARITA",
  "IT CIDENG": "IT",
  "IT SEMARANG": "IT",
  "IT AMPASIT": "IT",
  "IT WISESA": "IT",
  WSS: "IT",
  "DIV-WSS": "IT",
  "DIV-IT": "IT",
  "DIV-ETRAMA": "ETRAMA",
  CP: "CORPLAN",
  "CORPORATE PLANNING": "CORPLAN",
  "DIV-CP": "CORPLAN",
  "DIV-CORPLAN": "CORPLAN",
  FIN: "FINANCE",
  "DIV-FIN": "FINANCE",
  "DIV-GA": "SENEN GA",
  "GA SENEN": "SENEN GA",
  SENEN: "SENEN GA",
  "DIV-CPP": "CPP",
};

const REVERSE_SITE_ALIASES: Record<string, string[]> = {
  "FRAUD MANAGEMENT": ["FRAUD MANAGEMENT", "FRAUD MGMT"],
  LEGAL: ["LEGAL", "LEGAL MGMT", "LEGAL - COMPLIANCE"],
  "OPERATIONAL LOGISTIC": [
    "OPERATIONAL LOGISTIC",
    "OPS LOGISTIK",
    "OPERATION LOGISTIC",
  ],
  "RISK MANAGEMENT": [
    "RISK MANAGEMENT",
    "RISK MGMT",
    "RISK",
    "RISKMGT",
    "DIV-RISKMGT",
  ],
  FLEET: ["FLEET", "FLEET MANAGEMENT"],
  CARGO: ["CARGO", "CARGO & GUARD"],
  "WIRA CARITA": ["WIRA CARITA", "WIRA CERITA", "WIRACARITA"],
  CORPLAN: ["CORPLAN", "CP", "CORPORATE PLANNING", "DIV-CP", "DIV-CORPLAN"],
  FINANCE: ["FINANCE", "FIN", "DIV-FIN"],
  ACCOUNTING: ["ACCOUNTING", "ACC"],
  DP: ["DP", "DEVELOPMENT & PERFORMANCE", "DEP-DP"],
  ETRAMA: ["ETRAMA", "DIV-ETRAMA"],
  "SENEN GA": ["SENEN GA", "SENEN", "GA SENEN", "DIV-GA"],
  CPP: ["CPP", "DIV-CPP", "GA CPP"],
  GACPP: ["GACPP", "DIV-GACPP"],
  IT: [
    "IT",
    "IT CIDENG",
    "IT SEMARANG",
    "IT AMPASIT",
    "IT WISESA",
    "WSS",
    "DIV-WSS",
    "DIV-IT",
  ],
};

const INVALID_SITES = new Set([
  "",
  "-",
  "JAKARTA",
  "CIDENG",
  "JAKARTA-CIDENG",
  "TEST",
  "TEST 2",
  "TEST 3",
  "TEST 4",
  "TEST 5",
]);

/**
 * Normalizes a raw site string to its canonical SOP site name.
 * Returns null if the site is invalid, empty, or an excluded placeholder/test site.
 */
export function normalizeSiteName(rawSite?: string | null): string | null {
  if (!rawSite) return null;

  const trimmed = rawSite.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();

  // Exclude invalid/test/general sites
  if (INVALID_SITES.has(upper) || upper.startsWith("TEST")) {
    return null;
  }

  // Check alias mapping first
  if (CANONICAL_SITE_ALIASES[upper]) {
    return CANONICAL_SITE_ALIASES[upper];
  }

  return upper;
}

/**
 * Returns all raw site aliases associated with a canonical site name.
 * Used for database queries to match raw site variants in SQL.
 */
export function getRawSiteAliases(site: string): string[] {
  const norm = normalizeSiteName(site);
  if (!norm) return [site];
  return REVERSE_SITE_ALIASES[norm] ?? [norm];
}

/**
 * Checks whether two site values match (accounting for normalization).
 */
export function isSameSite(
  siteA?: string | null,
  siteB?: string | null,
): boolean {
  if (!siteA || !siteB) return false;
  const normA = normalizeSiteName(siteA);
  const normB = normalizeSiteName(siteB);
  if (!normA || !normB) return false;
  return normA === normB;
}

export const KNOWN_UNITS: readonly string[] = [
  "COS",
  "IT",
  "CARGO",
  "DP",
  "RISK",
  "RISKMGT",
  "RISK MANAGEMENT",
  "HR",
  "FIN",
  "FINANCE",
  "LEGAL",
  "MKT",
  "MARKETING",
  "PROCIN",
  "PROCUREMENT",
  "FRAUD",
  "GA",
  "GACPP",
  "BD",
  "CP",
  "CPP",
  "FLEET",
  "CORPLAN",
  "SKAI",
  "BPD",
  "LCCS",
  "ACCOUNTING",
  "ETRAMA",
  "OPS",
  "OPERATIONS LOGISTIK",
  "OPERATIONAL LOGISTIC",
  "GUARD",
  "DNP",
  "WIRA CARITA",
] as const;

/**
 * Determines whether a given site or unit name belongs to an internal Unit vs Operational Site.
 */
export function isUnitSite(siteName: string): boolean {
  if (!siteName) return false;
  const upper = siteName.toUpperCase().trim();
  return KNOWN_UNITS.some((u) => upper === u || upper.startsWith(u + " "));
}
