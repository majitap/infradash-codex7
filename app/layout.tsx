import type { Metadata } from "next";
import "@fontsource-variable/geist-mono";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import "./console.css";
import "./atelier.css";
import "./operations.css";
import "./clarity.css";
import "./relay.css";
import "./relay-ko.css";
import { DashboardProvider } from "@/components/overview/dashboard-provider";
import { OperationsProvider } from "@/components/admin/operations-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { RelayProvider } from "@/components/relay/context";
import { RelayShell } from "@/components/relay/shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
export const metadata: Metadata = {
  title: {
    default: "릴레이 · 인프라의 흐름을 한눈에",
    template: "%s · 릴레이",
  },
  description:
    "복잡한 인프라에서 다음 행동을 발견하세요. 배포 흐름, 시스템 맵, 운영 신호가 하나로 이어지는 인프라 워크스페이스.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className="h-full"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full antialiased">
        <a className="skip-to-content" href="#main-content">
          본문으로 건너뛰기
        </a>
        <ThemeProvider>
          <OperationsProvider>
            <DashboardProvider>
              <TooltipProvider>
                <RelayProvider>
                  <RelayShell>{children}</RelayShell>
                  <Toaster richColors position="top-right" />
                </RelayProvider>
              </TooltipProvider>
            </DashboardProvider>
          </OperationsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
