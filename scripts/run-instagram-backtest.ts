import { PrismaClient } from "../src/generated/client";
import { runInstagramBacktest } from "../src/lib/meta/backtest";

const prisma = new PrismaClient();

async function main() {
  console.log("===============================================================");
  console.log("👗 SAKHI VASTRA — INSTAGRAM META ADS BACKTESTING ENGINE");
  console.log("===============================================================\n");

  const products = await prisma.product.findMany({
    where: { active: true },
    include: { variants: true },
    take: 3,
  });

  if (products.length === 0) {
    console.log("No active products found to backtest.");
    return;
  }

  for (const product of products) {
    console.log(`\n---------------------------------------------------------------`);
    console.log(`🧪 BACKTESTING: "${product.name}" (SKU: ${product.slug})`);
    console.log(`   Selling Price: ₹${Math.round(product.basePrice / 100)} | Images: ${product.images.length}`);
    console.log(`---------------------------------------------------------------`);

    // Run 14-Day Simulation on Instagram Reels with ₹500/day starting budget
    const backtest = await runInstagramBacktest({
      productId: product.id,
      creativeAngle: "REEL_CONCEPT",
      instagramPlacement: "INSTAGRAM_REELS",
      startingDailyBudgetRupees: 500,
      durationDays: 14,
      marketCondition: "REALISTIC_AVERAGE",
      codReturnRatePct: 20,
    });

    console.log(`\n📊 14-DAY SIMULATION RESULTS (Instagram Reels Placement):`);
    console.log(`   • Total Ad Spend:           ₹${backtest.summary.totalAdSpendRupees.toLocaleString("en-IN")}`);
    console.log(`   • Gross Orders:             ${backtest.summary.totalGrossOrders} units`);
    console.log(`   • Confirmed Orders:         ${backtest.summary.totalConfirmedOrders} units (after COD RTO returns)`);
    console.log(`   • Returned Orders (RTO):    ${backtest.summary.totalReturnedOrders} units (${backtest.simulationSettings.codReturnRatePct}% COD return factor)`);
    console.log(`   • Gross Revenue:            ₹${backtest.summary.totalGrossRevenueRupees.toLocaleString("en-IN")}`);
    console.log(`   • Net Revenue (Realized):   ₹${backtest.summary.totalNetRevenueRupees.toLocaleString("en-IN")}`);
    console.log(`   • Total COGS + Shipping:    ₹${backtest.summary.totalCogsAndShippingRupees.toLocaleString("en-IN")}`);
    console.log(`   • NET PROFIT (Post-Ads):    ₹${backtest.summary.netProfitRupees.toLocaleString("en-IN")}`);
    console.log(`   • Profit Margin:            ${backtest.summary.profitMarginPct}%`);
    console.log(`   • Final ROAS:               ${backtest.summary.finalRoas}x`);
    console.log(`   • Blended CPA:              ₹${backtest.summary.blendedCpaRupees} per order`);
    console.log(`   • Average CTR:              ${backtest.summary.averageCtrPct}%`);
    console.log(`   • Average CPC:              ₹${backtest.summary.averageCpcRupees}`);
    console.log(`   • VERDICT:                  [${backtest.summary.verdict}] — ${backtest.summary.verdictReason}`);

    if (backtest.summary.ruleActionsSummary.length > 0) {
      console.log(`\n⚡ AUTOMATED RULE TRIGGER LOG:`);
      backtest.summary.ruleActionsSummary.forEach((action) => {
        console.log(`   ✓ ${action}`);
      });
    }

    console.log(`\n📱 INSTAGRAM PLACEMENT BENCHMARK COMPARISON:`);
    backtest.placementComparison.forEach((p) => {
      console.log(`   • ${p.placement}:`);
      console.log(`     - Est. ROAS: ${p.roas}x | CTR: ${p.ctr}% | CPA: ₹${p.cpa} | CPM: ₹${p.cpm}`);
      console.log(`     - Note: ${p.suitability}`);
    });
  }

  console.log("\n===============================================================");
  console.log("✅ ALL INSTAGRAM PRODUCT BACKTESTS COMPLETED SUCCESSFULLY");
  console.log("===============================================================");
}

main().finally(async () => {
  await prisma.$disconnect();
});
