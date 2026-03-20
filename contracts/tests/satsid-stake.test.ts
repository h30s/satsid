import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

function setupUserWithSbtc(wallet: string, sbtcAmount: number) {
  simnet.callPublicFn(
    "satsid-core",
    "register-identity",
    [
      Cl.stringUtf8(`User ${wallet.slice(-4)}`),
      Cl.stringUtf8("Test user"),
    ],
    wallet
  );

  simnet.callPublicFn(
    "satsid-sbtc",
    "faucet",
    [Cl.uint(sbtcAmount), Cl.principal(wallet)],
    wallet
  );
}

describe("satsid-stake: sBTC Reputation Staking", () => {
  describe("stake-sbtc", () => {
    it("should stake sBTC and set verified status", () => {
      setupUserWithSbtc(wallet1, 1000000);

      const result = simnet.callPublicFn(
        "satsid-stake",
        "stake-sbtc",
        [Cl.uint(1000000)],
        wallet1
      );
      expect(Cl.prettyPrint(result.result)).toBe("(ok true)");

      const verified = simnet.callReadOnlyFn(
        "satsid-core",
        "is-verified",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(Cl.prettyPrint(verified.result)).toBe("(ok true)");
    });

    it("should reject stake below minimum", () => {
      setupUserWithSbtc(wallet1, 50000);

      const result = simnet.callPublicFn(
        "satsid-stake",
        "stake-sbtc",
        [Cl.uint(50000)],
        wallet1
      );
      expect(Cl.prettyPrint(result.result)).toBe("(err u203)");
    });

    it("should reject stake from unregistered user", () => {
      simnet.callPublicFn(
        "satsid-sbtc",
        "faucet",
        [Cl.uint(1000000), Cl.principal(wallet1)],
        wallet1
      );

      const result = simnet.callPublicFn(
        "satsid-stake",
        "stake-sbtc",
        [Cl.uint(1000000)],
        wallet1
      );
      expect(Cl.prettyPrint(result.result)).toBe("(err u200)");
    });

    it("should reject duplicate stake", () => {
      setupUserWithSbtc(wallet1, 2000000);

      simnet.callPublicFn(
        "satsid-stake",
        "stake-sbtc",
        [Cl.uint(1000000)],
        wallet1
      );

      const result = simnet.callPublicFn(
        "satsid-stake",
        "stake-sbtc",
        [Cl.uint(1000000)],
        wallet1
      );
      expect(Cl.prettyPrint(result.result)).toBe("(err u201)");
    });
  });

  describe("challenge-identity", () => {
    it("should create challenge and lock target stake", () => {
      setupUserWithSbtc(wallet1, 2000000);
      setupUserWithSbtc(wallet2, 2000000);

      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet1);
      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet2);

      const result = simnet.callPublicFn(
        "satsid-stake",
        "challenge-identity",
        [
          Cl.principal(wallet1),
          Cl.stringUtf8("Suspicious activity"),
        ],
        wallet2
      );
      expect(Cl.prettyPrint(result.result)).toBe("(ok true)");

      const stake = simnet.callReadOnlyFn(
        "satsid-stake",
        "get-stake",
        [Cl.principal(wallet1)],
        wallet1
      );
      // Target's stake should be locked
      expect(Cl.prettyPrint(stake.result)).toContain("(some");
    });

    it("should prevent self-challenge", () => {
      setupUserWithSbtc(wallet1, 2000000);
      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet1);

      const result = simnet.callPublicFn(
        "satsid-stake",
        "challenge-identity",
        [Cl.principal(wallet1), Cl.stringUtf8("Self challenge")],
        wallet1
      );
      expect(Cl.prettyPrint(result.result)).toBe("(err u207)");
    });
  });

  describe("resolve-challenge (slashing)", () => {
    it("should slash target when fraud confirmed", () => {
      setupUserWithSbtc(wallet1, 2000000);
      setupUserWithSbtc(wallet2, 2000000);

      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet1);
      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet2);

      // wallet2 challenges wallet1
      simnet.callPublicFn(
        "satsid-stake",
        "challenge-identity",
        [Cl.principal(wallet1), Cl.stringUtf8("Fraud detected")],
        wallet2
      );

      // Arbiter confirms fraud
      const result = simnet.callPublicFn(
        "satsid-stake",
        "resolve-challenge",
        [Cl.principal(wallet2), Cl.principal(wallet1), Cl.bool(true)],
        deployer
      );
      expect(Cl.prettyPrint(result.result)).toBe("(ok true)");

      // Target stake should be gone
      const targetStake = simnet.callReadOnlyFn(
        "satsid-stake",
        "get-stake",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(Cl.prettyPrint(targetStake.result)).toBe("none");

      // Target should not be verified
      const verified = simnet.callReadOnlyFn(
        "satsid-core",
        "is-verified",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(Cl.prettyPrint(verified.result)).toBe("(ok false)");

      // Target reputation should be 0
      const rep = simnet.callReadOnlyFn(
        "satsid-core",
        "get-reputation",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(Cl.prettyPrint(rep.result)).toBe("(ok u0)");
    });

    it("should penalize challenger when challenge rejected", () => {
      setupUserWithSbtc(wallet1, 2000000);
      setupUserWithSbtc(wallet2, 2000000);

      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet1);
      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet2);

      simnet.callPublicFn(
        "satsid-stake",
        "challenge-identity",
        [Cl.principal(wallet1), Cl.stringUtf8("False accusation")],
        wallet2
      );

      // Challenge rejected
      const result = simnet.callPublicFn(
        "satsid-stake",
        "resolve-challenge",
        [Cl.principal(wallet2), Cl.principal(wallet1), Cl.bool(false)],
        deployer
      );
      expect(Cl.prettyPrint(result.result)).toBe("(ok true)");

      // Target's stake should be unlocked (still exists)
      const stake = simnet.callReadOnlyFn(
        "satsid-stake",
        "get-stake",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(Cl.prettyPrint(stake.result)).toContain("(some");
    });

    it("should reject resolution from non-arbiter", () => {
      setupUserWithSbtc(wallet1, 2000000);
      setupUserWithSbtc(wallet2, 2000000);

      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet1);
      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet2);

      simnet.callPublicFn(
        "satsid-stake",
        "challenge-identity",
        [Cl.principal(wallet1), Cl.stringUtf8("Fraud")],
        wallet2
      );

      const result = simnet.callPublicFn(
        "satsid-stake",
        "resolve-challenge",
        [Cl.principal(wallet2), Cl.principal(wallet1), Cl.bool(true)],
        wallet3
      );
      expect(Cl.prettyPrint(result.result)).toBe("(err u204)");
    });
  });

  describe("unstaking flow", () => {
    it("should enforce cooldown period", () => {
      setupUserWithSbtc(wallet1, 2000000);
      simnet.callPublicFn("satsid-stake", "stake-sbtc", [Cl.uint(1000000)], wallet1);

      const reqResult = simnet.callPublicFn(
        "satsid-stake",
        "request-unstake",
        [],
        wallet1
      );
      expect(Cl.prettyPrint(reqResult.result)).toBe("(ok true)");

      // Immediately try to complete - should fail
      const completeResult = simnet.callPublicFn(
        "satsid-stake",
        "complete-unstake",
        [],
        wallet1
      );
      expect(Cl.prettyPrint(completeResult.result)).toBe("(err u209)");

      // Mine blocks past cooldown
      simnet.mineEmptyBlocks(721);

      const completeResult2 = simnet.callPublicFn(
        "satsid-stake",
        "complete-unstake",
        [],
        wallet1
      );
      expect(Cl.prettyPrint(completeResult2.result)).toBe("(ok true)");

      const verified = simnet.callReadOnlyFn(
        "satsid-core",
        "is-verified",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(Cl.prettyPrint(verified.result)).toBe("(ok false)");
    });
  });
});
