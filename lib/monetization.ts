// Kalkulator zarade (ČISTA matematika, bez AI). Formule izvedene iz Lekcije 2 kursa.
// Iste vrijednosti kao desktop verzija (npr. 8000 pregleda + kurs 100€ → 16.000€/mj).

import type { Estimate, MonetizationModel } from "./types";

export const MODELS: MonetizationModel[] = [
  { key: "pregledi", name: "Zarada od pregleda (AdSense)", desc: "Reklame na videu, ~1000€ po milionu pregleda — najslabiji model." },
  { key: "affiliate", name: "Affiliate marketing", desc: "Provizija (3–5%) za preporučene proizvode preko linka/kupona." },
  { key: "sponzorstva", name: "Sponzorstva", desc: "Integrisane reklame; cijena zavisi od prosječnih pregleda po videu." },
  { key: "clanstvo", name: "Članstvo / pretplata", desc: "Mjesečna pretplata za ekskluzivan sadržaj (YouTube, Patreon, Skool)." },
  { key: "merch", name: "Merch (fizički proizvodi)", desc: "Majice, šolje, kačketi s brendom — visoka marža, ali nepredvidivo." },
  { key: "crowdfunding", name: "Crowdfunding", desc: "Publika finansira proizvod/opremu (Kickstarter); jednokratno." },
  { key: "savjetovanje", name: "Savjetovanje / konsultacije", desc: "1-na-1 ili grupno; visoka cijena po satu, ali nije skalabilno." },
  { key: "digitalni_proizvod", name: "Digitalni proizvodi (PDF, ček-liste)", desc: "Zapakovano znanje; visoka marža, ne zastarijeva." },
  { key: "kursevi", name: "Onlajn kursevi (najbolji model)", desc: "Najbolja i skalabilna zarada; svaki video prodaje mjesecima." },
];

const r2 = (x: number) => Math.round(x * 100) / 100;

export interface EstimateInput {
  subscribers?: number;
  viewsPerVideo?: number;
  price?: number;
  videosPerMonth?: number;
  conversion?: number | null;
}

export function estimate(model: string, input: EstimateInput = {}): Estimate {
  const subs = Math.max(0, input.subscribers ?? 0);
  const views = Math.max(0, input.viewsPerVideo ?? 0);
  const price = Math.max(0, input.price ?? 0);
  const vpm = Math.max(1, input.videosPerMonth ?? 1);
  const conv = input.conversion ?? null;
  const monthlyViews = views * vpm;

  const m = MODELS.find((x) => x.key === model);
  const name = m ? m.name : model;

  let monthly = 0;
  let assumptions: string[] = [];
  let notes = "";

  switch (model) {
    case "pregledi": {
      monthly = (monthlyViews / 1_000_000) * 1000;
      assumptions = [
        `${monthlyViews.toLocaleString("bs")} pregleda mjesečno (${views.toLocaleString("bs")} × ${vpm} videa).`,
        "Prosjek ~1000 € po milionu pregleda (zavisi od teme i Premium gledalaca).",
      ];
      notes = "Najslabiji model — traži ogroman broj pregleda.";
      break;
    }
    case "affiliate": {
      const buyRate = 0.02, avgOrder = 50, commission = 0.04;
      monthly = monthlyViews * buyRate * avgOrder * commission;
      assumptions = [
        `${(buyRate * 100).toFixed(0)}% gledalaca kupi preko linka, prosječna korpa ${avgOrder} €.`,
        `Provizija ~${(commission * 100).toFixed(0)}%.`,
      ];
      notes = "Nestabilno; pada kako video stari i proizvodi zastarijevaju.";
      break;
    }
    case "sponzorstva": {
      monthly = (monthlyViews / 1_000_000) * 2500;
      assumptions = [
        `Sponzorski CPM ~2,5 € po 1000 pregleda (blended) na ${monthlyViews.toLocaleString("bs")} pregleda.`,
        "Mali kanali rijetko dobiju vrijedne sponzore.",
      ];
      notes = "Velike sume tek pri velikim pregledima; nesigurno (ugovor može stati).";
      break;
    }
    case "clanstvo": {
      const rate = 0.01, fee = 5;
      monthly = subs * rate * fee;
      assumptions = [
        `${(rate * 100).toFixed(0)}% od ${subs.toLocaleString("bs")} pretplatnika plaća ~${fee} €/mj.`,
        "Na YouTube članstvu ide ~50% platformi; Patreon/Skool zadržavaju više.",
      ];
      notes = "Predvidiv ponavljajući prihod, ali traži stalan ekskluzivan sadržaj.";
      break;
    }
    case "merch": {
      const rate = 0.008, item = 50, margin = 0.6;
      monthly = subs * rate * item * margin;
      assumptions = [
        `${(rate * 100).toFixed(1)}% pretplatnika mjesečno kupi artikal ~${item} €.`,
        `Marža ~${(margin * 100).toFixed(0)}%.`,
      ];
      notes = "Visoka marža, ali procentualno malo fanova zaista kupi.";
      break;
    }
    case "crowdfunding": {
      monthly = (subs * 1) / 12;
      assumptions = [
        `Godišnja kampanja prikupi ~1 € po pretplatniku (${subs.toLocaleString("bs")}), raspoređeno mjesečno.`,
      ];
      notes = "Jednokratno i rizično — kampanje često ne uspiju.";
      break;
    }
    case "savjetovanje": {
      const bookRate = 0.002;
      monthly = monthlyViews * bookRate * price;
      assumptions = [
        `${(bookRate * 100).toFixed(1)}% gledalaca bukira termin po cijeni ${price.toLocaleString("bs")} €.`,
        "Cijena = unijeta cijena (tretira se kao cijena termina/sata).",
      ];
      notes = "Visoka cijena po satu, ali ograničeno vremenom (nije skalabilno).";
      break;
    }
    case "digitalni_proizvod": {
      const rate = conv ?? 0.03;
      monthly = monthlyViews * rate * price;
      assumptions = [
        `~${(rate * 100).toFixed(1)}% gledalaca kupi digitalni proizvod po ${price.toLocaleString("bs")} €.`,
        "Skoro cijeli iznos ostaje kreatoru; ne zastarijeva.",
      ];
      notes = "Visoka marža i skalabilno; niža cijena po jedinici nego kurs.";
      break;
    }
    case "kursevi": {
      const rate = conv ?? 0.02;
      monthly = monthlyViews * rate * price;
      assumptions = [
        `~${(rate * 100).toFixed(1)}% gledalaca kupi kurs po ${price.toLocaleString("bs")} € (kurs: ~200 prodaja / 10k pregleda).`,
        "Svaki video, bez obzira na starost, donosi prodaje svaki mjesec.",
      ];
      notes = "NAJBOLJI model — najveća i skalabilna zarada.";
      break;
    }
    default: {
      return { key: model, model: name, monthlyEur: 0, yearlyEur: 0, assumptions: [], notes: "nepoznat model" };
    }
  }

  return {
    key: model,
    model: name,
    monthlyEur: r2(monthly),
    yearlyEur: r2(monthly * 12),
    assumptions,
    notes,
  };
}

export function compareAll(subscribers: number, viewsPerVideo: number, price: number, videosPerMonth = 1): Estimate[] {
  return MODELS
    .map((m) => estimate(m.key, { subscribers, viewsPerVideo, price, videosPerMonth }))
    .sort((a, b) => b.monthlyEur - a.monthlyEur);
}
