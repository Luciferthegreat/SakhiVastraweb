import { prisma } from "@/lib/db";
import { getMetaConfig } from "./config";
import { metaClient } from "./client";
import { evaluateAutomationRules } from "./rules";
import { getTrackingHealth } from "./safety";

export async function runAutomationCycle() {
  const config = await getMetaConfig();

  // 1. Sync Insights
  await metaClient.syncInsights();

  // 2. Evaluate deterministic automation rules
  const ruleResults = await evaluateAutomationRules();

  // 3. Tracking health check
  const trackingHealth = await getTrackingHealth();

  return {
    success: true,
    mode: config.automationMode,
    automationEnabled: config.automationEnabled,
    emergencyStop: config.emergencyStop,
    trackingHealth,
    ruleResults,
    executedAt: new Date().toISOString(),
  };
}

export async function generateDailyReport(targetDate = new Date()) {
  targetDate.setHours(0, 0, 0, 0);

  const config = await getMetaConfig();

  // 1. Get Meta Insights for date
  const insights = await prisma.metaInsight.findMany({
    where: { date: targetDate },
  });

  const totalSpendPaise = insights.reduce((acc, i) => acc + i.spend, 0);
  const totalAttributedPurchases = insights.reduce((acc, i) => acc + i.purchases, 0);
  const totalAttributedRevenuePaise = insights.reduce((acc, i) => acc + i.purchaseValue, 0);
  const totalImpressions = insights.reduce((acc, i) => acc + i.impressions, 0);
  const totalClicks = insights.reduce((acc, i) => acc + i.clicks, 0);

  // 2. Get Confirmed Orders in DB for target date
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const confirmedOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: targetDate, lt: nextDay },
      paymentStatus: "PAID",
    },
    include: { items: true },
  });

  const confirmedOrdersCount = confirmedOrders.length;
  const confirmedGrossRevenuePaise = confirmedOrders.reduce((acc, o) => acc + o.total, 0);

  // 3. Financial calculations
  const roas = totalSpendPaise > 0 ? Number((totalAttributedRevenuePaise / totalSpendPaise).toFixed(2)) : 0;
  const cpaPaise = totalAttributedPurchases > 0 ? Math.round(totalSpendPaise / totalAttributedPurchases) : 0;
  
  // Approximate COGS / product cost ~ 40% of selling price + shipping
  const estimatedCogsPaise = Math.round(confirmedGrossRevenuePaise * 0.4);
  const estimatedNetProfitPaise = confirmedGrossRevenuePaise - totalSpendPaise - estimatedCogsPaise;

  // 4. Activity log stats
  const activityLogs = await prisma.metaActivityLog.findMany({
    where: { timestamp: { gte: targetDate, lt: nextDay } },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  const tracking = await getTrackingHealth();

  return {
    date: targetDate.toISOString().slice(0, 10),
    mode: config.automationMode,
    automationEnabled: config.automationEnabled,
    emergencyStop: config.emergencyStop,
    dailySpendCapPaise: config.dailySpendCap,
    spendPaise: totalSpendPaise,
    impressions: totalImpressions,
    clicks: totalClicks,
    attributedPurchases: totalAttributedPurchases,
    attributedRevenuePaise: totalAttributedRevenuePaise,
    confirmedOrdersCount,
    confirmedGrossRevenuePaise,
    roas,
    cpaPaise,
    estimatedProfitPaise: estimatedNetProfitPaise,
    trackingHealth: tracking.status,
    recentActions: activityLogs,
  };
}
