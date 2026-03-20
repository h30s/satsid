import request from 'supertest';
import express from 'express';

// Mock Prisma before importing anything that uses it
jest.mock('@prisma/client', () => {
  const mockSession = {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      session: mockSession,
      identityCache: { findUnique: jest.fn() },
      reputationCache: { findUnique: jest.fn() },
    })),
  };
});

// Mock Stacks libraries
jest.mock('@stacks/encryption', () => ({
  verifyMessageSignatureRsv: jest.fn().mockReturnValue(true),
}));

jest.mock('@stacks/transactions', () => ({
  createStacksPublicKey: jest.fn().mockReturnValue({}),
  publicKeyToAddress: jest.fn().mockReturnValue('ST1TESTADDRESS'),
  cvToJSON: jest.fn(),
  hexToCV: jest.fn(),
  serializeCV: jest.fn().mockReturnValue(new Uint8Array()),
  principalCV: jest.fn(),
  stringAsciiCV: jest.fn(),
  uintCV: jest.fn(),
  noneCV: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn().mockResolvedValue({
  ok: false,
  status: 404,
  text: () => Promise.resolve('not found'),
  json: () => Promise.resolve({}),
}) as jest.Mock;

// Mock the auth service module
jest.mock('../src/services/auth.service', () => ({
  generateNonce: jest.fn().mockResolvedValue({
    nonce: 'satsid-auth-1234567890-abcdef1234567890abcdef1234567890',
    message: 'SatsID Authentication\n\nSign this message...',
    expiresAt: new Date(Date.now() + 300000),
  }),
  verifySignature: jest.fn().mockResolvedValue({ valid: true }),
  createToken: jest.fn().mockResolvedValue('mock.jwt.token'),
}));

jest.mock('../src/services/identity.service', () => ({
  getIdentity: jest.fn().mockResolvedValue({
    address: 'ST1TESTADDRESS',
    bnsName: null,
    displayName: null,
    bio: null,
    isVerified: false,
    isRegistered: false,
    reputationScore: 0,
    credentialCount: 0,
    stakeAmount: '0',
  }),
}));

import authRoutes from '../src/routes/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/nonce', () => {
    it('should return a nonce for a valid address', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .send({ address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' })
        .expect(200);

      expect(response.body).toHaveProperty('nonce');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body.nonce).toContain('satsid-auth-');
    });

    it('should reject missing address', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should reject invalid address format', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .send({ address: 'invalid-address' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Invalid Stacks address');
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should return a token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          signature: 'abcdef1234567890',
          publicKey: '0x1234567890abcdef',
          nonce: 'satsid-auth-1234567890-abcdef',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.token).toBe('mock.jwt.token');
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({ address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });
});
