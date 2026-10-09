import { prisma } from "@/lib/db";
import { generateCreativesForProduct } from "./creative";
import { getMetaConfig } from "./config";
import { CreativeAngleType } from "./types";

export interface BacktestParams {
  productId: string;
  creativeAngle?: CreativeAngleType;
  instagramPlacement?: "INSTAGRAM_FEED" | "INSTAGRAM_REELS" | "INSTAGRAM_STORIES" | "INSTAGRAM_CAROUSEL" | "ALL_PLACEMENTS";
  startingDailyBudgetRupees?: number; // default ₹500/day
  durationDays?: number; // 7, 14, 30 days
  marketCondition?: "BULLISH_WINNER" | "REALISTIC_AVERAGE" | "SATURATED_COMPETITIVE" | "HIGH_FATIGUE";
  codReturnRatePct?: number; // default 20% on COD orders
  initialStock?: number;
}

export interface DailySimulationRecord {
  day: number;
  date: string;
  dailyBudgetRupees: number;
  spendRupees: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpcRupees: number;
  cpmRupees: number;
  grossOrders: number;
  confirmedOrders: number;
  returnedOrders: number;
  grossRevenueRupees: number;
  netRevenueRupees: number;
  adSpendRupees: number;
  cogsAndShippingRupees: number;
  netProfitRupees: number;
  roas: number;
  remainingStock: number;
  status: "ACTIVE" | "PAUSED_BY_RULE" | "PAUSED_STOCKOUT" | "SCALED";
  actionTaken?: string;
  ruleTriggered?: string;
}

export interface BacktestResult {
  product: {
    id: string;
    name: string;
    slug: string;
    basePriceRupees: number;
    originalPriceRupees: number;
    discountPct: number;
    images: string[];
    fabric: string;
    totalStock: number;
  };
  creative: {
    angle: CreativeAngleType;
    title: string;
    headline: string;
    primaryText: string;
    imageUrl: string;
    callToAction: string;
    destinationUrl: string;
    placement: string;
  };
  simulationSettings: {
    durationDays: number;
    startingDailyBudgetRupees: number;
    marketCondition: string;
    instagramPlacement: string;
    codReturnRatePct: number;
  };
  dailyTimeline: DailySimulationRecord[];
  summary: {
    totalAdSpendRupees: number;
    totalGrossOrders: number;
    totalConfirmedOrders: number;
    totalReturnedOrders: number;
    totalGrossRevenueRupees: number;
    totalNetRevenueRupees: number;
    totalCogsAndShippingRupees: number;
    netProfitRupees: number;
    profitMarginPct: number;
    finalRoas: number;
    blendedCpaRupees: number;
    totalImpressions: number;
    totalClicks: number;
    averageCtrPct: number;
    averageCpcRupees: number;
    verdict: "SCALE_WINNER" | "MODERATE_PERFORMER" | "NEEDS_OPTIMIZATION" | "UNPROFITABLE_RISK";
    verdictReason: string;
    ruleActionsSummary: string[];
  };
  placementComparison: Array<{
    placement: string;
    cpm: number;
    ctr: number;
    cpa: number;
    roas: number;
    suitability: string;
  }>;
}

export async function runInstagramBacktest(params: BacktestParams): Promise<BacktestResult> {
  const config = await getMetaConfig();

  // 1. Fetch Product
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: { variants: true },
  });

  if (!product) {
    throw new Error(`Product with ID "${params.productId}" not found.`);
  }

  const priceRupees = Math.round(product.basePrice / 100);
  const originalPriceRupees = product.originalPrice
    ? Math.round(product.originalPrice / 100)
    : Math.round(priceRupees * 1.6);
  const discountPct = Math.round(((originalPriceRupees - priceRupees) / originalPriceRupees) * 100);

  const totalStockInDb = product.variants.reduce((acc, v) => acc + v.stock, 0);
  let remainingStock = params.initialStock !== undefined ? params.initialStock : Math.max(totalStockInDb, 25);

  // 2. Select Creative Angle
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

  const selectedAngle = params.creativeAngle || "PRODUCT_SHOWCASE";
  const selectedCreative = creatives.find((c) => c.angle === selectedAngle) || creatives[0];

  const placement = params.instagramPlacement || "INSTAGRAM_REELS";
  const duration = params.durationDays || 14;
  const startingBudget = params.startingDailyBudgetRupees || 500;
  const condition = params.marketCondition || "REALISTIC_AVERAGE";
  const codReturnPct = params.codReturnRatePct !== undefined ? params.codReturnRatePct : 20;

  // Placement baseline multipliers (Reels has higher CTR & lower CPM for visual ethnic apparel)
  const placementMultipliers = {
    INSTAGRAM_REELS: { cpm: 140, ctrBonus: 1.35, crBonus: 1.15 },
    INSTAGRAM_FEED: { cpm: 175, ctrBonus: 1.05, crBonus: 1.10 },
    INSTAGRAM_STORIES: { cpm: 130, ctrBonus: 1.15, crBonus: 1.0 },
    INSTAGRAM_CAROUSEL: { cpm: 190, ctrBonus: 1.45, crBonus: 1.25 },
    ALL_PLACEMENTS: { cpm: 155, ctrBonus: 1.15, crBonus: 1.1 },
  }[placement] || { cpm: 155, ctrBonus: 1.15, crBonus: 1.1 };

  // Angle multipliers (Reels & Price Offer convert higher on cold traffic)
  const angleMultiplier = {
    PRODUCT_SHOWCASE: { ctrMod: 1.0, crMod: 1.0 },
    BENEFIT_FOCUS: { ctrMod: 1.1, crMod: 1.15 },
    STYLING_OUTFIT: { ctrMod: 1.2, crMod: 1.1 },
    PRICE_OFFER: { ctrMod: 1.3, crMod: 1.25 },
    REEL_CONCEPT: { ctrMod: 1.4, crMod: 1.2 },
    CAROUSEL: { ctrMod: 1.35, crMod: 1.3 },
  }[selectedCreative.angle] || { ctrMod: 1.0, crMod: 1.0 };

  // Market Condition Factors
  const conditionFactor = {
    BULLISH_WINNER: { baseCpm: 130, baseCtr: 0.028, baseCr: 0.038, fatigueRate: 0.01 },
    REALISTIC_AVERAGE: { baseCpm: 160, baseCtr: 0.022, baseCr: 0.029, fatigueRate: 0.025 },
    SATURATED_COMPETITIVE: { baseCpm: 210, baseCtr: 0.016, baseCr: 0.021, fatigueRate: 0.04 },
    HIGH_FATIGUE: { baseCpm: 180, baseCtr: 0.024, baseCr: 0.025, fatigueRate: 0.08 },
  }[condition];

  let currentBudget = startingBudget;
  let status: "ACTIVE" | "PAUSED_BY_RULE" | "PAUSED_STOCKOUT" | "SCALED" = "ACTIVE";
  let lastScaleDay = -10;
  const ruleActionsSummary: string[] = [];
  const dailyTimeline: DailySimulationRecord[] = [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - duration);

  for (let day = 1; day <= duration; day++) {
    const simDate = new Date(startDate);
    simDate.setDate(simDate.getDate() + day);
    const dateStr = simDate.toISOString().slice(0, 10);

    let actionTaken = "";
    let ruleTriggered = "";

    // 1. Stock Guard Check
    if (remainingStock <= 0 && status === "ACTIVE") {
      status = "PAUSED_STOCKOUT";
      ruleTriggered = "Stock Guard (Out-of-Stock Auto-Pause)";
      actionTaken = `Paused campaign on Day ${day} because product stock reached 0.`;
      ruleActionsSummary.push(actionTaken);
    }

    if (status !== "ACTIVE" && status !== "SCALED") {
      dailyTimeline.push({
        day,
        date: dateStr,
        dailyBudgetRupees: currentBudget,
        spendRupees: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpcRupees: 0,
        cpmRupees: 0,
        grossOrders: 0,
        confirmedOrders: 0,
        returnedOrders: 0,
        grossRevenueRupees: 0,
        netRevenueRupees: 0,
        adSpendRupees: 0,
        cogsAndShippingRupees: 0,
        netProfitRupees: 0,
        roas: 0,
        remainingStock,
        status,
        actionTaken,
        ruleTriggered,
      });
      continue;
    }

    // 2. Simulate Daily Ad Delivery
    const fatigueMultiplier = Math.max(0.65, 1 - (day - 1) * conditionFactor.fatigueRate);
    const dayVariance = 0.9 + Math.sin(day * 1.5) * 0.15; // Natural daily variance

    const effectiveCpm = Math.round(conditionFactor.baseCpm * dayVariance * (placementMultipliers.cpm / 155));
    const effectiveCtr = Number(
      (conditionFactor.baseCtr * placementMultipliers.ctrBonus * angleMultiplier.ctrMod * fatigueMultiplier * dayVariance).toFixed(4)
    );
    const effectiveCr = Number(
      (conditionFactor.baseCr * placementMultipliers.crBonus * angleMultiplier.crMod * fatigueMultiplier).toFixed(4)
    );

    const spendRupees = currentBudget;
    const impressions = Math.round((spendRupees / effectiveCpm) * 1000);
    const clicks = Math.round(impressions * effectiveCtr);
    const cpcRupees = clicks > 0 ? Number((spendRupees / clicks).toFixed(2)) : 0;

    // Simulate Conversions
    const calculatedOrders = Math.round(clicks * effectiveCr);
    const grossOrders = Math.min(calculatedOrders, remainingStock);
    remainingStock = Math.max(0, remainingStock - grossOrders);

    // Indian COD Economics: ~65% COD, 35% Prepaid. COD RTO is codReturnPct
    const codOrders = Math.round(grossOrders * 0.65);
    const prepaidOrders = grossOrders - codOrders;
    const returnedOrders = Math.round(codOrders * (codReturnPct / 100));
    const confirmedOrders = grossOrders - returnedOrders;

    const grossRevenueRupees = grossOrders * priceRupees;
    const netRevenueRupees = confirmedOrders * priceRupees;

    // COGS: 38% product cost + ₹79 shipping on all shipped units (including returned logistics loss)
    const unitProductCogs = Math.round(priceRupees * 0.38);
    const shippingAndHandlingPerOrder = 79;
    const returnRtoPenaltyPerOrder = 55; // reverse shipping fee
    const totalCogsAndShippingRupees =
      confirmedOrders * (unitProductCogs + shippingAndHandlingPerOrder) +
      returnedOrders * (shippingAndHandlingPerOrder + returnRtoPenaltyPerOrder);

    const netProfitRupees = netRevenueRupees - spendRupees - totalCogsAndShippingRupees;
    const roas = spendRupees > 0 ? Number((grossRevenueRupees / spendRupees).toFixed(2)) : 0;

    // 3. Automation Rules Evaluation on this day's results

    // A. Scale Winner Rule (10% budget increase if ROAS >= 2.5x & orders >= 3 & 24h cooldown)
    if (
      roas >= config.targetRoas &&
      grossOrders >= config.minDataPurchases &&
      day - lastScaleDay >= 1 &&
      currentBudget * 1.1 <= config.dailySpendCap / 100
    ) {
      const newBudget = Math.round(currentBudget * (1 + config.maxBudgetIncreasePct / 100));
      actionTaken = `ROAS reached ${roas}x (${grossOrders} orders). Automatically increased budget from ₹${currentBudget} to ₹${newBudget} (+10% safe cap).`;
      ruleTriggered = "Scale Winner (10% Daily Safety Cap)";
      currentBudget = newBudget;
      lastScaleDay = day;
      status = "SCALED";
      ruleActionsSummary.push(`Day ${day}: ${actionTaken}`);
    }

    // B. Loss Breaker Rule (Pause if spend >= ₹800 without sales)
    else if (spendRupees >= config.maxLossPerAdPaise / 100 && grossOrders === 0) {
      status = "PAUSED_BY_RULE";
      ruleTriggered = "Loss Breaker (Pause Unprofitable Ad)";
      actionTaken = `Spent ₹${spendRupees} with 0 orders. Automatically paused campaign to prevent capital loss.`;
      ruleActionsSummary.push(`Day ${day}: ${actionTaken}`);
    }

    dailyTimeline.push({
      day,
      date: dateStr,
      dailyBudgetRupees: currentBudget,
      spendRupees,
      impressions,
      clicks,
      ctr: Number((effectiveCtr * 100).toFixed(2)),
      cpcRupees,
      cpmRupees: effectiveCpm,
      grossOrders,
      confirmedOrders,
      returnedOrders,
      grossRevenueRupees,
      netRevenueRupees,
      adSpendRupees: spendRupees,
      cogsAndShippingRupees: totalCogsAndShippingRupees,
      netProfitRupees,
      roas,
      remainingStock,
      status,
      actionTaken,
      ruleTriggered,
    });
  }

  // 4. Calculate Aggregate Totals
  const totalAdSpendRupees = dailyTimeline.reduce((acc, d) => acc + d.spendRupees, 0);
  const totalGrossOrders = dailyTimeline.reduce((acc, d) => acc + d.grossOrders, 0);
  const totalConfirmedOrders = dailyTimeline.reduce((acc, d) => acc + d.confirmedOrders, 0);
  const totalReturnedOrders = dailyTimeline.reduce((acc, d) => acc + d.returnedOrders, 0);
  const totalGrossRevenueRupees = dailyTimeline.reduce((acc, d) => acc + d.grossRevenueRupees, 0);
  const totalNetRevenueRupees = dailyTimeline.reduce((acc, d) => acc + d.netRevenueRupees, 0);
  const totalCogsAndShippingRupees = dailyTimeline.reduce((acc, d) => acc + d.cogsAndShippingRupees, 0);
  const totalNetProfitRupees = totalNetRevenueRupees - totalAdSpendRupees - totalCogsAndShippingRupees;
  const profitMarginPct = totalNetRevenueRupees > 0 ? Number(((totalNetProfitRupees / totalNetRevenueRupees) * 100).toFixed(1)) : 0;
  const finalRoas = totalAdSpendRupees > 0 ? Number((totalGrossRevenueRupees / totalAdSpendRupees).toFixed(2)) : 0;
  const blendedCpaRupees = totalGrossOrders > 0 ? Math.round(totalAdSpendRupees / totalGrossOrders) : 0;
  const totalImpressions = dailyTimeline.reduce((acc, d) => acc + d.impressions, 0);
  const totalClicks = dailyTimeline.reduce((acc, d) => acc + d.clicks, 0);
  const averageCtrPct = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const averageCpcRupees = totalClicks > 0 ? Number((totalAdSpendRupees / totalClicks).toFixed(2)) : 0;

  // Verdict calculation
  let verdict: "SCALE_WINNER" | "MODERATE_PERFORMER" | "NEEDS_OPTIMIZATION" | "UNPROFITABLE_RISK" = "MODERATE_PERFORMER";
  let verdictReason = "";

  if (finalRoas >= 2.8 && totalNetProfitRupees > 0) {
    verdict = "SCALE_WINNER";
    verdictReason = `High performer with ${finalRoas}x ROAS and healthy net profit of ₹${totalNetProfitRupees.toLocaleString("en-IN")}. Recommended for live budget scaling.`;
  } else if (finalRoas >= 2.2 && totalNetProfitRupees > 0) {
    verdict = "MODERATE_PERFORMER";
    verdictReason = `Profitable with ${finalRoas}x ROAS. Maintain standard ₹500-₹1,000 daily budget.`;
  } else if (finalRoas >= 1.6) {
    verdict = "NEEDS_OPTIMIZATION";
    verdictReason = `Breakeven ROAS (${finalRoas}x). Margin is compressed after COD returns and shipping. Test higher CTR creative angle.`;
  } else {
    verdict = "UNPROFITABLE_RISK";
    verdictReason = `Low ROAS (${finalRoas}x). Automation rules correctly mitigated losses.`;
  }

  // Placement comparison breakdown
  const placementComparison = [
    {
      placement: "Instagram Reels (9:16 Fullscreen)",
      cpm: 140,
      ctr: Number((conditionFactor.baseCtr * 1.35 * 100).toFixed(2)),
      cpa: Math.round(blendedCpaRupees * 0.85),
      roas: Number((finalRoas * 1.15).toFixed(2)),
      suitability: "🔥 Highest ROAS for Kurti try-on clips & styling transitions",
    },
    {
      placement: "Instagram Feed Post (1:1 Square)",
      cpm: 175,
      ctr: Number((conditionFactor.baseCtr * 1.05 * 100).toFixed(2)),
      cpa: Math.round(blendedCpaRupees * 1.05),
      roas: finalRoas,
      suitability: "✅ Stable, high-intent product showcase photography",
    },
    {
      placement: "Instagram Carousel (Multi-Card)",
      cpm: 190,
      ctr: Number((conditionFactor.baseCtr * 1.45 * 100).toFixed(2)),
      cpa: Math.round(blendedCpaRupees * 0.92),
      roas: Number((finalRoas * 1.12).toFixed(2)),
      suitability: "🌟 Excellent for showing multiple colors & square neck close-ups",
    },
    {
      placement: "Instagram Stories (9:16 Swipe-Up)",
      cpm: 130,
      ctr: Number((conditionFactor.baseCtr * 1.15 * 100).toFixed(2)),
      cpa: Math.round(blendedCpaRupees * 1.0),
      roas: Number((finalRoas * 0.95).toFixed(2)),
      suitability: "⚡ High impression volume for flash discounts & limited-time deals",
    },
  ];

  return {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePriceRupees: priceRupees,
      originalPriceRupees,
      discountPct,
      images: product.images,
      fabric: product.fabric || "Premium Breathable Cotton",
      totalStock: totalStockInDb,
    },
    creative: {
      angle: selectedCreative.angle,
      title: selectedCreative.title,
      headline: selectedCreative.headline,
      primaryText: selectedCreative.primaryText,
      imageUrl: selectedCreative.imageUrl,
      callToAction: selectedCreative.callToAction,
      destinationUrl: selectedCreative.destinationUrl,
      placement,
    },
    simulationSettings: {
      durationDays: duration,
      startingDailyBudgetRupees: startingBudget,
      marketCondition: condition,
      instagramPlacement: placement,
      codReturnRatePct: codReturnPct,
    },
    dailyTimeline,
    summary: {
      totalAdSpendRupees,
      totalGrossOrders,
      totalConfirmedOrders,
      totalReturnedOrders,
      totalGrossRevenueRupees,
      totalNetRevenueRupees,
      totalCogsAndShippingRupees,
      netProfitRupees: totalNetProfitRupees,
      profitMarginPct,
      finalRoas,
      blendedCpaRupees,
      totalImpressions,
      totalClicks,
      averageCtrPct,
      averageCpcRupees,
      verdict,
      verdictReason,
      ruleActionsSummary,
    },
    placementComparison,
  };
}
