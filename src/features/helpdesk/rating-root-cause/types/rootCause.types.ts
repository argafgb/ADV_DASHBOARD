export type Quarter = "All" | "Q1" | "Q2" | "Q3" | "Q4";

export type RatingRootCauseTab = "rootCause" | "rating" | "ticketRating";

export type RootCauseChartMode = "bar" | "treemap";

export type RootCauseDepartment = "DCT Support" | "IT Support" | "ALL";

export type RootCauseColor =
  | "violet"
  | "red"
  | "cyan"
  | "amber"
  | "emerald"
  | "blue";

export type RootCauseIconKey =
  | "human"
  | "bug"
  | "data"
  | "education"
  | "software"
  | "improvement";

export type RootCauseLeaf = {
  name: string;
  tickets: number;
};

export type RootCauseChild = {
  name: string;
  tickets: number;
  children?: RootCauseLeaf[];
};

export type RootCauseItem = {
  rank: number;
  name: string;
  tickets: number;
  growth: number | null;
  sharePercentage?: number;
  color: RootCauseColor;
  iconKey: RootCauseIconKey;
  department: RootCauseDepartment;
  children: RootCauseChild[];
};

export type RatingDistributionRow = {
  label: string;
  tickets: number;
  percentage: number;
  type: "good" | "bad" | "neutral";
};

export type RootCauseDetailTicket = {
  no: number;
  ticketNo: string;
  tanggal: string;
  pengirim: string;
  divisi: string;
  judulTicket: string;
};

export interface RootCauseQueryFilter {
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
}

export type RootCauseQueryResultRow = {
  root_cause: string;
  current_tickets: number;
  prev_tickets: number;
  growth_percentage: number | null;
  rank: number;
};

export type ActionITQueryResultRow = {
  name: string;
  count: number;
};

export type ActionITItem = {
  name: string;
  count: number;
  percentage: number;
  color: string;
};
