async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export const getDefaults = () => request('/api/defaults');
export const getTopology = (vehicles, rsus) => request(`/api/topology?vehicles=${vehicles}&rsus=${rsus}`);
export const runSimulation = (params) =>
  request('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
export const getHistory = () => request('/api/history');
