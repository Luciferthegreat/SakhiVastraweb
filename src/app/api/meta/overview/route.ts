import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMetaConfig } from "@/lib/meta/config";
import { getTrackingHealth } from "@/lib/meta/safety";
import { metaClient } from "@/lib/meta/client";

export async function GET() {
  try {
    const config = await getMetaConfig();
    const tracking = await getTrackingHealth();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch campaigns with today's insights
    const campaigns = await prisma.metaCampaign.findMany({
      include: {
        insights: {
          where: { date: today },
        },
        product: true,
      },
    });

    const activeCampaignsCount = campaigns.filter((c) => c.status === "ACTIVE").length;
    const pausedCampaignsCount = campaigns.filter((c) => c.status === "PAUSED").length;

    // Total spend & attributed metrics
    const totalSpendPaise = campaigns.reduce(
      (acc, c) => acc + (c.insights[0]?.spend || 0),
      0
    );
    const totalAttributedPurchases = campaigns.reduce(
      (acc, c) => acc + (c.insights[0]?.purchases || 0),
      0
    );
    const totalAttributedRevenuePaise = campaigns.reduce(
      (acc, c) => acc + (c.insights[0]?.purchaseValue || 0),
      0
    );
    const totalImpressions = campaigns.reduce(
      (acc, c) => acc + (c.insights[0]?.impressions || 0),
      0
    );
    const totalClicks = campaigns.reduce(
      (acc, c) => acc + (c.insights[0]?.clicks || 0),
      0
    );

    const roas =
      totalSpendPaise > 0
        ? Number((totalAttributedRevenuePaise / totalSpendPaise).toFixed(2))
        : 0;
    const costPerPurchasePaise =
      totalAttributedPurchases > 0
        ? Math.round(totalSpendPaise / totalAttributedPurchases)
        : 0;

    // Confirmed DB Orders in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        paymentStatus: "PAID",
      },
    });
    const totalConfirmedRevenuePaise = recentOrders.reduce((acc, o) => acc + o.total, 0);
    const estimatedCogsPaise = Math.round(totalConfirmedRevenuePaise * 0.4);
    const estimatedProfitPaise = totalConfirmedRevenuePaise - totalSpendPaise - estimatedCogsPaise;

    // Budget utilization
    const activeDailyBudgetPaise = campaigns
      .filter((c) => c.status === "ACTIVE")
      .reduce((acc, c) => acc + (c.dailyBudget || 0), 0);
    const budgetUtilizationPct =
      config.dailySpendCap > 0
        ? Math.min(100, Math.round((activeDailyBudgetPaise / config.dailySpendCap) * 100))
        : 0;

    // Recent activity logs
    const recentLogs = await prisma.metaActivityLog.findMany({
      take: 8,
      orderBy: { timestamp: "desc" },
    });

    let accountInfo: any = null;
    try {
      accountInfo = await metaClient.getAccountInfo();
    } catch {
      accountInfo = { name: "Sakhi Vastra Ad Account", mode: config.automationMode, is_live: false };
    }

    return NextResponse.json({
      success: true,
      config: {
        mode: config.automationMode,
        automationEnabled: config.automationEnabled,
        emergencyStop: config.emergencyStop,
        dailySpendCapPaise: config.dailySpendCap,
        maxBudgetIncreasePct: config.maxBudgetIncreasePct,
        targetRoas: config.targetRoas,
        maxLossPerAdPaise: config.maxLossPerAdPaise,
        pixelConfigured: !!config.pixelId,
        capiConfigured: !!(config.capiToken && config.pixelId),
      },
      accountInfo,
      metrics: {
        spendPaise: totalSpendPaise,
        purchases: totalAttributedPurchases,
        revenuePaise: totalAttributedRevenuePaise,
        roas,
        costPerPurchasePaise,
        impressions: totalImpressions,
        clicks: totalClicks,
        confirmedOrders7d: recentOrders.length,
        confirmedRevenue7dPaise: totalConfirmedRevenuePaise,
        estimatedProfitPaise,
        activeDailyBudgetPaise,
        budgetUtilizationPct,
        activeCampaignsCount,
        pausedCampaignsCount,
        totalCampaignsCount: campaigns.length,
      },
      tracking,
      recentLogs,
    });
  } catch (err: any) {
    console.error("Meta overview API error:", err);
    return NextResponse.json({ error: err.message || "Failed to load overview" }, { status: 500 });
  }
}
