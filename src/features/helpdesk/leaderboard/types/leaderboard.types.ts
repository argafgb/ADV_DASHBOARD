export interface LeaderboardData {
  employeeOfMonth: Record<
    string,
    { name: string; badge: string; code?: string }
  >;
  targetMonth?: number;
  monthLabel?: string;
  productivity: { name: string; score: number }[];
  absences: { name: string; count: number }[];
  lowRatings: { ticketNo: string; name: string; rating: number }[];
  overSla: {
    type: "RESPONSE" | "RESOLVED";
    name: string;
    ticketCount: number;
    ticketList: string[];
  }[];
}

export interface OverSlaTicketDetail {
  ticketNo: string;
  date: string;
  dispatcher: string;
  division: string;
  subject: string;
  status: string;
}
