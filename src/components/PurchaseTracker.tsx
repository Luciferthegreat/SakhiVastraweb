"use client";

import { useEffect } from "react";
import { trackPixelEvent } from "@/lib/pixel";

interface PurchaseTrackerProps {
  orderNumber: string;
  totalPaise: number;
  currency?: string;
  itemsCount: number;
}

export default function PurchaseTracker({
  orderNumber,
  totalPaise,
  currency = "INR",
  itemsCount,
}: PurchaseTrackerProps) {
  useEffect(() => {
    trackPixelEvent(
      "Purchase",
      {
        value: totalPaise / 100,
        currency,
        num_items: itemsCount,
        content_type: "product",
      },
      `purchase_${orderNumber}`
    );
  }, [orderNumber, totalPaise, currency, itemsCount]);

  return null;
}
