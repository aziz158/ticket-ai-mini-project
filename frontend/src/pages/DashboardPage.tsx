import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bot, CheckCircle, Clock, Inbox, Ticket } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchOverview, fetchPerformance, fetchSentiment } from "@/api/analytics";

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#22c55e",
  Neutral: "#94a3b8",
  Negative: "#f97316",
  Angry: "#ef4444",
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f97316",
  Low: "#22c55e",
};

export function DashboardPage() {
  const { data: overview, isLoading: ov } = useQuery({ queryKey: ["overview"], queryFn: fetchOverview, refetchInterval: 30000 });
  const { data: perf } = useQuery({ queryKey: ["performance"], queryFn: fetchPerformance, refetchInterval: 60000 });
  const { data: sentiment } = useQuery({ queryKey: ["sentiment"], queryFn: fetchSentiment, refetchInterval: 60000 });

  if (ov) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const sentimentPie = Object.entries(overview?.sentiment_distribution ?? {}).map(([name, value]) => ({ name, value }));
  const priorityPie = Object.entries(overview?.priority_distribution ?? {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Open Tickets" value={overview?.open_tickets ?? 0} icon={Inbox} iconColor="text-blue-600" />
        <MetricCard title="Resolved" value={overview?.resolved_tickets ?? 0} icon={CheckCircle} iconColor="text-green-600" />
        <MetricCard title="AI Resolved %" value={`${overview?.ai_resolved_percentage ?? 0}%`} icon={Bot} iconColor="text-purple-600" />
        <MetricCard title="Escalated" value={overview?.escalated_tickets ?? 0} icon={AlertTriangle} iconColor="text-red-600" />
        <MetricCard title="Avg Response" value={`${overview?.avg_response_time_hours ?? 0}h`} icon={Clock} iconColor="text-yellow-600" />
        <MetricCard title="Total Tickets" value={overview?.total_tickets ?? 0} icon={Ticket} iconColor="text-slate-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Ticket Volume (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={perf?.daily_volume ?? []}>
                <defs>
                  <linearGradient id="volume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#volume)" name="Tickets" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {sentimentPie.map((entry) => (
                    <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2">
              {sentimentPie.map((e) => (
                <div key={e.name} className="flex items-center gap-1 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: SENTIMENT_COLORS[e.name] }} />
                  {e.name} ({e.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityPie} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {priorityPie.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sentiment Trend (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={sentiment?.trends ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                {["Positive", "Neutral", "Negative", "Angry"].map((s) => (
                  <Area key={s} type="monotone" dataKey={s} stroke={SENTIMENT_COLORS[s]} fill={SENTIMENT_COLORS[s]} fillOpacity={0.1} stackId="1" />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
