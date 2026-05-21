import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { fetchTickets } from "@/api/tickets";
import { TicketFiltersBar } from "@/components/tickets/TicketFilters";
import { StatusBadge, PriorityBadge, SentimentBadge, ConfidenceBadge } from "@/components/tickets/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketFilters } from "@/types";

const DEFAULT_FILTERS: TicketFilters = {
  search: "",
  status: "",
  priority: "",
  sentiment: "",
  escalated: "",
  sort_by: "created_at",
  sort_dir: "desc",
  page: 1,
  per_page: 20,
};

export function TicketsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TicketFilters>(DEFAULT_FILTERS);

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => fetchTickets(filters),
    refetchInterval: 15000,
  });

  const updateFilters = (patch: Partial<TicketFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total} tickets` : "Loading..."}
        </p>
        <Button size="sm" onClick={() => navigate("/tickets/new")}>
          <Plus className="h-4 w-4 mr-1" /> New Ticket
        </Button>
      </div>

      <TicketFiltersBar filters={filters} onChange={updateFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Sentiment</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Escalated</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : data?.tickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="border-b cursor-pointer transition-colors hover:bg-muted/40"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{ticket.id}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{ticket.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{ticket.customer_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-48 truncate">{ticket.subject}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <SentimentBadge sentiment={ticket.sentiment} />
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {ticket.assigned_agent?.name ?? <span className="text-muted-foreground">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3">
                          <ConfidenceBadge score={ticket.ai_confidence} />
                        </td>
                        <td className="px-4 py-3">
                          {ticket.escalated && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {format(new Date(ticket.created_at), "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {data.page} of {data.pages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={data.page <= 1}
                  onClick={() => updateFilters({ page: data.page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={data.page >= data.pages}
                  onClick={() => updateFilters({ page: data.page + 1 })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
