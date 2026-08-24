import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Checking old catalog...");

  const variants = await prisma.productVariant.findMany({
    include: {
      orderItems: true,
    },
  });

  const safeVariants = variants.filter(
    (variant) => variant.orderItems.length === 0
  );

  console.log(`Total variants: ${variants.length}`);
  console.log(
    `Variants safe to delete: ${safeVariants.length}`
  );
  console.log(
    `Variants linked to orders: ${
      variants.length - safeVariants.length
    }`
  );

  for (const variant of safeVariants) {
    await prisma.productVariant.delete({
      where: {
        id: variant.id,
      },
    });
  }

  console.log("✅ Old unused variants cleaned.");

  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
  });

  for (const product of products) {
    if (product.variants.length === 0) {
      await prisma.product.delete({
        where: {
          id: product.id,
        },
      });
    }
  }

  console.log("✅ Empty products cleaned.");
}

main()
  .catch((error) => {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });