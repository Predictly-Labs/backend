/**
 * Preservation Property Tests - Task 2
 *
 * Property 2: Preservation - Validation Rejections Unchanged
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 *
 * Observation-first methodology:
 *   - non-member request        → 403, no DB write, no on-chain call
 *   - inactive-market request   → 400, no DB write, no on-chain call
 *   - duplicate-vote request    → 400, no DB write, no on-chain call
 *   - amount below minStake     → 400, no DB write, no on-chain call
 *   - amount above maxStake     → 400, no DB write, no on-chain call
 *
 * EXPECTED OUTCOME: Tests PASS on unfixed code — confirms baseline to preserve.
 */

// @ts-nocheck
/* eslint-disable */

// Set env vars before any module imports so contract.service.ts picks them up
process.env.MOVEMENT_PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';
process.env.PINATA_API_KEY = 'test';
process.env.PINATA_SECRET_KEY = 'test';
process.env.PRIVY_APP_ID = 'test';
process.env.PRIVY_APP_SECRET = 'test';

import { jest } from '@jest/globals';

// ── Mocks (must be declared before imports) ──────────────────────────────────

const mockVoteCreate = jest.fn();
const mockMarketUpdate = jest.fn();
const mockTransaction = jest.fn();
const mockMarketFindUnique = jest.fn();
const mockVoteFindUnique = jest.fn();

jest.mock('../config/database.js', () => ({
  prisma: {
    predictionMarket: {
      findUnique: (a) => mockMarketFindUnique(a),
      update: (a) => mockMarketUpdate(a),
    },
    vote: {
      findUnique: (a) => mockVoteFindUnique(a),
      create: (a) => mockVoteCreate(a),
    },
    $transaction: (ops) => mockTransaction(ops),
  },
}));

const mockSignAndSubmit = jest.fn();
const mockBuildSimple = jest.fn();
const mockWaitForTransaction = jest.fn();

jest.mock('@aptos-labs/ts-sdk', () => ({
  Aptos: jest.fn().mockImplementation(() => ({
    signAndSubmitTransaction: (a) => mockSignAndSubmit(a),
    waitForTransaction: (a) => mockWaitForTransaction(a),
    transaction: { build: { simple: (a) => mockBuildSimple(a) } },
    view: jest.fn(),
  })),
  AptosConfig: jest.fn().mockImplementation(() => ({})),
  Network: { CUSTOM: 'custom' },
  Account: { fromPrivateKey: jest.fn().mockReturnValue({ accountAddress: '0xmockadmin' }) },
  Ed25519PrivateKey: jest.fn().mockImplementation(() => ({})),
}));

import { placeVote } from '../controllers/predictions.controller.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRequest(
  prediction: string,
  amount: number,
  marketId = 'market-001',
  userId = 'user-001',
) {
  return { params: { id: marketId }, body: { prediction, amount }, user: { id: userId } };
}

function buildResponse() {
  let capturedStatus = 0;
  const res: any = {};
  res.status = jest.fn().mockImplementation((code: number) => {
    capturedStatus = code;
    return res;
  });
  res.json = jest.fn().mockReturnValue(res);
  return { res, getStatus: () => capturedStatus };
}

/** Market where the requesting user IS a member */
function activeMarket(minStake = 1, maxStake: number | null = 100) {
  return {
    id: 'market-001',
    onChainId: '42',
    status: 'ACTIVE',
    minStake,
    maxStake,
    yesPool: 0,
    noPool: 0,
    group: { members: [{ id: 'membership-001' }] },
  };
}

/** Market where the requesting user is NOT a member */
function activeMarketNoMember(minStake = 1, maxStake: number | null = 100) {
  return {
    id: 'market-001',
    status: 'ACTIVE',
    minStake,
    maxStake,
    yesPool: 0,
    noPool: 0,
    group: { members: [] },
  };
}

function inactiveMarket(status: string) {
  return {
    id: 'market-001',
    status,
    minStake: 1,
    maxStake: 100,
    yesPool: 0,
    noPool: 0,
    group: { members: [{ id: 'membership-001' }] },
  };
}

function existingVote() {
  return {
    id: 'vote-existing',
    marketId: 'market-001',
    userId: 'user-001',
    prediction: 'YES',
    amount: 10,
    onChainTxHash: null,
    hasClaimedReward: false,
    rewardAmount: null,
    createdAt: new Date(),
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no prior vote
  mockVoteFindUnique.mockResolvedValue(null);
  // Default: transaction executes all ops
  mockTransaction.mockImplementation(async (ops) => {
    if (Array.isArray(ops)) return Promise.all(ops);
    return ops;
  });
  mockVoteCreate.mockResolvedValue({
    id: 'vote-001',
    marketId: 'market-001',
    userId: 'user-001',
    prediction: 'YES',
    amount: 10,
    onChainTxHash: null,
    hasClaimedReward: false,
    rewardAmount: null,
    createdAt: new Date(),
  });
  mockMarketUpdate.mockResolvedValue({});
  mockBuildSimple.mockResolvedValue({});
  mockSignAndSubmit.mockResolvedValue({ hash: '0xdeadbeef' });
  mockWaitForTransaction.mockResolvedValue({});
});

// ── Property 2: Preservation ──────────────────────────────────────────────────

/**
 * Requirement 3.1 — Non-member requests continue to return 403.
 * placeVoteOnChain (signAndSubmitTransaction) must NOT be called.
 */
describe('Property 2 – Req 3.1: Non-member → 403, no on-chain call', () => {
  const nonMemberCases = [
    { prediction: 'YES', amount: 10 },
    { prediction: 'NO', amount: 10 },
    { prediction: 'YES', amount: 1 },   // minStake boundary
    { prediction: 'YES', amount: 100 },  // maxStake boundary
    { prediction: 'NO', amount: 50 },
  ];

  test.each(nonMemberCases)(
    'non-member vote ($prediction, $amount) → 403 and no on-chain call',
    async ({ prediction, amount }) => {
      mockMarketFindUnique.mockResolvedValue(activeMarketNoMember(1, 100));

      const { res, getStatus } = buildResponse();
      await placeVote(buildRequest(prediction, amount), res);

      expect(getStatus()).toBe(403);
      expect(mockSignAndSubmit).not.toHaveBeenCalled();
      expect(mockVoteCreate).not.toHaveBeenCalled();
    },
  );

  // PBT: generate many non-member scenarios
  test('property: any non-member request returns 403 and never calls on-chain', async () => {
    const amounts = [1, 5, 10, 50, 100, 99, 2];
    const predictions = ['YES', 'NO'];

    for (const prediction of predictions) {
      for (const amount of amounts) {
        jest.clearAllMocks();
        mockVoteFindUnique.mockResolvedValue(null);
        mockMarketFindUnique.mockResolvedValue(activeMarketNoMember(1, 100));

        const { res, getStatus } = buildResponse();
        await placeVote(buildRequest(prediction, amount), res);

        expect(getStatus()).toBe(403);
        expect(mockSignAndSubmit).not.toHaveBeenCalled();
        expect(mockVoteCreate).not.toHaveBeenCalled();
      }
    }
  });
});

/**
 * Requirement 3.2 — Inactive-market requests continue to return 400.
 * placeVoteOnChain must NOT be called.
 */
describe('Property 2 – Req 3.2: Inactive market → 400, no on-chain call', () => {
  const inactiveStatuses = ['PENDING', 'RESOLVED', 'CANCELLED', 'CLOSED'];

  test.each(inactiveStatuses)(
    'market status %s → 400 and no on-chain call',
    async (status) => {
      mockMarketFindUnique.mockResolvedValue(inactiveMarket(status));

      const { res, getStatus } = buildResponse();
      await placeVote(buildRequest('YES', 10), res);

      expect(getStatus()).toBe(400);
      expect(mockSignAndSubmit).not.toHaveBeenCalled();
      expect(mockVoteCreate).not.toHaveBeenCalled();
    },
  );

  // PBT: cross inactive statuses × predictions × amounts
  test('property: any inactive-market request returns 400 and never calls on-chain', async () => {
    const statuses = ['PENDING', 'RESOLVED', 'CANCELLED', 'CLOSED'];
    const predictions = ['YES', 'NO'];
    const amounts = [1, 10, 100];

    for (const status of statuses) {
      for (const prediction of predictions) {
        for (const amount of amounts) {
          jest.clearAllMocks();
          mockVoteFindUnique.mockResolvedValue(null);
          mockMarketFindUnique.mockResolvedValue(inactiveMarket(status));

          const { res, getStatus } = buildResponse();
          await placeVote(buildRequest(prediction, amount), res);

          expect(getStatus()).toBe(400);
          expect(mockSignAndSubmit).not.toHaveBeenCalled();
          expect(mockVoteCreate).not.toHaveBeenCalled();
        }
      }
    }
  });
});

/**
 * Requirement 3.3 — Duplicate-vote requests continue to return 400.
 * placeVoteOnChain must NOT be called.
 */
describe('Property 2 – Req 3.3: Duplicate vote → 400, no on-chain call', () => {
  test('duplicate YES vote → 400 and no on-chain call', async () => {
    mockMarketFindUnique.mockResolvedValue(activeMarket());
    mockVoteFindUnique.mockResolvedValue(existingVote());

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('YES', 10), res);

    expect(getStatus()).toBe(400);
    expect(mockSignAndSubmit).not.toHaveBeenCalled();
    expect(mockVoteCreate).not.toHaveBeenCalled();
  });

  test('duplicate NO vote → 400 and no on-chain call', async () => {
    mockMarketFindUnique.mockResolvedValue(activeMarket());
    mockVoteFindUnique.mockResolvedValue({ ...existingVote(), prediction: 'NO' });

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('NO', 10), res);

    expect(getStatus()).toBe(400);
    expect(mockSignAndSubmit).not.toHaveBeenCalled();
    expect(mockVoteCreate).not.toHaveBeenCalled();
  });

  // PBT: duplicate across predictions × amounts
  test('property: any duplicate vote returns 400 and never calls on-chain', async () => {
    const predictions = ['YES', 'NO'];
    const amounts = [1, 5, 10, 50, 100];

    for (const prediction of predictions) {
      for (const amount of amounts) {
        jest.clearAllMocks();
        mockMarketFindUnique.mockResolvedValue(activeMarket(1, 100));
        mockVoteFindUnique.mockResolvedValue(existingVote());

        const { res, getStatus } = buildResponse();
        await placeVote(buildRequest(prediction, amount), res);

        expect(getStatus()).toBe(400);
        expect(mockSignAndSubmit).not.toHaveBeenCalled();
        expect(mockVoteCreate).not.toHaveBeenCalled();
      }
    }
  });
});

/**
 * Requirement 3.4 — Amount below minStake continues to return 400.
 * placeVoteOnChain must NOT be called.
 */
describe('Property 2 – Req 3.4: Amount below minStake → 400, no on-chain call', () => {
  test('amount 0 with minStake 1 → 400 and no on-chain call', async () => {
    mockMarketFindUnique.mockResolvedValue(activeMarket(1, 100));

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('YES', 0), res);

    expect(getStatus()).toBe(400);
    expect(mockSignAndSubmit).not.toHaveBeenCalled();
    expect(mockVoteCreate).not.toHaveBeenCalled();
  });

  test('amount just below minStake → 400 and no on-chain call', async () => {
    mockMarketFindUnique.mockResolvedValue(activeMarket(10, 100));

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('YES', 9), res);

    expect(getStatus()).toBe(400);
    expect(mockSignAndSubmit).not.toHaveBeenCalled();
    expect(mockVoteCreate).not.toHaveBeenCalled();
  });

  // PBT: generate amounts strictly below various minStake values
  test('property: any amount below minStake returns 400 and never calls on-chain', async () => {
    const minStakes = [1, 5, 10, 20, 50];
    const predictions = ['YES', 'NO'];

    for (const minStake of minStakes) {
      // amounts strictly below minStake
      const belowAmounts = [0, minStake - 1].filter((a) => a >= 0 && a < minStake);
      for (const prediction of predictions) {
        for (const amount of belowAmounts) {
          jest.clearAllMocks();
          mockVoteFindUnique.mockResolvedValue(null);
          mockMarketFindUnique.mockResolvedValue(activeMarket(minStake, minStake * 10));

          const { res, getStatus } = buildResponse();
          await placeVote(buildRequest(prediction, amount), res);

          expect(getStatus()).toBe(400);
          expect(mockSignAndSubmit).not.toHaveBeenCalled();
          expect(mockVoteCreate).not.toHaveBeenCalled();
        }
      }
    }
  });
});

/**
 * Requirement 3.5 — Amount above maxStake continues to return 400.
 * placeVoteOnChain must NOT be called.
 */
describe('Property 2 – Req 3.5: Amount above maxStake → 400, no on-chain call', () => {
  test('amount just above maxStake → 400 and no on-chain call', async () => {
    mockMarketFindUnique.mockResolvedValue(activeMarket(1, 100));

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('YES', 101), res);

    expect(getStatus()).toBe(400);
    expect(mockSignAndSubmit).not.toHaveBeenCalled();
    expect(mockVoteCreate).not.toHaveBeenCalled();
  });

  test('amount far above maxStake → 400 and no on-chain call', async () => {
    mockMarketFindUnique.mockResolvedValue(activeMarket(1, 50));

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('NO', 999), res);

    expect(getStatus()).toBe(400);
    expect(mockSignAndSubmit).not.toHaveBeenCalled();
    expect(mockVoteCreate).not.toHaveBeenCalled();
  });

  // PBT: generate amounts strictly above various maxStake values
  test('property: any amount above maxStake returns 400 and never calls on-chain', async () => {
    const maxStakes = [10, 20, 50, 100];
    const predictions = ['YES', 'NO'];

    for (const maxStake of maxStakes) {
      const aboveAmounts = [maxStake + 1, maxStake + 10, maxStake * 2];
      for (const prediction of predictions) {
        for (const amount of aboveAmounts) {
          jest.clearAllMocks();
          mockVoteFindUnique.mockResolvedValue(null);
          mockMarketFindUnique.mockResolvedValue(activeMarket(1, maxStake));

          const { res, getStatus } = buildResponse();
          await placeVote(buildRequest(prediction, amount), res);

          expect(getStatus()).toBe(400);
          expect(mockSignAndSubmit).not.toHaveBeenCalled();
          expect(mockVoteCreate).not.toHaveBeenCalled();
        }
      }
    }
  });
});

/**
 * Requirement 3.6 — Successful votes continue to update yesPool, noPool,
 * totalVolume, yesPercentage, noPercentage, and participantCount in the DB.
 *
 * On unfixed code the DB write still happens (the bug is the missing on-chain
 * call, not the DB write), so these assertions should PASS on unfixed code.
 */
describe('Property 2 – Req 3.6: Successful vote updates DB pool fields', () => {
  test('YES vote updates yesPool, totalVolume, yesPercentage, noPercentage, participantCount', async () => {
    const market = activeMarket(1, 100);
    market.yesPool = 0;
    market.noPool = 0;
    mockMarketFindUnique.mockResolvedValue(market);

    const amount = 40;
    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('YES', amount), res);

    expect(getStatus()).toBe(201);

    // Verify prisma.predictionMarket.update was called with correct pool values
    expect(mockTransaction).toHaveBeenCalled();
    const transactionOps = mockTransaction.mock.calls[0][0];
    expect(Array.isArray(transactionOps)).toBe(true);
    expect(transactionOps).toHaveLength(2);

    // The market update call should have been made with correct values
    expect(mockMarketUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          yesPool: 40,
          noPool: 0,
          totalVolume: 40,
          yesPercentage: 100,
          noPercentage: 0,
          participantCount: expect.objectContaining({ increment: 1 }),
        }),
      }),
    );
  });

  test('NO vote updates noPool, totalVolume, yesPercentage, noPercentage, participantCount', async () => {
    const market = activeMarket(1, 100);
    market.yesPool = 0;
    market.noPool = 0;
    mockMarketFindUnique.mockResolvedValue(market);

    const amount = 60;
    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('NO', amount), res);

    expect(getStatus()).toBe(201);

    expect(mockMarketUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          yesPool: 0,
          noPool: 60,
          totalVolume: 60,
          yesPercentage: 0,
          noPercentage: 100,
          participantCount: expect.objectContaining({ increment: 1 }),
        }),
      }),
    );
  });

  test('YES vote on market with existing pool updates percentages correctly', async () => {
    const market = activeMarket(1, 200);
    market.yesPool = 60;
    market.noPool = 40;
    mockMarketFindUnique.mockResolvedValue(market);

    const amount = 100; // adds to yesPool: 60+100=160, noPool stays 40, total=200
    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('YES', amount), res);

    expect(getStatus()).toBe(201);

    expect(mockMarketUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          yesPool: 160,
          noPool: 40,
          totalVolume: 200,
          yesPercentage: 80,
          noPercentage: 20,
          participantCount: expect.objectContaining({ increment: 1 }),
        }),
      }),
    );
  });

  // PBT: property across YES/NO × various amounts
  test('property: successful vote always updates all six pool fields in DB', async () => {
    const cases = [
      { prediction: 'YES', amount: 10, yesPool: 0, noPool: 0 },
      { prediction: 'NO', amount: 25, yesPool: 0, noPool: 0 },
      { prediction: 'YES', amount: 50, yesPool: 20, noPool: 30 },
      { prediction: 'NO', amount: 15, yesPool: 85, noPool: 0 },
      { prediction: 'YES', amount: 1, yesPool: 0, noPool: 0 },
      { prediction: 'NO', amount: 100, yesPool: 0, noPool: 0 },
    ];

    for (const { prediction, amount, yesPool, noPool } of cases) {
      jest.clearAllMocks();
      mockVoteFindUnique.mockResolvedValue(null);
      mockTransaction.mockImplementation(async (ops) => {
        if (Array.isArray(ops)) return Promise.all(ops);
        return ops;
      });
      mockVoteCreate.mockResolvedValue({
        id: 'vote-001',
        marketId: 'market-001',
        userId: 'user-001',
        prediction,
        amount,
        onChainTxHash: null,
        hasClaimedReward: false,
        rewardAmount: null,
        createdAt: new Date(),
      });
      mockMarketUpdate.mockResolvedValue({});

      const market = activeMarket(1, 100);
      market.yesPool = yesPool;
      market.noPool = noPool;
      mockMarketFindUnique.mockResolvedValue(market);

      const { res, getStatus } = buildResponse();
      await placeVote(buildRequest(prediction, amount), res);

      expect(getStatus()).toBe(201);

      const isYes = prediction === 'YES';
      const newYesPool = yesPool + (isYes ? amount : 0);
      const newNoPool = noPool + (isYes ? 0 : amount);
      const total = newYesPool + newNoPool;

      expect(mockMarketUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            yesPool: newYesPool,
            noPool: newNoPool,
            totalVolume: total,
            yesPercentage: (newYesPool / total) * 100,
            noPercentage: (newNoPool / total) * 100,
            participantCount: expect.objectContaining({ increment: 1 }),
          }),
        }),
      );
    }
  });
});
