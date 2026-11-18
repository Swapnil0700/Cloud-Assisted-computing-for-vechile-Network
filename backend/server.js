import express from 'express';
import cors from 'cors';
import { simulate, topology, DEFAULTS, sanitize } from './simulation.js';

const app = express();
const PORT = process.env.PORT || 5000;
const history = []; // in-memory run history (last 10)

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/defaults', (_req, res) => res.json(DEFAULTS));

app.get('/api/topology', (req, res) => {
  const p = sanitize({ vehicles: req.query.vehicles, rsuCount: req.query.rsus });
  res.json(topology(p.vehicles, p.rsuCount));
});

app.post('/api/simulate', (req, res) => {
  const run = simulate(req.body);
  history.unshift({ id: Date.now(), ...run });
  if (history.length > 10) history.pop();
  res.json(run);
});

app.get('/api/history', (_req, res) =>
  res.json(
    history.map((h) => ({
      id: h.id,
      createdAt: h.createdAt,
      vehicles: h.params.vehicles,
      totalTasks: h.totalTasks,
      smartLatencyMs: h.results.find((r) => r.strategy === 'smart').avgLatencyMs,
    }))
  )
);

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
