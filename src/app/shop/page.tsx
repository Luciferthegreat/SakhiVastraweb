import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(searchParams.category
        ? { category: { slug: searchParams.category } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl md:text-5xl font-medium text-ink text-center mb-14">
        {searchParams.category === "festive"
          ? "Festive Edit"
          : searchParams.category === "everyday"
          ? "Everyday Weave"
          : "Shop All"}
      </h1>

      {products.length === 0 ? (
        <p className="text-center text-ink/60">
          No pieces here yet — check back soon, or browse the full collection.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-14">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                slug: p.slug,
                name: p.name,
                images:
                  p.images.length > 0
                    ? p.images
                    : ["/products/placeholder.jpg"],
                basePrice: p.basePrice,
                originalPrice: p.originalPrice,
                fabric: p.fabric,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}