// TNT motor — checklist za thumbnail headline (ČISTA logika, bez AI).
// Pravila kursa: ≤4 riječi, konkretan, otvara radoznalost, kratak, nije cijela rečenica.

import { stripDiacritics } from "./text";
import type { HeadlineResult, HeadlineCheck } from "./types";

const CURIOSITY = [
  "greska", "greske", "tajna", "tajne", "niko", "zasto", "ova", "ovaj", "ove",
  "ovo", "ovako", "trik", "nikad", "skoro", "fatalna", "stop", "prestani", "istina",
];

const GENERIC = ["moj", "moje", "novo", "video", "sve", "info", "ostalo", "kanal"];

export function headlineChecklist(headline: string): HeadlineResult {
  const raw = (headline || "").trim();
  const norm = stripDiacritics(raw);
  const words = raw.split(/\s+/).filter(Boolean);
  const wc = words.length;

  const checks: HeadlineCheck[] = [];

  checks.push({ label: `Najviše 4 riječi (ima ${wc})`, ok: wc > 0 && wc <= 4 });

  const hasConcrete = /[a-zčćšžđ]{4,}/i.test(raw);
  const isGeneric = words.length > 0 && words.every((w) => GENERIC.includes(stripDiacritics(w)));
  checks.push({ label: "Konkretan (nije uopšten)", ok: hasConcrete && !isGeneric });

  const opensCuriosity =
    CURIOSITY.some((w) => norm.includes(w)) ||
    raw.includes("?") || raw.includes("...") || /[A-ZČĆŠŽĐ]{2,}/.test(raw);
  checks.push({ label: "Otvara radoznalost", ok: opensCuriosity });

  checks.push({ label: `Kratko (≤24 znaka, ima ${raw.length})`, ok: raw.length > 0 && raw.length <= 24 });

  const notSentence = !raw.includes(".") || raw.endsWith("...");
  checks.push({ label: "Nije cijela rečenica (bez tačke)", ok: notSentence });

  const passed = checks.filter((c) => c.ok).length;
  const score = checks.length ? Math.round((passed / checks.length) * 100) : 0;

  const tips: string[] = [];
  if (!checks[0].ok) tips.push("Skrati na najviše 4 riječi — kraći headline je čitljiviji i jači na thumbnailu.");
  if (!checks[1].ok) tips.push("Budi konkretan i vezan za temu (npr. „početničke greške“), ne uopšten tekst.");
  if (!checks[2].ok) tips.push("Otvori jaz radoznalosti: nagovijesti, ali ne otkrij sve (demonstrativ „OVE“, pitanje ili CAPS riječ).");
  if (!checks[3].ok) tips.push("Skrati tekst — veliki, kratak headline se lakše pročita u feedu (cilj ≤24 znaka).");
  if (!checks[4].ok) tips.push("Izbaci tačku/cijelu rečenicu — headline je udarna fraza, ne rečenica.");
  if (!tips.length) tips.push("Odličan headline! Uskladi ga sa slikom lica koje pojačava emociju i visokim kontrastom pozadine.");

  return { score, checks, tips };
}
