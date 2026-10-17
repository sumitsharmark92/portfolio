import { NextRequest, NextResponse } from "next/server";
import { getGuestbookEntries, addGuestbookEntry } from "@/lib/storage";

export async function GET() {
  try {
    const entries = getGuestbookEntries();
    return NextResponse.json({ success: true, entries }, {
      headers: {
        "X-Security-Flag": "FLAG{s3cur1ty_f1rst_sumit_labs}",
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, handle, role, message, avatarSeed } = body;

    if (!name || !message || name.trim().length === 0 || message.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Name and message are required." }, { status: 400 });
    }

    // Extract or simulate client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const rawIp = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
    // Mask last octet for privacy
    const maskedIp = rawIp.includes(":") ? "2a01:4f8:***" : rawIp.replace(/\.\d+$/, ".***");

    const entry = addGuestbookEntry({
      name: name.slice(0, 50),
      handle: (handle || `@${name.toLowerCase().replace(/\s+/g, "_")}`).slice(0, 30),
      role: (role || "Security Enthusiast").slice(0, 50),
      message: message.slice(0, 400),
      ip: maskedIp,
      avatarSeed: avatarSeed || name,
    });

    return NextResponse.json({ success: true, entry });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
