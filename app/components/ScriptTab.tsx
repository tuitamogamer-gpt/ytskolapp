"use client";

import { useState } from "react";
import { callAi, Spinner, AiError } from "./ui";

type IntroRes = { score: number; open_loops: string[]; issues: string[]; rewrite: string };

export default function ScriptTab(_: { aiAvailable: boolean }) {
  const [topic, setTopic] = useState("");
  const [hooksLoading, setHooksLoading] = useState(false);
  const [hooksErr, setHooksErr] = useState<{ error?: string; needsKey?: boolean }>({});
  const [hooks, setHooks] = useState<string[]>([]);

  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outline, setOutline] = useState("");

  const [intro, setIntro] = useState("");
  const [introLoading, setIntroLoading] = useState(false);
  const [introErr, setIntroErr] = useState<{ error?: string; needsKey?: boolean }>({});
  const [introRes, setIntroRes] = useState<IntroRes | null>(null);

  async function genHooks() {
    if (!topic.trim()) return;
    setHooksLoading(true);
    setHooksErr({});
    setHooks([]);
    const r = await callAi<{ hooks: string[] }>("hooks", { topic, n: 5 });
    setHooksLoading(false);
    if (r.ok && r.data) setHooks(r.data.hooks);
    else setHooksErr({ error: r.error, needsKey: r.needsKey });
  }

  async function genOutline() {
    if (!topic.trim()) return;
    setOutlineLoading(true);
    setOutline("");
    const r = await callAi<{ outline: string }>("outline", { topic });
    setOutlineLoading(false);
    setOutline(r.ok && r.data ? r.data.outline : "⚠️ " + (r.error || ""));
  }

  async function analyzeIntro() {
    if (!intro.trim()) return;
    setIntroLoading(true);
    setIntroErr({});
    setIntroRes(null);
    const r = await callAi<IntroRes>("intro", { text: intro });
    setIntroLoading(false);
    if (r.ok && r.data) setIntroRes(r.data);
    else setIntroErr({ error: r.error, needsKey: r.needsKey });
  }

  return (
    <>
      <div className="panel">
        <h2>Hookovi i outline (AI)</h2>
        <p className="hint">Prvih 15 sekundi odlučuje. Generiši hookove i kostur videa za temu.</p>
        <div className="field">
          <label>Tema videa</label>
          <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="npr. kako napraviti thumbnail" />
        </div>
        <div className="row">
          <button className="btn btn-accent" onClick={genHooks} disabled={hooksLoading || !topic.trim()}>
            {hooksLoading ? <><Spinner /> …</> : "Generiši hookove"}
          </button>
          <button className="btn" onClick={genOutline} disabled={outlineLoading || !topic.trim()}>
            {outlineLoading ? <><Spinner /> …</> : "Napravi outline"}
          </button>
        </div>
        <AiError {...hooksErr} />
        <div className="result">
          {hooks.map((h, i) => (
            <div key={i} className="item">
              <div>{h}</div>
            </div>
          ))}
        </div>
        {outline && <div className="pre" style={{ marginTop: 12 }}>{outline}</div>}
      </div>

      <div className="panel">
        <h2>Analiza uvoda (AI)</h2>
        <p className="hint">Zalijepi prvih 15–30 sekundi skripte — AI ocjenjuje zadržavanje.</p>
        <div className="field">
          <label>Tekst uvoda</label>
          <textarea className="textarea" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Zalijepi uvod…" />
        </div>
        <button className="btn btn-accent" onClick={analyzeIntro} disabled={introLoading || !intro.trim()}>
          {introLoading ? <><Spinner /> Analiziram…</> : "Analiziraj uvod"}
        </button>
        <AiError {...introErr} />
        {introRes && (
          <div className="result">
            <div style={{ fontSize: 22, fontWeight: 800 }}>Zadržavanje: {introRes.score}/100</div>
            {introRes.open_loops?.length > 0 && (
              <>
                <div className="muted" style={{ fontWeight: 700, marginTop: 10 }}>🔁 Otvorene petlje</div>
                {introRes.open_loops.map((x, i) => (<div key={i} className="check ok"><span className="mark">·</span>{x}</div>))}
              </>
            )}
            {introRes.issues?.length > 0 && (
              <>
                <div className="muted" style={{ fontWeight: 700, marginTop: 10 }}>⚠️ Problemi</div>
                {introRes.issues.map((x, i) => (<div key={i} className="check no"><span className="mark">·</span>{x}</div>))}
              </>
            )}
            {introRes.rewrite && (
              <>
                <div className="muted" style={{ fontWeight: 700, marginTop: 10 }}>✍️ Prijedlog</div>
                <div className="pre" style={{ marginTop: 6 }}>{introRes.rewrite}</div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
