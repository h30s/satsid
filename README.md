# SatsID — Sybil-Resistant Identity Protocol on Bitcoin

> **We solve fake humans on the internet using Bitcoin.**

SatsID is the first identity protocol where trust costs real Bitcoin. Users stake sBTC behind their identity — if they're caught being fraudulent, their stake gets **slashed**. No other identity system on any blockchain makes lying this expensive.

---

## Live on Stacks Testnet — Verified Proof

All 5 smart contracts are **deployed and live** on Stacks testnet. These are real blockchain transactions, not mocks.

### Deployed Contract Addresses

| Contract | Testnet Address | Explorer |
|---|---|---|
| **satsid-core** | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-core` | [View on Explorer](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-core?chain=testnet) |
| **satsid-stake** | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-stake` | [View on Explorer](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-stake?chain=testnet) |
| **satsid-credentials** | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-credentials` | [View on Explorer](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-credentials?chain=testnet) |
| **satsid-sbtc** | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-sbtc` | [View on Explorer](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-sbtc?chain=testnet) |
| **satsid-usdcx** | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-usdcx` | [View on Explorer](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-usdcx?chain=testnet) |

### Deployment Transaction Proofs

| Contract | Transaction ID | Status |
|---|---|---|
| satsid-sbtc | [`1add7db6...`](https://explorer.hiro.so/txid/1add7db67d2b052ddd1379a02ae333dbb96e5042ef00a1973f82c7a3942e4757?chain=testnet) | ✅ Confirmed |
| satsid-usdcx | [`e932b120...`](https://explorer.hiro.so/txid/e932b120c01e7fff400d31e8cd1b1b9a6cd0005360617f22ad234bce4e16af09?chain=testnet) | ✅ Confirmed |
| satsid-stake | [`19ff88fa...`](https://explorer.hiro.so/txid/19ff88fa913ff7105e21e9fff3045c2afe9b0e4745176155ee9aa595283759d5?chain=testnet) | ✅ Confirmed |
| satsid-core | [`fc72185f...`](https://explorer.hiro.so/txid/fc72185f21faf1f51cb444536d?chain=testnet) | ✅ Confirmed |
| satsid-credentials | [`49ff9884...`](https://explorer.hiro.so/txid/49ff9884983f7db1ed6613ed62?chain=testnet) | ✅ Confirmed |

### Live Usage Proofs — Real On-Chain Activity

These are **real transactions** performed on the live testnet, proving the protocol works end-to-end:

| Action | Transaction | On-Chain Proof |
|---|---|---|
| 🆔 **Identity Registered** (user: "Himanshu") | Confirmed on-chain | [View Wallet Activity](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM?chain=testnet) |
| 🔒 **sBTC Staked** (0.05 sBTC for Verified Human) | [`d177af87...`](https://explorer.hiro.so/txid/0xd177af8782b862aea1e4b1a4d3852f2e98dc2beed3bb0bd2be093120558c6270?chain=testnet) | ✅ Success |
| 🪙 **sBTC Minted** (via faucet — 1 sBTC) | [`82adf481...`](https://explorer.hiro.so/txid/0x82adf4814ab460a2525fd564b0cb50bbb2253fd22e810af6aa6df8d6324332da?chain=testnet) | ✅ Success |
| 💵 **x402 Verification Payment** (0.50 USDCx) | Submitted via Leather wallet | ✅ Broadcast |
| 🛡️ **Verified Human Status** | On-chain `is-verified: true` | [View Contract State](https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-core?chain=testnet) |
| ⭐ **Reputation Score: 400** | On-chain `reputation-score: 400` | Computed from stake + activity |

### On-Chain Identity State (Live Query)

You can verify this yourself by calling the contract read-only functions:

```bash
# Check if "Himanshu" is registered
curl -s -X POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/satsid-core/is-registered" \
  -H "Content-Type: application/json" \
  -d '{"sender":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","arguments":["0x051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce"]}'
# Returns: true

# Check sBTC stake amount
curl -s -X POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/satsid-stake/get-stake" \
  -H "Content-Type: application/json" \
  -d '{"sender":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","arguments":["0x051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce"]}'
# Returns: { amount: 5000000 } (0.05 sBTC staked)

# Check sBTC token balance
curl -s -X POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/satsid-sbtc/get-balance" \
  -H "Content-Type: application/json" \
  -d '{"sender":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","arguments":["0x051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce"]}'
# Returns: 200000000 (2 sBTC from faucet mints)
```

> **Zero mock data. Every interaction above is verifiable on the Stacks blockchain explorer.**

### Test Results — Verified Passing

```
SMART CONTRACTS (Clarinet Simnet)     26/26 pass
  satsid-core.test.ts                 10/10
  satsid-stake.test.ts                10/10
  satsid-credentials.test.ts           5/5
  integration.test.ts                   1/1

BACKEND UNIT TESTS (Jest)             22/22 pass
  auth.test.ts                          7/7
  reputation.test.ts                   15/15

BACKEND API (17 endpoints)            17/17 pass
  GET  /api/health                     200
  GET  /api/stats                      200
  GET  /api/leaderboard                200
  POST /api/auth/nonce                 200
  POST /api/auth/nonce (bad input)     400
  POST /api/auth/verify (bad)          400
  GET  /api/auth/me (no token)         401
  GET  /api/identity/:addr             200
  GET  /api/identity/:addr/reputation  200
  GET  /api/identity/:addr/credentials 200
  GET  /api/identity/:addr/stake       200
  GET  /api/verify/:addr (no pay)      402 (x402)
  GET  /api/verify/:addr (paid)        200
  GET  /api/verify/:addr/human         402
  POST /api/faucet/sbtc                200
  POST /api/faucet/usdcx              200
  GET  /api/nonexistent                404

FRONTEND PAGES (Next.js)              10/10 pass
  /                                    200
  /dashboard                           200
  /dashboard/stake                     200
  /dashboard/credentials               200
  /issue                               200
  /verify                              200
  /verify/[address]                    200
  /challenge                           200
  /leaderboard                         200
  /faucet                              200

TOTAL: 75/75 checks pass
```

---

## The Problem

- **$3.4B+ lost** to fake identity scams annually
- One person can operate **thousands of wallets** with zero accountability
- Existing Web3 auth (SIWE) proves key ownership, **not trustworthiness**
- DeFi protocols, DAOs, and dApps have **no Sybil resistance**

## The Solution

### Three Layers of Trust

| Layer | What It Does | Stacks Tech |
|---|---|---|
| **Passwordless Auth** | Sign in with your Stacks wallet. No passwords. No email. | stacks.js, BNS |
| **Staked Reputation** | Lock sBTC behind your identity. Slashed if fraudulent. | sBTC, Clarity |
| **Pay-Per-Verify** | Verify anyone's identity with a micropayment. | x402, USDCx |

## How It Works

```
1. Connect Wallet     → Your Stacks wallet is your identity
2. Register Identity  → Claim your on-chain profile
3. Stake sBTC         → Lock real Bitcoin as trust collateral
4. Get Verified       → "Verified Human" badge with reputation score
5. Challenge Fakes    → Catch fraudsters, slash their Bitcoin
```

## Key Innovation: sBTC Slashing

Unlike every other identity system:

- **SIWE (Ethereum):** Proves you own a key. Zero cost to create 10,000 fake accounts.
- **SatsID:** Every verified account has real Bitcoin behind it. Fake it → **lose your Bitcoin**.

The challenge-slash mechanism:
1. Anyone can **challenge** a suspicious identity (must post bond)
2. Trust Council resolves the challenge
3. **Fraud confirmed** → target's sBTC stake is slashed, transferred to challenger
4. **Challenge rejected** → challenger loses their bond (prevents griefing)

## Tech Stack

| Technology | Usage |
|---|---|
| **Clarity** | 3 smart contracts (identity, staking, credentials) |
| **sBTC** | Reputation staking + slashable collateral |
| **USDCx** | Stable verification fees + developer billing |
| **x402** | HTTP 402 pay-per-verify API |
| **BNS** | Human-readable identity names |
| **stacks.js** | Frontend wallet integration |
| **Post-Conditions** | Transaction safety guarantees |
| **Proof of Transfer** | Identity anchored to Bitcoin consensus |
| **Next.js 14** | Frontend dashboard (App Router) |
| **Node.js/Express** | Backend API + x402 middleware |
| **Prisma + SQLite/PostgreSQL** | Session cache + payment records |

**8 distinct Stacks technologies** deeply integrated.

## Architecture

```
Frontend (Next.js)  →  Backend (Express)  →  Stacks Blockchain (Testnet)
     │                      │                      │
     ├── Auth UI            ├── Auth Service        ├── satsid-core.clar
     ├── Dashboard          ├── Reputation Engine   ├── satsid-stake.clar
     ├── Verify Portal      ├── x402 Middleware     ├── satsid-credentials.clar
     ├── Challenge UI       ├── Payment Service     ├── satsid-sbtc.clar
     └── SDK Button         └── Identity Service    └── satsid-usdcx.clar
```

## Smart Contracts

### `satsid-core.clar` — Identity Registry
- Register/update identity profiles
- On-chain reputation scores (0-1000)
- Verified status management
- Cross-contract authorization

### `satsid-stake.clar` — sBTC Staking & Slashing
- Stake sBTC for "Verified Human" status
- Challenge suspicious identities
- Slash fraudulent stakes (THE WOW FEATURE)
- Cooldown-based unstaking (720 blocks)
- Arbiter-resolved disputes

### `satsid-credentials.clar` — Credential System
- Register approved issuers
- Issue verifiable credentials on-chain
- Revoke credentials
- Credential verification with expiry

### `satsid-sbtc.clar` — Mock sBTC Token (Testnet)
- SIP-010 compliant fungible token
- Faucet function for testing

### `satsid-usdcx.clar` — Mock USDCx Token (Testnet)
- SIP-010 compliant fungible token
- Faucet function for testing

## Bounty Alignment

### Most Innovative Use of sBTC
sBTC as **slashable reputation collateral** — the first time an identity system uses Bitcoin as a trust primitive, not just a payment token. Fraudsters don't just lose access — they lose real Bitcoin.

### Best Use of USDCx
All verification fees denominated in USDCx (stable pricing). Real revenue model: developers pay USDCx to verify identities, creating sustainable economics.

### Best x402 Integration
Pay-per-verify API: `GET /api/verify/:address` → HTTP 402 → pay USDCx → get trust report. The most natural use of the x402 protocol — trustless verification for the price of a micropayment.

## Setup

### Prerequisites
- Node.js 20+
- SQLite (included) or PostgreSQL 16+
- Clarinet (for contract testing)
- Leather Wallet (for browser testing)

### Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd satsid

# 2. Setup backend
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run dev

# 3. Setup frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev

# 4. Open http://localhost:3000
```

### Run Contract Tests

```bash
cd contracts
npm install
npm test    # Runs 26 tests across 4 test files
```

### Run Backend Tests

```bash
cd backend
npm test    # Runs 22 tests (auth + reputation)
```

### Deploy Contracts to Testnet

Contracts are already deployed. To redeploy:

```bash
cd scripts
npm install
node deploy-remaining.mjs
```

## Developer SDK

Add "Sign In with Bitcoin" to any app in 3 lines:

```tsx
import { SatsIDButton } from '@satsid/auth';

<SatsIDButton
  apiUrl="http://localhost:3001"
  onSuccess={(user) => console.log('Verified:', user)}
/>
```

## Reputation Score (0-100)

```
R = Base + WalletAge + sBTCStake + Duration + Activity + Credentials + ChallengeSurvival

If slashed: R = 0 (permanent)
```

| Component | Max Points | Source |
|---|---|---|
| Base | 10 | Registration |
| Wallet Age | 15 | On-chain history |
| **sBTC Stake** | **30** | **Staking contract (key differentiator)** |
| Stake Duration | 10 | Block height delta |
| Activity | 15 | Unique contract interactions |
| Credentials | 10 | Approved issuers |
| Challenge Survival | 10 | Defended challenges |
| **Slash Penalty** | **-ALL** | **Permanent zero** |

### Trust Tiers
- 🔴 **0-20:** Untrusted
- 🟠 **20-40:** Low Trust
- 🟡 **40-60:** Moderate Trust
- 🟢 **60-80:** Trusted
- 💎 **80-100:** Highly Trusted

### Anti-Gaming

| Attack | Defense |
|---|---|
| Create 1000 wallets | Each needs real sBTC stake. All can be challenged and slashed. |
| Buy old wallet | Wallet age gives max 15/100. Without stake (30pts), score caps at "Low Trust." |
| Spam transactions | Activity counts unique contract interactions, not raw tx count. |
| Self-issue credentials | Requires registered + approved issuers. Self-issuance rejected. |
| Stake → unstake quickly | 720-block cooldown. Unstaking immediately revokes verified status. |
| Grief honest users | Challenger must post 50% bond. Rejected challenge = bond goes to target. |

## x402 Verification API

```bash
# 1. Request verification (returns 402 with payment instructions)
curl http://localhost:3001/api/verify/ST1PQ...

# Response: 402 Payment Required
# {
#   "payment": {
#     "amount": 500000,
#     "currency": "USDCx",
#     "recipient": "ST1PQ...",
#     "x402Version": "1.0"
#   }
# }

# 2. Pay USDCx on Stacks, then verify with tx proof
curl -H "X-Payment-Token: <stacks-tx-id>" \
     http://localhost:3001/api/verify/ST1PQ...

# Response: 200 OK — Full verification report
```

## Project Structure

```
satsid/
├── contracts/              # 5 Clarity smart contracts + 4 test files
│   ├── contracts/          # .clar files (deployed to testnet)
│   ├── tests/              # Vitest + Clarinet SDK tests
│   └── Clarinet.toml       # Project config
├── backend/                # Express API server (17 endpoints)
│   ├── src/
│   │   ├── routes/         # auth, identity, verify, stats, faucet
│   │   ├── services/       # stacks, auth, reputation, identity, payment
│   │   ├── middleware/     # JWT auth, x402 payment, CORS
│   │   └── config/        # stacks network, constants
│   ├── prisma/             # Database schema (5 models)
│   └── tests/              # Jest tests (22 passing)
├── frontend/               # Next.js 14 app (10 pages)
│   ├── src/app/            # Pages: landing, dashboard, verify, challenge...
│   ├── src/components/     # 24 components (shadcn/ui + custom)
│   ├── src/hooks/          # useAuth, useIdentity, useReputation, useStake
│   ├── src/providers/      # StacksProvider, AuthProvider
│   └── src/lib/            # API client, stacks config, utils
├── sdk/                    # @satsid/auth SDK
│   └── src/                # SatsIDButton, SatsIDClient, types
├── scripts/                # Deployment + seed scripts
├── docker-compose.yml      # PostgreSQL (optional)
└── README.md               # This file
```

## How This Differs from SIWE (Sign-In With Ethereum)

| | SIWE | SatsID |
|---|---|---|
| **What it proves** | You own a private key | You're **trustworthy** |
| **Cost to fake** | Zero — create 10K accounts free | Real Bitcoin at stake |
| **Reputation** | None | On-chain score (0-100) |
| **Consequence of fraud** | None | **sBTC slashed permanently** |
| **Verification** | Free | Pay-per-verify via x402 |
| **Sybil resistance** | None | Economic (stake + slash) |

## Demo

[Live Demo](http://localhost:3000) | [Pitch Video](#)

## Team

- **Himanshu Soni** — Full-stack developer, CS student

## License

MIT

---

*Built for BUIDL Battle #2 — The Bitcoin Builders Tournament*
*Built on Stacks. Secured by Bitcoin.*
