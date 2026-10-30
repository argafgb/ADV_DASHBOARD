export interface TicketFrequency {
  year: number;
  ticketCount: number;
  ticketDiff: number | null;
  growthPercentage: number | null;
}

export interface TicketVolumeByDepartment {
  departmentName: string;
  ticketsPrevYear: number;
  ticketsSelectedYear: number;
  ticketDiff: number;
  growthPercentage: number;
}

export interface TicketMonthlySummary {
  year: number;
  month: number;
  ticketCount: number;
  ticketDiff: number;
  growthPercentage: number;
}

export interface MonthlyVolumeCompare {
  month: string;
  yearPrev: number;
  yearCurrent: number;
}

export interface TicketMonthlyComparison {
  month: number;
  ticketsPrevYear: number;
  ticketsSelectedYear: number;
  totalTickets: number;
  growthPercentage: number | null;
}

export interface TicketFeatureItem {
  feature: string;
  ticketsPrevYear: number;
  ticketsSelectedYear: number;
  ticketDiff: number;
  growthPercentage: number | null;
}

export interface TicketVolumeByCategory {
  topGroups?: { name: string; tickets: number }[];
  topFeatures?: TicketFeatureItem[];
  category: string;
  ticketsPrevYear: number;
  ticketsSelectedYear: number;
  ticketDiff: number;
  growthPercentage: number | null;
}

export interface MonthlyCategoryComparison {
  month: number;
  category: string;
  ticketsPrevYear: number;
  ticketsSelectedYear: number;
  totalTickets: number;
  growthPercentage: number | null;
}

export interface MonthlyAppMenuComparison {
  month: number;
  app: string;
  feature: string;
  ticketsPrevYear: number;
  ticketsSelectedYear: number;
  totalTickets: number;
  growthPercentage: number | null;
}

export interface AppMenuIssueItem {
  problemLevel2: string;
  count: number;
  percentage: number;
}

export interface AppMenuBranchItem {
  branchName: string;
  count: number;
}

export interface AppMenuTicketItem {
  ticketNo: string;
  branchName: string;
  subject: string;
  problemLvl2?: string | null;
  resolveReason: string | null;
  timeInput: string | null;
  statusTicketDescs: string | null;
}

export interface AppMenuFieldIssueDetail {
  periodLabel?: string;
  month: number;
  year: number;
  app: string;
  feature: string;
  totalTickets: number;
  topIssues: AppMenuIssueItem[];
  topBranches: AppMenuBranchItem[];
  tickets: AppMenuTicketItem[];
}
