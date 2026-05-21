import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Send, UserCheck, UserX } from "lucide-react";
import { addMessage, fetchTicket, fetchUsers, updateTicket } from "@/api/tickets";
import { processTicket } from "@/api/ai";
import { AISuggestionPanel } from "@/components/ticket-details/AISuggestionPanel";
import { ConversationThread } from "@/components/ticket-details/ConversationThread";
import { StatusBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import type { Ticket } from "@/types";

export function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const addNotification = useStore((s) => s.addNotification);
  const [reply, setReply] = useState("");
  const [noteText, setNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<"reply" | "note">("reply");

  const ticketId = Number(id);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicket(ticketId),
    enabled: !isNaN(ticketId),
    refetchInterval: 10000,
  });

  const { data: users } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["ticket", ticketId] });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Ticket> & { message?: string; sender_type?: string; assigned_agent_id?: number }) =>
      updateTicket(ticketId, payload),
    onSuccess: () => invalidate(),
  });

  const messageMutation = useMutation({
    mutationFn: (payload: { message: string; sender_type: string }) => addMessage(ticketId, payload),
    onSuccess: () => { invalidate(); setReply(""); setNoteText(""); },
  });

  const processMutation = useMutation({
    mutationFn: () => processTicket(ticketId),
    onSuccess: () => { invalidate(); addNotification({ type: "ticket_updated", message: `Ticket #${ticketId} re-analyzed by AI.` }); },
  });

  const handleSendReply = () => {
    const text = activeTab === "reply" ? reply.trim() : noteText.trim();
    if (!text) return;
    messageMutation.mutate({ message: text, sender_type: activeTab === "note" ? "note" : "agent" });
  };

  const handleSendAIReply = () => {
    if (!ticket?.ai_suggested_reply) return;
    messageMutation.mutate({ message: ticket.ai_suggested_reply, sender_type: "ai" });
    updateMutation.mutate({ status: "Resolved" });
  };

  const handleStatusChange = (status: string) => {
    updateMutation.mutate({ status: status as Ticket["status"] });
    addNotification({ type: "ticket_updated", message: `Ticket #${ticketId} marked as ${status}.` });
  };

  const handleEscalate = () => {
    updateMutation.mutate({ escalated: !ticket?.escalated });
  };

  const handleReassign = (agentId: string) => {
    updateMutation.mutate({ assigned_agent_id: Number(agentId) });
  };

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">Loading ticket...</div>;
  }

  if (!ticket) {
    return <div className="py-20 text-center text-muted-foreground">Ticket not found.</div>;
  }

  const agents = users?.filter((u) => u.role === "Support Agent") ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/tickets")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground">#{ticket.id}</span>
          <h2 className="font-semibold">{ticket.subject}</h2>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.escalated && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Escalated</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{ticket.customer_name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{ticket.customer_email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Opened {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={ticket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={ticket.escalated ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleEscalate}
                  >
                    {ticket.escalated ? (
                      <><UserX className="h-4 w-4 mr-1" />De-escalate</>
                    ) : (
                      <><UserCheck className="h-4 w-4 mr-1" />Escalate</>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <ConversationThread messages={ticket.messages ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex gap-2">
                {(["reply", "note"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab === "reply" ? "Send Reply" : "Internal Note"}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={activeTab === "reply" ? "Type your reply to the customer..." : "Add an internal note (not visible to customer)..."}
                rows={4}
                value={activeTab === "reply" ? reply : noteText}
                onChange={(e) => (activeTab === "reply" ? setReply : setNoteText)(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <Select
                  value={ticket.assigned_agent?.id?.toString() ?? ""}
                  onValueChange={handleReassign}
                >
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="Assign to agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleSendReply} disabled={messageMutation.isPending}>
                  <Send className="h-4 w-4 mr-1" />
                  {messageMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <AISuggestionPanel
            ticket={ticket}
            onUseSuggestedReply={(r) => { setReply(r); setActiveTab("reply"); }}
            onMarkHelpful={(helpful) =>
              addNotification({ type: "ticket_updated", message: `AI suggestion marked as ${helpful ? "helpful" : "not helpful"}.` })
            }
            onReprocess={() => processMutation.mutate()}
            isProcessing={processMutation.isPending}
          />
        </div>
      </div>

      {ticket.ai_suggested_reply && (
        <div className="flex justify-end">
          <Button onClick={handleSendAIReply} disabled={messageMutation.isPending}>
            Send AI Reply &amp; Resolve
          </Button>
        </div>
      )}
    </div>
  );
}
