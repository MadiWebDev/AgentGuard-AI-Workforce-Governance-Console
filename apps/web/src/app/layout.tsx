import "./globals.css";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell";
import { SectionErrorBoundary } from "@/components/m3";

export const metadata = {
  title: "AgentGuard — AI Workforce Governance",
  description: "Log every agent action, enforce permissions and human approvals, track cost and reliability, export audit-ready evidence.",
};
export const viewport = { width: "device-width", initialScale: 1 };

/** M3 global shell: app bar (search, theme, notifications, org switcher, user menu),
 *  navigation rail (desktop), bottom nav (mobile), drawer (deep nav). */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SectionErrorBoundary section="app shell">
          <AppShell>{children}</AppShell>
        </SectionErrorBoundary>
      </body>
    </html>
  );
}
