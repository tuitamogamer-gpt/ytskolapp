"use client";

import React from "react";

export type AiResult<T = unknown> = { ok: boolean; data?: T; error?: string; needsKey?: boolean };

/** Pozovi AI rutu. Vraća {ok, data} ili {ok:false, error, needsKey}. */
export async function callAi<T = unknown>(
  action: string,
  payload: Record<string, unknown>
): Promise<AiResult<T>> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const json = await res.json();
    if (json.ok) return { ok: true, data: json.data as T };
    return { ok: false, error: json.error, needsKey: json.needsKey };
  } catch {
    return { ok: false, error: "Greška u mreži." };
  }
}

export function Spinner() {
  return <span className="spinner" />;
}

export function gradeColor(total: number): string {
  if (total >= 80) return "var(--green)";
  if (total >= 60) return "var(--blue)";
  if (total >= 40) return "var(--amber)";
  return "var(--accent)";
}

export function Bar({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color || gradeColor(value) }} />
      </div>
      <span className="bar-val">{value}</span>
    </div>
  );
}

export function Notice({ kind, children }: { kind: "info" | "warn" | "error"; children: React.ReactNode }) {
  return <div className={`notice notice-${kind}`}>{children}</div>;
}

/** Standardni prikaz greške/needsKey iz AI poziva. */
export function AiError({ error, needsKey }: { error?: string; needsKey?: boolean }) {
  if (!error) return null;
  return <Notice kind={needsKey ? "warn" : "error"}>{error}</Notice>;
}
