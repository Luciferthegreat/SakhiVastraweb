import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const action = searchParams.get("action");
    const status = searchParams.get("status");

    const where: any = {};
    if (action) where.action = action;
    if (status) where.status = status;

    const logs = await prisma.metaActivityLog.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    console.error("Logs API error:", err);
    return NextResponse.json({ error: err.message || "Failed to load logs" }, { status: 500 });
  }
}
