import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({
        loggedIn: false,
        items: [],
      });
    }

    const wishlists = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            images: true,
            basePrice: true,
            originalPrice: true,
            fabric: true,
            active: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = wishlists
      .filter((w) => w.product && w.product.active)
      .map((w) => ({
        id: w.product.id,
        slug: w.product.slug,
        name: w.product.name,
        images:
          w.product.images?.length > 0
            ? w.product.images
            : ["/products/placeholder.jpg"],
        basePrice: w.product.basePrice,
        originalPrice: w.product.originalPrice,
        fabric: w.product.fabric,
      }));

    return NextResponse.json({
      loggedIn: true,
      items,
    });
  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();
    const { slug, productId } = body;

    if (!slug && !productId) {
      return NextResponse.json(
        { error: "Product slug or ID is required" },
        { status: 400 }
      );
    }

    // Find the product
    const product = await prisma.product.findFirst({
      where: productId ? { id: productId } : { slug },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!userId) {
      // User is not logged in, but return success so client store handles it locally
      return NextResponse.json({
        loggedIn: false,
        productId: product.id,
        slug: product.slug,
      });
    }

    // Check if already wishlisted
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: product.id,
        },
      },
    });

    if (existing) {
      // Remove from wishlist
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        loggedIn: true,
        isWishlisted: false,
        message: "Removed from liked products",
      });
    } else {
      // Add to wishlist
      await prisma.wishlist.create({
        data: {
          userId,
          productId: product.id,
        },
      });

      return NextResponse.json({
        loggedIn: true,
        isWishlisted: true,
        message: "Added to liked products",
      });
    }
  } catch (error) {
    console.error("POST WISHLIST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update wishlist" },
      { status: 500 }
    );
  }
}
