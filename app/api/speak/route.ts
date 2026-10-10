import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const speakRequestSchema = z.object({ text: z.string().trim().min(1).max(2000) });

export async function POST(request: Request) {
  try {
    const body = speakRequestSchema.parse(await request.json());

    // The browser currently owns speech playback through SpeechSynthesis.
    // This endpoint establishes the backend contract for a server TTS provider.
    return NextResponse.json({ text: body.text, audioUrl: null, format: "browser-speech" });
  } catch {
    return NextResponse.json({ error: "Request body must contain non-empty text." }, { status: 400 });
  }
}
