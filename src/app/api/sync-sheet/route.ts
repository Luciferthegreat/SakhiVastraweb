import { NextResponse } from "next/server";
import { syncProducts } from "../../../../scripts/sync-products";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  console.log("🚀 /api/sync-sheet POST received");

  try {
    console.log("📊 Starting Google Sheet sync...");

    await syncProducts();

    console.log("✅ Google Sheet sync completed");

    return NextResponse.json({
      success: true,
      message: "Google Sheet synced successfully",
    });
  } catch (error) {
    console.error("❌ Google Sheet sync failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Google Sheet sync failed",
      },
      { status: 500 }
    );
  }
}