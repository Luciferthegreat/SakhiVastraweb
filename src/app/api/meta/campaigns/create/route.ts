import { NextResponse } from "next/server";
import { z } from "zod";
import { metaClient } from "@/lib/meta/client";

const createSchema = z.object({
  name: z.string().min(3),
  templateType: z.string().default("HERO_BESTSELLER"),
  productId: z.string().optional(),
  dailyBudgetRupees: z.number().min(100).max(50000), // in rupees
  creative: z.object({
    headline: z.string().min(3),
    primaryText: z.string().min(5),
    description: z.string().optional(),
    callToAction: z.string().default("SHOP_NOW"),
    imageUrl: z.string().url(),
    destinationUrl: z.string().url(),
    creativeAngle: z.string().default("PRODUCT_SHOWCASE"),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, templateType, productId, dailyBudgetRupees, creative } = parsed.data;

    const result = await metaClient.createCampaignWithAd({
      name,
      templateType,
      productId,
      dailyBudgetPaise: Math.round(dailyBudgetRupees * 100),
      creative,
    });

    return NextResponse.json({
      success: true,
      campaign: result.campaign,
      adSet: result.adSet,
      ad: result.ad,
      message: `Campaign "${name}" successfully created in PAUSED state.`,
    });
  } catch (err: any) {
    console.error("Create campaign error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create campaign" },
      { status: 400 }
    );
  }
}
