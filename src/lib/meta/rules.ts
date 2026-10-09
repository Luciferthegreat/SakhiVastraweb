import { prisma } from "@/lib/db";
import { getMetaConfig } from "./config";
import { metaClient } from "./client";
import { logActivity, validateSafetyAction } from "./safety";
import { RuleEvaluationResult } from "./types";

export async function evaluateAutomationRules(): Promise<RuleEvaluationResult[]> {
  const config = await getMetaConfig();
  const results: RuleEvaluationResult[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Fetch all campaigns with insights, ads, and product stock
  const campaigns = await prisma.metaCampaign.findMany({
    include: {
      product: {
        include: { variants: true },
      },
      adSets: {
        include: { ads: true },
      },
      insights: {
        where: { date: today },
      },
    },
  });

  for (const camp of campaigns) {
    const insight = camp.insights[0];
    const spendPaise = insight?.spend || 0;
    const purchases = insight?.purchases || 0;
    const roas = insight?.roas || 0;
    const currentBudgetPaise = camp.dailyBudget || 50000;

    // --- RULE 1: INVENTORY STOCK GUARD ---
    if (camp.product && camp.status === "ACTIVE") {
      const totalStock = camp.product.variants.reduce((acc, v) => acc + v.stock, 0);

      if (totalStock <= 0 || !camp.product.active) {
        const actionResult: RuleEvaluationResult = {
          ruleId: "rule_stock_guard",
          ruleName: "Out-of-Stock Auto-Pause",
          ruleType: "INVENTORY_CHECK",
          triggered: true,
          entityType: "CAMPAIGN",
          entityId: camp.id,
          entityName: camp.name,
          action: "PAUSE",
          previousValue: "ACTIVE",
          newValue: "PAUSED",
          reason: `Product "${camp.product.name}" has 0 remaining stock in inventory. Pausing ad to prevent wasted spend.`,
          safetyPassed: true,
          executed: false,
          mode: config.automationMode,
        };

        if (config.automationEnabled || config.automationMode === "simulation") {
          await metaClient.toggleStatus({
            entityType: "CAMPAIGN",
            entityId: camp.id,
            newStatus: "PAUSED",
            reason: actionResult.reason,
            ruleName: actionResult.ruleName,
          });
          actionResult.executed = true;
        }

        results.push(actionResult);
        continue;
      }
    }

    // --- RULE 2: PAUSE UNPROFITABLE ADS (Loss Breaker) ---
    if (camp.status === "ACTIVE" && spendPaise >= config.maxLossPerAdPaise && purchases === 0) {
      const actionResult: RuleEvaluationResult = {
        ruleId: "rule_loss_breaker",
        ruleName: "Pause Unprofitable Ads",
        ruleType: "PAUSE_LOSER",
        triggered: true,
        entityType: "CAMPAIGN",
        entityId: camp.id,
        entityName: camp.name,
        action: "PAUSE",
        previousValue: "ACTIVE",
        newValue: "PAUSED",
        reason: `Ad spent ₹${(spendPaise / 100).toFixed(0)} (Threshold: ₹${(
          config.maxLossPerAdPaise / 100
        ).toFixed(0)}) with 0 purchases. Pausing campaign.`,
        safetyPassed: true,
        executed: false,
        mode: config.automationMode,
      };

      if (config.automationEnabled || config.automationMode === "simulation") {
        await metaClient.toggleStatus({
          entityType: "CAMPAIGN",
          entityId: camp.id,
          newStatus: "PAUSED",
          reason: actionResult.reason,
          ruleName: actionResult.ruleName,
        });
        actionResult.executed = true;
      }

      results.push(actionResult);
      continue;
    }

    // --- RULE 3: SCALE WINNING CAMPAIGNS (10% Max Increase) ---
    if (
      camp.status === "ACTIVE" &&
      purchases >= config.minDataPurchases &&
      spendPaise >= config.minDataSpendPaise &&
      roas >= config.targetRoas
    ) {
      // Calculate 10% increase
      const increaseMultiplier = 1 + config.maxBudgetIncreasePct / 100;
      const proposedBudgetPaise = Math.round(currentBudgetPaise * increaseMultiplier);

      const safety = await validateSafetyAction({
        actionType: "INCREASE_BUDGET",
        campaignId: camp.id,
        currentBudgetPaise,
        proposedBudgetPaise,
        productId: camp.productId || undefined,
      });

      const actionResult: RuleEvaluationResult = {
        ruleId: "rule_scale_winner",
        ruleName: "Scale Winning Ads (10% Cap)",
        ruleType: "SCALE_WINNER",
        triggered: true,
        entityType: "CAMPAIGN",
        entityId: camp.id,
        entityName: camp.name,
        action: "SCALE_BUDGET",
        previousValue: `₹${(currentBudgetPaise / 100).toFixed(0)}`,
        newValue: `₹${(proposedBudgetPaise / 100).toFixed(0)}`,
        reason: `High performance: ROAS ${roas.toFixed(2)}x (Target: ${
          config.targetRoas
        }x) with ${purchases} purchases. Increasing budget by ${config.maxBudgetIncreasePct}%.`,
        safetyPassed: safety.allowed,
        safetyReason: safety.reason,
        executed: false,
        mode: config.automationMode,
      };

      if (safety.allowed && (config.automationEnabled || config.automationMode === "simulation")) {
        await metaClient.updateBudget({
          campaignId: camp.id,
          newBudgetPaise: proposedBudgetPaise,
          reason: actionResult.reason,
          ruleName: actionResult.ruleName,
        });
        actionResult.executed = true;
      } else if (!safety.allowed) {
        await logActivity({
          action: "RULE_EVALUATION",
          entityType: "CAMPAIGN",
          entityId: camp.id,
          entityName: camp.name,
          ruleName: actionResult.ruleName,
          reason: `Scale proposed but safety check blocked: ${safety.reason}`,
          mode: config.automationMode,
          status: "BLOCKED_BY_SAFETY",
        });
      }

      results.push(actionResult);
    }
  }

  // If no specific rules triggered on any campaigns, log audit check
  if (results.length === 0) {
    await logActivity({
      action: "RULE_EVALUATION",
      entityType: "SYSTEM",
      reason: `Evaluated ${campaigns.length} campaigns against safety rules. All campaigns operating within standard thresholds.`,
      mode: config.automationMode,
      status: "SUCCESS",
    });
  }

  return results;
}
