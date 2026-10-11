import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { sceneAnalysisSchema } from "../../../lib/scene-schema";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

const prompt = `You are an assistive scene-description system.

Analyze the provided image and identify the most relevant visible objects.
Prioritize nearby-looking obstacles, large furniture, doors, stairs, and other potentially important environmental features.
Describe locations relative to the image frame: left, center, or right.
Do not invent objects, distances, hazards, or safe paths.
Do not claim that the environment is safe to navigate.
If visibility is poor or objects are uncertain, communicate that uncertainty.

Return valid JSON containing sceneSummary, objects, and narration.
Each object must contain name, direction, and priority.
Direction must be one of left, center, right, unknown.
Priority must be one of high, medium, low.
Use at most three important objects in the narration.`;

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return json({ error: "An image file is required." }, 400);
  }

  if (!image.type.startsWith("image/")) {
    return json({ error: "The uploaded file must be an image." }, 415);
  }

  if (image.size === 0 || image.size > 10 * 1024 * 1024) {
    return json({ error: "Image must be between 1 byte and 10 MB." }, 413);
  }

  if (!process.env.GEMINI_API_KEY) {
    return json({ error: "GEMINI_API_KEY is not configured." }, 503);
  }

  try {
    const bytes = Buffer.from(await image.arrayBuffer());
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: [{ text: prompt }, { inlineData: { mimeType: image.type, data: bytes.toString("base64") } }],
      config: { responseMimeType: "application/json" },
    });

    const parsed = sceneAnalysisSchema.parse(JSON.parse(response.text || "{}"));
    return json(parsed);
  } catch (error) {
    console.error("Scene analysis failed", error);
    return json({ error: "Unable to analyze the image." }, 502);
  }
}
