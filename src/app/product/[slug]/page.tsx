import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import AddToCartForm from "@/components/AddToCartForm";

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

  const image = product.images[0] ?? "/products/placeholder.jpg";

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-14">
      <div className="relative aspect-[3/4] bg-ink/5 rounded-sm overflow-hidden">
        <Image src={image} alt={product.name} fill className="object-cover" priority />
      </div>

      <div>
        {product.fabric && (
          <p className="text-xs uppercase tracking-widest text-rani mb-3">{product.fabric}</p>
        )}
        <h1 className="font-display text-4xl font-medium text-ink">{product.name}</h1>
        <p className="mt-4 text-xl text-ink/80">{formatInr(product.basePrice)}</p>
        <p className="mt-6 text-ink/70 leading-relaxed max-w-md">{product.description}</p>

        <div className="mt-10">
          <AddToCartForm
            productName={product.name}
            slug={product.slug}
            image={image}
            variants={product.variants.map((v) => ({
              id: v.id,
              size: v.size,
              stock: v.stock,
              price: product.basePrice + v.priceDelta,
            }))}
          />
        </div>
      </div>
    </section>
  );
}
