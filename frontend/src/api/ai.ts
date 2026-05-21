import client from "./client";

export const classifyTicket = async (subject: string, message: string) => {
  const { data } = await client.post("/ai/classify", { subject, message });
  return data as { category: string; confidence: number };
};

export const analyzeSentiment = async (message: string) => {
  const { data } = await client.post("/ai/analyze-sentiment", { message });
  return data as { sentiment: string };
};

export const summarizeTicket = async (subject: string, message: string) => {
  const { data } = await client.post("/ai/summarize", { subject, message });
  return data as { summary: string };
};

export const suggestReply = async (subject: string, message: string, sentiment?: string, category?: string) => {
  const { data } = await client.post("/ai/suggest-reply", { subject, message, sentiment, category });
  return data as { reply: string };
};

export const processTicket = async (ticketId: number) => {
  const { data } = await client.post(`/ai/process-ticket/${ticketId}`);
  return data;
};
