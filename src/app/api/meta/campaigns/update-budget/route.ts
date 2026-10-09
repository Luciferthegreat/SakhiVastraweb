import { NextResponse } from "next/server";
import { z } from "zod";
import { metaClient } from "@/lib/meta/client";

const budgetSchema = z.object({
  campaignId: z.string(),
  newBudgetRupees: z.number().min(50).max(100000),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = budgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { campaignId, newBudgetRupees, reason } = parsed.data;

    const result = await metaClient.updateBudget({
      campaignId,
      newBudgetPaise: Math.round(newBudgetRupees * 100),
      reason,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Update budget error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update budget" },
      { status: 400 }
    );
  }
}
