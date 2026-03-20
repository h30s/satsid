const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || error.error || `API Error: ${res.status}`);
  }
  return res.json();
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export const api = {
  // Auth
  getNonce: (address: string) =>
    fetchJson(`${API_URL}/api/auth/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    }),

  verifySignature: (data: {
    address: string;
    signature: string;
    publicKey: string;
    nonce: string;
    message: string;
  }) =>
    fetchJson(`${API_URL}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  getMe: (token: string) =>
    fetchJson(`${API_URL}/api/auth/me`, {
      headers: authHeaders(token),
    }),

  // Identity
  getIdentity: (address: string) =>
    fetchJson(`${API_URL}/api/identity/${address}`),

  getReputation: (address: string) =>
    fetchJson(`${API_URL}/api/identity/${address}/reputation`),

  getCredentials: (address: string) =>
    fetchJson(`${API_URL}/api/identity/${address}/credentials`),

  getStake: (address: string) =>
    fetchJson(`${API_URL}/api/identity/${address}/stake`),

  // Verify (x402)
  verifyIdentity: (address: string, paymentToken?: string) =>
    fetchJson(`${API_URL}/api/verify/${address}`, {
      headers: paymentToken
        ? { "X-Payment-Token": paymentToken }
        : undefined,
    }),

  verifyHuman: (address: string, paymentToken?: string) =>
    fetchJson(`${API_URL}/api/verify/${address}/human`, {
      headers: paymentToken
        ? { "X-Payment-Token": paymentToken }
        : undefined,
    }),

  // Stats
  getStats: () => fetchJson(`${API_URL}/api/stats`),

  getLeaderboard: () => fetchJson(`${API_URL}/api/leaderboard`),

  // Faucet
  mintSbtc: (address: string, amount: number) =>
    fetchJson(`${API_URL}/api/faucet/sbtc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, amount }),
    }),

  mintUsdcx: (address: string, amount: number) =>
    fetchJson(`${API_URL}/api/faucet/usdcx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, amount }),
    }),

  // Challenge
  submitChallenge: (
    token: string,
    data: { targetAddress: string; reason: string; bondAmount: number }
  ) =>
    fetchJson(`${API_URL}/api/challenge`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  getChallenges: () => fetchJson(`${API_URL}/api/challenges`),
};
