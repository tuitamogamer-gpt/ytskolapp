// Content plan — generisanje datuma (Python-stil) i izvoz u .ics / .csv (ČISTO, bez AI).

import type { PlanItem } from "./types";

function fmtDate(iso: string): string {
  return iso.replace(/-/g, "");
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Izračunaj datume objava: weeks sedmica × perWeek videa, raspoređeno kroz svaku sedmicu. */
export function planDates(start: string, weeks: number, perWeek: number): string[] {
  const base = start || todayIso();
  const dates: string[] = [];
  const step = perWeek > 1 ? Math.floor(7 / perWeek) : 7;
  for (let w = 0; w < weeks; w++) {
    for (let p = 0; p < perWeek; p++) {
      dates.push(addDays(base, w * 7 + p * step));
    }
  }
  return dates;
}

function escText(text: string): string {
  return (text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// RFC5545 "line folding": linije duže od ~73 znaka se prelamaju (CRLF + razmak).
function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let s = line;
  parts.push(s.slice(0, 73));
  s = s.slice(73);
  while (s.length > 72) {
    parts.push(" " + s.slice(0, 72));
    s = s.slice(72);
  }
  parts.push(" " + s);
  return parts.join("\r\n");
}

// Deterministički UID (bez random/Date) iz indeksa + naslova.
function uid(i: number, item: PlanItem): string {
  let h = 0;
  const s = i + "|" + (item.title || "");
  for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) >>> 0;
  return `ytskola-${i}-${h.toString(16)}@yt-skola-studio`;
}

/** Validan iCalendar (.ics) string — jedan all-day VEVENT po stavci. Uvozi se u Google/Outlook/Apple kalendar. */
export function toIcs(plan: PlanItem[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//YT Skola Studio//BS//",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine("X-WR-CALNAME:YouTube Škola — plan sadržaja"),
  ];
  plan.forEach((item, i) => {
    const start = fmtDate(item.date);
    const end = fmtDate(addDays(item.date, 1));
    const desc = `Hook: ${item.hook}\nThumbnail headline: ${item.thumbnailHeadline}\nCilj: ${item.goal}`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid(i, item)}`);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${end}`);
    lines.push(foldLine(`SUMMARY:🎬 ${escText(item.title)}`));
    lines.push(foldLine(`DESCRIPTION:${escText(desc)}`));
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** CSV (UTF-8) sa zaglavljem i po jednim redom za svaku stavku plana. */
export function toCsv(plan: PlanItem[]): string {
  const header = ["date", "title", "thumbnail_headline", "hook", "goal"];
  const esc = (v: unknown) => {
    const s = (v ?? "").toString();
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const rows = plan.map((p) =>
    [p.date, p.title, p.thumbnailHeadline, p.hook, p.goal].map(esc).join(",")
  );
  return [header.join(","), ...rows].join("\r\n") + "\r\n";
}
