import client from "./client";
import type { PaginatedTickets, Ticket, TicketFilters, TicketMessage, User } from "@/types";

export const fetchTickets = async (filters: Partial<TicketFilters>): Promise<PaginatedTickets> => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v != null));
  const { data } = await client.get("/tickets", { params });
  return data;
};

export const fetchTicket = async (id: number): Promise<Ticket> => {
  const { data } = await client.get(`/tickets/${id}`);
  return data;
};

export const createTicket = async (payload: Partial<Ticket>): Promise<Ticket> => {
  const { data } = await client.post("/tickets", payload);
  return data;
};

export const updateTicket = async (id: number, payload: Partial<Ticket> & { message?: string; sender_type?: string; assigned_agent_id?: number }): Promise<Ticket> => {
  const { data } = await client.put(`/tickets/${id}`, payload);
  return data;
};

export const deleteTicket = async (id: number): Promise<void> => {
  await client.delete(`/tickets/${id}`);
};

export const addMessage = async (ticketId: number, payload: { message: string; sender_type: string }): Promise<TicketMessage> => {
  const { data } = await client.post(`/tickets/${ticketId}/messages`, payload);
  return data;
};

export const fetchUsers = async (): Promise<User[]> => {
  const { data } = await client.get("/users");
  return data;
};
