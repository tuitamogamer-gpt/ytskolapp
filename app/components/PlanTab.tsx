"use client";

import { useState } from "react";
import { toIcs, toCsv, todayIso } from "@/lib/planner";
import type { PlanItem } from "@/lib/types";
import { callAi, Spinner, AiError } from "./ui";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PlanTab(_: { aiAvailable: boolean }) {
  const [niche, setNiche] = useState("");
  const [weeks, setWeeks] = useState(8);
  const [perWeek, setPerWeek] = useState(1);
  const [start, setStart] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<{ error?: string; needsKey?: boolean }>({});
  const [plan, setPlan] = useState<PlanItem[]>([]);

  async function gen() {
    if (!niche.trim()) return;
    setLoading(true);
    setErr({});
    setPlan([]);
    const r = await callAi<{ plan: PlanItem[] }>("plan", { niche, weeks, perWeek, start });
    setLoading(false);
    if (r.ok && r.data) setPlan(r.data.plan);
    else setErr({ error: r.error, needsKey: r.needsKey });
  }

  return (
    <div className="panel">
      <h2>Content plan &amp; kalendar</h2>
      <p className="hint">AI smišlja ideje (naslov, hook, headline, cilj); datumi se računaju lokalno. Izvezi u kalendar.</p>
      <div className="row">
        <div className="field" style={{ flex: 2 }}>
          <label>Niša</label>
          <input className="input" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="npr. bolovi u leđima za muškarce 40+" />
        </div>
        <div className="field">
          <label>Sedmica</label>
          <input className="input" type="number" min={1} value={weeks} onChange={(e) => setWeeks(+e.target.value || 1)} />
        </div>
        <div className="field">
          <label>Videa/sedmici</label>
          <input className="input" type="number" min={1} value={perWeek} onChange={(e) => setPerWeek(+e.target.value || 1)} />
        </div>
        <div className="field">
          <label>Početak</label>
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-accent" onClick={gen} disabled={loading || !niche.trim()}>
        {loading ? <><Spinner /> Generišem plan…</> : "Generiši plan"}
      </button>
      <AiError {...err} />

      {plan.length > 0 && (
        <div className="result">
          <div className="row" style={{ marginBottom: 12 }}>
            <button className="btn" onClick={() => download("yt-plan.ics", toIcs(plan), "text/calendar")}>📅 Izvezi .ics</button>
            <button className="btn" onClick={() => download("yt-plan.csv", toCsv(plan), "text/csv")}>📄 Izvezi .csv</button>
          </div>
          {plan.map((p, i) => (
            <div key={i} className="item">
              <div className="item-meta">📅 {p.date}</div>
              <div className="item-title">{p.title}</div>
              {p.hook && <div style={{ marginTop: 6, fontSize: 14 }}><span className="muted">Hook:</span> {p.hook}</div>}
              {p.thumbnailHeadline && <div style={{ fontSize: 14 }}><span className="muted">Thumbnail:</span> {p.thumbnailHeadline}</div>}
              {p.goal && <div style={{ fontSize: 14 }}><span className="muted">Cilj:</span> {p.goal}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
