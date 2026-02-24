const BASE = '/api/trading212';

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

export async function getPositions(authAxios) {
  const { data } = await authAxios.get(`${BASE}/positions`);
  return data.positions || [];
}

export async function getDividends(authAxios) {
  const { data } = await authAxios.get(`${BASE}/dividends`);
  return data.data || [];
}

export async function getAccount(authAxios) {
  const { data } = await authAxios.get(`${BASE}/account`);
  return data;
}

export async function getInstruments(authAxios) {
  const { data } = await authAxios.get(`${BASE}/instruments`);
  return data.instruments || [];
}
