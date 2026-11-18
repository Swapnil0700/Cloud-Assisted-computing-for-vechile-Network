// Task-offloading simulation: Local vs Edge (RSU) vs Cloud vs Smart (hybrid)

export const DEFAULTS = {
  vehicles: 20,
  tasksPerVehicle: 5,
  rsuCount: 4,
  windowMs: 8000,      // time window in which tasks arrive
  v2iRateMbps: 20,     // vehicle -> RSU wireless rate
  backhaulMbps: 100,   // RSU -> cloud link
  cloudRttMs: 60,      // round-trip latency to cloud
  vehicleGHz: 1,
  edgeGHz: 5,          // each RSU edge server
  cloudGHz: 30,
  wTime: 0.6,          // smart strategy weights
  wEnergy: 0.4,
  seed: 42,
};

const LIMITS = {
  vehicles: [1, 100], tasksPerVehicle: [1, 20], rsuCount: [1, 12],
  windowMs: [1000, 60000], v2iRateMbps: [1, 200], backhaulMbps: [5, 1000],
  cloudRttMs: [5, 500], vehicleGHz: [0.5, 3], edgeGHz: [1, 20],
  cloudGHz: [5, 100], wTime: [0, 1], wEnergy: [0, 1], seed: [0, 1e9],
};

export function sanitize(input = {}) {
  const p = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    const v = Number(input[key]);
    if (input[key] !== undefined && Number.isFinite(v)) {
      const [lo, hi] = LIMITS[key];
      p[key] = Math.min(hi, Math.max(lo, v));
    }
  }
  p.vehicles = Math.round(p.vehicles);
  p.tasksPerVehicle = Math.round(p.tasksPerVehicle);
  p.rsuCount = Math.round(p.rsuCount);
  return p;
}

// Small deterministic PRNG (mulberry32) so runs are reproducible
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateTasks(p) {
  const r = rng(p.seed);
  const speeds = Array.from({ length: p.vehicles }, () => 30 + r() * 80); // km/h
  const tasks = [];
  let id = 0;
  for (let v = 0; v < p.vehicles; v++) {
    for (let k = 0; k < p.tasksPerVehicle; k++) {
      tasks.push({
        id: id++,
        vehicle: v,
        rsu: v % p.rsuCount,
        speed: speeds[v],
        arrival: r() * p.windowMs,
        sizeMb: 0.2 + r() * 1.8,        // megabytes of input data
        mcycles: 500 + r() * 2500,      // computation demand
        deadlineMs: 1500 + r() * 2500,
      });
    }
  }
  return tasks.sort((a, b) => a.arrival - b.arrival);
}

function evaluate(t, state, p) {
  // Faster vehicles and crowded cells get a lower effective uplink rate
  const rate = (p.v2iRateMbps * (1.2 - t.speed / 200)) / (1 + (0.03 * p.vehicles) / p.rsuCount);
  const txMs = ((t.sizeMb * 8) / rate) * 1000;
  const txEnergy = 1.3 * (txMs / 1000); // 1.3 W radio

  const localMs = t.mcycles / p.vehicleGHz;
  const local = {
    latency: localMs,
    energy: 0.9 * (t.mcycles / 1000) * p.vehicleGHz ** 2,
  };

  const edgeStart = Math.max(t.arrival + txMs, state.rsuBusy[t.rsu]);
  const edgeFinish = edgeStart + t.mcycles / p.edgeGHz;
  const edge = { latency: edgeFinish - t.arrival, energy: txEnergy, finish: edgeFinish };

  const backhaulMs = ((t.sizeMb * 8) / p.backhaulMbps) * 1000;
  const cloud = {
    latency: txMs + backhaulMs + p.cloudRttMs + t.mcycles / p.cloudGHz,
    energy: txEnergy,
  };
  return { local, edge, cloud };
}

function percentile(arr, q) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? 0;
}

export function runStrategy(name, tasks, p) {
  const state = { rsuBusy: Array(p.rsuCount).fill(0) };
  const lat = [];
  const eng = [];
  const share = { local: 0, edge: 0, cloud: 0 };
  const buckets = Array.from({ length: 20 }, () => ({ sum: 0, n: 0 }));
  let missed = 0;

  for (const t of tasks) {
    const o = evaluate(t, state, p);
    let pick = name;
    if (name === 'smart') {
      const cost = (k) =>
        (p.wTime * o[k].latency) / t.deadlineMs +
        (p.wEnergy * o[k].energy) / o.local.energy +
        (o[k].latency > t.deadlineMs ? 1 : 0);
      pick = ['local', 'edge', 'cloud'].reduce((a, b) => (cost(b) < cost(a) ? b : a));
    }
    const c = o[pick];
    if (pick === 'edge') state.rsuBusy[t.rsu] = c.finish;
    lat.push(c.latency);
    eng.push(c.energy);
    share[pick]++;
    if (c.latency > t.deadlineMs) missed++;
    const b = Math.min(19, Math.floor((t.arrival / p.windowMs) * 20));
    buckets[b].sum += c.latency;
    buckets[b].n++;
  }

  const n = tasks.length;
  const avg = (a) => a.reduce((x, y) => x + y, 0) / n;
  let last = 0;
  return {
    strategy: name,
    avgLatencyMs: avg(lat),
    p95LatencyMs: percentile(lat, 0.95),
    avgEnergyJ: avg(eng),
    deadlineMissPct: (missed / n) * 100,
    share: {
      local: (share.local / n) * 100,
      edge: (share.edge / n) * 100,
      cloud: (share.cloud / n) * 100,
    },
    timeline: buckets.map((b) => {
      if (b.n) last = b.sum / b.n;
      return Math.round(last);
    }),
  };
}

export function simulate(params) {
  const p = sanitize(params);
  const tasks = generateTasks(p);
  const results = ['local', 'edge', 'cloud', 'smart'].map((s) => runStrategy(s, tasks, p));
  return { params: p, totalTasks: tasks.length, results, createdAt: new Date().toISOString() };
}

export function topology(vehicles = 20, rsus = 4) {
  const r = rng(7);
  return {
    rsus: Array.from({ length: rsus }, (_, i) => ({ id: i, x: (i + 0.5) / rsus })),
    vehicles: Array.from({ length: vehicles }, (_, i) => ({
      id: i,
      x: r(),
      lane: i % 2,
      speed: 30 + r() * 80,
    })),
  };
}
