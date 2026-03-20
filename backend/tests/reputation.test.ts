import {
  computeReputation,
  ReputationInput,
  buildDefaultInput,
} from '../src/services/reputation.service';

// Mock the formatting utility
jest.mock('../src/utils/formatting', () => ({
  getTierFromScore: jest.fn((score: number) => {
    if (score >= 80) return 'Legend';
    if (score >= 60) return 'Pillar';
    if (score >= 40) return 'Trusted';
    if (score >= 20) return 'Builder';
    return 'Pioneer';
  }),
}));

describe('Reputation Service', () => {
  describe('computeReputation', () => {
    it('should return base score of 10 for a new user', () => {
      const input: ReputationInput = {
        walletAgeBlocks: 0,
        stakeAmount: 0,
        stakeDurationBlocks: 0,
        uniqueContractInteractions: 0,
        credentialCount: 0,
        challengesSurvived: 0,
        isSlashed: false,
      };

      const result = computeReputation(input);

      expect(result.totalScore).toBe(10);
      expect(result.baseScore).toBe(10);
      expect(result.walletAgeScore).toBe(0);
      expect(result.stakeScore).toBe(0);
      expect(result.durationScore).toBe(0);
      expect(result.activityScore).toBe(0);
      expect(result.credentialScore).toBe(0);
      expect(result.challengeBonus).toBe(0);
      expect(result.tier).toBe('Pioneer');
      expect(result.isSlashed).toBe(false);
    });

    it('should return zero score for a slashed user', () => {
      const input: ReputationInput = {
        walletAgeBlocks: 100000,
        stakeAmount: 100000000,
        stakeDurationBlocks: 50000,
        uniqueContractInteractions: 10,
        credentialCount: 5,
        challengesSurvived: 3,
        isSlashed: true,
      };

      const result = computeReputation(input);

      expect(result.totalScore).toBe(0);
      expect(result.tier).toBe('Slashed');
      expect(result.isSlashed).toBe(true);
      expect(result.baseScore).toBe(0);
      expect(result.walletAgeScore).toBe(0);
      expect(result.stakeScore).toBe(0);
    });

    it('should compute wallet age score correctly', () => {
      // ~30 days = 144 * 30 = 4320 blocks => score 3
      const input30d = buildDefaultInput();
      input30d.walletAgeBlocks = 4320;
      expect(computeReputation(input30d).walletAgeScore).toBe(3);

      // ~90 days = 144 * 90 = 12960 blocks => score 6
      const input90d = buildDefaultInput();
      input90d.walletAgeBlocks = 12960;
      expect(computeReputation(input90d).walletAgeScore).toBe(6);

      // ~1 year = 144 * 365 = 52560 blocks => score 12
      const input1y = buildDefaultInput();
      input1y.walletAgeBlocks = 52560;
      expect(computeReputation(input1y).walletAgeScore).toBe(12);

      // ~2 years = 144 * 730 = 105120 blocks => score 15 (max)
      const input2y = buildDefaultInput();
      input2y.walletAgeBlocks = 105120;
      expect(computeReputation(input2y).walletAgeScore).toBe(15);
    });

    it('should compute sBTC stake score correctly', () => {
      // 10000 satoshis => score 5
      const input1 = buildDefaultInput();
      input1.stakeAmount = 10000;
      expect(computeReputation(input1).stakeScore).toBe(5);

      // 1000000 (0.01 sBTC) => score 15
      const input2 = buildDefaultInput();
      input2.stakeAmount = 1000000;
      expect(computeReputation(input2).stakeScore).toBe(15);

      // 100000000 (1 sBTC) => score 25
      const input3 = buildDefaultInput();
      input3.stakeAmount = 100000000;
      expect(computeReputation(input3).stakeScore).toBe(25);

      // 1000000000 (10 sBTC) => score 30 (max)
      const input4 = buildDefaultInput();
      input4.stakeAmount = 1000000000;
      expect(computeReputation(input4).stakeScore).toBe(30);
    });

    it('should compute activity score with per-interaction points', () => {
      const input = buildDefaultInput();
      input.uniqueContractInteractions = 3;
      // 3 interactions * 3 points = 9
      expect(computeReputation(input).activityScore).toBe(9);
    });

    it('should cap activity score at 15', () => {
      const input = buildDefaultInput();
      input.uniqueContractInteractions = 10;
      // 10 * 3 = 30, but capped at 15
      expect(computeReputation(input).activityScore).toBe(15);
    });

    it('should compute credential score correctly', () => {
      const input = buildDefaultInput();
      input.credentialCount = 3;
      // 3 credentials * 2 points = 6
      expect(computeReputation(input).credentialScore).toBe(6);
    });

    it('should cap credential score at 10', () => {
      const input = buildDefaultInput();
      input.credentialCount = 10;
      // 10 * 2 = 20, but capped at 10
      expect(computeReputation(input).credentialScore).toBe(10);
    });

    it('should compute challenge survival bonus', () => {
      const input = buildDefaultInput();
      input.challengesSurvived = 3;
      // 3 * 2 = 6
      expect(computeReputation(input).challengeBonus).toBe(6);
    });

    it('should cap total score at 100', () => {
      const input: ReputationInput = {
        walletAgeBlocks: 200000,
        stakeAmount: 10000000000,
        stakeDurationBlocks: 200000,
        uniqueContractInteractions: 100,
        credentialCount: 100,
        challengesSurvived: 100,
        isSlashed: false,
      };

      const result = computeReputation(input);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should compute a Legend tier for a max-reputation user', () => {
      const input: ReputationInput = {
        walletAgeBlocks: 105120,         // 2 years => 15
        stakeAmount: 1000000000,         // 10 sBTC => 30
        stakeDurationBlocks: 105120,     // 2 years => 10
        uniqueContractInteractions: 5,   // 5 * 3 = 15
        credentialCount: 5,              // 5 * 2 = 10
        challengesSurvived: 5,           // 5 * 2 = 10
        isSlashed: false,
      };

      const result = computeReputation(input);
      // base(10) + wallet(15) + stake(30) + duration(10) + activity(15) + cred(10) + challenge(10) = 100
      expect(result.totalScore).toBe(100);
      expect(result.tier).toBe('Legend');
    });

    it('should assign Builder tier for score 20-39', () => {
      const input = buildDefaultInput();
      input.stakeAmount = 10000; // 5 points
      input.uniqueContractInteractions = 2; // 6 points
      // total = 10 + 5 + 6 = 21
      const result = computeReputation(input);
      expect(result.totalScore).toBe(21);
      expect(result.tier).toBe('Builder');
    });

    it('should assign Trusted tier for score 40-59', () => {
      const input = buildDefaultInput();
      input.walletAgeBlocks = 12960; // 6
      input.stakeAmount = 1000000;   // 15
      input.uniqueContractInteractions = 3; // 9
      // total = 10 + 6 + 15 + 9 = 40
      const result = computeReputation(input);
      expect(result.totalScore).toBe(40);
      expect(result.tier).toBe('Trusted');
    });

    it('should assign Pillar tier for score 60-79', () => {
      const input = buildDefaultInput();
      input.walletAgeBlocks = 52560;  // 12
      input.stakeAmount = 10000000;   // 20
      input.stakeDurationBlocks = 12960; // 4
      input.uniqueContractInteractions = 5; // 15
      // total = 10 + 12 + 20 + 4 + 15 = 61
      const result = computeReputation(input);
      expect(result.totalScore).toBe(61);
      expect(result.tier).toBe('Pillar');
    });
  });

  describe('buildDefaultInput', () => {
    it('should return all zero values', () => {
      const input = buildDefaultInput();
      expect(input.walletAgeBlocks).toBe(0);
      expect(input.stakeAmount).toBe(0);
      expect(input.stakeDurationBlocks).toBe(0);
      expect(input.uniqueContractInteractions).toBe(0);
      expect(input.credentialCount).toBe(0);
      expect(input.challengesSurvived).toBe(0);
      expect(input.isSlashed).toBe(false);
    });
  });
});
