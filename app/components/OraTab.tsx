"use client";

import { useState } from "react";
import { scoreTitle } from "@/lib/ora";
import { Bar, callAi, Spinner, AiError, gradeColor } from "./ui";

export default function OraTab({ aiAvailable }: { aiAvailable: boolean }) {
  const [title, setTitle] = useState("Izbjegavaj OVE 3 greške (prof. gitarista)");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<{ error?: string; needsKey?: boolean }>({});
  const [titles, setTitles] = useState<string[]>([]);

  const s = scoreTitle(title);

  async function gen() {
    if (!topic.trim()) return;
    setLoading(true);
    setErr({});
    setTitles([]);
    const r = await callAi<{ titles: string[] }>("titles", { topic, n: 7 });
    setLoading(false);
    if (r.ok && r.data) setTitles(r.data.titles);
    else setErr({ error: r.error, needsKey: r.needsKey });
  }

  return (
    <>
      <div className="panel">
        <h2>ORA bodovanje naslova</h2>
        <p className="hint">Obećanje · Radoznalost · Autoritet — bodovanje radi uživo, bez ključa.</p>
        <div className="field">
          <label>Tvoj naslov</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Upiši naslov videa…"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "10px 0 14px" }}>
          <span className="score-big" style={{ color: gradeColor(s.total) }}>{s.total}</span>
          <div>
            <span className="score-grade" style={{ color: gradeColor(s.total) }}>{s.grade}</span>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {s.length} znakova {s.lengthOk ? "✓ ≤50 (mobilni)" : "— skrati na ≤50"}
            </div>
          </div>
        </div>
        <Bar label="Obećanje" value={s.obecanje} />
        <Bar label="Radoznalost" value={s.radoznalost} />
        <Bar label="Autoritet" value={s.autoritet} />
        <Bar label="UKUPNO" value={s.total} color={gradeColor(s.total)} />
        <ul className="tips">
          {s.tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h2>Generiši naslove (AI)</h2>
        <p className="hint">Unesi temu — AI predlaže ORA naslove. Klikni naslov da ga ubaciš u bodovanje gore.</p>
        <div className="row">
          <div className="field">
            <label>Tema videa</label>
            <input
              className="input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="npr. kurs gitare za početnike"
              onKeyDown={(e) => e.key === "Enter" && gen()}
            />
          </div>
          <button className="btn btn-accent" onClick={gen} disabled={loading || !topic.trim()}>
            {loading ? (
              <>
                <Spinner /> Generišem…
              </>
            ) : (
              "Generiši naslove"
            )}
          </button>
        </div>
        <AiError {...err} />
        <div className="result">
          {titles.map((t, i) => {
            const sc = scoreTitle(t);
            return (
              <div key={i} className="item click" onClick={() => setTitle(t)} title="Klikni za analizu">
                <div className="item-title">{t}</div>
                <div className="item-meta">
                  ORA {sc.total}/100 · {sc.grade} · {t.length} znakova — klikni za analizu
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
