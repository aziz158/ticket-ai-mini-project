import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { TicketFilters } from "@/types";

interface Props {
  filters: TicketFilters;
  onChange: (f: Partial<TicketFilters>) => void;
  onReset: () => void;
}

export function TicketFiltersBar({ filters, onChange, onReset }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          className="pl-8"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value, page: 1 })}
        />
      </div>

      <Select value={filters.status || "all"} onValueChange={(v) => onChange({ status: v === "all" ? "" : v, page: 1 })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Open">Open</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.priority || "all"} onValueChange={(v) => onChange({ priority: v === "all" ? "" : v, page: 1 })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sentiment || "all"} onValueChange={(v) => onChange({ sentiment: v === "all" ? "" : v, page: 1 })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Sentiment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sentiment</SelectItem>
          <SelectItem value="Positive">Positive</SelectItem>
          <SelectItem value="Neutral">Neutral</SelectItem>
          <SelectItem value="Negative">Negative</SelectItem>
          <SelectItem value="Angry">Angry</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.escalated || "all"} onValueChange={(v) => onChange({ escalated: v === "all" ? "" : v, page: 1 })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Escalated" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="true">Escalated</SelectItem>
          <SelectItem value="false">Not Escalated</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" size="sm" onClick={onReset}>
        <X className="h-4 w-4 mr-1" /> Reset
      </Button>
    </div>
  );
}
