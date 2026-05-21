import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Layout } from "@/components/layout/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { TicketsPage } from "@/pages/TicketsPage";
import { TicketDetailsPage } from "@/pages/TicketDetailsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { useStore } from "@/store/useStore";
import type { Ticket } from "@/types";

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 10000 } },
});

const socket = io("http://localhost:5000", { transports: ["websocket"] });

function SocketListener() {
  const addNotification = useStore((s) => s.addNotification);

  useEffect(() => {
    socket.on("ticket_created", (ticket: Ticket) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      addNotification({ type: "ticket_created", message: `New ticket #${ticket.id}: "${ticket.subject}" from ${ticket.customer_name}` });
    });

    socket.on("ticket_updated", (ticket: Ticket) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket", ticket.id] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    });

    socket.on("ticket_deleted", ({ id }: { id: number }) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      addNotification({ type: "ticket_deleted", message: `Ticket #${id} was deleted.` });
    });

    socket.on("message_added", () => {
      qc.invalidateQueries({ queryKey: ["ticket"] });
    });

    return () => {
      socket.off("ticket_created");
      socket.off("ticket_updated");
      socket.off("ticket_deleted");
      socket.off("message_added");
    };
  }, [addNotification]);

  return null;
}

export function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <SocketListener />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/:id" element={<TicketDetailsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
