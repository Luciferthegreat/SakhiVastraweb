import { NextResponse } from "next/server";
import { runAutomationCycle } from "@/lib/meta/scheduler";

export async function POST() {
  try {
    const result = await runAutomationCycle();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Run automation cycle error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute automation cycle" },
      { status: 500 }
    );
  }
}
