# SatsID API Reference

Base URL: `http://localhost:3001/api`

---

## Authentication

### POST /auth/nonce

Generate a cryptographic challenge nonce for wallet sign-in.

**Request:**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
}
```

**Response (200):**
```json
{
  "nonce": "a1b2c3d4e5f6...",
  "issuedAt": "2026-03-20T10:00:00.000Z",
  "expiresAt": "2026-03-20T10:10:00.000Z"
}
```

---

### POST /auth/verify

Verify a signed nonce and receive a JWT token.

**Request:**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "signature": "0x...",
  "publicKey": "0x...",
  "nonce": "a1b2c3d4e5f6..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "expiresAt": "2026-03-21T10:00:00.000Z"
}
```

---

### GET /auth/me

Get current authenticated user info.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "bnsName": null
}
```

---

## Identity

### GET /identity/:address

Fetch on-chain identity data for any Stacks address.

**Response (200):**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "bnsName": null,
  "displayName": "Himanshu",
  "bio": null,
  "isVerified": true,
  "isRegistered": true,
  "reputationScore": 50,
  "credentialCount": 0,
  "stakeAmount": "5000000"
}
```

---

### GET /identity/:address/reputation

Compute and return the full reputation breakdown for an address.

**Response (200):**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "reputation": {
    "totalScore": 50,
    "baseScore": 10,
    "walletAgeScore": 0,
    "stakeScore": 15,
    "durationScore": 0,
    "activityScore": 15,
    "credentialScore": 0,
    "challengeBonus": 0,
    "tier": "Trusted",
    "isSlashed": false
  },
  "computedAt": "2026-03-20T10:00:00.000Z"
}
```

**Reputation Tiers:**

| Tier | Score Range |
|---|---|
| Diamond | 80-100 |
| Gold | 60-79 |
| Silver | 40-59 |
| Bronze | 20-39 |
| Untrusted | 0-19 |

**Score Formula:**
```
R = Base(10) + WalletAge(0-15) + Stake(0-30) + Duration(0-10)
    + Activity(0-15) + Credentials(0-10) + ChallengeBonus(0-10) - SlashPenalty
```

---

### GET /identity/:address/credentials

Get all credentials issued to an address.

**Response (200):**
```json
{
  "credentials": [
    {
      "id": 1,
      "title": "KYC Verified",
      "credentialType": "verification",
      "issuer": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
      "issuedAt": 154100,
      "isRevoked": false
    }
  ]
}
```

---

### GET /identity/:address/stake

Get staking information for an address.

**Response (200):**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "amount": "5000000",
  "stakedAt": 154147,
  "isActive": true
}
```

**Note:** Amount is in micro-sBTC (8 decimals). `5000000` = 0.05 sBTC.

---

## Verification (x402 Gated)

These endpoints require an x402 micropayment in USDCx. Without valid payment, they return HTTP 402.

### GET /verify/:address

Full identity verification report. Requires 0.50 USDCx payment.

**Headers:** `X-Payment-TX: <stacks_transaction_id>`

**Response (402) — Payment Required:**
```json
{
  "status": 402,
  "message": "Payment Required",
  "payment": {
    "amount": 500000,
    "currency": "USDCx",
    "recipient": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "contract": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-usdcx",
    "description": "Full identity verification report"
  }
}
```

**Response (200) — Payment Verified:**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "isVerifiedHuman": true,
  "reputationScore": 50,
  "tier": "Trusted",
  "stake": {
    "amount": 5000000,
    "status": "active"
  },
  "credentials": [],
  "challenges": [],
  "verifiedAt": "2026-03-20T10:00:00.000Z"
}
```

---

### GET /verify/:address/credential/:id

Verify a specific credential. Requires 0.25 USDCx payment.

**Headers:** `X-Payment-TX: <stacks_transaction_id>`

**Response (200):**
```json
{
  "credentialId": 1,
  "isValid": true,
  "title": "KYC Verified",
  "issuer": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  "issuedAt": 154100,
  "isRevoked": false
}
```

---

### GET /verify/:address/human

Quick human verification check. Requires 0.10 USDCx payment.

**Headers:** `X-Payment-TX: <stacks_transaction_id>`

**Response (200):**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "isHuman": true,
  "stakeAmount": "5000000",
  "reputationScore": 50,
  "tier": "Trusted"
}
```

---

## Stats

### GET /stats

Global protocol statistics.

**Response (200):**
```json
{
  "totalIdentities": 1,
  "totalStaked": "5000000",
  "totalCredentials": 0,
  "totalChallenges": 0,
  "totalVerifications": 0
}
```

---

### GET /stats/leaderboard

Top identities ranked by reputation score.

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      "displayName": "Himanshu",
      "bnsName": null,
      "totalScore": 50,
      "tier": "Trusted",
      "stakeAmount": "5000000",
      "isVerified": true,
      "baseScore": 10,
      "stakeScore": 15,
      "activityScore": 15
    }
  ],
  "total": 1,
  "updatedAt": "2026-03-20T10:00:00.000Z"
}
```

---

## Faucet (Testnet Only)

### POST /faucet/sbtc

Mint test sBTC tokens for staking.

**Request:**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "amount": 100000000
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Minted 1.00 sBTC to ST1PQHQK...GZGM",
  "amount": 100000000
}
```

---

### POST /faucet/usdcx

Mint test USDCx tokens for x402 verification payments.

**Request:**
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "amount": 100000000
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Minted 100.00 USDCx to ST1PQHQK...GZGM",
  "amount": 100000000
}
```

---

## Health

### GET /health

Server health check.

**Response (200):**
```json
{
  "status": "ok",
  "service": "satsid-backend",
  "version": "1.0.0",
  "network": "testnet",
  "timestamp": "2026-03-20T10:00:00.000Z"
}
```

---

## Smart Contracts

All contracts are deployed at: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`

| Contract | Purpose | Explorer |
|---|---|---|
| `satsid-core` | Identity registration, profiles, reputation | [View](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-core?chain=testnet) |
| `satsid-stake` | sBTC staking, challenges, slashing | [View](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-stake?chain=testnet) |
| `satsid-credentials` | Verifiable credential issuance | [View](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-credentials?chain=testnet) |
| `satsid-sbtc` | Test sBTC token (SIP-010) | [View](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-sbtc?chain=testnet) |
| `satsid-usdcx` | Test USDCx token (SIP-010) | [View](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-usdcx?chain=testnet) |

---

## Error Codes

| HTTP Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 401 | Unauthorized (missing/invalid JWT) |
| 402 | Payment required (x402 endpoints) |
| 404 | Identity/resource not found |
| 500 | Internal server error |

## Contract Error Codes

| Code | Contract | Meaning |
|---|---|---|
| u100 | core | Not authorized |
| u101 | core | Already registered |
| u102 | core | Not registered |
| u200 | stake | Not registered |
| u201 | stake | Already staked |
| u202 | stake | No active stake |
| u203 | stake | Cooldown not expired |
| u204 | stake | Cannot challenge self |
| u205 | stake | Already challenged |
| u206 | stake | Not an arbiter |
| u300 | credentials | Not authorized issuer |
| u301 | credentials | Credential not found |
| u302 | credentials | Already revoked |
| u501 | sbtc/usdcx | Unauthorized transfer |

---

## SDK Usage

Install:
```bash
npm install @satsid/auth
```

React integration:
```tsx
import { SatsIDButton, SatsIDClient } from "@satsid/auth";

// Sign-in button (3 lines)
<SatsIDButton
  onAuth={(session) => console.log("Authenticated:", session.address)}
  apiUrl="http://localhost:3001/api"
/>

// Programmatic verification
const client = new SatsIDClient("http://localhost:3001/api");
const result = await client.isVerifiedHuman("ST1PQHQK...");
// { isHuman: true, score: 50, tier: "Trusted" }
```

---

## Rate Limits

| Endpoint | Limit |
|---|---|
| /auth/nonce | 10 req/min |
| /auth/verify | 5 req/min |
| /identity/* | 60 req/min |
| /verify/* | 30 req/min |
| /faucet/* | 3 req/min |
| /stats/* | 60 req/min |

---

## x402 Protocol Flow

```
Client                    Server                    Blockchain
  |                         |                         |
  |-- GET /verify/:addr --> |                         |
  |<-- 402 Payment Required |                         |
  |                         |                         |
  |-- USDCx transfer -------|-----------------------> |
  |<-- tx_id ---------------|                         |
  |                         |                         |
  |-- GET /verify/:addr --> |                         |
  |   X-Payment-TX: tx_id   |-- verify tx on-chain -> |
  |                         |<-- confirmed ---------- |
  |<-- 200 Report --------- |                         |
```

This implements the HTTP 402 "Payment Required" status code as a native payment protocol for machine-to-machine commerce on Bitcoin via Stacks.
