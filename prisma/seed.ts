import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const festive = await prisma.category.upsert({
    where: { slug: "festive" },
    update: {},
    create: { name: "Festive Edit", slug: "festive" },
  });

  const everyday = await prisma.category.upsert({
    where: { slug: "everyday" },
    update: {},
    create: { name: "Everyday Weave", slug: "everyday" },
  });

  const products = [
    {
      name: "Ivory Floral Embroidered Kurti",
      slug: "ivory-floral-embroidered-kurti",
      description:
        "Hand-embroidered floral booti on breathable cotton-silk, finished with a zari trim at the hem.",
      fabric: "Cotton-Silk",
      images: ["/products/ivory-floral-1.jpg", "/products/ivory-floral-2.jpg"],
      basePrice: 249900,
      categoryId: festive.id,
      variants: [
        { size: "S", sku: "SV-IFK-S", stock: 12 },
        { size: "M", sku: "SV-IFK-M", stock: 18 },
        { size: "L", sku: "SV-IFK-L", stock: 10 },
        { size: "XL", sku: "SV-IFK-XL", stock: 6 },
      ],
    },
    {
      name: "Rani Pink Chikankari Kurti",
      slug: "rani-pink-chikankari-kurti",
      description:
        "Lucknowi chikankari hand-stitched on soft mulmul, in a deep rani-pink base.",
      fabric: "Mulmul Cotton",
      images: ["/products/rani-chikankari-1.jpg"],
      basePrice: 319900,
      categoryId: festive.id,
      variants: [
        { size: "S", sku: "SV-RPC-S", stock: 8 },
        { size: "M", sku: "SV-RPC-M", stock: 14 },
        { size: "L", sku: "SV-RPC-L", stock: 9 },
      ],
    },
    {
      name: "Teal Ikat Weave Kurti",
      slug: "teal-ikat-weave-kurti",
      description:
        "Handloom ikat weave in peacock teal, an everyday staple with a straight silhouette.",
      fabric: "Handloom Cotton",
      images: ["/products/teal-ikat-1.jpg"],
      basePrice: 189900,
      categoryId: everyday.id,
      variants: [
        { size: "S", sku: "SV-TIW-S", stock: 20 },
        { size: "M", sku: "SV-TIW-M", stock: 22 },
        { size: "L", sku: "SV-TIW-L", stock: 15 },
        { size: "XL", sku: "SV-TIW-XL", stock: 11 },
      ],
    },
  ];

  for (const p of products) {
    const { variants, ...rest } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...rest,
        variants: { create: variants },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
