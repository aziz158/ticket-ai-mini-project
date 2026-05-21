import { format } from "date-fns";
import { Bot, MessageSquare, User } from "lucide-react";
import type { TicketMessage } from "@/types";
import { cn } from "@/lib/utils";

const SENDER_META = {
  customer: { icon: User, label: "Customer", bg: "bg-slate-100", align: "items-start" },
  agent: { icon: MessageSquare, label: "Agent", bg: "bg-blue-50", align: "items-start" },
  ai: { icon: Bot, label: "AI", bg: "bg-purple-50", align: "items-start" },
  note: { icon: MessageSquare, label: "Internal Note", bg: "bg-yellow-50", align: "items-start" },
} as const;

export function ConversationThread({ messages }: { messages: TicketMessage[] }) {
  if (messages.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>;
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const meta = SENDER_META[msg.sender_type] ?? SENDER_META.agent;
        const Icon = meta.icon;

        return (
          <div key={msg.id} className={cn("flex gap-3", meta.align)}>
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", meta.bg)}>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{meta.label}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(msg.created_at), "MMM d, h:mm a")}
                </span>
              </div>
              <div className={cn("rounded-lg p-3 text-sm", meta.bg)}>
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
