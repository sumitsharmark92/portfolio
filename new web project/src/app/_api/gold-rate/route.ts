import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════
   Gold Rate API — GET current rates, POST update rate
   ═══════════════════════════════════════════════════════════ */

// Current rates (in production, fetch from DB or live API)
const CURRENT_RATES = {
  "24K": 7800,
  "22K": 7200,
  "18K": 5900,
  lastUpdated: "2026-08-07T18:00:00+05:30",
  source: "manual",
  currency: "INR",
  unit: "per gram",
};

export async function GET() {
  return NextResponse.json({
    rates: CURRENT_RATES,
    formula: "Total = (Gold Weight × Rate) + Gemstone Cost + Making Charge + GST(3%)",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Admin auth check
    // TODO: Save to GoldRate table via Prisma

    return NextResponse.json({
      message: "Gold rate updated",
      rates: {
        ...CURRENT_RATES,
        ...body,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update gold rate" },
      { status: 500 }
    );
  }
}
