import React, { useEffect, useState } from 'react';
import NetworkView from './components/NetworkView.jsx';
import Controls from './components/Controls.jsx';
import Results from './components/Results.jsx';
import { getDefaults, getTopology, runSimulation, getHistory } from './api.js';

export default function App() {
  const [params, setParams] = useState(null);
  const [topology, setTopology] = useState(null);
  const [run, setRun] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDefaults().then(setParams).catch(() => setError('Cannot reach the backend. Start it with: npm run dev'));
  }, []);

  useEffect(() => {
    if (!params) return;
    const t = setTimeout(() => {
      getTopology(params.vehicles, params.rsuCount).then(setTopology).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [params?.vehicles, params?.rsuCount]);

  const run_ = async () => {
    setLoading(true);
    setError('');
    try {
      setRun(await runSimulation(params));
      setHistory(await getHistory());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (params && !run) run_(); }, [params]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><span className="logo">V</span> VehicleCloud</div>
        <nav><span className="active">Simulator</span></nav>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Cloud Assisted Computing for Vehicle Network</h1>
          <p>
            Compare how vehicles process computation-heavy tasks: locally, offloaded to roadside edge servers,
            to the remote cloud, or with a smart hybrid decision that balances latency and energy.
          </p>
        </section>

        {error && <div className="alert">{error}</div>}

        <div className="layout">
          <aside>
            {params && <Controls params={params} onChange={setParams} onRun={run_} loading={loading} />}
            {history.length > 0 && (
              <div className="card">
                <h3>Recent runs</h3>
                <ul className="history">
                  {history.map((h) => (
                    <li key={h.id}>
                      <span>{new Date(h.createdAt).toLocaleTimeString()} · {h.vehicles} vehicles</span>
                      <b>{h.smartLatencyMs.toFixed(0)} ms</b>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <section className="content">
            <div className="card">
              <h3>Live network topology</h3>
              {topology ? <NetworkView topology={topology} /> : <p className="muted">Loading…</p>}
            </div>
            {run && <Results run={run} />}
          </section>
        </div>
      </main>

      <footer className="footer">Cloud Assisted Computing for Vehicle Network · React + Node.js</footer>
    </div>
  );
}
