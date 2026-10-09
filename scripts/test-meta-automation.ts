import { PrismaClient } from "../src/generated/client";
import { generateCreativesForProduct } from "../src/lib/meta/creative";
import { validateSafetyAction, getTrackingHealth } from "../src/lib/meta/safety";
import { metaClient } from "../src/lib/meta/client";
import { evaluateAutomationRules } from "../src/lib/meta/rules";
import { generateDailyReport } from "../src/lib/meta/scheduler";
import { sha256, normalizePhone, generateEventId } from "../src/lib/meta/crypto";

const prisma = new PrismaClient();

async function runTests() {
  console.log("==================================================");
  console.log("🚀 SAKHI VASTRA META ADS AUTOMATION TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // --- TEST 1: CRYPTO & CAPI HASHING ---
  console.log("\n[1] Testing SHA-256 Data Hashing & Event IDs...");
  const hashedEmail = sha256("Test.Customer@Gmail.COM");
  const hashedPhone = normalizePhone("9876543210");
  const eventId = generateEventId("test");

  assert(
    hashedEmail === "865514b49a5347de09134c626870d9578fb61e2433d4900333f961cfcb6a4b57",
    "Email normalized and hashed properly",
    `Got: ${hashedEmail}`
  );
  assert(
    !!hashedPhone && hashedPhone.length === 64,
    "Indian phone number normalized with 91 and hashed",
    `Length: ${hashedPhone?.length}`
  );
  assert(
    eventId.startsWith("test_") && eventId.length > 15,
    "Unified event deduplication ID generated"
  );

  // --- TEST 2: PRODUCT DATA & CREATIVE GENERATION ---
  console.log("\n[2] Testing Multi-Angle Creative Generation...");
  const sampleProduct = await prisma.product.findFirst({
    where: { active: true },
    include: { variants: true },
  });

  if (!sampleProduct) {
    assert(false, "Found active product in database");
  } else {
    assert(true, `Found active product: ${sampleProduct.name}`);

    const creatives = generateCreativesForProduct({
      id: sampleProduct.id,
      name: sampleProduct.name,
      slug: sampleProduct.slug,
      fabric: sampleProduct.fabric,
      basePrice: sampleProduct.basePrice,
      originalPrice: sampleProduct.originalPrice,
      images: sampleProduct.images,
      variants: sampleProduct.variants.map((v) => ({ size: v.size, stock: v.stock })),
    });

    assert(creatives.length === 6, "Generated all 6 required creative angles", `Got: ${creatives.length}`);
    assert(
      creatives.some((c) => c.angle === "PRODUCT_SHOWCASE"),
      "Generated Product Showcase Angle"
    );
    assert(
      creatives.some((c) => c.angle === "BENEFIT_FOCUS"),
      "Generated Benefits & Fabric Focus Angle"
    );
    assert(
      creatives.some((c) => c.angle === "STYLING_OUTFIT"),
      "Generated Styling & Outfit Lookbook Angle"
    );
    assert(
      creatives.some((c) => c.angle === "PRICE_OFFER"),
      "Generated Price Promotion Angle"
    );
    assert(
      creatives.some((c) => c.angle === "REEL_CONCEPT"),
      "Generated Short-Form Reel Concept"
    );
    assert(
      creatives.some((c) => c.angle === "CAROUSEL"),
      "Generated Multi-Card Carousel Set"
    );
    assert(
      creatives[0].imageUrl.startsWith("https://ik.imagekit.io/sakhivastra/"),
      "Using authentic Sakhi Vastra ImageKit CDN image URL"
    );
  }

  // --- TEST 3: SAFETY POLICY & BUDGET CONSTRAINTS ---
  console.log("\n[3] Testing Safety Guardrails & Spending Caps...");

  // Test 10% budget increase ceiling:
  const budgetSafetyPass = await validateSafetyAction({
    actionType: "INCREASE_BUDGET",
    currentBudgetPaise: 50000, // ₹500
    proposedBudgetPaise: 55000, // ₹550 (+10%)
  });
  assert(budgetSafetyPass.allowed, "Allowed 10% budget increase within limit");

  const budgetSafetyFail = await validateSafetyAction({
    actionType: "INCREASE_BUDGET",
    currentBudgetPaise: 50000, // ₹500
    proposedBudgetPaise: 65000, // ₹650 (+30% - should fail)
  });
  assert(!budgetSafetyFail.allowed, "Blocked excessive budget increase (+30%)");

  // --- TEST 4: TRACKING HEALTH DIAGNOSTIC ---
  console.log("\n[4] Testing Tracking Health Engine...");
  const tracking = await getTrackingHealth();
  assert(
    ["HEALTHY", "DEGRADED", "NOT_INITIALIZED"].includes(tracking.status),
    `Tracking health diagnostic status: ${tracking.status}`
  );

  // --- TEST 5: AUTOMATION RULES & OPTIMIZATION CYCLE ---
  console.log("\n[5] Testing Rule Engine Evaluation...");
  const ruleResults = await evaluateAutomationRules();
  assert(Array.isArray(ruleResults), `Rule engine executed cleanly without exceptions (${ruleResults.length} actions triggered)`);

  // --- TEST 6: DAILY PERFORMANCE DIGEST & ORDER RECONCILIATION ---
  console.log("\n[6] Testing Daily Report Generation & Attribution Reconciliation...");
  const report = await generateDailyReport();
  assert(
    typeof report.spendPaise === "number" &&
      typeof report.confirmedOrdersCount === "number" &&
      typeof report.estimatedProfitPaise === "number",
    `Daily report generated (Confirmed DB Orders: ${report.confirmedOrdersCount}, Profit: ₹${(report.estimatedProfitPaise / 100).toFixed(0)})`
  );

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().finally(async () => {
  await prisma.$disconnect();
});
