"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type TabKey = "overview" | "campaigns" | "products" | "creatives" | "backtest" | "rules" | "logs" | "settings";

export default function MetaAdsDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Overview Data
  const [overview, setOverview] = useState<any>(null);
  // Campaigns Data
  const [campaigns, setCampaigns] = useState<any[]>([]);
  // Products Data
  const [products, setProducts] = useState<any[]>([]);
  // Rules Data
  const [rules, setRules] = useState<any[]>([]);
  const [safetySettings, setSafetySettings] = useState<any>({});
  // Activity Logs
  const [logs, setLogs] = useState<any[]>([]);
  // Config Data
  const [config, setConfig] = useState<any>({});

  // Creative Studio State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [generatedCreatives, setGeneratedCreatives] = useState<any[]>([]);
  const [generatingCreatives, setGeneratingCreatives] = useState(false);
  const [selectedCreativeIndex, setSelectedCreativeIndex] = useState(0);

  // Backtest Studio State
  const [backtestProductId, setBacktestProductId] = useState<string>("");
  const [backtestAngle, setBacktestAngle] = useState<string>("REEL_CONCEPT");
  const [backtestPlacement, setBacktestPlacement] = useState<string>("INSTAGRAM_REELS");
  const [backtestDuration, setBacktestDuration] = useState<number>(14);
  const [backtestBudget, setBacktestBudget] = useState<number>(500);
  const [backtestCondition, setBacktestCondition] = useState<string>("REALISTIC_AVERAGE");
  const [backtestCodReturn, setBacktestCodReturn] = useState<number>(20);
  const [backtestResult, setBacktestResult] = useState<any | null>(null);
  const [runningBacktest, setRunningBacktest] = useState(false);

  // New Campaign Modal / Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    templateType: "HERO_BESTSELLER",
    productId: "",
    dailyBudgetRupees: 500,
    headline: "",
    primaryText: "",
    description: "",
    callToAction: "SHOP_NOW",
    imageUrl: "",
    destinationUrl: "https://www.sakhivastra.in/shop",
    creativeAngle: "PRODUCT_SHOWCASE",
  });

  // Budget Edit Modal State
  const [editingBudgetCampaign, setEditingBudgetCampaign] = useState<any | null>(null);
  const [newBudgetInput, setNewBudgetInput] = useState<number>(500);

  // Config Form State
  const [configForm, setConfigForm] = useState({
    adAccountId: "",
    pixelId: "",
    accessToken: "",
    capiToken: "",
    appId: "",
    automationMode: "monitor",
    automationEnabled: false,
    dailySpendCapRupees: 5000,
    maxBudgetIncreasePct: 10,
    targetRoas: 2.5,
    maxLossPerAdRupees: 800,
  });

  // Load all dashboard data
  async function loadDashboardData() {
    try {
      setRefreshing(true);
      const [ovRes, campRes, prodRes, ruleRes, logRes, confRes] = await Promise.all([
        fetch("/api/meta/overview"),
        fetch("/api/meta/campaigns"),
        fetch("/api/meta/products"),
        fetch("/api/meta/rules"),
        fetch("/api/meta/logs?limit=40"),
        fetch("/api/meta/config"),
      ]);

      if (ovRes.ok) setOverview((await ovRes.json()));
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(campData.campaigns || []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
        if (prodData.products?.length > 0) {
          if (!selectedProductId) setSelectedProductId(prodData.products[0].id);
          if (!backtestProductId) setBacktestProductId(prodData.products[0].id);
        }
      }
      if (ruleRes.ok) {
        const ruleData = await ruleRes.json();
        setRules(ruleData.rules || []);
        setSafetySettings(ruleData.safetySettings || {});
      }
      if (logRes.ok) {
        const logData = await logRes.json();
        setLogs(logData.logs || []);
      }
      if (confRes.ok) {
        const confData = await confRes.json();
        setConfig(confData.config || {});
        if (confData.config) {
          setConfigForm({
            adAccountId: confData.config.adAccountId || "",
            pixelId: confData.config.pixelId || "",
            accessToken: "",
            capiToken: "",
            appId: confData.config.appId || "",
            automationMode: confData.config.automationMode || "monitor",
            automationEnabled: confData.config.automationEnabled || false,
            dailySpendCapRupees: confData.config.dailySpendCapRupees || 5000,
            maxBudgetIncreasePct: confData.config.maxBudgetIncreasePct || 10,
            targetRoas: confData.config.targetRoas || 2.5,
            maxLossPerAdRupees: confData.config.maxLossPerAdRupees || 800,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Trigger manual optimization cycle
  async function handleRunOptimizationCycle() {
    try {
      setActionMessage({ type: "success", text: "Evaluating automation rules & synchronizing insights..." });
      const res = await fetch("/api/meta/rules/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Execution failed");
      setActionMessage({
        type: "success",
        text: `Optimization cycle completed! Evaluated ${data.ruleResults?.length || 0} rule actions.`,
      });
      await loadDashboardData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Cycle failed" });
    }
  }

  // Toggle Emergency Stop
  async function handleToggleEmergencyStop(currentState: boolean) {
    try {
      const res = await fetch("/api/meta/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergencyStop: !currentState }),
      });
      if (!res.ok) throw new Error("Failed to toggle emergency stop");
      setActionMessage({
        type: !currentState ? "error" : "success",
        text: !currentState
          ? "🚨 EMERGENCY STOP ACTIVATED. All automated writes are blocked."
          : "✅ Emergency stop disabled. Automated operations resumed.",
      });
      await loadDashboardData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  }

  // Toggle Campaign / Ad Status
  async function handleToggleCampaignStatus(campaignId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
      const res = await fetch("/api/meta/campaigns/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "CAMPAIGN",
          entityId: campaignId,
          newStatus,
          reason: `Manual toggle by admin to ${newStatus}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setActionMessage({
        type: "success",
        text: `Campaign status updated to ${newStatus}.`,
      });
      await loadDashboardData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  }

  // Submit Budget Update
  async function handleSaveBudget() {
    if (!editingBudgetCampaign) return;
    try {
      const res = await fetch("/api/meta/campaigns/update-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: editingBudgetCampaign.id,
          newBudgetRupees: Number(newBudgetInput),
          reason: "Manual budget update with safety limit verification",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update budget");
      setActionMessage({
        type: "success",
        text: `Budget updated to ₹${newBudgetInput}/day.`,
      });
      setEditingBudgetCampaign(null);
      await loadDashboardData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  }

  // Generate Creatives for Selected Product
  async function handleGenerateCreatives(prodId: string) {
    setSelectedProductId(prodId);
    setGeneratingCreatives(true);
    try {
      const res = await fetch("/api/meta/creatives/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: prodId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Creative generation failed");
      setGeneratedCreatives(data.creatives || []);
      setSelectedCreativeIndex(0);
      setActiveTab("creatives");
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setGeneratingCreatives(false);
    }
  }

  // Execute Instagram Meta Ads Backtest Simulation
  async function handleRunBacktest(overrideProdId?: string) {
    const prodId = overrideProdId || backtestProductId;
    if (!prodId) {
      setActionMessage({ type: "error", text: "Please select a product to backtest." });
      return;
    }
    setRunningBacktest(true);
    setActionMessage({ type: "success", text: "Running Monte Carlo multi-day Instagram simulation..." });
    try {
      const res = await fetch("/api/meta/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: prodId,
          creativeAngle: backtestAngle,
          instagramPlacement: backtestPlacement,
          startingDailyBudgetRupees: Number(backtestBudget),
          durationDays: Number(backtestDuration),
          marketCondition: backtestCondition,
          codReturnRatePct: Number(backtestCodReturn),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");
      setBacktestResult(data.result);
      setActiveTab("backtest");
      setActionMessage({
        type: "success",
        text: `Backtest completed! ROAS: ${data.result.summary.finalRoas}x • Net Profit: ₹${data.result.summary.netProfitRupees.toLocaleString("en-IN")}`,
      });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Backtest failed" });
    } finally {
      setRunningBacktest(false);
    }
  }

  // Pre-fill Create Campaign Modal from Creative
  function handleLaunchFromCreative(creative: any, prod: any) {
    setNewCampaign({
      name: `Sakhi Vastra - ${prod.name} (${creative.angle})`,
      templateType: "HERO_BESTSELLER",
      productId: prod.id,
      dailyBudgetRupees: 500,
      headline: creative.headline,
      primaryText: creative.primaryText,
      description: creative.description || "",
      callToAction: creative.callToAction || "SHOP_NOW",
      imageUrl: creative.imageUrl,
      destinationUrl: creative.destinationUrl,
      creativeAngle: creative.angle,
    });
    setShowCreateModal(true);
  }

  // Create Campaign
  async function handleCreateCampaignSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/meta/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCampaign.name,
          templateType: newCampaign.templateType,
          productId: newCampaign.productId || undefined,
          dailyBudgetRupees: Number(newCampaign.dailyBudgetRupees),
          creative: {
            headline: newCampaign.headline,
            primaryText: newCampaign.primaryText,
            description: newCampaign.description,
            callToAction: newCampaign.callToAction,
            imageUrl: newCampaign.imageUrl,
            destinationUrl: newCampaign.destinationUrl,
            creativeAngle: newCampaign.creativeAngle,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Creation failed");
      setActionMessage({
        type: "success",
        text: data.message || "Campaign created successfully in PAUSED state.",
      });
      setShowCreateModal(false);
      await loadDashboardData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  }

  // Save Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/meta/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setActionMessage({ type: "success", text: "Settings saved securely." });
      await loadDashboardData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  }

  // Test CAPI event
  async function handleTestCapi() {
    try {
      setActionMessage({ type: "success", text: "Sending test CAPI event to Meta Events Manager..." });
      const res = await fetch("/api/meta/capi/test", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: "success",
          text: `CAPI test event sent successfully! Event ID: ${data.eventId}`,
        });
      } else {
        setActionMessage({
          type: "error",
          text: `CAPI test status: ${data.result?.error || "Skipped or token missing"}`,
        });
      }
      await loadDashboardData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#1A1615] pb-24">
      {/* TOP HEADER & SYSTEM BANNER */}
      <header className="bg-white border-b border-ink/10 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <span className="bg-[#9B1B58]/10 text-[#9B1B58] text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md border border-[#9B1B58]/20">
                PROD
              </span>
              <h1 className="font-display text-xl font-semibold text-ink">
                Sakhi Vastra <span className="text-rani font-normal text-base">Meta Ads Suite</span>
              </h1>
            </div>

            {/* Mode & Live Indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                  overview?.config?.mode === "live"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : overview?.config?.mode === "simulation"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    overview?.config?.mode === "live"
                      ? "bg-emerald-500 animate-pulse"
                      : overview?.config?.mode === "simulation"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                />
                MODE: {overview?.config?.mode?.toUpperCase() || "MONITOR"}
              </span>

              {overview?.config?.emergencyStop && (
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-red-600 text-white animate-bounce">
                  🚨 STOPPED
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-2.5 flex-wrap justify-end w-full md:w-auto">
            <button
              onClick={() => handleToggleEmergencyStop(overview?.config?.emergencyStop || false)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 shadow-xs ${
                overview?.config?.emergencyStop
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {overview?.config?.emergencyStop ? "✓ Resume Operations" : "⛔ Emergency Stop"}
            </button>

            <button
              onClick={handleRunOptimizationCycle}
              disabled={refreshing}
              className="text-xs px-3.5 py-1.5 rounded-lg font-medium bg-rani hover:bg-rani-dark text-white transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              ⚡ Run Rule Cycle
            </button>

            <button
              onClick={loadDashboardData}
              disabled={refreshing}
              className="text-xs px-3 py-1.5 rounded-lg font-medium bg-ink/5 hover:bg-ink/10 text-ink transition flex items-center gap-1"
            >
              🔄 {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href="/sync"
              className="text-xs px-3 py-1.5 rounded-lg font-medium bg-ink/5 hover:bg-ink/10 text-ink transition"
            >
              📊 Sheet Sync
            </Link>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between border-t ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="font-bold ml-4 hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-2 overflow-x-auto border-t border-ink/5 pt-1">
          {[
            { key: "overview", label: "📈 Executive Overview" },
            { key: "campaigns", label: `🎯 Campaigns (${campaigns.length})` },
            { key: "products", label: `👗 Products (${products.length})` },
            { key: "creatives", label: "🎨 Creative Studio" },
            { key: "backtest", label: "🧪 Instagram Backtesting" },
            { key: "rules", label: `⚙️ Automation Rules (${rules.length})` },
            { key: "logs", label: `📜 Activity Logs (${logs.length})` },
            { key: "settings", label: "🔐 Meta Setup" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`text-xs sm:text-sm font-medium py-3 px-3.5 border-b-2 whitespace-nowrap transition ${
                activeTab === tab.key
                  ? "border-rani text-rani font-semibold"
                  : "border-transparent text-ink/60 hover:text-ink hover:border-ink/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ============================================================ */}
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {/* ============================================================ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Safety & Mode Status Banner */}
            <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                      Safety Protocol
                    </span>
                    <span className="text-xs text-amber-900 font-medium">
                      Account Spend Cap: ₹{((overview?.config?.dailySpendCapPaise || 500000) / 100).toLocaleString("en-IN")}/day
                    </span>
                  </div>
                  <p className="text-sm text-ink/80">
                    System initialized in <strong className="font-semibold">{overview?.config?.mode?.toUpperCase()}</strong> mode. Live modifications remain gated behind automated budget caps, 10% daily increase limits, 24h cooldowns, and stock validation.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] text-ink/50 uppercase tracking-wider font-semibold">
                      Budget Utilization
                    </p>
                    <p className="text-lg font-bold text-ink">
                      {overview?.metrics?.budgetUtilizationPct || 0}%
                    </p>
                  </div>
                  <div className="w-24 bg-ink/10 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-rani h-full rounded-full transition-all duration-500"
                      style={{ width: `${overview?.metrics?.budgetUtilizationPct || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Ad Spend */}
              <div className="bg-white rounded-2xl p-5 border border-ink/5 shadow-xs space-y-1">
                <p className="text-xs text-ink/50 uppercase tracking-wider font-semibold">
                  Today's Ad Spend
                </p>
                <p className="font-display text-2xl text-ink font-semibold">
                  ₹{(((overview?.metrics?.spendPaise || 0) / 100)).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-ink/60">
                  Cap: ₹{(((overview?.config?.dailySpendCapPaise || 500000) / 100)).toLocaleString("en-IN")}
                </p>
              </div>

              {/* Card 2: ROAS */}
              <div className="bg-white rounded-2xl p-5 border border-ink/5 shadow-xs space-y-1">
                <p className="text-xs text-ink/50 uppercase tracking-wider font-semibold">
                  Ad ROAS
                </p>
                <p className="font-display text-2xl text-rani font-semibold">
                  {overview?.metrics?.roas || 0}x
                </p>
                <p className="text-[11px] text-ink/60">
                  Target: {overview?.config?.targetRoas || 2.5}x
                </p>
              </div>

              {/* Card 3: Cost Per Purchase (CPA) */}
              <div className="bg-white rounded-2xl p-5 border border-ink/5 shadow-xs space-y-1">
                <p className="text-xs text-ink/50 uppercase tracking-wider font-semibold">
                  Cost Per Purchase (CPA)
                </p>
                <p className="font-display text-2xl text-ink font-semibold">
                  ₹{(((overview?.metrics?.costPerPurchasePaise || 0) / 100)).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-ink/60">
                  Purchases: {overview?.metrics?.purchases || 0}
                </p>
              </div>

              {/* Card 4: Estimated Profit */}
              <div className="bg-white rounded-2xl p-5 border border-ink/5 shadow-xs space-y-1">
                <p className="text-xs text-ink/50 uppercase tracking-wider font-semibold">
                  Est. Net Profit (7d)
                </p>
                <p className="font-display text-2xl text-emerald-700 font-semibold">
                  ₹{(((overview?.metrics?.estimatedProfitPaise || 0) / 100)).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-ink/60">
                  After Ad Spend & COGS
                </p>
              </div>
            </div>

            {/* SECONDARY METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Tracking Health Card */}
              <div className="bg-white rounded-2xl p-6 border border-ink/5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-medium text-ink">
                    📡 Conversion Tracking Health
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      overview?.tracking?.status === "HEALTHY"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : overview?.tracking?.status === "DEGRADED"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {overview?.tracking?.status || "INITIALIZING"}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-ink/80">
                  <div className="flex justify-between py-1.5 border-b border-ink/5">
                    <span>Meta Pixel Script:</span>
                    <span className="font-semibold text-ink">
                      {overview?.tracking?.pixelConfigured ? "✅ Installed & Active" : "⚠️ Needs ID in Setup"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-ink/5">
                    <span>Conversions API (CAPI):</span>
                    <span className="font-semibold text-ink">
                      {overview?.tracking?.capiConfigured ? "✅ Server Active" : "⚠️ Token Required"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-ink/5">
                    <span>Event Deduplication (24h):</span>
                    <span className="font-semibold text-ink">
                      {overview?.tracking?.deduplicationRatePct || 0}% Match Rate
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Server-Side Purchase Dispatch:</span>
                    <span className="font-semibold text-emerald-600">
                      ✅ Wired on Order Verify
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleTestCapi}
                  className="w-full text-xs py-2 bg-ink/5 hover:bg-ink/10 text-ink font-medium rounded-lg transition"
                >
                  🚀 Send Test CAPI Event
                </button>
              </div>

              {/* Active Campaigns Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-ink/5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-medium text-ink">
                    🎯 Campaign Status
                  </h3>
                  <button
                    onClick={() => setActiveTab("campaigns")}
                    className="text-xs text-rani font-medium hover:underline"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <p className="text-xl font-bold text-emerald-700">
                      {overview?.metrics?.activeCampaignsCount || 0}
                    </p>
                    <p className="text-[10px] uppercase font-semibold text-emerald-800">
                      Active
                    </p>
                  </div>
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <p className="text-xl font-bold text-amber-700">
                      {overview?.metrics?.pausedCampaignsCount || 0}
                    </p>
                    <p className="text-[10px] uppercase font-semibold text-amber-800">
                      Paused
                    </p>
                  </div>
                  <div className="bg-ink/5 p-3 rounded-xl">
                    <p className="text-xl font-bold text-ink">
                      {overview?.metrics?.totalCampaignsCount || 0}
                    </p>
                    <p className="text-[10px] uppercase font-semibold text-ink/60">
                      Total
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full text-xs py-2.5 bg-rani text-white font-medium rounded-lg hover:bg-rani-dark transition shadow-xs"
                >
                  + Create Campaign from Template
                </button>
              </div>

              {/* Real Orders & Attribution Reconciliation */}
              <div className="bg-white rounded-2xl p-6 border border-ink/5 shadow-xs space-y-4">
                <h3 className="font-display text-base font-medium text-ink">
                  📦 Order Reconciliation (7d)
                </h3>

                <div className="space-y-2.5 text-xs text-ink/80">
                  <div className="flex justify-between py-1.5 border-b border-ink/5">
                    <span>Confirmed DB Orders:</span>
                    <span className="font-bold text-ink">
                      {overview?.metrics?.confirmedOrders7d || 0} Orders
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-ink/5">
                    <span>Confirmed Store Revenue:</span>
                    <span className="font-bold text-ink">
                      ₹{(((overview?.metrics?.confirmedRevenue7dPaise || 0) / 100)).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-ink/5">
                    <span>Attributed Ad Purchases:</span>
                    <span className="font-bold text-rani">
                      {overview?.metrics?.purchases || 0} Purchases
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Attributed Ad Revenue:</span>
                    <span className="font-bold text-rani">
                      ₹{(((overview?.metrics?.revenuePaise || 0) / 100)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-ink/5 rounded-lg text-[11px] text-ink/60 leading-relaxed">
                  ✓ Reconciles actual paid store orders against ad platform claims to protect against COD returns and phantom ROAS.
                </div>
              </div>
            </div>

            {/* RECENT AUTOMATED ACTIONS FEED */}
            <div className="bg-white rounded-2xl p-6 border border-ink/5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-medium text-ink">
                    ⚡ Recent Automated Actions & Safety Checks
                  </h3>
                  <p className="text-xs text-ink/50">
                    Deterministic audit trail of all optimizations, budget safety reviews, and status switches
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("logs")}
                  className="text-xs text-rani font-medium hover:underline"
                >
                  View Full Audit Log &rarr;
                </button>
              </div>

              <div className="divide-y divide-ink/5">
                {overview?.recentLogs?.length === 0 ? (
                  <p className="text-xs text-ink/50 py-4 text-center">
                    No actions logged yet. Run an optimization cycle to evaluate campaigns.
                  </p>
                ) : (
                  overview?.recentLogs?.map((log: any) => (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700"
                                : log.status === "BLOCKED_BY_SAFETY"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-medium text-ink">{log.entityName || log.entityType}</span>
                          <span className="text-ink/40 text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString("en-IN")}
                          </span>
                        </div>
                        <p className="text-ink/70">{log.reason}</p>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 bg-ink/5 text-ink/60 rounded uppercase font-semibold">
                        {log.mode}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CAMPAIGN MANAGEMENT */}
        {/* ============================================================ */}
        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  Campaign Management
                </h2>
                <p className="text-xs text-ink/60">
                  Manage active/paused campaigns, inspect ROAS, and adjust budgets under strict safety limits
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="text-xs px-4 py-2.5 bg-rani text-white font-medium rounded-lg hover:bg-rani-dark transition shadow-xs flex items-center gap-1.5"
              >
                + New Campaign from Template
              </button>
            </div>

            {/* CAMPAIGN LIST TABLE */}
            <div className="bg-white rounded-2xl border border-ink/5 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink">
                  <thead className="bg-ink/5 text-ink/60 uppercase text-[10px] tracking-wider font-semibold border-b border-ink/5">
                    <tr>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Campaign & Product</th>
                      <th className="py-3.5 px-4">Daily Budget</th>
                      <th className="py-3.5 px-4">Spend</th>
                      <th className="py-3.5 px-4">Purchases</th>
                      <th className="py-3.5 px-4">ROAS</th>
                      <th className="py-3.5 px-4">CPA</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-ink/50 text-xs">
                          No campaigns created yet. Click "+ New Campaign" to launch an automated campaign from approved product templates.
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((camp) => {
                        const totalStock = camp.product?.totalStock ?? 0;
                        const roas = camp.insights?.roas || 0;
                        return (
                          <tr key={camp.id} className="hover:bg-ink/[0.02] transition">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleCampaignStatus(camp.id, camp.status)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ${
                                  camp.status === "ACTIVE"
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                    : "bg-ink/5 text-ink/50 hover:bg-ink/10 border border-ink/10"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    camp.status === "ACTIVE" ? "bg-emerald-500" : "bg-ink/30"
                                  }`}
                                />
                                {camp.status}
                              </button>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-ink">{camp.name}</div>
                              {camp.product && (
                                <div className="text-[11px] text-ink/50 flex items-center gap-2 mt-0.5">
                                  <span>{camp.product.name}</span>
                                  <span>•</span>
                                  <span
                                    className={`font-medium ${
                                      totalStock > 0 ? "text-emerald-600" : "text-red-600"
                                    }`}
                                  >
                                    Stock: {totalStock}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-semibold whitespace-nowrap">
                              ₹{(((camp.dailyBudget || 0) / 100)).toLocaleString("en-IN")}/day
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              ₹{(((camp.insights?.spend || 0) / 100)).toLocaleString("en-IN")}
                            </td>

                            <td className="py-3.5 px-4 font-semibold">
                              {camp.insights?.purchases || 0}
                            </td>

                            <td className="py-3.5 px-4 font-bold text-rani">
                              {roas > 0 ? `${roas}x` : "—"}
                            </td>

                            <td className="py-3.5 px-4 text-ink/70 whitespace-nowrap">
                              {camp.insights?.costPerPurchase
                                ? `₹${camp.insights.costPerPurchase.toFixed(0)}`
                                : "—"}
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingBudgetCampaign(camp);
                                    setNewBudgetInput((camp.dailyBudget || 50000) / 100);
                                  }}
                                  className="px-2.5 py-1 text-[11px] bg-ink/5 hover:bg-ink/10 text-ink font-medium rounded-md transition"
                                >
                                  ✏️ Budget
                                </button>

                                {camp.product && (
                                  <button
                                    onClick={() => handleGenerateCreatives(camp.product.id)}
                                    className="px-2.5 py-1 text-[11px] bg-rani/10 hover:bg-rani/20 text-rani font-medium rounded-md transition"
                                  >
                                    🎨 Creatives
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PRODUCT CATALOG & AD READINESS */}
        {/* ============================================================ */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Sakhi Vastra Product Catalog
              </h2>
              <p className="text-xs text-ink/60">
                Products synced from Google Sheet & Database. Inspect stock levels, CDN images, and 1-click creative generation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => {
                const mainImg = p.images?.[0] || "/products/placeholder.jpg";
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-ink/5 shadow-xs overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Thumbnail & Status */}
                      <div className="relative aspect-4/3 w-full bg-ink/5 overflow-hidden">
                        {p.images?.[0] ? (
                          <img
                            src={mainImg}
                            alt={p.name}
                            className="w-full h-full object-cover object-top hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-ink/40">
                            No image available
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                              p.isEligibleForAds
                                ? "bg-emerald-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {p.isEligibleForAds ? "✓ AD READY" : "⚠️ NOT ELIGIBLE"}
                          </span>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-ink shadow-xs">
                            Stock: {p.totalStock}
                          </span>
                        </div>

                        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-bold text-rani shadow-xs">
                          ₹{p.basePriceRupees}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-medium text-sm text-ink line-clamp-1">
                          {p.name}
                        </h3>

                        <div className="flex items-center justify-between text-xs text-ink/60">
                          <span>Sizes: {p.variants?.map((v: any) => v.size).join(", ") || "Standard"}</span>
                          <span>Images: {p.images?.length || 0}</span>
                        </div>

                        {!p.isEligibleForAds && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg font-medium">
                            {p.ineligibilityReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0 flex gap-2">
                      <button
                        onClick={() => handleGenerateCreatives(p.id)}
                        disabled={generatingCreatives}
                        className="flex-1 text-xs py-2 bg-rani hover:bg-rani-dark text-white font-medium rounded-lg transition text-center"
                      >
                        🎨 Generate Multi-Angle Creatives
                      </button>

                      <a
                        href={`/product/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs p-2 bg-ink/5 hover:bg-ink/10 text-ink font-medium rounded-lg transition"
                        title="View Live Product Page"
                      >
                        🔗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: CREATIVE STUDIO */}
        {/* ============================================================ */}
        {activeTab === "creatives" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  Creative Studio & Angle Generator
                </h2>
                <p className="text-xs text-ink/60">
                  Generate verified advertising angles (Product Showcase, Benefits, Styling, Price Offer, Reels, Carousels) using real product imagery.
                </p>
              </div>

              {/* Product Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => handleGenerateCreatives(e.target.value)}
                  className="text-xs bg-white border border-ink/10 rounded-lg px-3 py-2 font-medium outline-none focus:border-rani"
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.basePriceRupees})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {generatingCreatives ? (
              <div className="py-20 text-center text-ink/50 text-sm">
                Generating compliant multi-angle ad copy for product...
              </div>
            ) : generatedCreatives.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-ink/5">
                <p className="text-ink/60 text-sm mb-4">
                  Select any product from the catalog to generate instant multi-angle creatives.
                </p>
                {products[0] && (
                  <button
                    onClick={() => handleGenerateCreatives(products[0].id)}
                    className="text-xs px-4 py-2 bg-rani text-white rounded-lg font-medium"
                  >
                    Generate Creatives for "{products[0].name}"
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Angle Selector Tabs */}
                <div className="lg:col-span-4 space-y-2">
                  {generatedCreatives.map((creative, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCreativeIndex(index)}
                      className={`w-full text-left p-4 rounded-xl border transition ${
                        selectedCreativeIndex === index
                          ? "bg-white border-rani shadow-xs"
                          : "bg-white/60 border-ink/5 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-rani uppercase tracking-wider">
                          {creative.title}
                        </span>
                        <span className="text-[10px] bg-ink/5 text-ink/60 px-2 py-0.5 rounded uppercase font-semibold">
                          {creative.angle}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-ink line-clamp-1">
                        {creative.headline}
                      </p>
                      <p className="text-[11px] text-ink/50 line-clamp-2 mt-1">
                        {creative.primaryText}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Right: Live Mock Preview (Instagram/Meta Ad Format) */}
                <div className="lg:col-span-8 space-y-4">
                  {(() => {
                    const currentCreative = generatedCreatives[selectedCreativeIndex];
                    if (!currentCreative) return null;

                    return (
                      <div className="bg-white rounded-2xl border border-ink/10 shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                          <div>
                            <span className="text-xs font-bold text-rani uppercase">
                              {currentCreative.title} Angle Preview
                            </span>
                            <h3 className="font-display text-lg font-medium text-ink">
                              {currentCreative.headline}
                            </h3>
                          </div>

                          {selectedProduct && (
                            <button
                              onClick={() => handleLaunchFromCreative(currentCreative, selectedProduct)}
                              className="text-xs px-4 py-2 bg-rani hover:bg-rani-dark text-white font-medium rounded-lg transition shadow-xs"
                            >
                              🚀 Create Campaign from this Creative
                            </button>
                          )}
                        </div>

                        {/* Meta Ad Mock Card */}
                        <div className="max-w-md mx-auto bg-white rounded-xl border border-ink/10 shadow-xs overflow-hidden">
                          {/* Ad Header */}
                          <div className="p-3 flex items-center justify-between border-b border-ink/5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-rani text-white font-display flex items-center justify-center text-xs font-bold">
                                SV
                              </div>
                              <div>
                                <p className="text-xs font-bold text-ink">Sakhi Vastra</p>
                                <p className="text-[10px] text-ink/50">Sponsored • 🌐</p>
                              </div>
                            </div>
                            <span className="text-ink/40 text-xs">•••</span>
                          </div>

                          {/* Primary Text */}
                          <div className="p-3 text-xs text-ink/90 whitespace-pre-line leading-relaxed">
                            {currentCreative.primaryText}
                          </div>

                          {/* Creative Image */}
                          <div className="relative aspect-square w-full bg-ink/5">
                            <img
                              src={currentCreative.imageUrl}
                              alt={currentCreative.headline}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>

                          {/* Ad Footer / Call to Action Bar */}
                          <div className="p-3 bg-ink/5 flex items-center justify-between gap-3">
                            <div className="space-y-0.5 truncate">
                              <p className="text-[10px] text-ink/50 uppercase tracking-wider">
                                SAKHIVASTRA.IN
                              </p>
                              <p className="text-xs font-bold text-ink truncate">
                                {currentCreative.headline}
                              </p>
                              {currentCreative.description && (
                                <p className="text-[11px] text-ink/60 truncate">
                                  {currentCreative.description}
                                </p>
                              )}
                            </div>

                            <button className="text-xs px-3.5 py-1.5 bg-ink text-white font-semibold rounded-md shrink-0">
                              {currentCreative.callToAction || "Shop Now"}
                            </button>
                          </div>
                        </div>

                        {/* Carousel Items preview if angle is carousel */}
                        {currentCreative.carouselItems && (
                          <div className="space-y-2 pt-2 border-t border-ink/10">
                            <p className="text-xs font-bold text-ink uppercase tracking-wider">
                              Multi-Card Carousel Items:
                            </p>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {currentCreative.carouselItems.map((item: any, i: number) => (
                                <div key={i} className="w-32 shrink-0 bg-ink/5 rounded-lg overflow-hidden p-2 text-center text-xs">
                                  <img src={item.imageUrl} alt={item.name} className="w-full aspect-square object-cover rounded mb-1.5" />
                                  <p className="font-semibold text-[11px] text-ink truncate">{item.name}</p>
                                  <p className="text-[10px] text-rani font-bold">₹{item.price}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: INSTAGRAM META ADS BACKTESTING STUDIO */}
        {/* ============================================================ */}
        {activeTab === "backtest" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  🧪 Instagram Meta Ads Backtesting Studio
                </h2>
                <p className="text-xs text-ink/60">
                  Simulate multi-day Instagram ad delivery on real Sakhi Vastra kurtis. Test creative angles, placement economics (Reels vs Feed vs Carousel), COD return friction, and automated rule scaling.
                </p>
              </div>

              <button
                onClick={() => handleRunBacktest()}
                disabled={runningBacktest || !backtestProductId}
                className="text-xs px-5 py-2.5 bg-rani hover:bg-rani-dark text-white font-semibold rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {runningBacktest ? "⚡ Running Monte Carlo Sim..." : "▶ Run Backtest Simulation"}
              </button>
            </div>

            {/* SIMULATION CONTROLS CARD */}
            <div className="bg-white rounded-2xl p-6 border border-ink/5 shadow-xs space-y-5">
              <h3 className="font-display text-sm font-semibold text-ink uppercase tracking-wider text-rani">
                ⚙️ Simulation & Market Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Product Select */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">Target Product</label>
                  <select
                    value={backtestProductId}
                    onChange={(e) => setBacktestProductId(e.target.value)}
                    className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani font-medium truncate"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.basePriceRupees} • Stock: {p.totalStock})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Placement Select */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">Instagram Placement</label>
                  <select
                    value={backtestPlacement}
                    onChange={(e) => setBacktestPlacement(e.target.value)}
                    className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani font-medium"
                  >
                    <option value="INSTAGRAM_REELS">Instagram Reels (9:16 Fullscreen)</option>
                    <option value="INSTAGRAM_FEED">Instagram Feed Post (1:1 Square)</option>
                    <option value="INSTAGRAM_CAROUSEL">Instagram Carousel (Multi-Card)</option>
                    <option value="INSTAGRAM_STORIES">Instagram Stories (9:16 Swipe-Up)</option>
                    <option value="ALL_PLACEMENTS">Advantage+ (All Placements)</option>
                  </select>
                </div>

                {/* Creative Angle */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">Creative Angle Concept</label>
                  <select
                    value={backtestAngle}
                    onChange={(e) => setBacktestAngle(e.target.value)}
                    className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani font-medium"
                  >
                    <option value="REEL_CONCEPT">Short-Form Reel / Try-On Hook</option>
                    <option value="PRODUCT_SHOWCASE">Product Showcase & Grace</option>
                    <option value="BENEFIT_FOCUS">Breathable Fabric & Comfort</option>
                    <option value="STYLING_OUTFIT">1 Kurti 3 Looks (Lookbook)</option>
                    <option value="PRICE_OFFER">Price Promotion (Under ₹500)</option>
                    <option value="CAROUSEL">Multi-Card Color Carousel</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">Simulation Period</label>
                  <select
                    value={backtestDuration}
                    onChange={(e) => setBacktestDuration(Number(e.target.value))}
                    className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani font-medium"
                  >
                    <option value={7}>7 Days (Fast Pulse)</option>
                    <option value={14}>14 Days (Standard Cohort)</option>
                    <option value={30}>30 Days (Full Scale Lifecycle)</option>
                  </select>
                </div>

                {/* Starting Daily Budget */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-ink">
                    <span>Starting Budget:</span>
                    <span className="text-rani font-bold">₹{backtestBudget}/day</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={3000}
                    step={100}
                    value={backtestBudget}
                    onChange={(e) => setBacktestBudget(Number(e.target.value))}
                    className="w-full accent-rani cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-ink/40">
                    <span>₹200</span>
                    <span>₹1,500</span>
                    <span>₹3,000</span>
                  </div>
                </div>

                {/* Market Condition */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">Market & Auction Dynamics</label>
                  <select
                    value={backtestCondition}
                    onChange={(e) => setBacktestCondition(e.target.value)}
                    className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani font-medium"
                  >
                    <option value="REALISTIC_AVERAGE">Realistic Average (CPM ₹160, CTR 2.2%)</option>
                    <option value="BULLISH_WINNER">Bullish Viral Hook (CPM ₹130, CTR 2.8%)</option>
                    <option value="SATURATED_COMPETITIVE">Competitive / High CPM (CPM ₹210, CTR 1.6%)</option>
                    <option value="HIGH_FATIGUE">Rapid Creative Decay / Fatigue</option>
                  </select>
                </div>

                {/* COD Return Factor */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-ink">
                    <span>COD RTO Rate:</span>
                    <span className="text-amber-700 font-bold">{backtestCodReturn}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={5}
                    value={backtestCodReturn}
                    onChange={(e) => setBacktestCodReturn(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-ink/40">
                    Indian D2C industry average: 18-22% COD return rate.
                  </p>
                </div>

                {/* Action Button */}
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => handleRunBacktest()}
                    disabled={runningBacktest || !backtestProductId}
                    className="w-full text-xs py-2.5 bg-rani hover:bg-rani-dark text-white font-semibold rounded-lg transition shadow-xs disabled:opacity-50"
                  >
                    {runningBacktest ? "Simulating..." : "▶ Run Simulation"}
                  </button>
                </div>
              </div>
            </div>

            {/* BACKTEST RESULTS PRESENTATION */}
            {backtestResult && (
              <div className="space-y-8">
                {/* TOP SUMMARY STATS & VERDICT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Visual Instagram Ad Mockup */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <p className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
                      📱 Instagram Ad Creative Preview
                    </p>

                    {/* Instagram Phone Mockup */}
                    <div className="w-full max-w-[340px] bg-black rounded-[36px] p-3 shadow-2xl border-4 border-[#2A2421]">
                      {/* Notch & Top Bar */}
                      <div className="flex justify-between items-center text-white/80 text-[10px] px-3 py-1 mb-2">
                        <span>9:41</span>
                        <div className="w-16 h-3.5 bg-black rounded-full mx-auto" />
                        <span>5G 88%</span>
                      </div>

                      {/* Instagram Ad Card Body */}
                      <div className="bg-[#121212] rounded-[24px] overflow-hidden text-white text-xs relative aspect-[9/16] flex flex-col justify-between">
                        {/* Background Media */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src={backtestResult.creative.imageUrl}
                            alt={backtestResult.product.name}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
                        </div>

                        {/* Top Header */}
                        <div className="relative z-10 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-rani text-white font-bold text-[10px] flex items-center justify-center border border-white/30">
                              SV
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-xs">sakhivastra</span>
                                <span className="text-[10px] text-blue-400">✓</span>
                              </div>
                              <p className="text-[9px] text-white/70">Sponsored • 🎵 Original Audio</p>
                            </div>
                          </div>
                          <span className="text-xs text-white/60">•••</span>
                        </div>

                        {/* Floating Action Bar on Right */}
                        <div className="relative z-10 p-3 self-end flex flex-col items-center gap-4 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-lg">❤️</span>
                            <span className="text-[9px] font-semibold">4.8k</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-lg">💬</span>
                            <span className="text-[9px] font-semibold">124</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-lg">✈️</span>
                            <span className="text-[9px] font-semibold">892</span>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-black/60 border border-white/40 flex items-center justify-center text-[10px] animate-spin">
                            💿
                          </div>
                        </div>

                        {/* Bottom Ad Content & CTA */}
                        <div className="relative z-10 p-3.5 space-y-2">
                          <div className="flex items-center justify-between bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                            <div>
                              <p className="text-[10px] font-bold text-amber-300">
                                ₹{backtestResult.product.basePriceRupees} (Was ₹{backtestResult.product.originalPriceRupees})
                              </p>
                              <p className="text-[11px] font-bold truncate max-w-[170px]">
                                {backtestResult.product.name}
                              </p>
                            </div>
                            <span className="text-[10px] bg-rani text-white font-bold px-2.5 py-1 rounded-md shadow-xs">
                              Shop Now &rarr;
                            </span>
                          </div>

                          <p className="text-[11px] text-white/90 line-clamp-2 leading-tight">
                            {backtestResult.creative.primaryText}
                          </p>

                          <p className="text-[10px] text-white/50">
                            #sakhivastra #kurtis #indianethnic #chikankari #fashion
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Simulation Metrics & Verdict */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Verdict Banner */}
                    <div
                      className={`rounded-2xl p-5 border flex items-start gap-3.5 ${
                        backtestResult.summary.verdict === "SCALE_WINNER"
                          ? "bg-emerald-50 text-emerald-950 border-emerald-200"
                          : backtestResult.summary.verdict === "MODERATE_PERFORMER"
                          ? "bg-blue-50 text-blue-950 border-blue-200"
                          : "bg-amber-50 text-amber-950 border-amber-200"
                      }`}
                    >
                      <span className="text-2xl">
                        {backtestResult.summary.verdict === "SCALE_WINNER"
                          ? "🚀"
                          : backtestResult.summary.verdict === "MODERATE_PERFORMER"
                          ? "📈"
                          : "⚠️"}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/10">
                            {backtestResult.summary.verdict.replace("_", " ")}
                          </span>
                          <span className="text-xs font-semibold">
                            ROAS: {backtestResult.summary.finalRoas}x
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          {backtestResult.summary.verdictReason}
                        </p>
                      </div>
                    </div>

                    {/* KPI Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl p-4 border border-ink/5 shadow-xs">
                        <p className="text-[10px] uppercase font-semibold text-ink/50">Total Ad Spend</p>
                        <p className="font-display text-xl font-bold text-ink mt-1">
                          ₹{backtestResult.summary.totalAdSpendRupees.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-ink/50 mt-0.5">
                          Over {backtestResult.simulationSettings.durationDays} Days
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-ink/5 shadow-xs">
                        <p className="text-[10px] uppercase font-semibold text-ink/50">Net Revenue (Realized)</p>
                        <p className="font-display text-xl font-bold text-rani mt-1">
                          ₹{backtestResult.summary.totalNetRevenueRupees.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-ink/50 mt-0.5">
                          Gross: ₹{backtestResult.summary.totalGrossRevenueRupees.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-ink/5 shadow-xs">
                        <p className="text-[10px] uppercase font-semibold text-ink/50">Post-Ad Net Profit</p>
                        <p
                          className={`font-display text-xl font-bold mt-1 ${
                            backtestResult.summary.netProfitRupees >= 0
                              ? "text-emerald-700"
                              : "text-red-600"
                          }`}
                        >
                          ₹{backtestResult.summary.netProfitRupees.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-ink/50 mt-0.5">
                          Margin: {backtestResult.summary.profitMarginPct}%
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-ink/5 shadow-xs">
                        <p className="text-[10px] uppercase font-semibold text-ink/50">Confirmed Units Sold</p>
                        <p className="font-display text-xl font-bold text-ink mt-1">
                          {backtestResult.summary.totalConfirmedOrders} Units
                        </p>
                        <p className="text-[10px] text-ink/50 mt-0.5">
                          Returned (RTO): {backtestResult.summary.totalReturnedOrders}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-ink/5 shadow-xs">
                        <p className="text-[10px] uppercase font-semibold text-ink/50">Blended CPA</p>
                        <p className="font-display text-xl font-bold text-ink mt-1">
                          ₹{backtestResult.summary.blendedCpaRupees}
                        </p>
                        <p className="text-[10px] text-ink/50 mt-0.5">
                          Per Acquired Customer
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-ink/5 shadow-xs">
                        <p className="text-[10px] uppercase font-semibold text-ink/50">Average CTR & CPC</p>
                        <p className="font-display text-xl font-bold text-ink mt-1">
                          {backtestResult.summary.averageCtrPct}% • ₹{backtestResult.summary.averageCpcRupees}
                        </p>
                        <p className="text-[10px] text-ink/50 mt-0.5">
                          {backtestResult.summary.totalClicks.toLocaleString("en-IN")} Total Clicks
                        </p>
                      </div>
                    </div>

                    {/* Rule Execution Triggers Log */}
                    <div className="bg-white rounded-2xl p-5 border border-ink/5 shadow-xs space-y-2.5">
                      <h4 className="font-display text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
                        <span>⚡ Automated Rule Triggers during Simulation</span>
                      </h4>

                      {backtestResult.summary.ruleActionsSummary.length === 0 ? (
                        <p className="text-xs text-ink/50 py-1">
                          Campaign operated steadily within normal performance boundaries without triggering pause or scale actions.
                        </p>
                      ) : (
                        <div className="space-y-1.5 text-xs">
                          {backtestResult.summary.ruleActionsSummary.map((action: string, i: number) => (
                            <div key={i} className="p-2 bg-ink/5 rounded-lg text-ink/80 flex items-start gap-2">
                              <span className="text-rani font-bold">✓</span>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pre-fill Campaign Button */}
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() =>
                          handleLaunchFromCreative(
                            {
                              angle: backtestResult.creative.angle,
                              headline: backtestResult.creative.headline,
                              primaryText: backtestResult.creative.primaryText,
                              description: `₹${backtestResult.product.basePriceRupees} • Free Shipping`,
                              callToAction: backtestResult.creative.callToAction,
                              imageUrl: backtestResult.creative.imageUrl,
                              destinationUrl: backtestResult.creative.destinationUrl,
                            },
                            backtestResult.product
                          )
                        }
                        className="text-xs px-5 py-2.5 bg-rani hover:bg-rani-dark text-white font-semibold rounded-lg transition shadow-xs flex items-center gap-2"
                      >
                        🚀 Launch Campaign with this Backtested Angle
                      </button>
                    </div>
                  </div>
                </div>

                {/* DAY-BY-DAY PERFORMANCE BREAKDOWN TABLE */}
                <div className="bg-white rounded-2xl border border-ink/5 shadow-xs overflow-hidden space-y-4 p-5">
                  <h3 className="font-display text-base font-semibold text-ink">
                    📅 Day-by-Day Ad Delivery & Unit Economics
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-ink">
                      <thead className="bg-ink/5 text-ink/60 uppercase text-[10px] tracking-wider font-semibold border-b border-ink/5">
                        <tr>
                          <th className="py-2.5 px-3">Day</th>
                          <th className="py-2.5 px-3">Daily Budget</th>
                          <th className="py-2.5 px-3">Spend</th>
                          <th className="py-2.5 px-3">Impressions</th>
                          <th className="py-2.5 px-3">CTR</th>
                          <th className="py-2.5 px-3">CPC</th>
                          <th className="py-2.5 px-3">Orders</th>
                          <th className="py-2.5 px-3">Realized Rev</th>
                          <th className="py-2.5 px-3">Net Profit</th>
                          <th className="py-2.5 px-3">ROAS</th>
                          <th className="py-2.5 px-3">Rule Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/5">
                        {backtestResult.dailyTimeline.map((d: any) => (
                          <tr key={d.day} className="hover:bg-ink/[0.02] transition">
                            <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                              Day {d.day}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              ₹{d.dailyBudgetRupees}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              ₹{d.spendRupees}
                            </td>
                            <td className="py-2.5 px-3 text-ink/70">
                              {d.impressions.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 font-medium">
                              {d.ctr}%
                            </td>
                            <td className="py-2.5 px-3 text-ink/70">
                              ₹{d.cpcRupees}
                            </td>
                            <td className="py-2.5 px-3 font-bold">
                              {d.grossOrders} <span className="text-[10px] text-ink/40 font-normal">({d.confirmedOrders} net)</span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-rani whitespace-nowrap">
                              ₹{d.netRevenueRupees.toLocaleString("en-IN")}
                            </td>
                            <td
                              className={`py-2.5 px-3 font-semibold whitespace-nowrap ${
                                d.netProfitRupees >= 0 ? "text-emerald-700" : "text-red-600"
                              }`}
                            >
                              ₹{d.netProfitRupees.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-rani">
                              {d.roas}x
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-ink/70">
                              {d.ruleTriggered ? (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold text-[10px]">
                                  {d.ruleTriggered}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PLACEMENT COMPARISON MATRIX */}
                <div className="bg-white rounded-2xl p-6 border border-ink/5 shadow-xs space-y-4">
                  <h3 className="font-display text-base font-semibold text-ink">
                    📊 Instagram Placements Benchmark Comparison for "{backtestResult.product.name}"
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {backtestResult.placementComparison.map((p: any, i: number) => (
                      <div key={i} className="bg-ink/[0.02] border border-ink/5 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-ink">{p.placement}</p>
                          <div className="mt-2 space-y-1 text-ink/70">
                            <div className="flex justify-between">
                              <span>Estimated ROAS:</span>
                              <strong className="text-rani">{p.roas}x</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Average CTR:</span>
                              <strong>{p.ctr}%</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Target CPA:</span>
                              <strong>₹{p.cpa}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Estimated CPM:</span>
                              <strong>₹{p.cpm}</strong>
                            </div>
                          </div>
                        </div>

                        <p className="pt-2 border-t border-ink/5 text-[11px] text-ink/60 italic">
                          {p.suitability}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: AUTOMATION RULES & SAFETY */}
        {/* ============================================================ */}
        {activeTab === "rules" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Automation Rules & Safety Controls
              </h2>
              <p className="text-xs text-ink/60">
                Deterministic policy safeguards. Live adjustments are restricted by safety caps, loss thresholds, and cooldown periods.
              </p>
            </div>

            {/* Configurable Safety Policy Form */}
            <div className="bg-white rounded-2xl p-6 border border-ink/5 shadow-xs space-y-6">
              <h3 className="font-display text-base font-medium text-ink">
                🛡️ Account-Wide Safety Guardrails
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Setting 1: Daily Spend Cap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Account Daily Spend Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={configForm.dailySpendCapRupees}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, dailySpendCapRupees: Number(e.target.value) })
                    }
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3 py-2.5 outline-none focus:border-rani"
                  />
                  <p className="text-[10px] text-ink/50">
                    Hard cap on entire advertising account across all campaigns.
                  </p>
                </div>

                {/* Setting 2: Max Budget Increase Pct */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Max Budget Increase per Change (%)
                  </label>
                  <input
                    type="number"
                    value={configForm.maxBudgetIncreasePct}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, maxBudgetIncreasePct: Number(e.target.value) })
                    }
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3 py-2.5 outline-none focus:border-rani"
                  />
                  <p className="text-[10px] text-ink/50">
                    Maximum 10% increase per modification to prevent sudden overspending.
                  </p>
                </div>

                {/* Setting 3: Target ROAS */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Target ROAS for Scaling (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={configForm.targetRoas}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, targetRoas: Number(e.target.value) })
                    }
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3 py-2.5 outline-none focus:border-rani"
                  />
                  <p className="text-[10px] text-ink/50">
                    Minimum ROAS required before any campaign can scale.
                  </p>
                </div>

                {/* Setting 4: Loss Threshold */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Max Loss Threshold to Pause Ad (₹)
                  </label>
                  <input
                    type="number"
                    value={configForm.maxLossPerAdRupees}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, maxLossPerAdRupees: Number(e.target.value) })
                    }
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3 py-2.5 outline-none focus:border-rani"
                  />
                  <p className="text-[10px] text-ink/50">
                    If an ad spends this without a purchase, it is automatically paused.
                  </p>
                </div>

                {/* Setting 5: Mode Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Automation Operating Mode
                  </label>
                  <select
                    value={configForm.automationMode}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, automationMode: e.target.value as any })
                    }
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3 py-2.5 outline-none focus:border-rani font-medium"
                  >
                    <option value="monitor">Monitor (Read-only observation)</option>
                    <option value="simulation">Simulation (Safe virtual execution)</option>
                    <option value="live">Live (Execute live changes on Meta)</option>
                  </select>
                  <p className="text-[10px] text-ink/50">
                    Keep in monitor/simulation until budget and live validation pass.
                  </p>
                </div>

                {/* Setting 6: Master Automation Switch */}
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={configForm.automationEnabled}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, automationEnabled: e.target.checked })
                      }
                      className="w-4 h-4 text-rani rounded accent-rani"
                    />
                    <span className="text-xs font-semibold text-ink">
                      Enable Automated Rule Execution
                    </span>
                  </label>
                  <p className="text-[10px] text-ink/50">
                    When disabled, rules log recommendations without modifying entities.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="text-xs px-5 py-2.5 bg-rani text-white font-semibold rounded-lg hover:bg-rani-dark transition shadow-xs"
                >
                  💾 Save Guardrail Settings
                </button>
              </div>
            </div>

            {/* RULE LIST */}
            <div className="space-y-3">
              <h3 className="font-display text-base font-medium text-ink">
                Active Optimization Rules
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl p-5 border border-ink/5 shadow-xs space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-ink">{r.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                            r.enabled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-ink/5 text-ink/40"
                          }`}
                        >
                          {r.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-xs text-ink/70 leading-relaxed">
                        {r.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-ink/5 flex items-center justify-between text-[11px] text-ink/50">
                      <span>Type: {r.ruleType}</span>
                      <span>Cooldown: {r.evaluationCooldownHours || 6}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: ACTIVITY & AUDIT LOGS */}
        {/* ============================================================ */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  Activity Audit Logs
                </h2>
                <p className="text-xs text-ink/60">
                  Full deterministic audit trail of every rule evaluation, budget adjustment, status toggle, and API response
                </p>
              </div>

              <button
                onClick={loadDashboardData}
                className="text-xs px-3 py-1.5 bg-ink/5 hover:bg-ink/10 text-ink rounded-lg font-medium"
              >
                🔄 Refresh Logs
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-ink/5 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink">
                  <thead className="bg-ink/5 text-ink/60 uppercase text-[10px] tracking-wider font-semibold border-b border-ink/5">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Change</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-ink/50 text-xs">
                          No activity records found.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-ink/[0.02] transition">
                          <td className="py-3 px-4 whitespace-nowrap text-ink/60 text-[11px]">
                            {new Date(log.timestamp).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 font-semibold whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-ink">
                              {log.entityName || log.entityId || log.entityType}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                            {log.previousValue && log.newValue ? (
                              <span>
                                {log.previousValue} &rarr;{" "}
                                <strong className="font-semibold text-rani">{log.newValue}</strong>
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3 px-4 text-ink/70 max-w-xs truncate" title={log.reason}>
                            {log.reason}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                log.status === "SUCCESS"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : log.status === "BLOCKED_BY_SAFETY"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-[10px] uppercase font-semibold text-ink/50">
                            {log.mode}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 7: META CREDENTIALS & SETUP */}
        {/* ============================================================ */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Meta Business & Marketing API Credentials
              </h2>
              <p className="text-xs text-ink/60">
                Connect your official Meta Business Account, Ad Account ID, and Conversions API access token. All secrets are stored securely on your server.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-ink/5 shadow-xs space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Meta Ad Account ID
                  </label>
                  <input
                    type="text"
                    value={configForm.adAccountId}
                    onChange={(e) => setConfigForm({ ...configForm, adAccountId: e.target.value })}
                    placeholder="act_123456789012345"
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3.5 py-2.5 outline-none focus:border-rani"
                  />
                  <p className="text-[10px] text-ink/50">
                    Found in Meta Ads Manager URL (e.g. act_XXXXXXXXX).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Meta Pixel ID (Web Dataset)
                  </label>
                  <input
                    type="text"
                    value={configForm.pixelId}
                    onChange={(e) => setConfigForm({ ...configForm, pixelId: e.target.value })}
                    placeholder="123456789012345"
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3.5 py-2.5 outline-none focus:border-rani"
                  />
                  <p className="text-[10px] text-ink/50">
                    Found in Meta Events Manager &gt; Datasets.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-ink">
                    Meta System User Access Token (with ads_management, ads_read scopes)
                  </label>
                  <input
                    type="password"
                    value={configForm.accessToken}
                    onChange={(e) => setConfigForm({ ...configForm, accessToken: e.target.value })}
                    placeholder={config.hasAccessToken ? `•••••••••••• (Currently Saved: ${config.accessTokenMasked})` : "EAAB..."}
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3.5 py-2.5 outline-none focus:border-rani font-mono"
                  />
                  <p className="text-[10px] text-ink/50">
                    Generated from Meta Business Manager &gt; System Users &gt; Generate Token.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-ink">
                    Conversions API (CAPI) Server Token
                  </label>
                  <input
                    type="password"
                    value={configForm.capiToken}
                    onChange={(e) => setConfigForm({ ...configForm, capiToken: e.target.value })}
                    placeholder={config.hasCapiToken ? `•••••••••••• (Currently Saved: ${config.capiTokenMasked})` : "EAAB..."}
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3.5 py-2.5 outline-none focus:border-rani font-mono"
                  />
                  <p className="text-[10px] text-ink/50">
                    Generated from Events Manager &gt; Settings &gt; Conversions API &gt; Generate access token.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Meta App ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={configForm.appId}
                    onChange={(e) => setConfigForm({ ...configForm, appId: e.target.value })}
                    placeholder="1234567890"
                    className="w-full text-xs bg-ink/5 border border-ink/10 rounded-lg px-3.5 py-2.5 outline-none focus:border-rani"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-ink/10">
                <button
                  type="button"
                  onClick={handleTestCapi}
                  className="text-xs px-4 py-2 bg-ink/5 hover:bg-ink/10 text-ink font-medium rounded-lg transition"
                >
                  🚀 Test CAPI Connection
                </button>

                <button
                  type="submit"
                  className="text-xs px-5 py-2.5 bg-rani hover:bg-rani-dark text-white font-semibold rounded-lg transition shadow-xs"
                >
                  💾 Save Meta Credentials
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREATE CAMPAIGN WIZARD */}
      {/* ============================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-ink/10 shadow-xl">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-display text-lg font-semibold text-ink">
                Create Campaign from Template
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-ink/40 hover:text-ink text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Sakhi Vastra - Floral Cotton Kurti (Hero Angle)"
                  className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Template Type</label>
                  <select
                    value={newCampaign.templateType}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, templateType: e.target.value })
                    }
                    className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani"
                  >
                    <option value="HERO_BESTSELLER">Hero Bestseller</option>
                    <option value="NEW_ARRIVAL">New Arrival Drop</option>
                    <option value="FESTIVE_SPECIAL">Festive / Navratri Special</option>
                    <option value="CLEARANCE">Clearance Offer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Daily Budget (₹)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    max={5000}
                    value={newCampaign.dailyBudgetRupees}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        dailyBudgetRupees: Number(e.target.value),
                      })
                    }
                    className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink">Headline</label>
                <input
                  type="text"
                  required
                  value={newCampaign.headline}
                  onChange={(e) => setNewCampaign({ ...newCampaign, headline: e.target.value })}
                  placeholder="Pure Breathable Cotton Kurti | All-Day Grace"
                  className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink">Primary Ad Text</label>
                <textarea
                  rows={3}
                  required
                  value={newCampaign.primaryText}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, primaryText: e.target.value })
                  }
                  placeholder="Handcrafted Indian kurtis made from breathable cotton..."
                  className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Image CDN URL</label>
                  <input
                    type="url"
                    required
                    value={newCampaign.imageUrl}
                    onChange={(e) => setNewCampaign({ ...newCampaign, imageUrl: e.target.value })}
                    placeholder="https://ik.imagekit.io/sakhivastra/..."
                    className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Destination URL</label>
                  <input
                    type="url"
                    required
                    value={newCampaign.destinationUrl}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, destinationUrl: e.target.value })
                    }
                    placeholder="https://www.sakhivastra.in/product/..."
                    className="w-full bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                ℹ️ <strong>Safety Guarantee:</strong> All new campaigns are strictly initialized in a <strong>PAUSED</strong> state. Review creative and targeting before activating.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-ink/5 text-ink rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rani text-white font-semibold rounded-lg hover:bg-rani-dark transition"
                >
                  Create Campaign (Paused)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT BUDGET */}
      {/* ============================================================ */}
      {editingBudgetCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-ink/10 shadow-xl">
            <h3 className="font-display text-base font-semibold text-ink">
              Update Daily Budget
            </h3>
            <p className="text-xs text-ink/60">
              Campaign: <strong>{editingBudgetCampaign.name}</strong>
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">
                New Daily Budget (₹)
              </label>
              <input
                type="number"
                value={newBudgetInput}
                onChange={(e) => setNewBudgetInput(Number(e.target.value))}
                className="w-full text-sm bg-ink/5 border border-ink/10 rounded-lg p-2.5 outline-none focus:border-rani font-semibold"
              />
              <p className="text-[11px] text-ink/50">
                Current: ₹{((editingBudgetCampaign.dailyBudget || 0) / 100).toFixed(0)} • Max Allowed (+10%): ₹
                {Math.round(((editingBudgetCampaign.dailyBudget || 0) / 100) * 1.1)}
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingBudgetCampaign(null)}
                className="text-xs px-3.5 py-2 bg-ink/5 text-ink rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="text-xs px-4 py-2 bg-rani text-white font-semibold rounded-lg hover:bg-rani-dark transition"
              >
                Verify & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
