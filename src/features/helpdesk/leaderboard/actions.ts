"use server";

import { requireActionPermission } from "@/lib/access/session";
import { OverSlaDetailTicketsSchema } from "@/lib/access/schemas";
import { getOverSlaDetailTickets } from "./services/leaderboardService";

export async function fetchOverSlaDetailTickets(ticketNos: string[]) {
  const access = await requireActionPermission(
    "menu.helpdesk.leaderboard.view",
  );
  const validated = OverSlaDetailTicketsSchema.parse(ticketNos);
  return getOverSlaDetailTickets(validated, access.scope);
}
