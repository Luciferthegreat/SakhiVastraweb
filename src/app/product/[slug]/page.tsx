import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import AddToCartForm from "@/components/AddToCartForm";
import ProductGallery from "@/components/ProductGallery";

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true },
  });

  if (!product || !product.active) notFound();

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["/products/placeholder.jpg"];

  const primaryImage = images[0];

  const hasDiscount =
    !!product.originalPrice && product.originalPrice > product.basePrice;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.basePrice) / product.originalPrice!) *
          100
      )
    : 0;

  const discountBadge = hasDiscount ? `${discountPercent}% OFF` : null;

  return (
    <div className="min-h-screen bg-ivory">
      {/* ================= BREADCRUMBS ================= */}
      <nav className="max-w-7xl mx-auto px-6 pt-6 pb-2">
        <div className="flex items-center gap-2 text-xs tracking-wider text-ink/50">
          <Link href="/" className="hover:text-rani transition-colors">
            HOME
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-rani transition-colors">
            SHOP
          </Link>
          <span>/</span>
          <span className="text-ink truncate max-w-xs">{product.name}</span>
        </div>
      </nav>

      {/* ================= MAIN PRODUCT SECTION ================= */}
      <section className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          {/* LEFT: MULTI-IMAGE GALLERY (7 cols on LG) */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={images}
              productName={product.name}
              discountBadge={discountBadge}
            />
          </div>

          {/* RIGHT: PRODUCT INFO & PURCHASE (5 cols on LG) */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            {product.fabric && (
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rani mb-2">
                {product.fabric}
              </p>
            )}

            <h1 className="font-display text-3xl md:text-4xl font-medium text-ink leading-tight">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl font-medium text-peacock">
                {formatInr(product.basePrice)}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-lg text-ink/40 line-through">
                    {formatInr(product.originalPrice!)}
                  </span>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 tracking-wide">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/50">Inclusive of all taxes</p>

            {/* Decorative divider */}
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-ink/10" />
              <span className="text-xs text-zari">✦</span>
              <span className="h-px flex-1 bg-ink/10" />
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-ink/75 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Add to Cart form */}
            <div className="mt-8">
              <AddToCartForm
                productName={product.name}
                slug={product.slug}
                image={primaryImage}
                variants={product.variants.map((v) => ({
                  id: v.id,
                  size: v.size,
                  stock: v.stock,
                  price: product.basePrice + v.priceDelta,
                }))}
              />
            </div>

            {/* Value Props / Trust Highlights */}
            <div className="mt-10 pt-8 border-t border-ink/10 grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-zari text-lg">✦</span>
                <div>
                  <p className="text-xs font-medium text-ink">Handcrafted Finish</p>
                  <p className="text-[11px] text-ink/60 mt-0.5">
                    Made with artisan care
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-zari text-lg">❀</span>
                <div>
                  <p className="text-xs font-medium text-ink">Pure Breathable Fabric</p>
                  <p className="text-[11px] text-ink/60 mt-0.5">
                    Comfortable all day
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-zari text-lg">🚚</span>
                <div>
                  <p className="text-xs font-medium text-ink">Pan India Delivery</p>
                  <p className="text-[11px] text-ink/60 mt-0.5">
                    Fast & safe shipping
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-zari text-lg">↺</span>
                <div>
                  <p className="text-xs font-medium text-ink">Easy Exchange</p>
                  <p className="text-[11px] text-ink/60 mt-0.5">
                    Hassle-free 7-day returns
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
