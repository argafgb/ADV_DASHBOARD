import type { Branch, IspLink } from "../types/network.types";

export interface DonutSlice {
  name: string;
  count: number;
  branches: string[];
  vendors?: string[];
  color: string;
}

export interface IspDirectory {
  /** active branches that have at least one ISP record */
  ispBranches: string[];
  /** = ispBranches.length — the denominator for every share on this page */
  opCount: number;
  /** all active branches, including those with no ISP record */
  activeCount: number;
  ispTotalLinks: number;
  avgLinks: string;
  donutData: DonutSlice[];
}

export interface IspService {
  contractMbps(branch: string): number;
  contractSplit(branch: string): string;
  vendorsOf(branch: string): string;
  directory: IspDirectory;
  /** 1..5 links -> branch names; branches with no record are in neither */
  redundancyBuckets: Record<number, string[]>;
}

const FALLBACK_COLOR = "#9CA3AF";
const TAIL_COLOR = "#C2C8D2";

/**
 * ISP link derivations, bound to the rows handed down from the server.
 *
 * Two things the mock version did that the real data makes unnecessary:
 * an inline `Indizbiz -> Indibiz` typo patch, now handled upstream by
 * `isp_vendor_aliases`, and a hardcoded colour map, now `isp_vendors.color_hex`.
 *
 * `opCount` counts branches that actually have an ISP record, not all active
 * branches. Three active branches have none — Ampasit and Cideng, whose links
 * sit on the retired combined site, and Tanah Abang 5, which has no Notion row
 * at all. Dividing by 40 would quietly understate every share; the shortfall
 * is surfaced in the UI instead.
 */
export function createIspService(
  links: Record<string, IspLink[]>,
  colors: Record<string, string>,
  branches: Branch[],
): IspService {
  const linksOf = (branch: string): IspLink[] => links[branch] ?? [];

  const ispBranches = branches
    .map((b) => b.name)
    .filter((n) => linksOf(n).length > 0)
    .sort();

  const allLinks = ispBranches.flatMap((branch) =>
    linksOf(branch).map((l) => ({ branch, v: l.v, mbps: l.mbps })),
  );

  const vmap: Record<string, { count: number; branches: string[] }> = {};
  for (const l of allLinks) {
    const e = (vmap[l.v] ??= { count: 0, branches: [] });
    e.count++;
    if (!e.branches.includes(l.branch)) e.branches.push(l.branch);
  }

  const vlist = Object.keys(vmap)
    .map((v) => ({ name: v, count: vmap[v].count, branches: vmap[v].branches }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Vendors with a single link collapse into one "Lainnya" slice, otherwise
  // the donut becomes a ring of hairlines.
  const vTail = vlist.filter((v) => v.count === 1);
  const donutData: DonutSlice[] = vlist
    .filter((v) => v.count > 1)
    .map((v) => ({
      name: v.name,
      count: v.count,
      branches: v.branches,
      color: colors[v.name] ?? FALLBACK_COLOR,
    }));
  if (vTail.length) {
    donutData.push({
      name: "Lainnya",
      count: vTail.reduce((a, v) => a + v.count, 0),
      branches: vTail.map((v) => v.branches[0]),
      vendors: vTail.map((v) => v.name),
      color: TAIL_COLOR,
    });
  }

  const redundancyBuckets: Record<number, string[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  for (const branch of ispBranches) {
    redundancyBuckets[Math.min(5, linksOf(branch).length)].push(branch);
  }

  const opCount = ispBranches.length;

  return {
    // Links with an unrecorded bandwidth contribute 0 rather than skewing the
    // total. Several vendors (LiveOn, Starlink, Axis) have no figure in Notion.
    contractMbps: (branch) =>
      linksOf(branch).reduce((a, l) => a + (l.mbps ?? 0), 0),

    contractSplit: (branch) =>
      linksOf(branch)
        .filter((l) => l.mbps)
        .map((l) => l.v + " " + l.mbps)
        .join(" + "),

    vendorsOf: (branch) =>
      linksOf(branch)
        .map((l) => l.v)
        .join(", "),

    directory: {
      ispBranches,
      opCount,
      activeCount: branches.length,
      ispTotalLinks: allLinks.length,
      avgLinks: opCount > 0 ? (allLinks.length / opCount).toFixed(1) : "0.0",
      donutData,
    },

    redundancyBuckets,
  };
}
