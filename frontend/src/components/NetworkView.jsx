import React, { useEffect, useRef, useState } from 'react';

const W = 900, H = 340, ROAD_Y = 250;

export default function NetworkView({ topology }) {
  const [vehicles, setVehicles] = useState([]);
  const ref = useRef([]);

  useEffect(() => {
    ref.current = topology.vehicles.map((v) => ({ ...v }));
    let last = performance.now();
    let raf;
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      ref.current.forEach((v) => {
        v.x = (v.x + (v.speed / 3000) * dt) % 1; // loops along the road
      });
      setVehicles(ref.current.map((v) => ({ ...v })));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [topology]);

  const rsus = topology.rsus;
  const nearest = (x) =>
    rsus.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a), rsus[0]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="network-svg" role="img" aria-label="Vehicle network">
      {/* Cloud */}
      <g transform={`translate(${W / 2 - 40}, 12)`}>
        <rect width="80" height="44" rx="8" fill="#2563eb" />
        <text x="40" y="27" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="600">CLOUD</text>
      </g>

      {/* Road */}
      <rect x="0" y={ROAD_Y - 10} width={W} height="70" fill="#e2e8f0" />
      <line x1="0" x2={W} y1={ROAD_Y + 25} y2={ROAD_Y + 25} stroke="#fff" strokeWidth="2" strokeDasharray="14 10" />

      {/* RSUs + backhaul */}
      {rsus.map((r) => {
        const x = r.x * W;
        return (
          <g key={r.id}>
            <line x1={W / 2} y1="56" x2={x} y2="130" stroke="#94a3b8" strokeWidth="2" />
            <rect x={x - 28} y="130" width="56" height="34" rx="6" fill="#0f766e" />
            <text x={x} y="152" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">RSU {r.id + 1}</text>
            <line x1={x} y1="164" x2={x} y2={ROAD_Y - 10} stroke="#cbd5e1" strokeWidth="2" />
          </g>
        );
      })}

      {/* V2I links */}
      {vehicles.map((v) => {
        const r = nearest(v.x);
        return (
          <line key={`l${v.id}`} x1={v.x * W} y1={ROAD_Y + (v.lane ? 38 : 8)} x2={r.x * W} y2="164"
            stroke="#2563eb" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="4 4" />
        );
      })}

      {/* Vehicles */}
      {vehicles.map((v) => (
        <rect key={v.id} x={v.x * W - 9} y={ROAD_Y + (v.lane ? 31 : 1)} width="18" height="12" rx="3"
          fill={v.lane ? '#f59e0b' : '#1e293b'} />
      ))}
    </svg>
  );
}
