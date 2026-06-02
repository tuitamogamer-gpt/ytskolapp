// Zajedničke tekstualne pomoćne funkcije (normalizacija, JSON ekstrakcija).

const DIACRITIC_MAP: Record<string, string> = {
  "č": "c", "ć": "c", "š": "s", "ž": "z", "đ": "dj",
  "Č": "c", "Ć": "c", "Š": "s", "Ž": "z", "Đ": "dj",
};

/** Vrati tekst u malim slovima sa uklonjenim B/H/S dijakriticima (za neosjetljivo poređenje). */
export function stripDiacritics(text: string): string {
  let swapped = "";
  for (const ch of text) swapped += DIACRITIC_MAP[ch] ?? ch;
  return swapped.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

/** Da li se okidač (na normalizovanom obliku) pojavljuje u tekstu, uz granicu riječi za proste riječi. */
export function normalizedHas(haystack: string, needle: string): boolean {
  if (needle.includes(" ") || !/^[a-z]+$/.test(needle)) {
    return haystack.includes(needle);
  }
  const re = new RegExp("\\b" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
  return re.test(haystack);
}

/** Tolerantno izvuci prvi balansirani JSON ([..] ili {..}) iz AI odgovora (skida ```json ograde). */
export function extractJson(raw: string): unknown {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const a = s.indexOf("[");
  const b = s.indexOf("{");
  let start = -1;
  if (a === -1) start = b;
  else if (b === -1) start = a;
  else start = Math.min(a, b);
  if (start === -1) return JSON.parse(s);

  const open = s[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return JSON.parse(s.slice(start, i + 1));
    }
  }
  return JSON.parse(s);
}
