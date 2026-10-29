export interface TicketArrivalHourRow {
  department: string;
  date: string;
  hour: number;
  tickets: number;
}

export interface TicketArrivalScheduleData {
  rows: TicketArrivalHourRow[];
  latestTimeInput: string | null;
}

export interface TicketArrivalScheduleFilters {
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
}
