/**
 * Bug Condition Exploration Test - Task 1
 *
 * Property 1: Fault Condition - On-Chain Transaction Never Submitted for Valid Votes
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 *
 * CRITICAL: This test MUST FAIL on unfixed code.
 * Failure confirms the bug: placeVote writes to DB without calling the smart contract.
 *
 * When the fix is applied (Task 3), this test will PASS.
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

// Mocks must be declared before any imports that use them

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

// Spy on aptos.signAndSubmitTransaction inside contract.service.ts
const mockSignAndSubmit = jest.fn();
const mockBuildSimple = jest.fn();
const mockWaitForTransaction = jest.fn();

jest.mock('@aptos-labs/ts-sdk', () => {
  const mockAccount = { accountAddress: '0xmockadmin' };
  return {
    Aptos: jest.fn().mockImplementation(() => ({
      signAndSubmitTransaction: (a) => mockSignAndSubmit(a),
      waitForTransaction: (a) => mockWaitForTransaction(a),
      transaction: {
        build: {
          simple: (a) => mockBuildSimple(a),
        },
      },
      view: jest.fn(),
    })),
    AptosConfig: jest.fn().mockImplementation(() => ({})),
    Network: { CUSTOM: 'custom' },
    Account: { fromPrivateKey: jest.fn().mockReturnValue(mockAccount) },
    Ed25519PrivateKey: jest.fn().mockImplementation(() => ({})),
  };
});

// Imports (after mocks)
import { placeVote } from '../controllers/predictions.controller.js';

// Helpers

function buildRequest(prediction, amount, marketId = 'market-001', userId = 'user-001') {
  return {
    params: { id: marketId },
    body: { prediction, amount },
    user: { id: userId },
  };
}

function buildResponse() {
  let capturedStatus = 0;
  const res = {};
  res.status = jest.fn().mockImplementation((code) => {
    capturedStatus = code;
    return res;
  });
  res.json = jest.fn().mockReturnValue(res);
  return { res, getStatus: () => capturedStatus };
}

function validMarket(minStake = 1, maxStake = 100) {
  return {
    id: 'market-001',
    status: 'ACTIVE',
    minStake,
    maxStake,
    onChainId: 42,
    yesPool: 0,
    noPool: 0,
    group: { members: [{ id: 'membership-001' }] },
  };
}

function createdVote(prediction, amount, txHash = null) {
  return {
    id: 'vote-001',
    marketId: 'market-001',
    userId: 'user-001',
    prediction,
    amount,
    onChainTxHash: txHash,
    hasClaimedReward: false,
    rewardAmount: null,
    createdAt: new Date(),
  };
}

// Setup

beforeEach(() => {
  jest.clearAllMocks();
  mockVoteFindUnique.mockResolvedValue(null);
  mockTransaction.mockImplementation(async (ops) => {
    if (Array.isArray(ops)) {
      return Promise.all(ops);
    }
    return ops;
  });
  mockVoteCreate.mockResolvedValue(createdVote('YES', 10));
  mockMarketUpdate.mockResolvedValue({});
  mockBuildSimple.mockResolvedValue({});
  mockSignAndSubmit.mockResolvedValue({ hash: '0xdeadbeef' });
  mockWaitForTransaction.mockResolvedValue({});
});

/**
 * Scoped PBT Approach: concrete failing cases covering the bug condition space.
 *
 * For each case: valid member, active market, no prior vote, amount in [minStake, maxStake].
 * Assert that aptos.signAndSubmitTransaction IS called exactly once.
 *
 * On UNFIXED code: signAndSubmitTransaction is NEVER called -> test FAILS -> bug confirmed.
 * On FIXED code:   signAndSubmitTransaction IS called once  -> test PASSES -> bug fixed.
 */
describe('Property 1: Fault Condition - placeVoteOnChain called for valid votes', () => {
  test('YES prediction at mid-range stake submits on-chain transaction', async () => {
    mockMarketFindUnique.mockResolvedValue(validMarket(1, 100));
    mockVoteCreate.mockResolvedValue(createdVote('YES', 10, '0xdeadbeef'));

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('YES', 10), res);

    // ASSERT: on-chain transaction was submitted (FAILS on unfixed code)
    expect(mockSignAndSubmit).toHaveBeenCalledTimes(1);
    expect(getStatus()).toBe(201);
    const call = mockVoteCreate.mock.calls[0]?.[0];
    expect(call?.data?.onChainTxHash).toBeTruthy();
  });

  test('NO prediction at mid-range stake submits on-chain transaction', async () => {
    mockMarketFindUnique.mockResolvedValue(validMarket(1, 100));
    mockVoteCreate.mockResolvedValue(createdVote('NO', 10, '0xdeadbeef'));

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('NO', 10), res);

    expect(mockSignAndSubmit).toHaveBeenCalledTimes(1);
    expect(getStatus()).toBe(201);
    const call = mockVoteCreate.mock.calls[0]?.[0];
    expect(call?.data?.onChainTxHash).toBeTruthy();
  });

  test('YES prediction at minStake boundary submits on-chain transaction', async () => {
    const minStake = 5;
    mockMarketFindUnique.mockResolvedValue(validMarket(minStake, 100));
    mockVoteCreate.mockResolvedValue(createdVote('YES', minStake, '0xdeadbeef'));

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('YES', minStake), res);

    expect(mockSignAndSubmit).toHaveBeenCalledTimes(1);
    expect(getStatus()).toBe(201);
    const call = mockVoteCreate.mock.calls[0]?.[0];
    expect(call?.data?.onChainTxHash).toBeTruthy();
  });

  test('YES prediction at maxStake boundary submits on-chain transaction', async () => {
    const maxStake = 50;
    mockMarketFindUnique.mockResolvedValue(validMarket(1, maxStake));
    mockVoteCreate.mockResolvedValue(createdVote('YES', maxStake, '0xdeadbeef'));

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('YES', maxStake), res);

    expect(mockSignAndSubmit).toHaveBeenCalledTimes(1);
    expect(getStatus()).toBe(201);
    const call = mockVoteCreate.mock.calls[0]?.[0];
    expect(call?.data?.onChainTxHash).toBeTruthy();
  });

  test('NO prediction at maxStake boundary submits on-chain transaction', async () => {
    const maxStake = 50;
    mockMarketFindUnique.mockResolvedValue(validMarket(1, maxStake));
    mockVoteCreate.mockResolvedValue(createdVote('NO', maxStake, '0xdeadbeef'));

    const { res, getStatus } = buildResponse();
    await placeVote(buildRequest('NO', maxStake), res);

    expect(mockSignAndSubmit).toHaveBeenCalledTimes(1);
    expect(getStatus()).toBe(201);
    const call = mockVoteCreate.mock.calls[0]?.[0];
    expect(call?.data?.onChainTxHash).toBeTruthy();
  });
});
