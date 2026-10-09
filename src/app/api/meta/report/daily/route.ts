import { NextResponse } from "next/server";
import { generateDailyReport } from "@/lib/meta/scheduler";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const report = await generateDailyReport(targetDate);
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error("Daily report API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate daily report" },
      { status: 500 }
    );
  }
}
