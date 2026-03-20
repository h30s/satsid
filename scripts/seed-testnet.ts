/**
 * SatsID Testnet Seed Script
 *
 * Seeds the testnet with test data for demo purposes.
 * Run: npx ts-node scripts/seed-testnet.ts
 *
 * Prerequisites:
 * - Contracts deployed to Stacks testnet
 * - Environment variables set (DEPLOYER_ADDRESS, DEPLOYER_KEY, etc.)
 */

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringUtf8CV,
  principalCV,
  bufferCV,
} from "@stacks/transactions";
import { StacksTestnet } from "@stacks/network";

const network = new StacksTestnet();

// These should be set from environment or CLI args
const DEPLOYER_ADDRESS =
  process.env.DEPLOYER_ADDRESS ||
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const DEPLOYER_KEY = process.env.DEPLOYER_KEY || "";

// Test wallets — generate these or use known testnet wallets
const WALLETS = {
  hero: {
    address: process.env.HERO_ADDRESS || "",
    key: process.env.HERO_KEY || "",
    name: "himanshu.btc",
    bio: "Bitcoin builder. Identity pioneer. Building SatsID.",
  },
  villain: {
    address: process.env.VILLAIN_ADDRESS || "",
    key: process.env.VILLAIN_KEY || "",
    name: "SuspiciousBot42",
    bio: "Definitely not a bot",
  },
  issuer: {
    address: process.env.ISSUER_ADDRESS || "",
    key: process.env.ISSUER_KEY || "",
    name: "Stacks Academy",
    bio: "Official Stacks education platform",
  },
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTx(txId: string, label: string) {
  console.log(`  ⏳ Waiting for ${label}: ${txId}`);
  let attempts = 0;
  while (attempts < 60) {
    try {
      const res = await fetch(
        `https://api.testnet.hiro.so/extended/v1/tx/${txId}`
      );
      const data = await res.json();
      if (data.tx_status === "success") {
        console.log(`  ✅ ${label} confirmed`);
        return data;
      }
      if (
        data.tx_status === "abort_by_response" ||
        data.tx_status === "abort_by_post_condition"
      ) {
        console.error(`  ❌ ${label} failed: ${data.tx_status}`);
        throw new Error(`TX failed: ${data.tx_status}`);
      }
    } catch (e) {
      // API might not have the tx yet
    }
    attempts++;
    await sleep(10000);
  }
  throw new Error(`${label} timed out`);
}

async function callContract(
  senderKey: string,
  contractName: string,
  functionName: string,
  args: any[],
  label: string
) {
  const tx = await makeContractCall({
    contractAddress: DEPLOYER_ADDRESS,
    contractName,
    functionName,
    functionArgs: args,
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  });

  const result = await broadcastTransaction(tx, network);
  const txId = typeof result === "string" ? result : result.txid;
  await waitForTx(txId, label);
  return txId;
}

async function seed() {
  console.log("🚀 SatsID Testnet Seed Script\n");

  if (!DEPLOYER_KEY || !WALLETS.hero.key) {
    console.error("❌ Missing wallet keys. Set environment variables:");
    console.error("   DEPLOYER_ADDRESS, DEPLOYER_KEY");
    console.error("   HERO_ADDRESS, HERO_KEY");
    console.error("   VILLAIN_ADDRESS, VILLAIN_KEY");
    console.error("   ISSUER_ADDRESS, ISSUER_KEY");
    process.exit(1);
  }

  // Step 1: Mint sBTC for all wallets
  console.log("1️⃣  Minting test sBTC...");
  for (const [name, wallet] of Object.entries(WALLETS)) {
    await callContract(
      wallet.key,
      "sbtc-token",
      "faucet",
      [uintCV(10000000), principalCV(wallet.address)], // 0.1 sBTC
      `Mint sBTC for ${name}`
    );
  }

  // Step 2: Mint USDCx for verification demos
  console.log("\n2️⃣  Minting test USDCx...");
  await callContract(
    WALLETS.hero.key,
    "usdcx-token",
    "faucet",
    [uintCV(100000000), principalCV(WALLETS.hero.address)], // 100 USDCx
    "Mint USDCx for hero"
  );

  // Step 3: Register identities
  console.log("\n3️⃣  Registering identities...");
  for (const [name, wallet] of Object.entries(WALLETS)) {
    await callContract(
      wallet.key,
      "satsid-core",
      "register-identity",
      [stringUtf8CV(wallet.name), stringUtf8CV(wallet.bio)],
      `Register ${name}`
    );
  }

  // Step 4: Stake sBTC
  console.log("\n4️⃣  Staking sBTC...");
  await callContract(
    WALLETS.hero.key,
    "satsid-stake",
    "stake-sbtc",
    [uintCV(5000000)], // 0.05 sBTC
    "Hero stakes sBTC"
  );
  await callContract(
    WALLETS.villain.key,
    "satsid-stake",
    "stake-sbtc",
    [uintCV(1000000)], // 0.01 sBTC
    "Villain stakes sBTC"
  );

  // Step 5: Issue credentials to hero
  console.log("\n5️⃣  Issuing credentials...");
  await callContract(
    WALLETS.issuer.key,
    "satsid-credentials",
    "register-issuer",
    [stringUtf8CV("Stacks Academy")],
    "Register issuer"
  );

  await callContract(
    WALLETS.issuer.key,
    "satsid-credentials",
    "issue-credential",
    [
      principalCV(WALLETS.hero.address),
      stringUtf8CV("clarity-developer"),
      stringUtf8CV("Certified Clarity Developer"),
      stringUtf8CV(
        "Successfully completed the Stacks Clarity smart contract course"
      ),
      bufferCV(new Uint8Array(32).fill(0xab)),
      uintCV(0),
    ],
    "Issue credential 1"
  );

  await callContract(
    WALLETS.issuer.key,
    "satsid-credentials",
    "issue-credential",
    [
      principalCV(WALLETS.hero.address),
      stringUtf8CV("stacks-builder"),
      stringUtf8CV("Verified Stacks Builder"),
      stringUtf8CV("Active contributor to the Stacks ecosystem"),
      bufferCV(new Uint8Array(32).fill(0xcd)),
      uintCV(0),
    ],
    "Issue credential 2"
  );

  console.log("\n✅ SEED COMPLETE");
  console.log("════════════════════════════════");
  console.log(`Hero (${WALLETS.hero.name}): Registered, Staked 0.05 sBTC, 2 credentials`);
  console.log(`Villain (${WALLETS.villain.name}): Registered, Staked 0.01 sBTC, 0 credentials`);
  console.log(`Issuer (${WALLETS.issuer.name}): Registered as credential issuer`);
  console.log("════════════════════════════════");
  console.log("\nReady for demo! The villain can be challenged and slashed.");
}

seed().catch(console.error);
