import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Cross-Contract Integration Tests", () => {
  it("FULL FLOW: Register → Stake → Credential → Challenge → Slash", () => {
    // === Step 1: Register all identities ===
    simnet.callPublicFn(
      "satsid-core",
      "register-identity",
      [Cl.stringUtf8("Honest User"), Cl.stringUtf8("I am real")],
      wallet1
    );
    simnet.callPublicFn(
      "satsid-core",
      "register-identity",
      [Cl.stringUtf8("Fraudster"), Cl.stringUtf8("Totally legit")],
      wallet2
    );
    simnet.callPublicFn(
      "satsid-core",
      "register-identity",
      [Cl.stringUtf8("Issuer Corp"), Cl.stringUtf8("We issue creds")],
      wallet3
    );

    // === Step 2: Mint sBTC ===
    simnet.callPublicFn(
      "satsid-sbtc",
      "faucet",
      [Cl.uint(5000000), Cl.principal(wallet1)],
      wallet1
    );
    simnet.callPublicFn(
      "satsid-sbtc",
      "faucet",
      [Cl.uint(5000000), Cl.principal(wallet2)],
      wallet2
    );

    // === Step 3: Both stake sBTC ===
    simnet.callPublicFn(
      "satsid-stake",
      "stake-sbtc",
      [Cl.uint(1000000)],
      wallet1
    );
    simnet.callPublicFn(
      "satsid-stake",
      "stake-sbtc",
      [Cl.uint(1000000)],
      wallet2
    );

    // Verify both are verified
    let v1 = simnet.callReadOnlyFn(
      "satsid-core",
      "is-verified",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(Cl.prettyPrint(v1.result)).toBe("(ok true)");

    let v2 = simnet.callReadOnlyFn(
      "satsid-core",
      "is-verified",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(Cl.prettyPrint(v2.result)).toBe("(ok true)");

    // === Step 4: Issue credential to honest user ===
    simnet.callPublicFn(
      "satsid-credentials",
      "register-issuer",
      [Cl.stringUtf8("Issuer Corp")],
      wallet3
    );
    const credResult = simnet.callPublicFn(
      "satsid-credentials",
      "issue-credential",
      [
        Cl.principal(wallet1),
        Cl.stringUtf8("verified-developer"),
        Cl.stringUtf8("Verified Stacks Developer"),
        Cl.stringUtf8("Has proven Clarity expertise"),
        Cl.buffer(new Uint8Array(32).fill(0xcc)),
        Cl.uint(0),
      ],
      wallet3
    );
    expect(Cl.prettyPrint(credResult.result)).toBe("(ok u1)");

    // === Step 5: Honest user challenges fraudster ===
    const challengeResult = simnet.callPublicFn(
      "satsid-stake",
      "challenge-identity",
      [
        Cl.principal(wallet2),
        Cl.stringUtf8("Multiple wallets, Sybil attack"),
      ],
      wallet1
    );
    expect(Cl.prettyPrint(challengeResult.result)).toBe("(ok true)");

    // === Step 6: Arbiter confirms fraud → SLASH ===
    const slashResult = simnet.callPublicFn(
      "satsid-stake",
      "resolve-challenge",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.bool(true),
      ],
      deployer
    );
    expect(Cl.prettyPrint(slashResult.result)).toBe("(ok true)");

    // === Step 7: Verify aftermath ===

    // Fraudster: no stake
    const fraudStake = simnet.callReadOnlyFn(
      "satsid-stake",
      "get-stake",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(Cl.prettyPrint(fraudStake.result)).toBe("none");

    // Fraudster: not verified
    v2 = simnet.callReadOnlyFn(
      "satsid-core",
      "is-verified",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(Cl.prettyPrint(v2.result)).toBe("(ok false)");

    // Fraudster: reputation = 0
    const fraudRep = simnet.callReadOnlyFn(
      "satsid-core",
      "get-reputation",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(Cl.prettyPrint(fraudRep.result)).toBe("(ok u0)");

    // Honest user: still verified
    v1 = simnet.callReadOnlyFn(
      "satsid-core",
      "is-verified",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(Cl.prettyPrint(v1.result)).toBe("(ok true)");

    // Credential still valid
    const credVerify = simnet.callReadOnlyFn(
      "satsid-credentials",
      "verify-credential",
      [Cl.uint(1)],
      wallet1
    );
    expect(Cl.prettyPrint(credVerify.result)).toContain("(ok");
  });
});
