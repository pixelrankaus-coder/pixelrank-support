export type ViewType = "my_tickets" | "my_groups" | "agent";

export type TicketStatus = "open" | "pending" | "on_hold" | "closed";

export type TicketTab =
  | "pending"
  | "response_due"
  | "resolution_due"
  | "hold"
  | "all_tickets"
  | "created"
  | "requested"
  | "participated"
  | "mentioned"
  | "shared_with_me"
  | "shared_with_groups"
  | "watching"
  | "ccd"
  | "closed";

export interface DashboardStats {
  pending: number;
  onHold: number;
  resolutionDue: number;
  responseDue: number;
}

export interface CSATData {
  positive: { percentage: number; count: number };
  neutral: { percentage: number; count: number };
  negative: { percentage: number; count: number };
  overall: number;
}

export interface DashboardTicket {
  id: number;
  subject: string;
  createdAt: string;
  status: TicketStatus;
  brand: string;
  contact: {
    name: string;
    email: string;
  };
}

export interface PaginationInfo {
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface TabConfig {
  id: TicketTab;
  label: string;
  count?: number;
  hasInfo?: boolean;
}
