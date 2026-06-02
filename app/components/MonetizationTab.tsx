"use client";

import { useState } from "react";
import { compareAll } from "@/lib/monetization";
import type { Estimate } from "@/lib/types";

const eur = (n: number) =>
  n.toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MonetizationTab(_: { aiAvailable: boolean }) {
  const [subs, setSubs] = useState(10000);
  const [views, setViews] = useState(8000);
  const [price, setPrice] = useState(100);
  const [vpm, setVpm] = useState(1);
  const [selected, setSelected] = useState<string>("");

  const rows = compareAll(subs, views, price, vpm);
  const detail: Estimate | undefined = rows.find((r) => r.key === selected) ?? rows[0];

  return (
    <div className="panel">
      <h2>Kalkulator zarade — 9 modela</h2>
      <p className="hint">Čista matematika iz Lekcije 2. Mijenja se uživo, bez ključa. Klikni red za detalje.</p>

      <div className="row">
        <div className="field">
          <label>Pretplatnici</label>
          <input className="input" type="number" value={subs} min={0} onChange={(e) => setSubs(+e.target.value || 0)} />
        </div>
        <div className="field">
          <label>Pregleda po videu</label>
          <input className="input" type="number" value={views} min={0} onChange={(e) => setViews(+e.target.value || 0)} />
        </div>
        <div className="field">
          <label>Cijena proizvoda (€)</label>
          <input className="input" type="number" value={price} min={0} onChange={(e) => setPrice(+e.target.value || 0)} />
        </div>
        <div className="field">
          <label>Videa mjesečno</label>
          <input className="input" type="number" value={vpm} min={1} onChange={(e) => setVpm(+e.target.value || 1)} />
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th className="rank">#</th>
            <th>Model</th>
            <th className="num">Mjesečno €</th>
            <th className="num">Godišnje €</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.key}
              className={i === 0 ? "top" : ""}
              style={{ cursor: "pointer" }}
              onClick={() => setSelected(r.key)}
            >
              <td className="rank">{i + 1}</td>
              <td>{r.model}</td>
              <td className="num">{eur(r.monthlyEur)}</td>
              <td className="num">{eur(r.yearlyEur)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {detail && (
        <div className="result">
          <div className="item">
            <div className="item-title">{detail.model}</div>
            <div style={{ margin: "8px 0", fontSize: 15 }}>
              <b style={{ color: "var(--green)" }}>{eur(detail.monthlyEur)} € / mjesec</b>
              <span className="muted"> · {eur(detail.yearlyEur)} € / godina</span>
            </div>
            <ul className="tips" style={{ marginTop: 4 }}>
              {detail.assumptions.map((a, i) => (
                <li key={i} style={{ paddingLeft: 22 }}>
                  {a}
                </li>
              ))}
            </ul>
            {detail.notes && <p className="muted" style={{ marginTop: 10 }}>ℹ️ {detail.notes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
