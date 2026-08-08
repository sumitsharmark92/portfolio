import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════
   Orders API — GET (list) and POST (create order)
   ═══════════════════════════════════════════════════════════ */

export async function GET() {
  // TODO: Replace with Prisma query
  // TODO: Add auth check — admin sees all, customer sees own
  const orders = [
    {
      id: "ord_1",
      orderNumber: "ORD-2847",
      customer: "Priya Sharma",
      totalAmount: 185600,
      status: "IN_CRAFTING",
      createdAt: "2026-08-07T10:00:00Z",
    },
    {
      id: "ord_2",
      orderNumber: "ORD-2846",
      customer: "Meera Patel",
      totalAmount: 325000,
      status: "QUALITY_CHECK",
      createdAt: "2026-08-06T14:30:00Z",
    },
  ];

  return NextResponse.json({ orders, total: orders.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Validate cart items
    // TODO: Calculate final price with current gold rate
    // TODO: Create order with Prisma
    // TODO: Generate order number

    const orderNumber = `ORD-${Date.now().toString().slice(-4)}`;

    return NextResponse.json(
      {
        message: "Order placed successfully",
        order: {
          id: `ord_${Date.now()}`,
          orderNumber,
          ...body,
          status: "RECEIVED",
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
