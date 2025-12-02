"use client";

import { ReactNode } from "react";
import { BannerProvider, useBanner } from "@/components/banner-provider";
import { IconBar } from "@/components/icon-bar";
import { ClaudeChatWrapper } from "@/components/ai/claude-chat-wrapper";
import { ProductUpdateBanner } from "@/components/product-update-banner";

interface DashboardShellProps {
  children: ReactNode;
  header?: ReactNode;
  userName?: string | null;
}

function DashboardContent({ children, header, userName }: DashboardShellProps) {
  const { isBannerVisible, bannerHeight } = useBanner();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Product Update Banner - Full width at very top */}
      <ProductUpdateBanner />

      {/* Global icon bar - positioned below banner when visible */}
      <IconBar userName={userName} />

      {/* Main content area (shifted right of icon bar, and down if banner visible) */}
      <div
        className="pl-16 min-h-screen flex flex-col"
        style={{ paddingTop: isBannerVisible ? bannerHeight : 0 }}
      >
        {/* Top header with search, notifications, profile - passed as prop from server */}
        {header}

        {/* Page content */}
        <div className="flex-1">{children}</div>
      </div>

      {/* Claude AI Chat - Floating button and panel */}
      <ClaudeChatWrapper />
    </div>
  );
}

export function DashboardShell({ children, header, userName }: DashboardShellProps) {
  return (
    <BannerProvider>
      <DashboardContent header={header} userName={userName}>{children}</DashboardContent>
    </BannerProvider>
  );
}
