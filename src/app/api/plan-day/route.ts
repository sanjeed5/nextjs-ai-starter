import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const runtime = "nodejs";

type IncomingTask = {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number | null;
  aiGenerated?: boolean | null;
  createdAt?: string | null;
};

export async function POST(request: Request) {
  try {
    const { tasks, nowISO, timeZone, locale } = (await request.json()) as {
      tasks: IncomingTask[];
      nowISO?: string;
      timeZone?: string;
      locale?: string;
    };
    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Invalid 'tasks' provided" },
        { status: 400 }
      );
    }

    const pending = tasks.filter((t) => !t.completed);
    const taskLines = pending
      .map((t, i) => `${i + 1}. ${t.title}`)
      .join("\n");

    const model = google("models/gemini-2.5-flash");

    const now = nowISO ? new Date(nowISO) : new Date();
    const tz = timeZone || 'UTC';
    const loc = locale || 'en-US';
    const formatted = new Intl.DateTimeFormat(loc, {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: tz,
    }).format(now);

    const prompt = `You are an expert day planner. Consider the list of pending tasks and produce a concise plan.

Return strictly in well-structured GitHub-Flavored Markdown with:
- A top-level heading for the plan date, e.g., "Today's Plan (${new Intl.DateTimeFormat(loc, { dateStyle: 'full', timeZone: tz }).format(now)})" or "Tomorrow's Plan (DATE)"
- For each item: a numbered list entry with a bolded title, a short reasoning, and a time estimate in minutes
- Under each item, include a sub-list for schedule blocks (local time ranges)
- Use blank lines between major sections for readability

Scheduling rules:
- Use the provided local context strictly. Do NOT schedule anything in the past.
- If current local time is earlier than typical work hours, start at the nearest reasonable start time.
- If current local time has already passed part of the day, start at the next quarter-hour at or after the current time.
- If the current local time is late (after 8:00 PM local), plan for tomorrow instead, starting around 9:00 AM local, and set the heading to "Tomorrow's Plan".
- Use the user's locale ${loc} and time zone ${tz} when formatting times (AM/PM if applicable).

Context:
- Current datetime: ${formatted}
- Time zone: ${tz}
- Locale: ${loc}

Pending Tasks:\n${taskLines || "(none)"}`;

    const { text } = await generateText({ model, prompt });

    return NextResponse.json({ plan: text });
  } catch (error) {
    console.error("/api/plan-day error", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}


