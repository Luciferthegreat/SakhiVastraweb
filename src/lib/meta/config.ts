import { prisma } from "@/lib/db";
import { MetaConfigSettings } from "./types";

const DEFAULT_CONFIG: MetaConfigSettings = {
  adAccountId: process.env.META_AD_ACCOUNT_ID || null,
  pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || null,
  accessToken: process.env.META_ACCESS_TOKEN || null,
  capiToken: process.env.META_CAPI_TOKEN || process.env.META_ACCESS_TOKEN || null,
  appId: process.env.META_APP_ID || null,
  appSecret: process.env.META_APP_SECRET || null,
  automationMode: (process.env.AUTOMATION_MODE as any) || "monitor",
  automationEnabled: process.env.AUTOMATION_ENABLED === "true",
  dailySpendCap: parseInt(process.env.META_DAILY_SPEND_CAP || "500000", 10), // ₹5,000 default
  maxBudgetIncreasePct: parseFloat(process.env.META_MAX_BUDGET_INCREASE_PCT || "10.0"), // 10%
  budgetIncreaseCooldownHours: parseInt(process.env.META_BUDGET_COOLDOWN_HOURS || "24", 10),
  minDataPurchases: parseInt(process.env.META_MIN_DATA_PURCHASES || "3", 10),
  minDataSpendPaise: parseInt(process.env.META_MIN_DATA_SPEND || "100000", 10),
  maxLossPerAdPaise: parseInt(process.env.META_MAX_LOSS_PER_AD || "80000", 10),
  targetRoas: parseFloat(process.env.META_TARGET_ROAS || "2.5"),
  emergencyStop: false,
  autoSyncSchedule: "0 */2 * * *",
};

export async function getMetaConfig(): Promise<MetaConfigSettings> {
  try {
    const dbConfig = await prisma.metaConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!dbConfig) {
      // Create initial default row in DB
      const created = await prisma.metaConfig.create({
        data: {
          adAccountId: DEFAULT_CONFIG.adAccountId,
          pixelId: DEFAULT_CONFIG.pixelId,
          accessToken: DEFAULT_CONFIG.accessToken,
          capiToken: DEFAULT_CONFIG.capiToken,
          appId: DEFAULT_CONFIG.appId,
          appSecret: DEFAULT_CONFIG.appSecret,
          automationMode: DEFAULT_CONFIG.automationMode,
          automationEnabled: DEFAULT_CONFIG.automationEnabled,
          dailySpendCap: DEFAULT_CONFIG.dailySpendCap,
          maxBudgetIncreasePct: DEFAULT_CONFIG.maxBudgetIncreasePct,
          budgetIncreaseCooldownHours: DEFAULT_CONFIG.budgetIncreaseCooldownHours,
          minDataPurchases: DEFAULT_CONFIG.minDataPurchases,
          minDataSpendPaise: DEFAULT_CONFIG.minDataSpendPaise,
          maxLossPerAdPaise: DEFAULT_CONFIG.maxLossPerAdPaise,
          targetRoas: DEFAULT_CONFIG.targetRoas,
          emergencyStop: DEFAULT_CONFIG.emergencyStop,
          autoSyncSchedule: DEFAULT_CONFIG.autoSyncSchedule,
        },
      });

      return {
        id: created.id,
        adAccountId: created.adAccountId,
        pixelId: created.pixelId,
        accessToken: created.accessToken,
        capiToken: created.capiToken,
        appId: created.appId,
        appSecret: created.appSecret,
        automationMode: created.automationMode as any,
        automationEnabled: created.automationEnabled,
        dailySpendCap: created.dailySpendCap,
        maxBudgetIncreasePct: created.maxBudgetIncreasePct,
        budgetIncreaseCooldownHours: created.budgetIncreaseCooldownHours,
        minDataPurchases: created.minDataPurchases,
        minDataSpendPaise: created.minDataSpendPaise,
        maxLossPerAdPaise: created.maxLossPerAdPaise,
        targetRoas: created.targetRoas,
        emergencyStop: created.emergencyStop,
        autoSyncSchedule: created.autoSyncSchedule,
      };
    }

    return {
      id: dbConfig.id,
      adAccountId: dbConfig.adAccountId || DEFAULT_CONFIG.adAccountId,
      pixelId: dbConfig.pixelId || DEFAULT_CONFIG.pixelId,
      accessToken: dbConfig.accessToken || DEFAULT_CONFIG.accessToken,
      capiToken: dbConfig.capiToken || DEFAULT_CONFIG.capiToken,
      appId: dbConfig.appId || DEFAULT_CONFIG.appId,
      appSecret: dbConfig.appSecret || DEFAULT_CONFIG.appSecret,
      automationMode: dbConfig.automationMode as any,
      automationEnabled: dbConfig.automationEnabled,
      dailySpendCap: dbConfig.dailySpendCap,
      maxBudgetIncreasePct: dbConfig.maxBudgetIncreasePct,
      budgetIncreaseCooldownHours: dbConfig.budgetIncreaseCooldownHours,
      minDataPurchases: dbConfig.minDataPurchases,
      minDataSpendPaise: dbConfig.minDataSpendPaise,
      maxLossPerAdPaise: dbConfig.maxLossPerAdPaise,
      targetRoas: dbConfig.targetRoas,
      emergencyStop: dbConfig.emergencyStop,
      autoSyncSchedule: dbConfig.autoSyncSchedule,
    };
  } catch (err) {
    console.error("Failed to load MetaConfig from DB, falling back to defaults:", err);
    return DEFAULT_CONFIG;
  }
}

export async function updateMetaConfig(
  updates: Partial<MetaConfigSettings>
): Promise<MetaConfigSettings> {
  const current = await getMetaConfig();

  const dataToSave: any = { ...updates };
  delete dataToSave.id;

  if (current.id) {
    const updated = await prisma.metaConfig.update({
      where: { id: current.id },
      data: dataToSave,
    });
    return {
      id: updated.id,
      adAccountId: updated.adAccountId,
      pixelId: updated.pixelId,
      accessToken: updated.accessToken,
      capiToken: updated.capiToken,
      appId: updated.appId,
      appSecret: updated.appSecret,
      automationMode: updated.automationMode as any,
      automationEnabled: updated.automationEnabled,
      dailySpendCap: updated.dailySpendCap,
      maxBudgetIncreasePct: updated.maxBudgetIncreasePct,
      budgetIncreaseCooldownHours: updated.budgetIncreaseCooldownHours,
      minDataPurchases: updated.minDataPurchases,
      minDataSpendPaise: updated.minDataSpendPaise,
      maxLossPerAdPaise: updated.maxLossPerAdPaise,
      targetRoas: updated.targetRoas,
      emergencyStop: updated.emergencyStop,
      autoSyncSchedule: updated.autoSyncSchedule,
    };
  } else {
    const created = await prisma.metaConfig.create({
      data: {
        ...DEFAULT_CONFIG,
        ...dataToSave,
      },
    });
    return {
      id: created.id,
      adAccountId: created.adAccountId,
      pixelId: created.pixelId,
      accessToken: created.accessToken,
      capiToken: created.capiToken,
      appId: created.appId,
      appSecret: created.appSecret,
      automationMode: created.automationMode as any,
      automationEnabled: created.automationEnabled,
      dailySpendCap: created.dailySpendCap,
      maxBudgetIncreasePct: created.maxBudgetIncreasePct,
      budgetIncreaseCooldownHours: created.budgetIncreaseCooldownHours,
      minDataPurchases: created.minDataPurchases,
      minDataSpendPaise: created.minDataSpendPaise,
      maxLossPerAdPaise: created.maxLossPerAdPaise,
      targetRoas: created.targetRoas,
      emergencyStop: created.emergencyStop,
      autoSyncSchedule: created.autoSyncSchedule,
    };
  }
}
