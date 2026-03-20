import stxTx from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } = stxTx;
import stxNet from '@stacks/network';
const { STACKS_TESTNET } = stxNet;
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const network = STACKS_TESTNET;
const DEPLOYER_KEY = '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601';

const contractsDir = resolve(__dirname, '..', 'contracts', 'contracts');

const contractsToDeploy = [
  { name: 'satsid-sbtc', file: 'satsid-sbtc.clar' },
  { name: 'satsid-usdcx', file: 'satsid-usdcx.clar' },
  { name: 'satsid-stake', file: 'satsid-stake.clar' },
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function deploy(contractName, fileName) {
  const codeBody = readFileSync(resolve(contractsDir, fileName), 'utf-8');
  console.log(`\nDeploying ${contractName}...`);
  console.log(`  Code size: ${codeBody.length} bytes`);

  const tx = await makeContractDeploy({
    contractName,
    codeBody,
    senderKey: DEPLOYER_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    clarityVersion: 2,
    fee: 200000n,
  });

  const result = await broadcastTransaction({ transaction: tx, network });

  if (result.error) {
    console.log(`  ❌ Failed: ${result.error} - ${result.reason}`);
    if (result.reason === 'ContractAlreadyExists') {
      console.log(`  ℹ️  Contract already deployed — skipping`);
    }
    return null;
  }

  const txid = result.txid || result;
  console.log(`  ✅ Broadcast: ${txid}`);
  console.log(`  🔗 https://explorer.hiro.so/txid/${txid}?chain=testnet`);
  return txid;
}

async function main() {
  console.log('🚀 Deploying remaining SatsID contracts to Stacks testnet\n');

  for (const contract of contractsToDeploy) {
    const txid = await deploy(contract.name, contract.file);
    // Wait between deploys for nonce increment
    await sleep(5000);
  }

  console.log('\n════════════════════════════════════════════');
  console.log('All contracts (final addresses):');
  console.log('  satsid-core:        ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-core');
  console.log('  satsid-credentials: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-credentials');
  console.log('  satsid-sbtc:        ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-sbtc');
  console.log('  satsid-stake:       ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-stake');
  console.log('  satsid-usdcx:       ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.satsid-usdcx');
  console.log('════════════════════════════════════════════');
  console.log('\nTransactions will confirm in ~10 minutes.');
}

main().catch(console.error);
