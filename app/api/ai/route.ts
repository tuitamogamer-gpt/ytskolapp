// Jedinstvena AI ruta: POST { action, ...payload }. Sve AI funkcije idu kroz ovdje.
// Bez API ključa vraća { ok:false, needsKey:true } da UI pokaže prijateljsku poruku.

import { NextResponse } from "next/server";
import { aiAvailable, ask, askJson, AIError } from "@/lib/anthropic";
import * as knowledge from "@/lib/knowledge";
import { planDates } from "@/lib/planner";
import type { PlanItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM =
  "Ti si trener iz 'YouTube Škole' za rast kanala. Pišeš ISKLJUČIVO na bosanskom/hrvatskom/" +
  "srpskom jeziku (ijekavica). Primjenjuješ okvire kursa: 4F (fokus na jednu temu/bol, vrijedne " +
  "informacije, rješavanje jednog problema, zahvalnost), ORA za naslove (Obećanje, Radoznalost, " +
  "Autoritet) i TNT (title i thumbnail). Konkretno, bez clickbaita koji se ne može ispuniti.";

function coerceStrings(value: unknown, n: number): string[] {
  let items: unknown = value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const k of ["titles", "naslovi", "headlines", "hooks", "items", "list", "data"]) {
      if (Array.isArray(obj[k])) { items = obj[k]; break; }
    }
    if (!Array.isArray(items)) items = Object.values(obj);
  }
  const out: string[] = [];
  if (Array.isArray(items)) {
    for (const it of items) {
      let text = "";
      if (typeof it === "string") text = it;
      else if (it && typeof it === "object") {
        const o = it as Record<string, unknown>;
        for (const k of ["title", "naslov", "headline", "hook", "text", "value"]) {
          if (typeof o[k] === "string") { text = o[k] as string; break; }
        }
      } else text = String(it);
      text = text.replace(/^\s*(?:\d+[.)]\s*|[-•*]\s*)/, "").trim().replace(/^["„]|["“]$/g, "").trim();
      if (text) out.push(text);
    }
  }
  return out.slice(0, n);
}

async function dispatch(action: string, p: Record<string, unknown>): Promise<unknown> {
  const str = (k: string, d = "") => (typeof p[k] === "string" ? (p[k] as string).trim() : d);
  const int = (k: string, d: number) => {
    const v = Number(p[k]);
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : d;
  };

  switch (action) {
    case "titles": {
      const topic = str("topic");
      if (!topic) throw new AIError("Tema je prazna.");
      const n = int("n", 7);
      const ctx = knowledge.contextFor("naslov ORA radoznalost obećanje autoritet");
      const aud = str("audience") ? `Ciljna publika: ${str("audience")}.\n` : "";
      const prompt =
        `KONTEKST IZ KURSA:\n${ctx}\n\nZADATAK:\nTema videa: "${topic}".\n${aud}` +
        `Napiši TAČNO ${n} različitih YouTube naslova. Svaki MORA sadržati sva tri ORA elementa:\n` +
        `• OBEĆANJE: mjerljiv rezultat — broj ili vremenski okvir (npr. „za 10 dana“, „3 koraka“, „+50%“).\n` +
        `• RADOZNALOST: demonstrativ koji SKRIVA subjekt („OVE greške“, „OVAJ trik“), pitanje ili tri tačke — nagovijesti, ne otkrij.\n` +
        `• AUTORITET: kvalifikacija ili poznato ime u zagradi gdje stane (npr. „(prof. gitarista)“).\n` +
        `Glavni dio ≤50 znakova. Primjer OBLIKA: „Izbjegavaj OVE 3 greške (prof. gitarista)“.\n` +
        `FORMAT: vrati ISKLJUČIVO JSON niz od ${n} stringova, bez dodatnog teksta.`;
      const titles = coerceStrings(await askJson(prompt, SYSTEM), n);
      if (!titles.length) throw new AIError("AI nije vratio nijedan naslov.");
      return { titles };
    }

    case "improveTitle": {
      const title = str("title");
      if (!title) throw new AIError("Naslov je prazan.");
      const ctx = knowledge.contextFor("naslov ORA obećanje radoznalost");
      const prompt =
        `KONTEKST:\n${ctx}\n\nPoboljšaj ovaj YouTube naslov primjenom ORA okvira (jače Obećanje, ` +
        `jasniji jaz radoznalosti, autoritet u zagradi ako stane), ≤50 znakova: "${title}".\n` +
        `Vrati SAMO jedan poboljšani naslov, bez objašnjenja, bez navodnika.`;
      const out = (await ask(prompt, SYSTEM, 200)).split("\n").map((l) => l.trim()).filter(Boolean);
      const improved = (out.find((l) => !l.endsWith(":")) || title).replace(/^["„]|["“]$/g, "").trim();
      return { title: improved };
    }

    case "tntHeadlines": {
      const topic = str("topic");
      if (!topic) throw new AIError("Tema je prazna.");
      const n = int("n", 8);
      const ctx = knowledge.contextFor("thumbnail headline curiosity gap kratak");
      const prompt =
        `KONTEKST:\n${ctx}\n\nTema: "${topic}".\nNapiši ${n} headline-a za THUMBNAIL. Pravila: ` +
        `MAKSIMALNO 4 riječi, konkretno i vezano za temu, otvara jaz radoznalosti (nije općenito). ` +
        `Primjeri oblika: „Početničke greške“, „OVE 3 greške“, „Skrivena tajna“.\n` +
        `FORMAT: vrati ISKLJUČIVO JSON niz od ${n} stringova.`;
      const headlines = coerceStrings(await askJson(prompt, SYSTEM), n);
      if (!headlines.length) throw new AIError("AI nije vratio headline.");
      return { headlines };
    }

    case "thumbnailAudit": {
      const description = str("description");
      if (!description) throw new AIError("Opis thumbnaila je prazan.");
      const ctx = knowledge.contextFor("thumbnail jednostavnost kontrast lice emocija");
      const prompt =
        `KONTEKST:\n${ctx}\n\nOcijeni ovaj planirani thumbnail po pravilima kursa (jednostavnost, ` +
        `visok kontrast, jaz radoznalosti, lice s emocijom, bez otvorenih usta/rubova/sjena): ` +
        `"${description}".\nFORMAT: vrati ISKLJUČIVO JSON objekt {"score": broj 0-100, ` +
        `"good": [string], "fix": [string]}.`;
      return await askJson(prompt, SYSTEM);
    }

    case "niche": {
      const niche = str("niche");
      if (!niche) throw new AIError("Niša je prazna.");
      const ctx = knowledge.contextFor("4F niša fokus jedan problem bol monetizacija");
      const problem = str("problem") ? `Problem: ${str("problem")}.\n` : "";
      const aud = str("audience") ? `Publika: ${str("audience")}.\n` : "";
      const prompt =
        `KONTEKST IZ KURSA (4F):\n${ctx}\n\nProcijeni ovu nišu po 4F okviru.\nNiša: "${niche}".\n${problem}${aud}` +
        `FORMAT: vrati ISKLJUČIVO JSON objekt:\n{"scores":{"fokus_teme":0-10,"vrijednost":0-10,` +
        `"jedan_problem":0-10,"monetizacija":0-10},"verdict":"1-2 rečenice","strengths":[string],` +
        `"risks":[string],"recommendations":[string],"monetization_idea":"konkretan digitalni proizvod/kurs za ovu nišu"}.`;
      return await askJson(prompt, SYSTEM);
    }

    case "hooks": {
      const topic = str("topic");
      if (!topic) throw new AIError("Tema je prazna.");
      const n = int("n", 5);
      const ctx = knowledge.contextFor("uvod hook prvih 15 sekundi retention radoznalost");
      const prompt =
        `KONTEKST:\n${ctx}\n\nTema videa: "${topic}".\nNapiši ${n} uvodnih hookova (prva rečenica, ` +
        `prvih 15 sekundi) koji odmah otvaraju jaz radoznalosti ili udaraju impresivnom činjenicom. ` +
        `Bez pozdrava i predstavljanja.\nFORMAT: vrati ISKLJUČIVO JSON niz od ${n} stringova.`;
      const hooks = coerceStrings(await askJson(prompt, SYSTEM), n);
      if (!hooks.length) throw new AIError("AI nije vratio hookove.");
      return { hooks };
    }

    case "intro": {
      const text = str("text");
      if (!text) throw new AIError("Tekst uvoda je prazan.");
      const ctx = knowledge.contextFor("uvod prvih 15 sekundi hook kredibilitet obećanje");
      const prompt =
        `KONTEKST:\n${ctx}\n\nAnaliziraj ovaj uvod videa (prvih 15-30s) sa stanovišta zadržavanja gledaoca: ` +
        `"${text}".\nFORMAT: vrati ISKLJUČIVO JSON objekt {"score":0-100,"open_loops":[string],` +
        `"issues":[string],"rewrite":"poboljšana verzija uvoda"}.`;
      return await askJson(prompt, SYSTEM, 1500);
    }

    case "outline": {
      const topic = str("topic");
      if (!topic) throw new AIError("Tema je prazna.");
      const title = str("title") ? `Naslov: ${str("title")}.\n` : "";
      const ctx = knowledge.contextFor("skripta storytelling blokovi jaz radoznalosti CTA");
      const prompt =
        `KONTEKST:\n${ctx}\n\nNapiši outline (kostur) za vrijedan YouTube video.\nTema: "${topic}".\n${title}` +
        `Struktura: Hook (prvih 15s) → vrijednost u 3-5 blokova povezanih jazom radoznalosti → CTA/newsletter. ` +
        `Piši kao markdown sa naslovima i bulletima, na B/H/S.`;
      return { outline: await ask(prompt, SYSTEM, 2200) };
    }

    case "plan": {
      const niche = str("niche");
      if (!niche) throw new AIError("Niša je prazna.");
      const weeks = int("weeks", 8);
      const perWeek = int("perWeek", 1);
      const start = str("start");
      const dates = planDates(start, weeks, perWeek);
      const n = dates.length;
      const ctx = knowledge.contextFor("plan mini serijali teme problem ORA");
      const prompt =
        `KONTEKST:\n${ctx}\n\nNapravi content plan za nišu: "${niche}".\nDaj TAČNO ${n} ideja za videe ` +
        `(po mogućnosti grupisane u mini-serijale). Za svaku ideju daj naslov (ORA), kratak hook, ` +
        `headline za thumbnail (≤4 riječi) i cilj videa.\nFORMAT: vrati ISKLJUČIVO JSON niz od ${n} objekata ` +
        `{"title":string,"hook":string,"thumbnail_headline":string,"goal":string}.`;
      const raw = await askJson<unknown>(prompt, SYSTEM, 3000);
      const arr = Array.isArray(raw) ? raw : (raw as { items?: unknown[] })?.items || [];
      const plan: PlanItem[] = [];
      const list = arr as Record<string, unknown>[];
      for (let i = 0; i < dates.length && i < list.length; i++) {
        const it = list[i] || {};
        plan.push({
          date: dates[i],
          title: String(it.title ?? it.naslov ?? `Video ${i + 1}`).trim(),
          thumbnailHeadline: String(it.thumbnail_headline ?? it.headline ?? "").trim(),
          hook: String(it.hook ?? "").trim(),
          goal: String(it.goal ?? it.cilj ?? "").trim(),
        });
      }
      if (!plan.length) throw new AIError("AI nije vratio plan.");
      return { plan };
    }

    case "ask": {
      const question = str("question");
      if (!question) throw new AIError("Pitanje je prazno.");
      const ctx = knowledge.contextFor(question, 7000);
      const prompt =
        `Odgovori na pitanje ISKLJUČIVO na osnovu sljedećeg gradiva iz YouTube Škole. Ako odgovor nije ` +
        `u gradivu, reci da nije pokriveno. Citiraj broj lekcije gdje je relevantno.\n\nGRADIVO:\n${ctx}\n\n` +
        `PITANJE: ${question}`;
      return { answer: await ask(prompt, SYSTEM, 1500) };
    }

    default:
      throw new AIError(`Nepoznata akcija: ${action}`);
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Neispravan zahtjev." });
  }

  const action = typeof body.action === "string" ? body.action : "";

  if (!aiAvailable()) {
    return NextResponse.json({
      ok: false,
      needsKey: true,
      error: "AI funkcije zahtijevaju ANTHROPIC_API_KEY. Dodaj ga u Vercel (Settings → Environment Variables) da uključiš generisanje.",
    });
  }

  try {
    const data = await dispatch(action, body);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const msg = e instanceof AIError ? e.message : "Došlo je do greške pri AI pozivu.";
    return NextResponse.json({ ok: false, error: msg });
  }
}
