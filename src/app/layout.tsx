import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import ClientesPage from "./clientes/page";

export const metadata: Metadata = {
  title: "Lava Rápido — Sistema de Gestão",
  description: "Sistema completo de gestão para lava-rápidos. Cadastro de clientes, veículos, serviços, controle operacional e financeiro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // fazer cadastro de Clientes
  // ajustar quadro kanban
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

