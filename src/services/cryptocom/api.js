const BASE = '/api/cryptocom';

export async function connect(authAxios, apiKey, apiSecret) {
  const { data } = await authAxios.post(`${BASE}/connect`, { apiKey, apiSecret });
  return data;
}

export async function disconnect(authAxios) {
  const { data } = await authAxios.delete(`${BASE}/disconnect`);
  return data;
}

export async function getStatus(authAxios) {
  const { data } = await authAxios.get(`${BASE}/status`);
  return data;
}

export async function getBalances(authAxios) {
  const { data } = await authAxios.get(`${BASE}/balances`);
  return data.balances || [];
}

export async function getHistory(authAxios) {
  const { data } = await authAxios.get(`${BASE}/history`);
  return data.trades || [];
}

export async function getPrices(authAxios) {
  const { data } = await authAxios.get(`${BASE}/prices`);
  return data.prices || [];
}
