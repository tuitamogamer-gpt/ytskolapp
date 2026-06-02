"use client";

import { useState } from "react";
import { search, allLessons } from "@/lib/knowledge";
import type { SearchHit } from "@/lib/types";
import { callAi, Spinner, AiError } from "./ui";

export default function KnowledgeTab(_: { aiAvailable: boolean }) {
  const lessons = allLessons();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<{ error?: string; needsKey?: boolean }>({});
  const [answer, setAnswer] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  function doSearch(val: string) {
    setQ(val);
    setHits(val.trim().length >= 3 ? search(val, 5) : []);
  }

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setErr({});
    setAnswer("");
    const r = await callAi<{ answer: string }>("ask", { question });
    setLoading(false);
    if (r.ok && r.data) setAnswer(r.data.answer);
    else setErr({ error: r.error, needsKey: r.needsKey });
  }

  return (
    <>
      <div className="panel">
        <h2>Pretraga baze znanja</h2>
        <p className="hint">Pretraži 12 lekcija kursa (radi lokalno, bez ključa).</p>
        <input className="input" value={q} onChange={(e) => doSearch(e.target.value)} placeholder="npr. curiosity gap, AVPV, monetizacija…" />
        <div className="result">
          {hits.map((h, i) => (
            <div key={i} className="item">
              <div className="item-title">Lekcija {h.n}: {h.title}</div>
              <div style={{ marginTop: 6, fontSize: 14 }} className="muted">…{h.snippet}…</div>
            </div>
          ))}
          {q.trim().length >= 3 && hits.length === 0 && <p className="muted">Nema rezultata.</p>}
        </div>
      </div>

      <div className="panel">
        <h2>Pitaj (AI Q&amp;A)</h2>
        <p className="hint">Odgovor isključivo na osnovu gradiva kursa (RAG nad 12 lekcija).</p>
        <div className="row">
          <div className="field">
            <label>Pitanje</label>
            <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="npr. Koji je najbolji model zarade?" onKeyDown={(e) => e.key === "Enter" && ask()} />
          </div>
          <button className="btn btn-accent" onClick={ask} disabled={loading || !question.trim()}>
            {loading ? <><Spinner /> …</> : "Pitaj"}
          </button>
        </div>
        <AiError {...err} />
        {answer && <div className="pre" style={{ marginTop: 12 }}>{answer}</div>}
      </div>

      <div className="panel">
        <h2>12 lekcija</h2>
        <p className="hint">Klikni lekciju za sažetak i ključne savjete.</p>
        {lessons.map((l) => (
          <div key={l.n} className="item click" onClick={() => setOpen(open === l.n ? null : l.n)}>
            <div className="item-title">Lekcija {l.n}: {l.title}</div>
            <div className="item-meta">
              {l.topic}
              {l.frameworks?.length ? ` · ${l.frameworks.join(", ")}` : ""}
            </div>
            {open === l.n && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 14 }}>{l.summary}</p>
                <ul className="tips">{l.key_points?.map((k, i) => <li key={i}>{k}</li>)}</ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
