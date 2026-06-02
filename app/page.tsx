"use client";

import { useEffect, useState } from "react";
import OraTab from "./components/OraTab";
import TntTab from "./components/TntTab";
import NicheTab from "./components/NicheTab";
import MonetizationTab from "./components/MonetizationTab";
import ScriptTab from "./components/ScriptTab";
import PlanTab from "./components/PlanTab";
import KnowledgeTab from "./components/KnowledgeTab";
import { Notice } from "./components/ui";

type TabProps = { aiAvailable: boolean };

const TABS: { id: string; label: string; C: (p: TabProps) => JSX.Element }[] = [
  { id: "ora", label: "Naslovi (ORA)", C: OraTab },
  { id: "tnt", label: "Thumbnail (TNT)", C: TntTab },
  { id: "niche", label: "Niša (4F)", C: NicheTab },
  { id: "money", label: "Monetizacija", C: MonetizationTab },
  { id: "script", label: "Skripta", C: ScriptTab },
  { id: "plan", label: "Plan & Kalendar", C: PlanTab },
  { id: "kb", label: "Baza znanja", C: KnowledgeTab },
];

export default function Page() {
  const [active, setActive] = useState("ora");
  const [ai, setAi] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setAi(!!d.aiAvailable))
      .catch(() => setAi(false));
  }, []);

  const Active = TABS.find((t) => t.id === active)?.C ?? OraTab;

  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <h1>🎬 YouTube Škola Studio</h1>
          <span className="sub">alat za rast kanala</span>
        </div>
        {ai === null ? (
          <span className="badge">…</span>
        ) : ai ? (
          <span className="badge badge-on">
            <span className="dot" /> AI spreman
          </span>
        ) : (
          <span className="badge badge-off">
            <span className="dot" /> AI nedostupan — čiste funkcije rade
          </span>
        )}
      </div>

      {ai === false && (
        <Notice kind="info">
          AI funkcije (generisanje naslova, validacija niše, plan, Q&amp;A) traže <b>ANTHROPIC_API_KEY</b> na
          Vercel-u. Sve ostalo — ORA bodovanje, TNT checklist, kalkulator zarade, izvoz u kalendar i pretraga
          baze znanja — radi i bez ključa.
        </Notice>
      )}

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${active === t.id ? "active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <Active aiAvailable={!!ai} />

      <div className="footer">
        Sva logika potiče iz 12 lekcija YouTube Škole · ORA bodovanje, kalkulator i .ics izvoz rade lokalno u browseru.
      </div>
    </div>
  );
}
