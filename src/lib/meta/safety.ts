import { prisma } from "@/lib/db";
import { getMetaConfig } from "./config";
import { AutomationMode } from "./types";

export interface SafetyCheckResult {
  allowed: boolean;
  reason: string;
  code:
    | "SAFE"
    | "EMERGENCY_STOP_ACTIVE"
    | "AUTOMATION_DISABLED"
    | "DAILY_SPEND_CAP_EXCEEDED"
    | "BUDGET_INCREASE_TOO_HIGH"
    | "COOLDOWN_ACTIVE"
    | "INSUFFICIENT_DATA"
    | "INSUFFICIENT_STOCK"
    | "TRACKING_UNHEALTHY"
    | "SIMULATION_ONLY";
}

export async function logActivity(params: {
  action: string;
  entityType: "CAMPAIGN" | "ADSET" | "AD" | "SYSTEM" | "RULE";
  entityId?: string;
  entityName?: string;
  ruleId?: string;
  ruleName?: string;
  previousValue?: string;
  newValue?: string;
  reason: string;
  mode: AutomationMode;
  status: "SUCCESS" | "FAILED" | "BLOCKED_BY_SAFETY";
  apiPayload?: any;
  apiResponse?: any;
  errorMessage?: string;
}) {
  try {
    return await prisma.metaActivityLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        ruleId: params.ruleId,
        ruleName: params.ruleName,
        previousValue: params.previousValue,
        newValue: params.newValue,
        reason: params.reason,
        mode: params.mode,
        status: params.status,
        apiPayload: params.apiPayload ? JSON.parse(JSON.stringify(params.apiPayload)) : undefined,
        apiResponse: params.apiResponse ? JSON.parse(JSON.stringify(params.apiResponse)) : undefined,
        errorMessage: params.errorMessage,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
    return null;
  }
}

/**
 * Validate whether an action is safe to execute live
 */
export async function validateSafetyAction(params: {
  actionType: "INCREASE_BUDGET" | "DECREASE_BUDGET" | "PAUSE" | "RESUME" | "CREATE";
  campaignId?: string;
  currentBudgetPaise?: number;
  proposedBudgetPaise?: number;
  productId?: string;
}): Promise<SafetyCheckResult> {
  const config = await getMetaConfig();

  // 1. Check Emergency Stop
  if (config.emergencyStop) {
    return {
      allowed: false,
      reason: "Emergency Stop is ACTIVE. All automated modifications are blocked.",
      code: "EMERGENCY_STOP_ACTIVE",
    };
  }

  // 2. Check Automation Enabled
  if (!config.automationEnabled && config.automationMode === "live") {
    return {
      allowed: false,
      reason: "Automation is currently disabled in settings.",
      code: "AUTOMATION_DISABLED",
    };
  }

  // 3. Inventory Stock Check (if productId provided)
  if (params.productId) {
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: { variants: true },
    });

    if (!product || !product.active) {
      return {
        allowed: false,
        reason: `Product "${product?.name || params.productId}" is inactive in catalog.`,
        code: "INSUFFICIENT_STOCK",
      };
    }

    const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
    if (totalStock <= 0) {
      return {
        allowed: false,
        reason: `Product "${product.name}" has 0 total stock across all sizes.`,
        code: "INSUFFICIENT_STOCK",
      };
    }
  }

  // 4. Budget Increase Specific Checks
  if (params.actionType === "INCREASE_BUDGET" && params.currentBudgetPaise && params.proposedBudgetPaise) {
    const increasePaise = params.proposedBudgetPaise - params.currentBudgetPaise;
    if (increasePaise <= 0) {
      return { allowed: true, reason: "Budget is not increasing.", code: "SAFE" };
    }

    const maxAllowedIncreasePct = config.maxBudgetIncreasePct; // e.g. 10.0%
    const maxAllowedBudgetPaise = Math.round(
      params.currentBudgetPaise * (1 + maxAllowedIncreasePct / 100)
    );

    if (params.proposedBudgetPaise > maxAllowedBudgetPaise) {
      return {
        allowed: false,
        reason: `Proposed budget increase (${(
          (increasePaise / params.currentBudgetPaise) *
          100
        ).toFixed(1)}%) exceeds maximum safety limit of ${maxAllowedIncreasePct}% (Max: ₹${(
          maxAllowedBudgetPaise / 100
        ).toFixed(0)}).`,
        code: "BUDGET_INCREASE_TOO_HIGH",
      };
    }

    // Check 24-hour Cooldown for Campaign Budget Increases
    if (params.campaignId) {
      const cooldownCutoff = new Date(
        Date.now() - config.budgetIncreaseCooldownHours * 60 * 60 * 1000
      );

      const recentIncrease = await prisma.metaActivityLog.findFirst({
        where: {
          entityId: params.campaignId,
          action: "INCREASE_BUDGET",
          status: "SUCCESS",
          timestamp: { gte: cooldownCutoff },
        },
        orderBy: { timestamp: "desc" },
      });

      if (recentIncrease) {
        return {
          allowed: false,
          reason: `Campaign budget was already increased on ${recentIncrease.timestamp.toISOString()}. Cooldown is ${
            config.budgetIncreaseCooldownHours
          } hours.`,
          code: "COOLDOWN_ACTIVE",
        };
      }
    }

    // Check Account-Wide Daily Spend Cap
    const totalCurrentBudgets = await prisma.metaCampaign.aggregate({
      where: { status: "ACTIVE" },
      _sum: { dailyBudget: true },
    });

    const activeSpendPaise = (totalCurrentBudgets._sum.dailyBudget || 0) + increasePaise;
    if (activeSpendPaise > config.dailySpendCap) {
      return {
        allowed: false,
        reason: `Total account active daily budget (₹${(activeSpendPaise / 100).toFixed(
          0
        )}) would exceed configured account daily spend cap (₹${(
          config.dailySpendCap / 100
        ).toFixed(0)}).`,
        code: "DAILY_SPEND_CAP_EXCEEDED",
      };
    }
  }

  return {
    allowed: true,
    reason: "Passed all safety policies and thresholds.",
    code: "SAFE",
  };
}

/**
 * Check tracking health by looking at recent conversion events in the last 24h
 */
export async function getTrackingHealth(): Promise<{
  status: "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "NOT_INITIALIZED";
  pixelConfigured: boolean;
  capiConfigured: boolean;
  recentBrowserEvents: number;
  recentServerEvents: number;
  deduplicationRatePct: number;
  lastEventTime?: Date;
}> {
  const config = await getMetaConfig();
  const pixelConfigured = !!config.pixelId;
  const capiConfigured = !!(config.capiToken && config.pixelId);

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentEvents = await prisma.metaConversionEvent.findMany({
    where: { eventTime: { gte: oneDayAgo } },
    orderBy: { eventTime: "desc" },
    take: 100,
  });

  const total = recentEvents.length;
  const browserCount = recentEvents.filter((e) => e.browserSent).length;
  const serverCount = recentEvents.filter((e) => e.serverSent).length;
  const deduplicatedCount = recentEvents.filter((e) => e.browserSent && e.serverSent).length;
  const deduplicationRatePct = total > 0 ? Math.round((deduplicatedCount / total) * 100) : 0;

  let status: "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "NOT_INITIALIZED" = "NOT_INITIALIZED";

  if (!pixelConfigured && !capiConfigured) {
    status = "NOT_INITIALIZED";
  } else if (total === 0) {
    status = "DEGRADED"; // configured but no events in last 24h
  } else if (capiConfigured && pixelConfigured && deduplicationRatePct > 50) {
    status = "HEALTHY";
  } else if (total > 0) {
    status = "HEALTHY";
  } else {
    status = "UNHEALTHY";
  }

  return {
    status,
    pixelConfigured,
    capiConfigured,
    recentBrowserEvents: browserCount,
    recentServerEvents: serverCount,
    deduplicationRatePct,
    lastEventTime: recentEvents[0]?.eventTime,
  };
}
