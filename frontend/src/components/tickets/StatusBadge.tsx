import { Badge } from "@/components/ui/badge";
import type { Sentiment, TicketPriority, TicketStatus } from "@/types";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, "info" | "warning" | "success"> = {
    Open: "info",
    Pending: "warning",
    Resolved: "success",
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const map: Record<TicketPriority, "danger" | "warning" | "success"> = {
    High: "danger",
    Medium: "warning",
    Low: "success",
  };
  return <Badge variant={map[priority]}>{priority}</Badge>;
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return null;
  const map: Record<Sentiment, "danger" | "warning" | "secondary" | "success"> = {
    Angry: "danger",
    Negative: "warning",
    Neutral: "secondary",
    Positive: "success",
  };
  return <Badge variant={map[sentiment]}>{sentiment}</Badge>;
}

export function ConfidenceBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const variant = pct >= 85 ? "success" : pct >= 70 ? "warning" : "danger";
  return <Badge variant={variant}>{pct}%</Badge>;
}
