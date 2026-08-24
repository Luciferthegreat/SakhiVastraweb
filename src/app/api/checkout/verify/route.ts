import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { createShiprocketOrder } from "@/lib/shiprocket";

const bodySchema = z.object({
  orderId: z.string(), // our internal Order.id
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: { include: { product: true } } } }, address: true },
  });
  if (!order || order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const isValid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // Payment confirmed — decrement stock and mark paid in one transaction.
  await prisma.$transaction([
    ...order.items.map((item) =>
      prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      })
    ),
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    }),
  ]);

  // Create the shipment in Shiprocket. If this fails, the payment has
  // still succeeded — we log it and let an admin retry manually rather
  // than failing the whole checkout for the customer.
  try {
    const shiprocketRes = await createShiprocketOrder({
      orderId: order.orderNumber,
      orderDate: new Date().toISOString().slice(0, 16).replace("T", " "),
      billingCustomerName: order.address.fullName,
      billingAddress: `${order.address.line1}${order.address.line2 ? ", " + order.address.line2 : ""}`,
      billingCity: order.address.city,
      billingState: order.address.state,
      billingPincode: order.address.pincode,
      billingPhone: order.phone,
      billingEmail: order.email,
      items: order.items.map((item) => ({
        name: item.productName,
        sku: item.variant.sku,
        units: item.quantity,
        selling_price: item.unitPrice / 100,
      })),
      subTotal: order.subtotal / 100,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        shiprocketOrderId: String(shiprocketRes.order_id ?? ""),
        shiprocketShipmentId: String(shiprocketRes.shipment_id ?? ""),
        shipmentStatus: "CREATED",
      },
    });
  } catch (err) {
    console.error("Shiprocket order creation failed for order", order.orderNumber, err);
    await prisma.order.update({
      where: { id: order.id },
      data: { shipmentStatus: "CREATION_FAILED" },
    });
  }

  return NextResponse.json({ success: true, orderNumber: order.orderNumber, orderId: order.id });
}
