export type TicketViewId =
  | "all"
  | "undelivered"
  | "unresolved"
  | "my_open"
  | "raised"
  | "watching"
  | "archive"
  | "spam"
  | "trash";

export type ViewSection = "views" | "other";

export interface TicketView {
  id: TicketViewId;
  name: string;
  section: ViewSection;
}

// Views section - main ticket views
export const TICKET_VIEWS: TicketView[] = [
  {
    id: "all",
    name: "All tickets",
    section: "views",
  },
  {
    id: "undelivered",
    name: "All undelivered messages",
    section: "views",
  },
  {
    id: "unresolved",
    name: "All unresolved tickets",
    section: "views",
  },
  {
    id: "my_open",
    name: "New and my open tickets",
    section: "views",
  },
  {
    id: "raised",
    name: "Tickets I raised",
    section: "views",
  },
  {
    id: "watching",
    name: "Tickets I'm watching",
    section: "views",
  },
  // Other section
  {
    id: "archive",
    name: "Archive",
    section: "other",
  },
  {
    id: "spam",
    name: "Spam",
    section: "other",
  },
  {
    id: "trash",
    name: "Trash",
    section: "other",
  },
];

// Helper to get views by section
export function getViewsBySection(section: ViewSection): TicketView[] {
  return TICKET_VIEWS.filter((view) => view.section === section);
}

// Get filter query for each view
export function getFiltersForView(
  viewId: TicketViewId,
  currentUserId?: string
): Record<string, unknown> {
  switch (viewId) {
    case "all":
      return {};

    case "undelivered":
      // Not implemented yet - return all for now
      return {};

    case "unresolved":
      return {
        status: { in: ["OPEN", "PENDING"] },
      };

    case "my_open":
      if (!currentUserId) return { status: { in: ["OPEN", "PENDING"] } };
      return {
        status: { in: ["OPEN", "PENDING"] },
        assigneeId: currentUserId,
      };

    case "raised":
      if (!currentUserId) return {};
      return {
        createdById: currentUserId,
      };

    case "watching":
      // Not implemented yet - return all for now
      return {};

    case "archive":
      return {
        status: "CLOSED",
      };

    case "spam":
      // Not implemented yet - return empty (no tickets)
      return {
        id: "__none__", // Will return no results
      };

    case "trash":
      // Not implemented yet - return empty (no tickets)
      return {
        id: "__none__", // Will return no results
      };

    default:
      return {};
  }
}

// Validate view ID
export function isValidView(view: string | undefined): view is TicketViewId {
  if (!view) return false;
  return TICKET_VIEWS.some((v) => v.id === view);
}

// Get view config by ID
export function getViewById(viewId: TicketViewId): TicketView | undefined {
  return TICKET_VIEWS.find((v) => v.id === viewId);
}
