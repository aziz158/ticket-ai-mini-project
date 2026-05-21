export type TicketStatus = "Open" | "Pending" | "Resolved";
export type TicketPriority = "High" | "Medium" | "Low";
export type Sentiment = "Positive" | "Neutral" | "Negative" | "Angry";
export type SenderType = "customer" | "agent" | "ai" | "note";
export type UserRole = "Admin" | "Manager" | "Support Agent" | "AI Reviewer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: SenderType;
  message: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  customer_name: string;
  customer_email: string;
  subject: string;
  message: string;
  priority: TicketPriority;
  status: TicketStatus;
  sentiment: Sentiment | null;
  category: string | null;
  ai_summary: string | null;
  ai_suggested_reply: string | null;
  ai_confidence: number | null;
  escalated: boolean;
  escalation_reason: string | null;
  assigned_agent: User | null;
  created_at: string;
  resolved_at: string | null;
  messages?: TicketMessage[];
}

export interface PaginatedTickets {
  tickets: Ticket[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
}

export interface TicketFilters {
  search: string;
  status: string;
  priority: string;
  sentiment: string;
  escalated: string;
  sort_by: string;
  sort_dir: "asc" | "desc";
  page: number;
  per_page: number;
}

export interface AnalyticsOverview {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  pending_tickets: number;
  escalated_tickets: number;
  ai_resolved_percentage: number;
  avg_response_time_hours: number;
  sentiment_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
}

export interface EscalationAnalytics {
  total_escalated: number;
  escalation_reasons: Record<string, number>;
  daily_escalations: Array<{ date: string; total: number; escalated: number; rate: number }>;
}

export interface SentimentAnalytics {
  trends: Array<Record<string, string | number>>;
  overall: Record<string, number>;
}

export interface PerformanceAnalytics {
  agent_performance: Array<{
    agent: User;
    total_assigned: number;
    resolved: number;
    resolution_rate: number;
  }>;
  daily_volume: Array<{ date: string; count: number }>;
  ai_vs_human: { ai: number; human: number };
}

export interface Notification {
  id: string;
  type: "ticket_created" | "ticket_updated" | "ticket_deleted" | "message_added";
  message: string;
  timestamp: number;
}
