import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";

const bodySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.object({
    fullName: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(4),
  }),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

// Flat shipping fee for now — swap for Shiprocket serviceability
// lookup if you want live courier rates.
const SHIPPING_FEE_PAISE = 7900;

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, phone, address, items } = parsed.data;

    // Re-price everything server-side from the DB.
    // Never trust prices sent from the client.
    const variantIds = items.map((i) => i.variantId);

    const variants = await prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
        },
      },
      include: {
        product: true,
      },
    });

    if (variants.length !== variantIds.length) {
      return NextResponse.json(
        {
          error: "One or more items are no longer available.",
        },
        { status: 400 }
      );
    }

    let subtotal = 0;

    const orderItemsData = items.map((reqItem) => {
      const variant = variants.find(
        (v) => v.id === reqItem.variantId
      );

      if (!variant) {
        throw new Error(
          `Product variant not found: ${reqItem.variantId}`
        );
      }

      if (variant.stock < reqItem.quantity) {
        throw new Error(
          `Insufficient stock for ${variant.product.name} (size ${variant.size})`
        );
      }

      const unitPrice =
        variant.product.basePrice + variant.priceDelta;

      subtotal += unitPrice * reqItem.quantity;

      return {
        variantId: variant.id,
        productName: variant.product.name,
        size: variant.size,
        quantity: reqItem.quantity,
        unitPrice,
      };
    });

    const total = subtotal + SHIPPING_FEE_PAISE;

    const orderNumber = `SV-${Date.now()
      .toString()
      .slice(-8)}`;

    // Create customer address
    const dbAddress = await prisma.address.create({
      data: {
        ...address,
        phone,
      },
    });

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        phone,
        subtotal,
        shippingFee: SHIPPING_FEE_PAISE,
        total,
        addressId: dbAddress.id,
        items: {
          create: orderItemsData,
        },
      },
    });

    // Create Razorpay instance ONLY when the API is actually called.
    // This prevents Vercel build-time environment errors.
    const razorpay = getRazorpay();

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: total,
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        internalOrderId: order.id,
      },
    });

    // Save Razorpay order ID
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: total,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create order",
      },
      { status: 500 }
    );
  }
}