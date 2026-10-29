"use server";

import { requireActionPermission } from "@/lib/access/session";
import { getTicketRatingData } from "../services/ticketRatingService";
import type { TicketRatingFilter } from "../types/ticketRating.types";
import { validateRatingPeriod } from "../utils/ratingPeriod";

export async function fetchLowRatingTicketsAction(filters: TicketRatingFilter) {
  const access = await requireActionPermission("menu.helpdesk.rating-root-cause.view");
  const error = validateRatingPeriod(filters.startDate, filters.endDate);
  if (error) throw new Error(error);
  if (!["ALL", "DCT Support", "IT Support"].includes(filters.dept ?? "ALL")) {
    throw new Error("Divisi tidak valid.");
  }
  const data = await getTicketRatingData(filters, access.scope);
  return data.lowRatingTickets;
}
