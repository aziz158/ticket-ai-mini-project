import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchEscalations, fetchPerformance, fetchSentiment } from "@/api/analytics";

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#22c55e",
  Neutral: "#94a3b8",
  Negative: "#f97316",
  Angry: "#ef4444",
};

export function AnalyticsPage() {
  const { data: escalations, isLoading: el } = useQuery({ queryKey: ["escalations"], queryFn: fetchEscalations, refetchInterval: 60000 });
  const { data: sentiment } = useQuery({ queryKey: ["sentiment"], queryFn: fetchSentiment, refetchInterval: 60000 });
  const { data: perf } = useQuery({ queryKey: ["performance"], queryFn: fetchPerformance, refetchInterval: 60000 });

  const aiVsHuman = perf?.ai_vs_human
    ? [
        { name: "AI Resolved", value: perf.ai_vs_human.ai, fill: "#8b5cf6" },
        { name: "Human Resolved", value: perf.ai_vs_human.human, fill: "#3b82f6" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Escalation Rate (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {el ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={escalations?.daily_escalations ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#94a3b8" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="escalated" fill="#ef4444" name="Escalated" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sentiment Trends (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={sentiment?.trends ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              {["Positive", "Neutral", "Negative", "Angry"].map((s) => (
                <Area
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={SENTIMENT_COLORS[s]}
                  fill={SENTIMENT_COLORS[s]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI vs Human Resolution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={aiVsHuman} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={4}>
                  {aiVsHuman.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Agent</th>
                    <th className="pb-2 text-right">Assigned</th>
                    <th className="pb-2 text-right">Resolved</th>
                    <th className="pb-2 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(perf?.agent_performance ?? []).map((row) => (
                    <tr key={row.agent.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{row.agent.name}</td>
                      <td className="py-2 text-right text-muted-foreground">{row.total_assigned}</td>
                      <td className="py-2 text-right text-muted-foreground">{row.resolved}</td>
                      <td className="py-2 text-right font-semibold">
                        <span className={row.resolution_rate >= 70 ? "text-green-600" : "text-orange-500"}>
                          {row.resolution_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(perf?.agent_performance?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        No agents assigned to tickets yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
