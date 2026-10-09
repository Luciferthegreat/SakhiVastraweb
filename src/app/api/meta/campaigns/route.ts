import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaigns = await prisma.metaCampaign.findMany({
      include: {
        product: {
          include: { variants: true },
        },
        adSets: {
          include: {
            ads: true,
          },
        },
        insights: {
          where: { date: today },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      campaigns: campaigns.map((c) => {
        const insight = c.insights[0] || {
          spend: 0,
          impressions: 0,
          clicks: 0,
          purchases: 0,
          purchaseValue: 0,
          roas: 0,
          ctr: 0,
          cpc: 0,
          costPerPurchase: 0,
        };

        const totalStock = c.product?.variants.reduce((acc, v) => acc + v.stock, 0) ?? 0;

        return {
          id: c.id,
          metaCampaignId: c.metaCampaignId,
          name: c.name,
          objective: c.objective,
          status: c.status,
          dailyBudget: c.dailyBudget,
          templateType: c.templateType,
          isAutomated: c.isAutomated,
          productId: c.productId,
          product: c.product
            ? {
                id: c.product.id,
                name: c.product.name,
                slug: c.product.slug,
                basePrice: c.product.basePrice,
                images: c.product.images,
                active: c.product.active,
                totalStock,
              }
            : null,
          adSets: c.adSets.map((as) => ({
            id: as.id,
            metaAdSetId: as.metaAdSetId,
            name: as.name,
            status: as.status,
            dailyBudget: as.dailyBudget,
            targeting: as.targetingJson,
            ads: as.ads.map((ad) => ({
              id: ad.id,
              metaAdId: ad.metaAdId,
              name: ad.name,
              status: ad.status,
              creativeAngle: ad.creativeAngle,
              headline: ad.headline,
              primaryText: ad.primaryText,
              imageUrl: ad.imageUrl,
              destinationUrl: ad.destinationUrl,
            })),
          })),
          insights: insight,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      }),
    });
  } catch (err: any) {
    console.error("Fetch campaigns API error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch campaigns" }, { status: 500 });
  }
}
