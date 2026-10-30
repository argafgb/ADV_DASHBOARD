"use server";

import { z } from "zod";
import { requireActionPermission } from "@/lib/access/session";
import { getDashboardFilters } from "@/lib/helpdesk/dashboard-filters";
import { getReopenedTicketDetails } from "./services/reopenedTicketService";

const ReopenedTicketFilterSchema = z.object({
  year: z.string(),
  month: z.string(),
  dept: z.string(),
  page: z.number().int().min(1).max(100000),
});

export async function fetchReopenedTicketDetails(input: {
  year: string;
  month: string;
  dept: string;
  page: number;
}) {
  const access = await requireActionPermission("menu.helpdesk.sla-performance.view");
  const validated = ReopenedTicketFilterSchema.parse(input);
  const filters = getDashboardFilters(validated);
  return getReopenedTicketDetails({ ...filters, page: validated.page }, access.scope);
}
