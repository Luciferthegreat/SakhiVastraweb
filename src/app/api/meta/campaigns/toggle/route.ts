import { NextResponse } from "next/server";
import { z } from "zod";
import { metaClient } from "@/lib/meta/client";

const toggleSchema = z.object({
  entityType: z.enum(["CAMPAIGN", "ADSET", "AD"]),
  entityId: z.string(),
  newStatus: z.enum(["ACTIVE", "PAUSED"]),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { entityType, entityId, newStatus, reason } = parsed.data;

    const result = await metaClient.toggleStatus({
      entityType,
      entityId,
      newStatus,
      reason,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Toggle status error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update entity status" },
      { status: 400 }
    );
  }
}
