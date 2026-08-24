import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(category ? { category: { slug: category } } : {}),
    },
    include: { variants: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}
