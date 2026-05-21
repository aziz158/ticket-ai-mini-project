import client from "./client";
import type { AnalyticsOverview, EscalationAnalytics, PerformanceAnalytics, SentimentAnalytics } from "@/types";

export const fetchOverview = async (): Promise<AnalyticsOverview> => {
  const { data } = await client.get("/analytics/overview");
  return data;
};

export const fetchEscalations = async (): Promise<EscalationAnalytics> => {
  const { data } = await client.get("/analytics/escalations");
  return data;
};

export const fetchSentiment = async (): Promise<SentimentAnalytics> => {
  const { data } = await client.get("/analytics/sentiment");
  return data;
};

export const fetchPerformance = async (): Promise<PerformanceAnalytics> => {
  const { data } = await client.get("/analytics/performance");
  return data;
};
