import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting development catalog reset...");

  // 1. Delete test order items
  await prisma.orderItem.deleteMany();

  // 2. Delete test orders
  await prisma.order.deleteMany();

  // 3. Delete addresses used by test orders
  await prisma.address.deleteMany();

  // 4. Delete all product variants
  await prisma.productVariant.deleteMany();

  // 5. Delete all products
  await prisma.product.deleteMany();

  // 6. Delete categories
  await prisma.category.deleteMany();

  console.log("✅ Database catalog cleaned.");
  console.log("✅ Test orders removed.");
  console.log("✅ Products removed.");
  console.log("✅ Variants removed.");
  console.log("✅ Categories removed.");
}

main()
  .catch((error) => {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });