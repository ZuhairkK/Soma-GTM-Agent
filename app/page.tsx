"use client";

import { useState } from "react";
import type { GenerateResponse, MockProfile, EmailDraft } from "@/lib/types";

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard({ profile }: { profile: MockProfile }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-sm p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">
        Mock Respondent
      </p>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{profile.name}</h2>

      <div className="space-y-2.5 text-sm text-gray-600">
        <Row label="Stress sources" value={profile.stressSources} />
        <div>
          <span className="text-gray-500 font-medium">Burnout signs</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {profile.burnoutSigns.map((sign) => (
              <span
                key={sign}
                className="rounded-full bg-violet-100 text-violet-700 px-2.5 py-0.5 text-xs font-medium"
              >
                {sign}
              </span>
            ))}
          </div>
        </div>
        <Row label="Exercise" value={`${profile.exerciseFrequency}× per week`} />
        <Row label="Coping mechanisms" value={profile.copingMechanisms} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-700 ml-1">{value}</span>
    </div>
  );
}

// ─── Email Card ───────────────────────────────────────────────────────────────

const EMAIL_META: Record<string, { label: string; accent: string; dot: string }> = {
  "Day 1": { label: "Welcome",          accent: "border-violet-300 bg-violet-50/60", dot: "bg-violet-400" },
  "Day 4": { label: "Mid-week Tip",     accent: "border-sky-300 bg-sky-50/60",       dot: "bg-sky-400"    },
  "Day 7": { label: "Activation Nudge", accent: "border-emerald-300 bg-emerald-50/60", dot: "bg-emerald-400" },
};

function EmailCard({ email }: { email: EmailDraft }) {
  const meta = EMAIL_META[email.day] ?? { label: email.day, accent: "border-gray-200 bg-gray-50", dot: "bg-gray-400" };
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`rounded-2xl border ${meta.accent} backdrop-blur-xl shadow-sm overflow-hidden`}>
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{email.day}</span>
          <span className="rounded-full bg-white/80 ring-1 ring-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {meta.label}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-3 border-t border-white/50">
          <p className="pt-4 text-sm font-semibold text-gray-800">{email.subject}</p>
          <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{email.body}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [loading, setLoading]       = useState(false);
  const [data, setData]             = useState<GenerateResponse | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [slackLoading, setSlackLoading] = useState(false);
  const [slackResult, setSlackResult]   = useState<{ ok: boolean; channel?: string; error?: string } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setData(null);
    setError(null);
    setSlackResult(null);
    try {
      const res = await fetch("/api/generate", { method: "POST" });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendSlack() {
    if (!data) return;
    setSlackLoading(true);
    setSlackResult(null);
    try {
      const res = await fetch("/api/send-slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: data.emails }),
      });
      setSlackResult(await res.json());
    } catch (e) {
      setSlackResult({ ok: false, error: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setSlackLoading(false);
    }
  }

  return (
    /* macOS-style frosted background */
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-violet-50">

      <main className="relative mx-auto max-w-2xl px-4 py-20">

        {/* ── Header ── */}
        <div className="mb-12 text-center">
          {/* macOS-style window traffic lights for aesthetic */}
          <div className="flex justify-center gap-2 mb-8">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Soma</h1>
          <p className="mt-2 text-sm text-gray-400">GTM Agent · Waitlist Email Sequencer</p>
        </div>

        {/* ── Generate Button ── */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="relative flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? "Generating…" : "Generate Emails"}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Results ── */}
        {data && (
          <div className="space-y-4">
            <ProfileCard profile={data.profile} />

            <div className="space-y-3">
              {data.emails.map((email) => (
                <EmailCard key={email.day} email={email} />
              ))}
            </div>

            {/* ── Send to Slack ── */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                onClick={handleSendSlack}
                disabled={slackLoading}
                className="flex items-center gap-2 rounded-xl bg-gray-900 px-7 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-gray-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {/* Slack icon */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z"/>
                </svg>
                {slackLoading ? "Sending…" : "Send to Slack"}
              </button>

              {/* Slack result feedback */}
              {slackResult && (
                <p className={`text-sm font-medium ${slackResult.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {slackResult.ok
                    ? `✓ Posted to ${slackResult.channel}`
                    : `✗ ${slackResult.error}`}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
