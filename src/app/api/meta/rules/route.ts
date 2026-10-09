import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMetaConfig, updateMetaConfig } from "@/lib/meta/config";

export async function GET() {
  try {
    const config = await getMetaConfig();
    let rules = await prisma.metaAutomationRule.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (rules.length === 0) {
      // Seed standard rules
      rules = await Promise.all([
        prisma.metaAutomationRule.create({
          data: {
            name: "Loss Breaker (Pause Unprofitable Ads)",
            description: `Automatically pause ads that spend more than ₹${(
              config.maxLossPerAdPaise / 100
            ).toFixed(0)} without a single purchase.`,
            ruleType: "PAUSE_LOSER",
            enabled: true,
            conditionJson: { metric: "spend", operator: ">=", value: config.maxLossPerAdPaise, purchases: 0 },
            actionJson: { action: "PAUSE", target: "CAMPAIGN" },
          },
        }),
        prisma.metaAutomationRule.create({
          data: {
            name: "Scale Winning Ads (Max 10% Increase)",
            description: `Safely scale high-performing campaigns with ROAS >= ${config.targetRoas}x by 10% daily (24h cooldown).`,
            ruleType: "SCALE_WINNER",
            enabled: true,
            conditionJson: {
              roas: config.targetRoas,
              minPurchases: config.minDataPurchases,
              minSpend: config.minDataSpendPaise,
            },
            actionJson: { action: "SCALE_BUDGET", pct: config.maxBudgetIncreasePct },
          },
        }),
        prisma.metaAutomationRule.create({
          data: {
            name: "Out-of-Stock Auto-Pause (Stock Guard)",
            description: "Automatically pause campaigns immediately when product inventory reaches 0 stock.",
            ruleType: "INVENTORY_CHECK",
            enabled: true,
            conditionJson: { totalStock: 0 },
            actionJson: { action: "PAUSE", target: "CAMPAIGN" },
          },
        }),
        prisma.metaAutomationRule.create({
          data: {
            name: "Account Daily Spend Cap Breaker",
            description: `Prevents account-wide daily advertising spend from exceeding ₹${(
              config.dailySpendCap / 100
            ).toFixed(0)}.`,
            ruleType: "PREVENT_OVERSPEND",
            enabled: true,
            conditionJson: { totalAccountSpendPaise: config.dailySpendCap },
            actionJson: { action: "BLOCK_INCREASE", target: "ACCOUNT" },
          },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      rules,
      safetySettings: {
        dailySpendCapRupees: config.dailySpendCap / 100,
        maxBudgetIncreasePct: config.maxBudgetIncreasePct,
        budgetIncreaseCooldownHours: config.budgetIncreaseCooldownHours,
        minDataPurchases: config.minDataPurchases,
        minDataSpendRupees: config.minDataSpendPaise / 100,
        maxLossPerAdRupees: config.maxLossPerAdPaise / 100,
        targetRoas: config.targetRoas,
        emergencyStop: config.emergencyStop,
        automationEnabled: config.automationEnabled,
        automationMode: config.automationMode,
      },
    });
  } catch (err: any) {
    console.error("Rules API error:", err);
    return NextResponse.json({ error: err.message || "Failed to load rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.ruleId && typeof body.enabled === "boolean") {
      const updated = await prisma.metaAutomationRule.update({
        where: { id: body.ruleId },
        data: { enabled: body.enabled },
      });
      return NextResponse.json({ success: true, rule: updated });
    }

    if (body.safetySettings) {
      const s = body.safetySettings;
      const updatedConfig = await updateMetaConfig({
        dailySpendCap: s.dailySpendCapRupees ? Math.round(s.dailySpendCapRupees * 100) : undefined,
        maxBudgetIncreasePct: s.maxBudgetIncreasePct,
        budgetIncreaseCooldownHours: s.budgetIncreaseCooldownHours,
        minDataPurchases: s.minDataPurchases,
        minDataSpendPaise: s.minDataSpendRupees ? Math.round(s.minDataSpendRupees * 100) : undefined,
        maxLossPerAdPaise: s.maxLossPerAdRupees ? Math.round(s.maxLossPerAdRupees * 100) : undefined,
        targetRoas: s.targetRoas,
        emergencyStop: typeof s.emergencyStop === "boolean" ? s.emergencyStop : undefined,
        automationEnabled: typeof s.automationEnabled === "boolean" ? s.automationEnabled : undefined,
        automationMode: s.automationMode,
      });

      return NextResponse.json({ success: true, config: updatedConfig });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (err: any) {
    console.error("Update rules/safety error:", err);
    return NextResponse.json({ error: err.message || "Failed to update" }, { status: 500 });
  }
}
