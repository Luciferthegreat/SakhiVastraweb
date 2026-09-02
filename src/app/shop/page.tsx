import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }> | { category?: string };
}) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams?.category;

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(currentCategory
        ? { category: { slug: currentCategory } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const categories = [
    { label: "All Pieces", slug: undefined },
    { label: "Festive Edit", slug: "festive" },
    { label: "Everyday Weave", slug: "everyday" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
      {/* Title */}
      <div className="text-center mb-8 sm:mb-12">
        <p className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-rani font-medium mb-2">
          Handcrafted Collection
        </p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium text-ink">
          {currentCategory === "festive"
            ? "Festive Edit"
            : currentCategory === "everyday"
            ? "Everyday Weave"
            : "All Kurtis"}
        </h1>
      </div>

      {/* Category Pills Bar (Horizontal Scroll on Mobile) */}
      <div className="flex items-center justify-start sm:justify-center gap-2 pb-4 mb-8 sm:mb-12 overflow-x-auto scrollbar-none px-1">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.slug;
          const href = cat.slug ? `/shop?category=${cat.slug}` : "/shop";

          return (
            <Link
              key={cat.label}
              href={href}
              className={`
                px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-medium tracking-wider whitespace-nowrap transition-all duration-300
                ${
                  isActive
                    ? "bg-rani text-ivory shadow-md scale-105"
                    : "bg-white/70 text-ink/70 border border-ink/15 hover:border-rani hover:text-rani"
                }
              `}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {/* Product List */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-ink/5 rounded-3xl border border-ink/10 max-w-lg mx-auto p-8">
          <p className="text-ink/70 text-sm mb-4">
            No pieces found in this category yet.
          </p>
          <Link
            href="/shop"
            className="inline-block text-xs font-semibold uppercase tracking-wider text-rani underline"
          >
            View all pieces →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:gap-x-6 sm:gap-y-14 md:grid-cols-4">
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