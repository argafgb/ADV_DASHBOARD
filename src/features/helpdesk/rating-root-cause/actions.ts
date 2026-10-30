"use server";

import { requireActionPermission } from "@/lib/access/session";
import { RatingRootCauseFilterSchema } from "@/lib/access/schemas";
import {
  getRootCauseDivisionSummary,
  getRootCauseDetailTickets,
  getRootCauseHierarchy,
} from "./services/rootCauseService";
import {
  getRatingFeedbackSummary,
  getRatingDetailTickets,
} from "./services/ratingFeedbackService";
import { getTicketArrivalSchedule } from "./services/ticketScheduleService";

export async function fetchRatingFeedbackSummary(filters: {
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
}) {
  const access = await requireActionPermission(
    "menu.helpdesk.rating-root-cause.view",
  );
  return getRatingFeedbackSummary(filters, access.scope);
}

export async function fetchTicketArrivalSchedule(filters: {
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
}) {
  const access = await requireActionPermission(
    "menu.helpdesk.rating-root-cause.view",
  );
  return getTicketArrivalSchedule(filters, access.scope);
}

export async function fetchRatingDetailTickets(filters: {
  rating: number;
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
  limit?: number;
  offset?: number;
}) {
  const access = await requireActionPermission(
    "menu.helpdesk.rating-root-cause.view",
  );
  const validated = RatingRootCauseFilterSchema.safeParse(filters);
  const safeLimit = validated.success ? validated.data.limit : Math.min(Math.max(1, Number(filters.limit) || 50), 100);
  const safeOffset = validated.success ? validated.data.offset : Math.max(0, Number(filters.offset) || 0);

  return getRatingDetailTickets(
    {
      ...filters,
      rating: Math.min(5, Math.max(0, Number(filters.rating) || 0)),
      limit: safeLimit,
      offset: safeOffset,
    },
    access.scope,
  );
}

// Sunburst types
type LeafItem = {
  name: string;
  value: number;
};

type DivisionItem = {
  name: string;
  value: number;
  details: LeafItem[];
};

type CauseItem = {
  rank: number;
  name: string;
  value: number;
  color: string;
  divisions: DivisionItem[];
};

export async function fetchRootCauseDivisionSummary(filters: {
  type_temuan: string;
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
}) {
  const access = await requireActionPermission(
    "menu.helpdesk.rating-root-cause.view",
  );
  return getRootCauseDivisionSummary(
    {
      ...filters,
      type_temuan: (filters.type_temuan || "").slice(0, 100),
    },
    access.scope,
  );
}

export async function fetchRootCauseDetailTickets(filters: {
  type_temuan: string;
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
  group_problem?: string;
  limit?: number;
  offset?: number;
}) {
  const access = await requireActionPermission(
    "menu.helpdesk.rating-root-cause.view",
  );
  const validated = RatingRootCauseFilterSchema.safeParse(filters);
  const safeLimit = validated.success ? validated.data.limit : Math.min(Math.max(1, Number(filters.limit) || 50), 100);
  const safeOffset = validated.success ? validated.data.offset : Math.max(0, Number(filters.offset) || 0);

  return getRootCauseDetailTickets(
    {
      ...filters,
      type_temuan: (filters.type_temuan || "").slice(0, 100),
      group_problem: (filters.group_problem || "ALL").slice(0, 100),
      limit: safeLimit,
      offset: safeOffset,
    },
    access.scope,
  );
}

export async function fetchRootCauseHierarchy(filters: {
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
}): Promise<CauseItem[]> {
  const access = await requireActionPermission(
    "menu.helpdesk.rating-root-cause.view",
  );
  const rawRows = await getRootCauseHierarchy(filters, access.scope);

  // Group by root_cause -> division -> detail_name
  const tree: Record<
    string,
    {
      value: number;
      divisions: Record<
        string,
        {
          value: number;
          details: Record<string, number>;
        }
      >;
    }
  > = {};

  rawRows.forEach((row) => {
    const rootName = row.root_cause.toUpperCase();
    const divName = row.division;
    const detailName = row.detail_name;
    const count = row.ticket_count;

    if (!tree[rootName]) {
      tree[rootName] = { value: 0, divisions: {} };
    }
    tree[rootName].value += count;

    if (!tree[rootName].divisions[divName]) {
      tree[rootName].divisions[divName] = { value: 0, details: {} };
    }
    tree[rootName].divisions[divName].value += count;

    if (!tree[rootName].divisions[divName].details[detailName]) {
      tree[rootName].divisions[divName].details[detailName] = 0;
    }
    tree[rootName].divisions[divName].details[detailName] += count;
  });

  const PALETTE = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#06b6d4", // cyan-500
  ];

  return Object.entries(tree)
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 6)
    .map(([rootName, rootData], i) => ({
      rank: i + 1,
      name: rootName,
      value: rootData.value,
      color: PALETTE[i % PALETTE.length],
      divisions: Object.entries(rootData.divisions)
        .sort(([, a], [, b]) => b.value - a.value)
        .map(([divName, divData]) => ({
          name: divName,
          value: divData.value,
          details: Object.entries(divData.details)
            .sort(([, a], [, b]) => b - a)
            .map(([detailName, count]) => ({
              name: detailName,
              value: count,
            })),
        })),
    }));
}
