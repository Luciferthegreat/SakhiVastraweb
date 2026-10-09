import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCreativesForProduct } from "@/lib/meta/creative";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const creatives = generateCreativesForProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      fabric: product.fabric,
      basePrice: product.basePrice,
      originalPrice: product.originalPrice,
      images: product.images,
      variants: product.variants.map((v) => ({ size: v.size, stock: v.stock })),
    });

    return NextResponse.json({
      success: true,
      productId: product.id,
      productName: product.name,
      creatives,
    });
  } catch (err: any) {
    console.error("Creative generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate creatives" },
      { status: 500 }
    );
  }
}
