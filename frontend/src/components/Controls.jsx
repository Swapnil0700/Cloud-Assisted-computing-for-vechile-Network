import React from 'react';

const FIELDS = [
  { key: 'vehicles', label: 'Vehicles', min: 5, max: 100, step: 1 },
  { key: 'tasksPerVehicle', label: 'Tasks per vehicle', min: 1, max: 20, step: 1 },
  { key: 'rsuCount', label: 'Roadside units (RSUs)', min: 1, max: 12, step: 1 },
  { key: 'v2iRateMbps', label: 'V2I uplink (Mbps)', min: 5, max: 100, step: 1 },
  { key: 'backhaulMbps', label: 'Backhaul to cloud (Mbps)', min: 10, max: 500, step: 10 },
  { key: 'cloudRttMs', label: 'Cloud round-trip (ms)', min: 10, max: 300, step: 5 },
  { key: 'edgeGHz', label: 'Edge server (GHz)', min: 1, max: 20, step: 1 },
  { key: 'wTime', label: 'Smart weight: time', min: 0, max: 1, step: 0.05 },
  { key: 'wEnergy', label: 'Smart weight: energy', min: 0, max: 1, step: 0.05 },
];

export default function Controls({ params, onChange, onRun, loading }) {
  return (
    <div className="card">
      <h3>Simulation parameters</h3>
      {FIELDS.map((f) => (
        <label className="field" key={f.key}>
          <span>
            {f.label}
            <b>{params[f.key]}</b>
          </span>
          <input type="range" min={f.min} max={f.max} step={f.step} value={params[f.key]}
            onChange={(e) => onChange({ ...params, [f.key]: Number(e.target.value) })} />
        </label>
      ))}
      <div className="btn-row">
        <button className="btn primary" onClick={onRun} disabled={loading}>
          {loading ? 'Running…' : 'Run simulation'}
        </button>
        <button className="btn" onClick={() => onChange({ ...params, seed: Math.floor(Math.random() * 1e6) })}>
          New random seed
        </button>
      </div>
    </div>
  );
}
