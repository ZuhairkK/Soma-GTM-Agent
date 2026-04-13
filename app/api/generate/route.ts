import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { MockProfile, EmailDraft, GenerateResponse } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Re-export types so existing imports from this path don't break during transition.
export type { MockProfile, EmailDraft, GenerateResponse };

// Strip markdown code fences that Claude occasionally wraps around JSON output
// despite explicit instructions not to. e.g. ```json\n{...}\n```
function stripFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

// Extract the text content from a Claude response, guarding against
// non-text content blocks (e.g. tool_use blocks).
function extractText(message: Anthropic.Message): string {
  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error(`Unexpected content block type: ${block?.type ?? "none"}`);
  }
  return block.text;
}

// --- Step 1: Generate a realistic mock Typeform respondent ---

async function generateMockProfile(): Promise<MockProfile> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Generate a realistic mock respondent for Soma's waitlist form. Soma is a cognitive health startup that tracks mental performance — like Whoop for the brain.

The form has four questions:
1. What are your major sources of stress at work/school? (open text)
2. What early signs of burnout or mental fatigue do you notice in yourself? (multi-select from: Fatigue, Irritability, Brain fog, Sleep disturbances, Loss of motivation)
3. How many times do you exercise a week? (number 0–7)
4. What coping mechanisms do you use when stressed? (open text)

Return ONLY valid JSON matching this shape, no markdown fences:
{
  "name": "First name only",
  "stressSources": "string",
  "burnoutSigns": ["array", "of", "selected", "options"],
  "exerciseFrequency": 2,
  "copingMechanisms": "string"
}`,
      },
    ],
  });

  const raw = stripFences(extractText(message));
  return JSON.parse(raw) as MockProfile;
}

// --- Step 2: Generate 3 personalized email drafts from the profile ---

async function generateEmails(profile: MockProfile): Promise<EmailDraft[]> {
  const profileSummary = `
Name: ${profile.name}
Stress sources: ${profile.stressSources}
Burnout signs: ${profile.burnoutSigns.join(", ")}
Exercise frequency: ${profile.exerciseFrequency}x per week
Coping mechanisms: ${profile.copingMechanisms}
  `.trim();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are writing on behalf of Soma, a cognitive health startup that helps people track and improve their mental performance — like Whoop for the brain.

You have this waitlist respondent's profile:
${profileSummary}

Write 3 personalized emails for this person:

1. Day 1 — Welcome email. Open with a compelling, specific statistic or research finding directly tied to their burnout signs or stress sources (cite a real study or credible stat). Then warmly welcome them to Soma, acknowledge their specific situation, and explain how Soma helps.

2. Day 4 — Mid-week tip. One practical, science-backed tip personalized to their profile (e.g. if they have brain fog, a tip around cognitive recovery). Keep it brief and actionable.

3. Day 7 — Activation nudge. Re-engage them with a short motivational message that reinforces Soma's value proposition and encourages them to stay on the waitlist / refer a friend.

Tone: warm, credible, human. Not salesy. Think: a knowledgeable friend who happens to run a health startup.

Return ONLY valid JSON, no markdown fences:
[
  { "day": "Day 1", "subject": "...", "body": "..." },
  { "day": "Day 4", "subject": "...", "body": "..." },
  { "day": "Day 7", "subject": "...", "body": "..." }
]`,
      },
    ],
  });

  const raw = stripFences(extractText(message));
  return JSON.parse(raw) as EmailDraft[];
}

// --- Route handler ---

export async function POST() {
  try {
    const profile = await generateMockProfile();
    const emails = await generateEmails(profile);
    return NextResponse.json({ profile, emails } satisfies GenerateResponse);
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: "Failed to generate profile or emails." },
      { status: 500 }
    );
  }
}
