import { NextResponse } from "next/server";
import { trackShiprocketShipment } from "@/lib/shiprocket";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ awb: string }> }
) {
  try {
    const { awb } = await params;
const data = await trackShiprocketShipment(awb);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Shiprocket tracking failed", err);
    return NextResponse.json({ error: "Could not fetch tracking info." }, { status: 502 });
  }
}
