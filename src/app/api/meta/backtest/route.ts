import { NextResponse } from "next/server";
import { runInstagramBacktest } from "@/lib/meta/backtest";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.productId) {
      return NextResponse.json({ error: "productId is required for backtesting" }, { status: 400 });
    }

    const result = await runInstagramBacktest({
      productId: body.productId,
      creativeAngle: body.creativeAngle,
      instagramPlacement: body.instagramPlacement,
      startingDailyBudgetRupees: body.startingDailyBudgetRupees ? Number(body.startingDailyBudgetRupees) : 500,
      durationDays: body.durationDays ? Number(body.durationDays) : 14,
      marketCondition: body.marketCondition,
      codReturnRatePct: body.codReturnRatePct !== undefined ? Number(body.codReturnRatePct) : 20,
      initialStock: body.initialStock !== undefined ? Number(body.initialStock) : undefined,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Backtest API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute backtest simulation" },
      { status: 500 }
    );
  }
}
