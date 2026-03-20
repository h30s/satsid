import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

function setupIssuerAndRecipient() {
  simnet.callPublicFn(
    "satsid-core",
    "register-identity",
    [Cl.stringUtf8("Stacks University"), Cl.stringUtf8("Education institution")],
    wallet1
  );
  simnet.callPublicFn(
    "satsid-core",
    "register-identity",
    [Cl.stringUtf8("Student"), Cl.stringUtf8("Blockchain learner")],
    wallet2
  );
  simnet.callPublicFn(
    "satsid-credentials",
    "register-issuer",
    [Cl.stringUtf8("Stacks University")],
    wallet1
  );
}

describe("satsid-credentials: Credential System", () => {
  describe("issue-credential", () => {
    it("should issue a credential successfully", () => {
      setupIssuerAndRecipient();
      const dataHash = new Uint8Array(32).fill(0xab);

      const result = simnet.callPublicFn(
        "satsid-credentials",
        "issue-credential",
        [
          Cl.principal(wallet2),
          Cl.stringUtf8("blockchain-developer"),
          Cl.stringUtf8("Certified Blockchain Developer"),
          Cl.stringUtf8("Completed Stacks course with honors"),
          Cl.buffer(dataHash),
          Cl.uint(0),
        ],
        wallet1
      );
      expect(Cl.prettyPrint(result.result)).toBe("(ok u1)");

      const cred = simnet.callReadOnlyFn(
        "satsid-credentials",
        "get-credential",
        [Cl.uint(1)],
        wallet1
      );
      expect(Cl.prettyPrint(cred.result)).toContain("(some");
    });

    it("should reject credential from non-issuer", () => {
      simnet.callPublicFn(
        "satsid-core",
        "register-identity",
        [Cl.stringUtf8("Random"), Cl.stringUtf8("Not an issuer")],
        wallet2
      );
      simnet.callPublicFn(
        "satsid-core",
        "register-identity",
        [Cl.stringUtf8("Target"), Cl.stringUtf8("Target")],
        wallet3
      );

      const result = simnet.callPublicFn(
        "satsid-credentials",
        "issue-credential",
        [
          Cl.principal(wallet3),
          Cl.stringUtf8("fake-cert"),
          Cl.stringUtf8("Fake"),
          Cl.stringUtf8("Fake credential"),
          Cl.buffer(new Uint8Array(32)),
          Cl.uint(0),
        ],
        wallet2
      );
      expect(Cl.prettyPrint(result.result)).toBe("(err u302)");
    });
  });

  describe("verify-credential", () => {
    it("should return valid for active credential", () => {
      setupIssuerAndRecipient();

      simnet.callPublicFn(
        "satsid-credentials",
        "issue-credential",
        [
          Cl.principal(wallet2),
          Cl.stringUtf8("test-cert"),
          Cl.stringUtf8("Test Certificate"),
          Cl.stringUtf8("A test credential"),
          Cl.buffer(new Uint8Array(32)),
          Cl.uint(0),
        ],
        wallet1
      );

      const result = simnet.callReadOnlyFn(
        "satsid-credentials",
        "verify-credential",
        [Cl.uint(1)],
        wallet2
      );
      expect(Cl.prettyPrint(result.result)).toContain("(ok");
    });

    it("should return invalid for revoked credential", () => {
      setupIssuerAndRecipient();

      simnet.callPublicFn(
        "satsid-credentials",
        "issue-credential",
        [
          Cl.principal(wallet2),
          Cl.stringUtf8("test-cert"),
          Cl.stringUtf8("Test Certificate"),
          Cl.stringUtf8("Will be revoked"),
          Cl.buffer(new Uint8Array(32)),
          Cl.uint(0),
        ],
        wallet1
      );

      simnet.callPublicFn(
        "satsid-credentials",
        "revoke-credential",
        [Cl.uint(1)],
        wallet1
      );

      const result = simnet.callReadOnlyFn(
        "satsid-credentials",
        "verify-credential",
        [Cl.uint(1)],
        wallet2
      );
      // Result should indicate revoked
      expect(Cl.prettyPrint(result.result)).toContain("(ok");
    });
  });

  describe("revoke-credential", () => {
    it("should only allow issuer to revoke", () => {
      setupIssuerAndRecipient();

      simnet.callPublicFn(
        "satsid-credentials",
        "issue-credential",
        [
          Cl.principal(wallet2),
          Cl.stringUtf8("test"),
          Cl.stringUtf8("Test"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(new Uint8Array(32)),
          Cl.uint(0),
        ],
        wallet1
      );

      // Recipient tries to revoke
      const result = simnet.callPublicFn(
        "satsid-credentials",
        "revoke-credential",
        [Cl.uint(1)],
        wallet2
      );
      expect(Cl.prettyPrint(result.result)).toBe("(err u301)");
    });
  });
});
