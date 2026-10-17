import { NextRequest, NextResponse } from "next/server";
import { getStats, incrementStat, VisitorStats } from "@/lib/storage";

export async function GET() {
  try {
    const stats = getStats();
    return NextResponse.json({ success: true, stats });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, amount } = body;

    if (key && ["totalVisitors", "simulatedThreatsBlocked", "terminalCommandsRun", "guestbookSigns"].includes(key)) {
      incrementStat(key as keyof VisitorStats, amount || 1);
    }

    const updated = getStats();
    return NextResponse.json({ success: true, stats: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
