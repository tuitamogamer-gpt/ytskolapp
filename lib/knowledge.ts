// Baza znanja: učitava strukturirane podatke + sirove tekstove 12 lekcija; pretraga i RAG.

import kbData from "./data/knowledge.json";
import lessonsData from "./data/lessons.json";
import { stripDiacritics } from "./text";
import type { Lesson, SearchHit } from "./types";

const kb = kbData as unknown as {
  lessons: Lesson[];
  frameworks: Record<string, { name: string; summary: string; elements: { key: string; desc: string }[] }>;
  monetization_models: { key: string; name: string; desc: string; pros: string[]; cons: string[]; best_for: string }[];
  rules: Record<string, number>;
};

interface LessonText { n: number; title: string; text: string; }
const lessonsText = lessonsData as unknown as LessonText[];

export function allLessons(): Lesson[] {
  return kb.lessons.slice().sort((a, b) => a.n - b.n);
}
export function getLesson(n: number): Lesson | undefined {
  return kb.lessons.find((l) => l.n === n);
}
export function frameworks() {
  return kb.frameworks;
}
export function monetizationModels() {
  return kb.monetization_models;
}
export function rules(): Record<string, number> {
  return kb.rules;
}

/** Pretraga po sirovim tekstovima lekcija (neosjetljiva na dijakritike). Vraća najbolje isječke. */
export function search(query: string, limit = 3): SearchHit[] {
  const terms = stripDiacritics(query).split(/\s+/).filter((t) => t.length >= 3);
  if (!terms.length) return [];

  const hits: SearchHit[] = [];
  const windowSize = 600;
  const stepSize = 300;

  for (const lesson of lessonsText) {
    const norm = stripDiacritics(lesson.text);
    let best = { score: 0, pos: 0 };
    for (let i = 0; i < Math.max(1, norm.length); i += stepSize) {
      const win = norm.slice(i, i + windowSize);
      let s = 0;
      for (const t of terms) {
        let idx = 0;
        while ((idx = win.indexOf(t, idx)) !== -1) { s++; idx += t.length; }
      }
      if (s > best.score) best = { score: s, pos: i };
    }
    if (best.score > 0) {
      const snippet = lesson.text.slice(best.pos, best.pos + windowSize).replace(/\s+/g, " ").trim();
      hits.push({ n: lesson.n, title: lesson.title, snippet, score: best.score });
    }
  }
  hits.sort((a, b) => b.score - a.score || a.n - b.n);
  return hits.slice(0, limit);
}

/** Spojeni relevantni isječci za grounding AI prompta (RAG). */
export function contextFor(query: string, maxChars = 6000): string {
  const hits = search(query, 12);
  let out = "";
  for (const h of hits) {
    const block = `[Lekcija ${h.n}: ${h.title}]\n${h.snippet}\n\n`;
    if (out.length + block.length > maxChars) break;
    out += block;
  }
  return out.trim();
}
