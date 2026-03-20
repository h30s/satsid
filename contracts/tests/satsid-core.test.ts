import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("satsid-core: Identity Registry", () => {
  describe("register-identity", () => {
    it("should register a new identity successfully", () => {
      const { result } = simnet.callPublicFn(
        "satsid-core",
        "register-identity",
        [Cl.stringUtf8("Himanshu Soni"), Cl.stringUtf8("Bitcoin builder")],
        wallet1
      );
      expect(Cl.prettyPrint(result)).toBe("(ok true)");
    });

    it("should reject duplicate registration", () => {
      simnet.callPublicFn(
        "satsid-core",
        "register-identity",
        [Cl.stringUtf8("User One"), Cl.stringUtf8("Bio")],
        wallet1
      );
      const { result } = simnet.callPublicFn(
        "satsid-core",
        "register-identity",
        [Cl.stringUtf8("User One Again"), Cl.stringUtf8("Bio")],
        wallet1
      );
      expect(Cl.prettyPrint(result)).toBe("(err u100)");
    });

    it("should reject empty display name", () => {
      const { result } = simnet.callPublicFn(
        "satsid-core",
        "register-identity",
        [Cl.stringUtf8(""), Cl.stringUtf8("Bio")],
        wallet1
      );
      expect(Cl.prettyPrint(result)).toBe("(err u103)");
    });

    it("should increment total identities counter", () => {
      simnet.callPublicFn("satsid-core", "register-identity",
        [Cl.stringUtf8("User 1"), Cl.stringUtf8("Bio 1")], wallet1);
      simnet.callPublicFn("satsid-core", "register-identity",
        [Cl.stringUtf8("User 2"), Cl.stringUtf8("Bio 2")], wallet2);

      const { result } = simnet.callReadOnlyFn(
        "satsid-core", "get-total-identities", [], wallet1);
      expect(Cl.prettyPrint(result)).toBe("u2");
    });
  });

  describe("update-profile", () => {
    it("should update profile for registered user", () => {
      simnet.callPublicFn("satsid-core", "register-identity",
        [Cl.stringUtf8("Old Name"), Cl.stringUtf8("Old Bio")], wallet1);
      const { result } = simnet.callPublicFn("satsid-core", "update-profile",
        [Cl.stringUtf8("New Name"), Cl.stringUtf8("New Bio")], wallet1);
      expect(Cl.prettyPrint(result)).toBe("(ok true)");
    });

    it("should reject update for unregistered user", () => {
      const { result } = simnet.callPublicFn("satsid-core", "update-profile",
        [Cl.stringUtf8("Name"), Cl.stringUtf8("Bio")], wallet1);
      expect(Cl.prettyPrint(result)).toBe("(err u101)");
    });
  });

  describe("set-verified (authorization)", () => {
    it("should reject direct calls (not from satsid-stake)", () => {
      simnet.callPublicFn("satsid-core", "register-identity",
        [Cl.stringUtf8("User"), Cl.stringUtf8("Bio")], wallet1);
      const { result } = simnet.callPublicFn("satsid-core", "set-verified",
        [Cl.principal(wallet1), Cl.bool(true)], wallet1);
      expect(Cl.prettyPrint(result)).toBe("(err u102)");
    });
  });

  describe("read-only functions", () => {
    it("is-registered should return false for unregistered", () => {
      const { result } = simnet.callReadOnlyFn("satsid-core", "is-registered",
        [Cl.principal(wallet1)], wallet1);
      expect(Cl.prettyPrint(result)).toBe("false");
    });

    it("is-registered should return true after registration", () => {
      simnet.callPublicFn("satsid-core", "register-identity",
        [Cl.stringUtf8("User"), Cl.stringUtf8("Bio")], wallet1);
      const { result } = simnet.callReadOnlyFn("satsid-core", "is-registered",
        [Cl.principal(wallet1)], wallet1);
      expect(Cl.prettyPrint(result)).toBe("true");
    });

    it("get-reputation should return base score after registration", () => {
      simnet.callPublicFn("satsid-core", "register-identity",
        [Cl.stringUtf8("User"), Cl.stringUtf8("Bio")], wallet1);
      const { result } = simnet.callReadOnlyFn("satsid-core", "get-reputation",
        [Cl.principal(wallet1)], wallet1);
      expect(Cl.prettyPrint(result)).toBe("(ok u100)");
    });
  });
});
