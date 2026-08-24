import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default async function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true, address: true },
  });

  if (!order) notFound();

  return (
    <section className="max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-widest text-zari mb-3">Order confirmed</p>
      <h1 className="font-display text-4xl text-ink mb-2">Thank you, {order.address.fullName}.</h1>
      <p className="text-ink/60 mb-10">
        Order <span className="font-medium text-ink">{order.orderNumber}</span> is being prepared for
        shipping{order.shipmentStatus === "CREATED" ? " and has been handed to our courier partner." : "."}
      </p>

      <ul className="text-left divide-y divide-ink/10 border-y border-ink/10">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between py-3 text-sm">
            <span>{item.productName} · Size {item.size} × {item.quantity}</span>
            <span>{formatInr(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between mt-4 font-display text-lg">
        <span>Total paid</span>
        <span>{formatInr(order.total)}</span>
      </div>

      <p className="text-sm text-ink/50 mt-10">
        A confirmation has been sent to {order.email}. You'll receive tracking details by email once
        your courier is assigned.
      </p>
    </section>
  );
}
