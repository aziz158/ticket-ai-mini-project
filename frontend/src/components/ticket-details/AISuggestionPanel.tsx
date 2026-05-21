import { AlertTriangle, Bot, Brain, Sparkles, Tag, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SentimentBadge, ConfidenceBadge } from "@/components/tickets/StatusBadge";
import type { Ticket } from "@/types";

interface Props {
  ticket: Ticket;
  onUseSuggestedReply: (reply: string) => void;
  onMarkHelpful: (helpful: boolean) => void;
  onReprocess: () => void;
  isProcessing?: boolean;
}

export function AISuggestionPanel({ ticket, onUseSuggestedReply, onMarkHelpful, onReprocess, isProcessing }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-purple-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Sentiment</span>
            <SentimentBadge sentiment={ticket.sentiment} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Category</span>
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {ticket.category ?? "Unclassified"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">AI Confidence</span>
            <ConfidenceBadge score={ticket.ai_confidence} />
          </div>
          {ticket.escalated && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 p-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="text-xs font-semibold text-red-700">Escalated</p>
                <p className="text-xs text-red-600">{ticket.escalation_reason}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {ticket.ai_summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-blue-600" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{ticket.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {ticket.ai_suggested_reply && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Suggested Reply
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-md bg-muted p-3 text-sm">{ticket.ai_suggested_reply}</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => onUseSuggestedReply(ticket.ai_suggested_reply!)}>
                Use This Reply
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Helpful?</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMarkHelpful(true)}>
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMarkHelpful(false)}>
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={onReprocess} disabled={isProcessing}>
        <Bot className="h-4 w-4 mr-2" />
        {isProcessing ? "Processing..." : "Re-run AI Analysis"}
      </Button>
    </div>
  );
}
