const BASE = '/api/binance';

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

export async function getEarn(authAxios) {
  const { data } = await authAxios.get(`${BASE}/earn`);
  return data;
}

export async function getDividends(authAxios) {
  const { data } = await authAxios.get(`${BASE}/dividends`);
  return data;
}

export async function getPrices(authAxios) {
  const { data } = await authAxios.get(`${BASE}/prices`);
  return data.prices || [];
}
