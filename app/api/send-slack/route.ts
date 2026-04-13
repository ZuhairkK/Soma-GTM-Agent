import { NextRequest, NextResponse } from "next/server";
import type { EmailDraft } from "@/lib/types";

interface SendSlackRequest {
  emails: EmailDraft[];
}

// Format all 3 email drafts into a readable Slack Block Kit payload.
function formatSlackMessage(emails: EmailDraft[]): { blocks: unknown[] } {
  const channel = process.env.SLACK_CHANNEL_NAME ?? "#soma-gtm";

  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📬 New Soma GTM Email Sequence",
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `Sending to *${channel}*` }],
    },
    { type: "divider" },
    // One section per email draft
    ...emails.flatMap((email) => [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${email.day}* — ${email.subject}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          // Slack enforces a 3000-char limit per text block; trim defensively.
          text: email.body.length > 2900 ? email.body.slice(0, 2900) + "…" : email.body,
        },
      },
      { type: "divider" },
    ]),
  ];

  return { blocks };
}

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "SLACK_WEBHOOK_URL is not configured." },
      { status: 500 }
    );
  }

  // Validate request body before touching it
  let body: SendSlackRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body — expected JSON." },
      { status: 400 }
    );
  }

  if (!Array.isArray(body?.emails) || body.emails.length === 0) {
    return NextResponse.json(
      { error: "Request body must include a non-empty emails array." },
      { status: 400 }
    );
  }

  const payload = formatSlackMessage(body.emails);

  const slackRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!slackRes.ok) {
    const text = await slackRes.text();
    console.error("[/api/send-slack] Slack error:", text);
    return NextResponse.json(
      { error: `Slack responded with: ${text}` },
      { status: 502 }
    );
  }

  const channel = process.env.SLACK_CHANNEL_NAME ?? "#soma-gtm";
  return NextResponse.json({ ok: true, channel });
}
