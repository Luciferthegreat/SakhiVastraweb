import { NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/meta/capi";
import { generateEventId } from "@/lib/meta/crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const testCode = body.testEventCode || process.env.META_TEST_EVENT_CODE;

    const eventId = generateEventId("test_capi");

    const result = await sendCapiEvent(
      {
        eventName: "PageView",
        eventId,
        eventSourceUrl: "https://www.sakhivastra.in",
        userData: {
          email: "admin@sakhivastra.in",
          phone: "919999999999",
          clientUserAgent: req.headers.get("user-agent") || "Mozilla/5.0 SakhiVastra Test Suite",
        },
        customData: {
          currency: "INR",
          value: 39900,
        },
      },
      testCode
    );

    return NextResponse.json({
      success: result.success,
      eventId,
      result,
    });
  } catch (err: any) {
    console.error("Test CAPI error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute CAPI test" },
      { status: 500 }
    );
  }
}
