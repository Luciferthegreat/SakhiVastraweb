"use client";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

export function generateClientEventId(prefix = "sv"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export function trackPixelEvent(
  eventName: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase",
  params?: Record<string, any>,
  eventId?: string
) {
  if (typeof window === "undefined" || !window.fbq) return;

  const resolvedEventId = eventId || generateClientEventId(eventName.toLowerCase());

  if (params) {
    window.fbq("track", eventName, params, { eventID: resolvedEventId });
  } else {
    window.fbq("track", eventName, {}, { eventID: resolvedEventId });
  }

  return resolvedEventId;
}
