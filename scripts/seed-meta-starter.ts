import { PrismaClient } from "../src/generated/client";
import { generateCreativesForProduct } from "../src/lib/meta/creative";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SEEDING STARTER META CAMPAIGNS & CONFIG ===");

  // 1. Ensure MetaConfig exists
  const existingConfig = await prisma.metaConfig.findFirst();
  if (!existingConfig) {
    await prisma.metaConfig.create({
      data: {
        automationMode: "monitor",
        automationEnabled: false,
        dailySpendCap: 500000, // ₹5,000
        maxBudgetIncreasePct: 10.0,
        budgetIncreaseCooldownHours: 24,
        minDataPurchases: 3,
        minDataSpendPaise: 100000,
        maxLossPerAdPaise: 80000,
        targetRoas: 2.5,
        emergencyStop: false,
      },
    });
    console.log("Created default MetaConfig");
  }

  // 2. Fetch live products from DB
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { variants: true },
    take: 3,
  });

  console.log(`Found ${products.length} active products to create starter campaigns for.`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const product of products) {
    const existing = await prisma.metaCampaign.findFirst({
      where: { productId: product.id },
    });

    if (existing) {
      console.log(`Campaign already exists for product: ${product.name}`);
      continue;
    }

    const creatives = generateCreativesForProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      fabric: product.fabric,
      basePrice: product.basePrice,
      originalPrice: product.originalPrice,
      images: product.images,
      variants: product.variants.map((v) => ({ size: v.size, stock: v.stock })),
    });

    const primaryCreative = creatives[0];

    const campaign = await prisma.metaCampaign.create({
      data: {
        metaCampaignId: `sim_camp_${product.slug.slice(0, 15)}`,
        name: `Sakhi Vastra - ${product.name} (Hero Angle)`,
        objective: "OUTCOME_SALES",
        status: "PAUSED",
        dailyBudget: 50000, // ₹500
        templateType: "HERO_BESTSELLER",
        productId: product.id,
        isAutomated: true,
      },
    });

    const adSet = await prisma.metaAdSet.create({
      data: {
        metaAdSetId: `sim_adset_${campaign.id.slice(-8)}`,
        campaignId: campaign.id,
        name: `${campaign.name} - Women 21-55 IN`,
        status: "PAUSED",
        dailyBudget: 50000,
        targetingJson: {
          ageMin: 21,
          ageMax: 55,
          genders: [2],
          geoLocations: { countries: ["IN"] },
        },
        optimizationGoal: "OFFSITE_CONVERSIONS",
      },
    });

    await prisma.metaAd.create({
      data: {
        metaAdId: `sim_ad_${adSet.id.slice(-8)}`,
        adSetId: adSet.id,
        name: `${product.name} - Product Showcase`,
        status: "PAUSED",
        creativeAngle: "PRODUCT_SHOWCASE",
        headline: primaryCreative.headline,
        primaryText: primaryCreative.primaryText,
        description: primaryCreative.description,
        callToAction: primaryCreative.callToAction,
        imageUrl: primaryCreative.imageUrl,
        destinationUrl: primaryCreative.destinationUrl,
        productId: product.id,
      },
    });

    // Create realistic baseline insight
    await prisma.metaInsight.create({
      data: {
        entityType: "CAMPAIGN",
        entityId: campaign.id,
        campaignId: campaign.id,
        date: today,
        spend: 45000, // ₹450
        impressions: 8200,
        clicks: 198,
        ctr: 2.41,
        cpc: 2.27,
        purchases: 3,
        purchaseValue: 119700, // ₹1,197
        roas: 2.66,
        costPerPurchase: 150.0,
      },
    });

    // Log activity
    await prisma.metaActivityLog.create({
      data: {
        action: "CREATE_CAMPAIGN",
        entityType: "CAMPAIGN",
        entityId: campaign.id,
        entityName: campaign.name,
        reason: `Initial campaign setup initialized in PAUSED state.`,
        mode: "monitor",
        status: "SUCCESS",
      },
    });

    console.log(`Created starter campaign for ${product.name}`);
  }

  console.log("=== SEEDING COMPLETED ===");
}

main().finally(async () => {
  await prisma.$disconnect();
});
