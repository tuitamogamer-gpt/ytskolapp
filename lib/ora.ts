// ORA motor za naslove (Obećanje, Radoznalost, Autoritet) — ČISTA heuristika, bez AI.
// Identičan algoritam kao desktop verzija (rekalibrisan da jaki naslovi dosegnu 75–95).

import { stripDiacritics, clamp, normalizedHas } from "./text";
import type { OraScore } from "./types";

const CURIOSITY_WORDS = [
  "greska", "greske", "gresku", "gresaka",
  "tajna", "tajne", "tajnu",
  "niko", "nitko",
  "zasto",
  "ova", "ovaj", "ove", "ovo", "ovu", "ovi",
  "ovako", "ovdje",
  "skoro svi", "gotovo svi",
  "evo zasto",
  "prestani", "prestanite",
  "nikad", "nikada",
  "istina o", "istina je",
  "ne radi", "ne funkcionise",
  "trik", "trikovi", "trika",
];

const DEMONSTRATIVES = ["ova", "ovaj", "ove", "ovo", "ovu", "ovi", "ovako", "te", "ti", "to"];

const OUTCOME_WORDS = [
  "zaradi", "zaradite", "zaradis", "zarada",
  "smrsaj", "smrsa", "smrsavanje",
  "rijesi", "rijesite", "rjesenje",
  "udvostruci", "udvostrucite", "utrostruci",
  "nauci", "naucite", "naucis",
  "ovladaj", "savladaj", "savladajte",
  "popravi", "popravite",
  "izgradi", "izgradite",
  "pokreni", "pokrenite",
  "postani", "postanite",
  "ustedi", "ustedite",
  "povecaj", "povecajte", "udvoji",
  "izbjegni", "izbjegavaj", "izbaci",
  "dobij", "dobijte", "osvoji",
  "prodaj", "prodaji", "prodajte",
  "skini", "smanji", "smanjite",
  "kuhaj", "skuhaj", "speci",
  "sviraj", "zasviraj", "odsviraj",
  "privuci", "privuce",
];

const TIMEFRAME_UNITS = [
  "dan", "dana", "danu",
  "sedmica", "sedmice", "sedmicu", "sedmicama",
  "tjedan", "tjedna", "tjedana",
  "mjesec", "mjeseca", "mjeseci",
  "godina", "godine", "godinu",
  "sat", "sata", "sati",
  "minut", "minuta", "minute",
];

const AUTHORITY_WORDS = [
  "prof", "profesor", "profesorica", "profesionalac",
  "dr ", "doktor", "dipl",
  "ing", "inzenjer", "inzenjerka",
  "majstor", "ekspert", "strucnjak",
  "pedagog", "edukator", "edukatorica",
  "trener", "coach", "konsultant", "savjetnik",
  "godina iskustva", "godine iskustva", "godinu iskustva",
  "iskustva", "iskustvo",
  "certificirani", "licencirani", "sertifikovani",
  "nutricionista", "fizioterapeut", "advokat", "ljekar",
];

function scoreRadoznalost(raw: string, norm: string): number {
  let score = 0;
  let hits = 0;
  for (const w of CURIOSITY_WORDS) if (normalizedHas(norm, w)) hits++;
  score += Math.min(hits, 3) * 24;

  for (const d of DEMONSTRATIVES) {
    if (normalizedHas(norm, d)) { score += 24; break; }
  }
  if (raw.includes("?")) score += 26;
  if (raw.includes("...") || raw.includes("…")) score += 22;

  const caps = raw.match(/[A-ZČĆŠŽĐ]{2,}/g);
  if (caps && raw.trim().toUpperCase() !== raw.trim()) score += 14;

  const fullyRevealing =
    hits === 0 && !raw.includes("?") && !raw.includes("...") && !raw.includes("…");
  if (fullyRevealing) score = Math.max(0, score - 12);

  return clamp(score);
}

function scoreObecanje(raw: string, norm: string): number {
  let score = 0;
  if (/\d/.test(raw)) score += 28;
  if (/\bza\s+\d+\s+\w+/.test(norm)) score += 24;
  else {
    for (const u of TIMEFRAME_UNITS) {
      if (normalizedHas(norm, "za " + u)) { score += 14; break; }
    }
  }
  if (normalizedHas(norm, "kako")) score += 20;
  if (normalizedHas(norm, "nauci") || normalizedHas(norm, "naucite") || normalizedHas(norm, "naucis")) score += 16;
  if (raw.includes("€") || normalizedHas(norm, "eur") || normalizedHas(norm, "eura") || normalizedHas(norm, "km")) score += 18;
  if (/\d\s*[xX]\b/.test(raw) || /\b[xX]\d/.test(raw)) score += 14;
  if (raw.includes("+")) score += 8;

  let outcome = 0;
  for (const w of OUTCOME_WORDS) if (normalizedHas(norm, w)) outcome++;
  score += Math.min(outcome, 3) * 18;

  return clamp(score);
}

function scoreAutoritet(raw: string, norm: string): number {
  let score = 0;
  const paren = raw.match(/\(([^)]*)\)/);
  const parenNorm = paren ? stripDiacritics(paren[1]) : "";
  const hasParen = !!(paren && paren[1].trim());
  const qual = AUTHORITY_WORDS.some((w) => normalizedHas(norm, w));

  if (qual) {
    score += 70;
    if (hasParen && AUTHORITY_WORDS.some((w) => parenNorm.includes(w))) score += 25;
  } else if (hasParen) {
    score += 45;
  }
  if (/\d+\s*godin\w*\s+iskustv/.test(norm) || normalizedHas(norm, "godina iskustva")) score += 30;
  if (/\b(kao|za|sa|uz|poput)\s+[A-ZČĆŠŽĐ][\wČĆŠŽĐčćšžđ]+/.test(raw)) score += 28;

  return clamp(score);
}

function lengthFactor(length: number): number {
  if (length <= 50) return 100;
  if (length <= 70) {
    const over = length - 50;
    return Math.max(50, 95 - (over - 1) * (45 / 19));
  }
  const over = length - 70;
  return Math.max(0, 45 - over * 5);
}

function tipsRadoznalost(): string[] {
  return [
    "Otvori jaz radoznalosti: nagovijesti grešku ili tajnu, ali NE otkrij koju (npr. „Izbjegavaj OVE greške...“).",
    "Ubaci demonstrativ koji skriva subjekt — „OVA“, „OVE“, „OVAJ“ — da gledalac mora kliknuti da sazna na šta misliš.",
    "Razmisli o pitanju ili tri tačke na kraju koje ostavljaju misao nedovršenom („Evo zašto...“).",
  ];
}
function tipsObecanje(): string[] {
  return [
    "Dodaj konkretan, mjerljiv rezultat — šta gledalac dobija i za koliko (npr. „...i nauči svirati za 10 dana“).",
    "Ubaci broj ili vremenski okvir („7 grešaka“, „za 14 dana“) jer brojevi signaliziraju jasnu korist.",
    "Počni obećanjem koristi (Obećanje je najjači ORA element) — gledaocu mora biti jasno šta rješava prije nego klikne.",
  ];
}
function tipsAutoritet(): string[] {
  return [
    "Dodaj autoritet u zagradu za desktop rep naslova (znakovi 51–70), npr. „(prof. gitarista)“.",
    "Posudi vjerodostojnost co-brandingom — poznato ime ili brend (npr. „...kao Urban“) umjesto nepoznatog imena.",
    "Ako nemaš na čiji se brend nasloniti, stavi oznaku struke („edukator“, „majstor“, „X godina iskustva“).",
  ];
}
function tipsLength(length: number): string[] {
  return [
    `Naslov ima ${length} znakova — skrati ga na ≤50 jer mobilni prikazuje samo prvih 50 znakova (sa razmacima).`,
    "Izbaci suvišne riječi; što je naslov kraći, to bolje. Eventualni autoritet prebaci u zagradu na kraj (desktop rep do 70 znakova).",
  ];
}

/** Glavna ČISTA funkcija: boduj naslov po ORA okviru (bez AI). */
export function scoreTitle(title: string): OraScore {
  const raw = (title || "").trim();
  const norm = stripDiacritics(raw);
  const length = raw.length;
  const lengthOk = length <= 50;

  let radoznalost = scoreRadoznalost(raw, norm);
  let obecanje = scoreObecanje(raw, norm);
  let autoritet = scoreAutoritet(raw, norm);
  let lf = lengthFactor(length);

  if (!raw) { radoznalost = 0; obecanje = 0; autoritet = 0; lf = 0; }

  const total = clamp(0.40 * radoznalost + 0.35 * obecanje + 0.15 * autoritet + 0.10 * lf);

  let grade: string;
  if (total >= 80) grade = "Odlično";
  else if (total >= 60) grade = "Dobro";
  else if (total >= 40) grade = "Osrednje";
  else grade = "Slabo";

  const dim: Record<string, number> = {
    radoznalost, obecanje, autoritet, length: Math.round(lf),
  };
  const order = Object.keys(dim).sort((a, b) => dim[a] - dim[b]);
  const providers: Record<string, () => string[]> = {
    radoznalost: tipsRadoznalost,
    obecanje: tipsObecanje,
    autoritet: tipsAutoritet,
    length: () => tipsLength(length),
  };

  const tips: string[] = [];
  for (const d of order) {
    if (d === "length" && lengthOk && tips.length >= 2) continue;
    for (const t of providers[d]()) {
      if (!tips.includes(t)) tips.push(t);
      if (tips.length >= 3) break;
    }
    if (tips.length >= 2) break;
  }
  if (tips.length < 2) {
    for (const t of tipsRadoznalost()) {
      if (!tips.includes(t)) tips.push(t);
      if (tips.length >= 2) break;
    }
  }

  return { total, obecanje, radoznalost, autoritet, length, lengthOk, grade, tips };
}
