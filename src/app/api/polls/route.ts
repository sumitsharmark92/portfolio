import { NextRequest, NextResponse } from "next/server";
import { getPolls, voteInPoll } from "@/lib/storage";

export async function GET() {
  try {
    const polls = getPolls();
    return NextResponse.json({ success: true, polls });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pollId, optionId } = body;

    if (!pollId || !optionId) {
      return NextResponse.json({ success: false, error: "pollId and optionId are required." }, { status: 400 });
    }

    const updatedPoll = voteInPoll(pollId, optionId);
    if (!updatedPoll) {
      return NextResponse.json({ success: false, error: "Poll or option not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, poll: updatedPoll });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
