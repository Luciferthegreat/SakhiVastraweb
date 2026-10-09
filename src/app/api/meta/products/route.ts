import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        metaCampaigns: {
          select: { id: true, name: true, status: true, dailyBudget: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = products.map((p) => {
      const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
      const hasImages = p.images && p.images.length > 0;
      const isEligibleForAds = p.active && totalStock > 0 && hasImages;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        fabric: p.fabric,
        basePriceRupees: Math.round(p.basePrice / 100),
        originalPriceRupees: p.originalPrice ? Math.round(p.originalPrice / 100) : null,
        images: p.images,
        active: p.active,
        totalStock,
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          stock: v.stock,
        })),
        isEligibleForAds,
        ineligibilityReason: !p.active
          ? "Product marked inactive"
          : totalStock <= 0
          ? "Out of stock across all sizes"
          : !hasImages
          ? "No product images available"
          : null,
        activeCampaignsCount: p.metaCampaigns.filter((c) => c.status === "ACTIVE").length,
        totalCampaignsCount: p.metaCampaigns.length,
      };
    });

    return NextResponse.json({
      success: true,
      totalCount: enriched.length,
      eligibleCount: enriched.filter((p) => p.isEligibleForAds).length,
      products: enriched,
    });
  } catch (err: any) {
    console.error("Meta products API error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch products" }, { status: 500 });
  }
}
