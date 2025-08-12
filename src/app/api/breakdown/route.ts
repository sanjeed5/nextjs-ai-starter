import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid 'title' provided" },
        { status: 400 }
      );
    }

    const model = google("models/gemini-2.5-flash");

    const prompt = `You are a helpful productivity assistant. Break the following task into 3-5 concrete, actionable subtasks suitable for a beginner. Respond ONLY in strict JSON with the shape {"subtasks": string[]}.

Task: "${title}"

Rules:
- 3 to 5 short subtasks
- No numbering, just plain strings
- No explanations, no extra fields, valid JSON only`;

    const { text } = await generateText({
      model,
      prompt,
    });

    let parsed: { subtasks: string[] } | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback: try to coerce from common formats
      const coerced = text
        .replace(/```json|```/g, "")
        .trim();
      try {
        parsed = JSON.parse(coerced);
      } catch {
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
          .filter((l) => l.length > 0);
        parsed = { subtasks: lines.slice(0, 5) };
      }
    }

    const subtasks = (parsed?.subtasks ?? [])
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter((s) => s.length > 0)
      .slice(0, 5);

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("/api/breakdown error", error);
    return NextResponse.json(
      { error: "Failed to generate subtasks" },
      { status: 500 }
    );
  }
}


