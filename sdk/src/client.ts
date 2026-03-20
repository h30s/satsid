import type {
  SatsIDClientConfig,
  SatsIDUser,
  VerificationReport,
  PaymentInstructions,
} from "./types";

export class SatsIDClient {
  private apiUrl: string;
  private network: string;

  constructor(config: SatsIDClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, "");
    this.network = config.network || "testnet";
  }

  async getIdentity(address: string): Promise<SatsIDUser> {
    const res = await fetch(`${this.apiUrl}/api/identity/${address}`);
    if (!res.ok) throw new Error(`Failed to get identity: ${res.statusText}`);
    return res.json();
  }

  async getReputation(
    address: string
  ): Promise<VerificationReport["reputation"]> {
    const res = await fetch(
      `${this.apiUrl}/api/identity/${address}/reputation`
    );
    if (!res.ok) throw new Error(`Failed to get reputation: ${res.statusText}`);
    return res.json();
  }

  async verify(
    address: string,
    paymentToken?: string
  ): Promise<VerificationReport | PaymentInstructions> {
    const headers: Record<string, string> = {};
    if (paymentToken) {
      headers["X-Payment-Token"] = paymentToken;
      headers["X-Payment-Network"] = `stacks-${this.network}`;
    }

    const res = await fetch(`${this.apiUrl}/api/verify/${address}`, {
      headers,
    });

    if (res.status === 402) {
      return (await res.json()) as PaymentInstructions;
    }

    if (!res.ok) throw new Error(`Verification failed: ${res.statusText}`);
    return (await res.json()) as VerificationReport;
  }

  async isVerifiedHuman(address: string): Promise<boolean> {
    try {
      const identity = await this.getIdentity(address);
      return identity.isVerified;
    } catch {
      return false;
    }
  }

  async getStats(): Promise<{
    totalIdentities: number;
    totalStaked: string;
    totalVerifications: number;
    totalCredentials: number;
  }> {
    const res = await fetch(`${this.apiUrl}/api/stats`);
    if (!res.ok) throw new Error(`Failed to get stats: ${res.statusText}`);
    return res.json();
  }
}
