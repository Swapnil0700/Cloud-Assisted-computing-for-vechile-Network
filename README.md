# Cloud Assisted Computing for Vehicle Network

Full-stack web app (React + Node/Express) that simulates computation offloading in a vehicular network.
Vehicles can run tasks **locally**, offload to **roadside edge servers (RSUs)**, offload to the **cloud**,
or use a **smart hybrid** policy that balances latency, energy and deadlines.

## Run
```bash
npm run install:all   # installs root, backend and frontend dependencies
npm run dev           # API on :5000, web app on :5173
```
Open http://localhost:5173

## Structure
- `backend/simulation.js` – latency/energy models, RSU queueing, strategies
- `backend/server.js` – REST API (`/api/simulate`, `/api/topology`, `/api/history`, `/api/defaults`)
- `frontend/src` – React UI (controls, live topology, charts, summary table)

## Model summary
- Local: `t = Mcycles / GHz`, energy `0.9 · Gcycles · f²`
- Edge: uplink time + RSU queue wait + `Mcycles / edgeGHz`
- Cloud: uplink + backhaul + cloud RTT + `Mcycles / cloudGHz`
- Smart: per task picks the lowest `wTime·latency/deadline + wEnergy·energy/localEnergy` (+ penalty on missed deadline)
