import React from 'react';

export const META = {
  local: { label: 'Local only', color: '#64748b' },
  edge: { label: 'Edge (RSU)', color: '#0f766e' },
  cloud: { label: 'Cloud', color: '#d97706' },
  smart: { label: 'Smart hybrid', color: '#2563eb' },
};

export function Kpis({ run }) {
  const get = (s) => run.results.find((r) => r.strategy === s);
  const smart = get('smart'), local = get('local');
  const gain = ((local.avgLatencyMs - smart.avgLatencyMs) / local.avgLatencyMs) * 100;
  const items = [
    { label: 'Total tasks', value: run.totalTasks },
    { label: 'Smart avg latency', value: `${smart.avgLatencyMs.toFixed(0)} ms` },
    { label: 'Latency vs local', value: `${gain.toFixed(0)}% faster` },
    { label: 'Deadline misses (smart)', value: `${smart.deadlineMissPct.toFixed(1)}%` },
  ];
  return (
    <div className="kpis">
      {items.map((k) => (
        <div className="kpi" key={k.label}>
          <span>{k.label}</span>
          <b>{k.value}</b>
        </div>
      ))}
    </div>
  );
}

function Bars({ title, run, field, unit, digits = 0 }) {
  const max = Math.max(...run.results.map((r) => r[field])) || 1;
  return (
    <div className="card">
      <h3>{title}</h3>
      {run.results.map((r) => (
        <div className="bar-row" key={r.strategy}>
          <span className="bar-label">{META[r.strategy].label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(r[field] / max) * 100}%`, background: META[r.strategy].color }} />
          </div>
          <span className="bar-val">{r[field].toFixed(digits)} {unit}</span>
        </div>
      ))}
    </div>
  );
}

function Share({ run }) {
  return (
    <div className="card">
      <h3>Where tasks are executed</h3>
      {run.results.map((r) => (
        <div className="bar-row" key={r.strategy}>
          <span className="bar-label">{META[r.strategy].label}</span>
          <div className="bar-track stack">
            {['local', 'edge', 'cloud'].map((k) => (
              <div key={k} style={{ width: `${r.share[k]}%`, background: META[k].color }} title={`${META[k].label}: ${r.share[k].toFixed(0)}%`} />
            ))}
          </div>
        </div>
      ))}
      <div className="legend">
        {['local', 'edge', 'cloud'].map((k) => (
          <span key={k}><i style={{ background: META[k].color }} />{META[k].label}</span>
        ))}
      </div>
    </div>
  );
}

function Timeline({ run }) {
  const w = 520, h = 180, pad = 28;
  const max = Math.max(...run.results.flatMap((r) => r.timeline)) || 1;
  const pt = (v, i, n) => `${pad + (i / (n - 1)) * (w - pad * 2)},${h - pad - (v / max) * (h - pad * 2)}`;
  return (
    <div className="card">
      <h3>Average latency over time (ms)</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="chart">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad} x2={w - pad} y1={h - pad - f * (h - pad * 2)} y2={h - pad - f * (h - pad * 2)} stroke="#e2e8f0" />
            <text x="2" y={h - pad - f * (h - pad * 2) + 4} fontSize="10" fill="#64748b">{Math.round(max * f)}</text>
          </g>
        ))}
        {run.results.map((r) => (
          <polyline key={r.strategy} fill="none" stroke={META[r.strategy].color}
            strokeWidth={r.strategy === 'smart' ? 3 : 2}
            points={r.timeline.map((v, i) => pt(v, i, r.timeline.length)).join(' ')} />
        ))}
      </svg>
      <div className="legend">
        {run.results.map((r) => (
          <span key={r.strategy}><i style={{ background: META[r.strategy].color }} />{META[r.strategy].label}</span>
        ))}
      </div>
    </div>
  );
}

function Table({ run }) {
  return (
    <div className="card">
      <h3>Summary</h3>
      <table>
        <thead>
          <tr><th>Strategy</th><th>Avg latency</th><th>P95 latency</th><th>Energy / task</th><th>Deadline misses</th></tr>
        </thead>
        <tbody>
          {run.results.map((r) => (
            <tr key={r.strategy}>
              <td><i className="dot" style={{ background: META[r.strategy].color }} />{META[r.strategy].label}</td>
              <td>{r.avgLatencyMs.toFixed(0)} ms</td>
              <td>{r.p95LatencyMs.toFixed(0)} ms</td>
              <td>{r.avgEnergyJ.toFixed(2)} J</td>
              <td>{r.deadlineMissPct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Results({ run }) {
  return (
    <>
      <Kpis run={run} />
      <div className="grid-2">
        <Bars title="Average latency" run={run} field="avgLatencyMs" unit="ms" />
        <Bars title="Energy per task (vehicle)" run={run} field="avgEnergyJ" unit="J" digits={2} />
        <Bars title="Deadline miss rate" run={run} field="deadlineMissPct" unit="%" digits={1} />
        <Share run={run} />
      </div>
      <Timeline run={run} />
      <Table run={run} />
    </>
  );
}
