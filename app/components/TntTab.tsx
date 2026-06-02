"use client";

import { useState } from "react";
import { headlineChecklist } from "@/lib/tnt";
import { callAi, Spinner, AiError } from "./ui";

type Audit = { score: number; good: string[]; fix: string[] };

export default function TntTab(_: { aiAvailable: boolean }) {
  const [headline, setHeadline] = useState("Početničke greške");
  const [topic, setTopic] = useState("");
  const [desc, setDesc] = useState("");

  const [genLoading, setGenLoading] = useState(false);
  const [genErr, setGenErr] = useState<{ error?: string; needsKey?: boolean }>({});
  const [headlines, setHeadlines] = useState<string[]>([]);

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditErr, setAuditErr] = useState<{ error?: string; needsKey?: boolean }>({});
  const [audit, setAudit] = useState<Audit | null>(null);

  const c = headlineChecklist(headline);

  async function gen() {
    if (!topic.trim()) return;
    setGenLoading(true);
    setGenErr({});
    setHeadlines([]);
    const r = await callAi<{ headlines: string[] }>("tntHeadlines", { topic, n: 8 });
    setGenLoading(false);
    if (r.ok && r.data) setHeadlines(r.data.headlines);
    else setGenErr({ error: r.error, needsKey: r.needsKey });
  }

  async function runAudit() {
    if (!desc.trim()) return;
    setAuditLoading(true);
    setAuditErr({});
    setAudit(null);
    const r = await callAi<Audit>("thumbnailAudit", { description: desc });
    setAuditLoading(false);
    if (r.ok && r.data) setAudit(r.data);
    else setAuditErr({ error: r.error, needsKey: r.needsKey });
  }

  return (
    <>
      <div className="panel">
        <h2>TNT headline checklist</h2>
        <p className="hint">Tekst na thumbnailu: ≤4 riječi, konkretan, otvara radoznalost. Provjera radi uživo.</p>
        <div className="field">
          <label>Headline (tekst na thumbnailu)</label>
          <input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="npr. Početničke greške" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0 10px" }}>
          <span className="score-big" style={{ color: c.score >= 80 ? "var(--green)" : c.score >= 50 ? "var(--amber)" : "var(--accent)" }}>
            {c.score}
          </span>
          <span className="muted">/ 100</span>
        </div>
        {c.checks.map((ch, i) => (
          <div key={i} className={`check ${ch.ok ? "ok" : "no"}`}>
            <span className="mark">{ch.ok ? "✅" : "⬜"}</span> {ch.label}
          </div>
        ))}
        <ul className="tips">
          {c.tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="grid2">
        <div className="panel">
          <h2>Generiši headline (AI)</h2>
          <p className="hint">Kratki headline-i (≤4 riječi) za temu. Klikni da provjeriš gore.</p>
          <div className="field">
            <label>Tema</label>
            <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="npr. bolovi u leđima 40+" onKeyDown={(e) => e.key === "Enter" && gen()} />
          </div>
          <button className="btn btn-accent" onClick={gen} disabled={genLoading || !topic.trim()}>
            {genLoading ? <><Spinner /> Generišem…</> : "Generiši headline"}
          </button>
          <AiError {...genErr} />
          <div className="result">
            {headlines.map((h, i) => (
              <div key={i} className="item click" onClick={() => setHeadline(h)} title="Klikni za provjeru">
                <div className="item-title">{h}</div>
                <div className="item-meta">{headlineChecklist(h).score}/100 — klikni za checklist</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Provjeri thumbnail (AI)</h2>
          <p className="hint">Opiši planirani thumbnail — AI ga ocijeni po pravilima kursa.</p>
          <div className="field">
            <label>Opis thumbnaila</label>
            <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="npr. crna pozadina, veliki bijeli tekst 'OVE 3 greške', moje lice iznenađeno desno…" />
          </div>
          <button className="btn btn-accent" onClick={runAudit} disabled={auditLoading || !desc.trim()}>
            {auditLoading ? <><Spinner /> Analiziram…</> : "Provjeri thumbnail"}
          </button>
          <AiError {...auditErr} />
          {audit && (
            <div className="result">
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Ocjena: {audit.score}/100</div>
              {audit.good?.length > 0 && (
                <>
                  <div className="muted" style={{ fontWeight: 700, marginTop: 8 }}>✅ Dobro</div>
                  {audit.good.map((g, i) => <div key={i} className="check ok"><span className="mark">·</span>{g}</div>)}
                </>
              )}
              {audit.fix?.length > 0 && (
                <>
                  <div className="muted" style={{ fontWeight: 700, marginTop: 10 }}>🔧 Popravi</div>
                  {audit.fix.map((f, i) => <div key={i} className="check no"><span className="mark">·</span>{f}</div>)}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
