"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useBanner } from "@/components/banner-provider";

interface BannerSettings {
  message: string;
  linkText: string | null;
  linkUrl: string | null;
  backgroundColor: string;
  textColor: string;
  dismissible: boolean;
}

export function ProductUpdateBanner() {
  const { setIsBannerVisible } = useBanner();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<BannerSettings | null>(null);

  useEffect(() => {
    const fetchBannerSettings = async () => {
      try {
        const response = await fetch("/api/top-banner");
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setSettings(data);
            // Check dismissal state only if dismissible
            if (data.dismissible) {
              const dismissed = localStorage.getItem("productUpdateBannerDismissed");
              const dismissedDate = localStorage.getItem("productUpdateBannerDismissedDate");
              if (dismissed && dismissedDate) {
                const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
                setIsDismissed(daysSinceDismissed < 7);
              }
            }
          } else {
            // No data returned means banner is disabled
            setSettings(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch banner settings:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchBannerSettings();
  }, []);

  // Update the context when visibility changes
  useEffect(() => {
    const isVisible = isLoaded && settings !== null && !isDismissed;
    setIsBannerVisible(isVisible);
  }, [isLoaded, settings, isDismissed, setIsBannerVisible]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("productUpdateBannerDismissed", "true");
    localStorage.setItem("productUpdateBannerDismissedDate", Date.now().toString());
  };

  // Don't render until we've loaded settings
  if (!isLoaded || !settings || isDismissed) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[50px] px-4 flex items-center justify-center z-[60]"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Product Update:</span>
        <span>{settings.message}</span>
        {settings.linkText && settings.linkUrl && (
          <Link
            href={settings.linkUrl}
            className="font-medium underline hover:no-underline"
          >
            {settings.linkText}
          </Link>
        )}
      </div>
      {settings.dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute right-4 p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Dismiss banner"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
