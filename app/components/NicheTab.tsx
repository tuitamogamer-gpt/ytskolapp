"use client";

import { useState } from "react";
import { frameworks } from "@/lib/knowledge";
import { Bar, callAi, Spinner, AiError } from "./ui";

type NicheResult = {
  scores: { fokus_teme: number; vrijednost: number; jedan_problem: number; monetizacija: number };
  verdict: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
  monetization_idea: string;
};

export default function NicheTab(_: { aiAvailable: boolean }) {
  const fw = frameworks()["4F"];
  const [niche, setNiche] = useState("");
  const [problem, setProblem] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<{ error?: string; needsKey?: boolean }>({});
  const [res, setRes] = useState<NicheResult | null>(null);

  async function run() {
    if (!niche.trim()) return;
    setLoading(true);
    setErr({});
    setRes(null);
    const r = await callAi<NicheResult>("niche", { niche, problem, audience });
    setLoading(false);
    if (r.ok && r.data) setRes(r.data);
    else setErr({ error: r.error, needsKey: r.needsKey });
  }

  const sc = res?.scores;
  const pct = (n: number) => Math.round((Math.max(0, Math.min(10, n)) / 10) * 100);

  return (
    <>
      <div className="panel">
        <h2>4F validacija niše</h2>
        <p className="hint">{fw?.summary}</p>
        <div className="chips">
          {fw?.elements?.map((e, i) => (
            <div key={i} className="chip">
              <b>{e.key}</b>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <div className="field" style={{ flex: 2 }}>
            <label>Niša / tema kanala</label>
            <input className="input" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="npr. fitness za muškarce 40+" onKeyDown={(e) => e.key === "Enter" && run()} />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label>Problem / bol (opciono)</label>
            <input className="input" value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="npr. bolovi u leđima" />
          </div>
          <div className="field">
            <label>Publika (opciono)</label>
            <input className="input" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="npr. muškarci 40–55" />
          </div>
        </div>
        <button className="btn btn-accent" onClick={run} disabled={loading || !niche.trim()}>
          {loading ? <><Spinner /> Procjenjujem…</> : "Provjeri nišu"}
        </button>
        <AiError {...err} />
      </div>

      {res && sc && (
        <div className="panel">
          <h2>Rezultat</h2>
          <Bar label="Fokus teme" value={pct(sc.fokus_teme)} />
          <Bar label="Vrijednost" value={pct(sc.vrijednost)} />
          <Bar label="Jedan problem" value={pct(sc.jedan_problem)} />
          <Bar label="Monetizacija" value={pct(sc.monetizacija)} />
          <p style={{ marginTop: 14, fontSize: 15 }}>
            <b>Procjena:</b> {res.verdict}
          </p>
          {res.strengths?.length > 0 && (
            <>
              <div className="muted" style={{ fontWeight: 700, marginTop: 10 }}>✅ Prednosti</div>
              {res.strengths.map((x, i) => (<div key={i} className="check ok"><span className="mark">·</span>{x}</div>))}
            </>
          )}
          {res.risks?.length > 0 && (
            <>
              <div className="muted" style={{ fontWeight: 700, marginTop: 10 }}>⚠️ Rizici</div>
              {res.risks.map((x, i) => (<div key={i} className="check no"><span className="mark">·</span>{x}</div>))}
            </>
          )}
          {res.recommendations?.length > 0 && (
            <ul className="tips">{res.recommendations.map((x, i) => <li key={i}>{x}</li>)}</ul>
          )}
          {res.monetization_idea && (
            <div className="item" style={{ marginTop: 12 }}>
              <div className="item-title">💰 Ideja za proizvod</div>
              <div style={{ marginTop: 6 }}>{res.monetization_idea}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
