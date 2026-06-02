# 🎬 YouTube Škola Studio — web

Web verzija alata za rast YouTube kanala, deployabilna na **Vercel**. Sva logika potiče iz 12
lekcija *YouTube Škole* (4F, ORA, TNT, 9 modela zarade), izvučenih u `lib/data/`.

**Tehnologija:** Next.js 14 (App Router) + TypeScript, bez vanjskih runtime zavisnosti
(Anthropic API se zove direktno preko `fetch`).

## Šta radi bez ikakvog ključa (čiste funkcije, lokalno u browseru)
- **ORA bodovanje naslova** (Obećanje / Radoznalost / Autoritet) — uživo
- **TNT checklist** za thumbnail headline
- **Kalkulator zarade** za svih 9 modela
- **Content plan → izvoz u `.ics` i `.csv`** (kalendar)
- **Pretraga baze znanja** (12 lekcija)

## Šta traži API ključ (AI, serverless)
Generisanje naslova, generisanje thumbnail headline-a, audit thumbnaila, validacija niše (4F),
hookovi / analiza uvoda / outline, AI content plan, i Q&A nad bazom znanja.

> Bez ključa app radi normalno — AI dugmad samo prikažu prijateljsku poruku da treba ključ.

---

## Lokalno pokretanje

```bash
npm install
npm run dev        # http://localhost:3000
```

Za AI lokalno, napravi `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
# opciono: ANTHROPIC_MODEL=claude-sonnet-4-6
```

## Deploy na Vercel (iz gita)

1. Pushaj ovaj repo na GitHub (vidi dolje).
2. Na [vercel.com](https://vercel.com) → **Add New → Project** → importuj repo.
   Vercel automatski prepozna Next.js (build: `next build`, ništa ne treba mijenjati).
3. (Opciono, za AI) **Settings → Environment Variables** → dodaj `ANTHROPIC_API_KEY`
   (ključ sa https://console.anthropic.com). Po želji `ANTHROPIC_MODEL`.
4. **Deploy.** Gotovo.

Bez koraka 3 sajt radi sa svim čistim funkcijama; AI se uključi čim dodaš ključ i redeployaš.

## Push na GitHub

```bash
git remote add origin https://github.com/<korisnik>/yt-skola-studio.git
git branch -M main
git push -u origin main
```

---

## Struktura

```
app/
  page.tsx              glavni shell (7 tabova, AI status)
  layout.tsx            root layout
  globals.css           tamna tema
  components/           OraTab, TntTab, NicheTab, MonetizationTab, ScriptTab, PlanTab, KnowledgeTab, ui
  api/ai/route.ts       sve AI akcije (gejtano na ANTHROPIC_API_KEY)
  api/status/route.ts   javlja da li je AI dostupan
lib/
  ora.ts                ORA bodovanje (čista heuristika)
  tnt.ts                TNT checklist
  monetization.ts       kalkulator (9 modela)
  planner.ts            datumi + .ics/.csv izvoz
  knowledge.ts          baza znanja + pretraga/RAG
  anthropic.ts          poziv Anthropic API-ja (fetch)
  text.ts, types.ts     pomoćne funkcije i tipovi
  data/                 knowledge.json + lessons.json (12 lekcija)
```
