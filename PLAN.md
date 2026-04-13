# Feature Implementation Plan

**Overall Progress:** `83%` *(Steps 1–5 complete · Step 6: Deploy to Vercel remaining)*

## TLDR
A Next.js app hosted on Vercel with a single "Generate Emails" button. Clicking it calls Claude to first generate a realistic mock Typeform respondent, then uses that profile to generate 3 personalized email drafts (Day 1, Day 4, Day 7). The mock response and email drafts display on screen, and a second button sends all 3 emails to a Slack channel.

## Critical Decisions
- **Stack: Next.js** — React frontend + API routes in one project, deploys cleanly to Vercel
- **Two-step Claude call** — Step 1: generate mock respondent profile. Step 2: generate 3 emails from that profile. Keeps prompts clean and outputs predictable
- **Structured JSON responses from Claude** — Both calls return typed JSON so the frontend can render cleanly
- **Slack via Incoming Webhook** — Simplest Slack integration, no OAuth needed for MVP
- **No database** — Stateless MVP; nothing is persisted

## Tasks

- [x] 🟩 **Step 1: Project Setup**
  - [x] 🟩 Initialize Next.js app with TypeScript
  - [x] 🟩 Install dependencies: `@anthropic-ai/sdk`
  - [x] 🟩 Create `.env.local` with `ANTHROPIC_API_KEY` and `SLACK_WEBHOOK_URL`
  - [x] 🟩 Add `.gitignore` covering `.env.local` and `node_modules`

- [x] 🟩 **Step 2: Mock Profile Generation API Route**
  - [x] 🟩 Create `POST /api/generate` route
  - [x] 🟩 Call Claude to generate a realistic mock Typeform respondent (stress sources, burnout signs, exercise frequency, coping mechanisms)
  - [x] 🟩 Return profile as structured JSON

- [x] 🟩 **Step 3: Email Generation (within same API route)**
  - [x] 🟩 Pass the generated profile into a second Claude call
  - [x] 🟩 Prompt returns 3 emails (Day 1, Day 4, Day 7) as structured JSON — each with subject + body
  - [x] 🟩 Day 1 email opens with a relevant stat/study tied to the respondent's specific answers
  - [x] 🟩 Return both the profile and the 3 emails in the API response

- [x] 🟩 **Step 4: Slack API Route**
  - [x] 🟩 Create `POST /api/send-slack` route
  - [x] 🟩 Accept the 3 generated emails and post to Slack via Incoming Webhook
  - [x] 🟩 Format each email with a clear label (Day 1 / Day 4 / Day 7) in the Slack message

- [x] 🟩 **Step 5: Frontend UI**
  - [x] 🟩 Single page with Soma branding (name + tagline)
  - [x] 🟩 "Generate Emails" button → calls `/api/generate`
  - [x] 🟩 Display the generated mock respondent profile as a summary card
  - [x] 🟩 Display 3 email draft cards (Day 1 / Day 4 / Day 7), each showing subject + body
  - [x] 🟩 "Send to Slack" button → calls `/api/send-slack` with the generated emails
  - [x] 🟩 Show Slack channel name on success

- [ ] 🟥 **Step 6: Deploy to Vercel**
  - [ ] 🟥 Push to GitHub
  - [ ] 🟥 Connect repo to Vercel
  - [ ] 🟥 Add environment variables in Vercel dashboard
