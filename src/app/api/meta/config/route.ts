import { NextResponse } from "next/server";
import { getMetaConfig, updateMetaConfig } from "@/lib/meta/config";

export async function GET() {
  try {
    const config = await getMetaConfig();

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        adAccountId: config.adAccountId,
        pixelId: config.pixelId,
        hasAccessToken: !!config.accessToken,
        accessTokenMasked: config.accessToken
          ? `${config.accessToken.slice(0, 6)}...${config.accessToken.slice(-4)}`
          : null,
        hasCapiToken: !!config.capiToken,
        capiTokenMasked: config.capiToken
          ? `${config.capiToken.slice(0, 6)}...${config.capiToken.slice(-4)}`
          : null,
        appId: config.appId,
        automationMode: config.automationMode,
        automationEnabled: config.automationEnabled,
        dailySpendCapRupees: config.dailySpendCap / 100,
        maxBudgetIncreasePct: config.maxBudgetIncreasePct,
        budgetIncreaseCooldownHours: config.budgetIncreaseCooldownHours,
        minDataPurchases: config.minDataPurchases,
        minDataSpendRupees: config.minDataSpendPaise / 100,
        maxLossPerAdRupees: config.maxLossPerAdPaise / 100,
        targetRoas: config.targetRoas,
        emergencyStop: config.emergencyStop,
      },
    });
  } catch (err: any) {
    console.error("Get config API error:", err);
    return NextResponse.json({ error: err.message || "Failed to load config" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const updates: any = {};
    if (body.adAccountId !== undefined) updates.adAccountId = body.adAccountId?.trim() || null;
    if (body.pixelId !== undefined) updates.pixelId = body.pixelId?.trim() || null;
    if (body.accessToken) updates.accessToken = body.accessToken.trim();
    if (body.capiToken) updates.capiToken = body.capiToken.trim();
    if (body.appId !== undefined) updates.appId = body.appId?.trim() || null;
    if (body.appSecret) updates.appSecret = body.appSecret.trim();
    if (body.automationMode) updates.automationMode = body.automationMode;
    if (typeof body.automationEnabled === "boolean") updates.automationEnabled = body.automationEnabled;
    if (typeof body.emergencyStop === "boolean") updates.emergencyStop = body.emergencyStop;
    if (body.dailySpendCapRupees !== undefined) {
      updates.dailySpendCap = Math.round(Number(body.dailySpendCapRupees) * 100);
    }
    if (body.maxBudgetIncreasePct !== undefined) {
      updates.maxBudgetIncreasePct = Number(body.maxBudgetIncreasePct);
    }
    if (body.targetRoas !== undefined) {
      updates.targetRoas = Number(body.targetRoas);
    }
    if (body.maxLossPerAdRupees !== undefined) {
      updates.maxLossPerAdPaise = Math.round(Number(body.maxLossPerAdRupees) * 100);
    }

    const updated = await updateMetaConfig(updates);

    return NextResponse.json({
      success: true,
      message: "Configuration saved securely.",
      config: {
        id: updated.id,
        adAccountId: updated.adAccountId,
        pixelId: updated.pixelId,
        hasAccessToken: !!updated.accessToken,
        automationMode: updated.automationMode,
        automationEnabled: updated.automationEnabled,
        emergencyStop: updated.emergencyStop,
        dailySpendCapRupees: updated.dailySpendCap / 100,
      },
    });
  } catch (err: any) {
    console.error("Save config API error:", err);
    return NextResponse.json({ error: err.message || "Failed to save config" }, { status: 500 });
  }
}
