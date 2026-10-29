import type { RatingsDistribution } from "../../overview/types/ratingDistribution.types";
import type { ComparisonFilter } from "../../comparison/services/comparisonService";

export interface TicketRatingFilter extends ComparisonFilter {
  startDate?: string;
  endDate?: string;
}

export interface LowRatingTicket {
  ticketNo: string;
  rating: number;
  support: string;
  department: string;
  branch: string;
  date: string;
  subject: string;
  status: string;
  notes: string;
  resolution: string;
}

export interface TicketRatingData extends RatingsDistribution {
  lowRatingTickets: LowRatingTicket[];
}
