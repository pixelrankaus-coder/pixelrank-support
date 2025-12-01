"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

/**
 * Safely renders HTML content by sanitizing it with DOMPurify.
 * This removes potentially dangerous elements while preserving
 * visual styling from email clients like Outlook.
 */
export function SafeHtml({ html, className = "" }: SafeHtmlProps) {
  const sanitizedHtml = useMemo(() => {
    if (typeof window === "undefined") {
      // During SSR, return the raw HTML (it will be sanitized on client)
      return html || "";
    }

    if (!html) return "";

    // Configure DOMPurify to allow safe HTML elements and attributes
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ALLOW_DATA_ATTR: true,
      ADD_TAGS: ["style"], // Allow style tags for email formatting
      ADD_ATTR: [
        "target",
        "rel",
        "style",
        "align",
        "valign",
        "bgcolor",
        "border",
        "cellpadding",
        "cellspacing",
        "width",
        "height",
      ],
      // Remove script-related elements
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    });
  }, [html]);

  return (
    <div
      className={className}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
