// Server-only AI sloj: zove Anthropic Messages API direktno preko fetch (bez SDK-a).
// Bez ANTHROPIC_API_KEY, aiAvailable() je false i rute vraćaju prijateljsku poruku.

import { extractJson } from "./text";

export class AIError extends Error {}

export function aiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function ask(prompt: string, system = "", maxTokens = 1800): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AIError("AI nije podešen: nedostaje ANTHROPIC_API_KEY.");

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: system || undefined,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (e) {
    throw new AIError("Ne mogu se povezati sa Anthropic API-jem.");
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new AIError(`Anthropic API greška (${res.status}): ${t.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: { text?: string }[] };
  const text = (data.content || []).map((b) => b.text || "").join("").trim();
  if (!text) throw new AIError("AI nije vratio odgovor.");
  return text;
}

export async function askJson<T = unknown>(prompt: string, system = "", maxTokens = 1800): Promise<T> {
  const text = await ask(prompt, system, maxTokens);
  try {
    return extractJson(text) as T;
  } catch {
    throw new AIError("AI odgovor nije bio u validnom JSON formatu.");
  }
}
