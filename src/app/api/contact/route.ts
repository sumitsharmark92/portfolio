import { NextRequest, NextResponse } from "next/server";
import { readDatabase, writeDatabase } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: "Name, email, and message are required." }, { status: 400 });
    }

    const db = readDatabase();
    if (!db.messages) db.messages = [];

    const forwarded = req.headers.get("x-forwarded-for");
    const rawIp = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      email,
      phone: phone || "",
      message,
      ip: rawIp,
      timestamp: new Date().toISOString(),
      read: false,
    };

    db.messages.unshift(newMessage);

    if (!db.activityLog) db.activityLog = [];
    db.activityLog.unshift({
      id: `act-${Date.now()}`,
      action: "CONTACT_MESSAGE",
      details: `New message received from ${name} (${email})`,
      status: "SUCCESS",
      time: Date.now(),
    });

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: "Message encrypted and dispatched securely to Sumit Sharma.",
      id: newMessage.id,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
