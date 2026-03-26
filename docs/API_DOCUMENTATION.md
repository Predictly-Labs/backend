# Predictly API Documentation

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.predictly.xyz/api
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Most endpoints require a valid JWT token in the Authorization header.

### Header Format

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### 1. Generate Sign-In Message

Generate a message to be signed by the user's wallet for authentication.

**Endpoint:** `POST /auth/wallet/message`

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "walletAddress": "0x123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Sign this message to authenticate with Predictly...",
    "nonce": "abc123...",
    "expiresAt": "2024-12-28T12:05:00.000Z"
  }
}
```

**Notes:**
- The nonce expires after 5 minutes
- The message must be signed with the wallet's private key
- Use the exact message string for signature verification

---

### 2. Verify Signature

Verify the signed message and authenticate the user.

**Endpoint:** `POST /auth/wallet/verify`

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "walletAddress": "0x123...",
  "signature": "0xabc...",
  "message": "Sign this message to authenticate with Predictly..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "walletAddress": "0x123...",
      "displayName": "User_123abc",
      "avatarUrl": null,
      "createdAt": "2024-12-28T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Welcome back!"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid signature or message format
- `401 Unauthorized`: Signature verification failed
- `429 Too Many Requests`: Rate limit exceeded

---

### 3. Get Current User

Get the authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "walletAddress": "0x123...",
    "displayName": "User_123abc",
    "avatarUrl": null,
    "totalPredictions": 10,
    "correctPredictions": 7,
    "totalEarnings": "150.50",
    "currentStreak": 3,
    "createdAt": "2024-12-28T12:00:00.000Z",
    "memberships": [
      {
        "id": "membership-uuid",
        "role": "MEMBER",
        "joinedAt": "2024-12-28T12:00:00.000Z",
        "group": {
          "id": "group-uuid",
          "name": "Crypto Predictions",
          "iconUrl": "https://..."
        }
      }
    ],
    "_count": {
      "memberships": 5,
      "votes": 10,
      "createdMarkets": 2
    }
  }
}
```

---

## Market Endpoints

### 1. Create Market

Create a new prediction market (off-chain, free).

**Endpoint:** `POST /markets`

**Authentication:** Required

**Rate Limit:** 10 markets per hour per user

**Request Body:**
```json
{
  "groupId": "group-uuid",
  "title": "Will Bitcoin reach $100k by end of 2024?",
  "description": "Market resolves YES if BTC price reaches $100,000 USD...",
  "imageUrl": "https://example.com/image.jpg",
  "marketType": "STANDARD",
  "endDate": "2024-12-31T23:59:59Z",
  "minStake": 1.0,
  "maxStake": 100.0
}
```

**Market Types:**
- `STANDARD`: Regular prediction market
- `NO_LOSS`: Zero-loss market (stake returned on loss)
- `WITH_YIELD`: Market with yield generation

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "market-uuid",
    "groupId": "group-uuid",
    "creatorId": "user-uuid",
    "title": "Will Bitcoin reach $100k by end of 2024?",
    "description": "Market resolves YES if BTC price reaches $100,000 USD...",
    "imageUrl": "https://example.com/image.jpg",
    "marketType": "STANDARD",
    "status": "PENDING",
    "endDate": "2024-12-31T23:59:59Z",
    "minStake": "1.0",
    "maxStake": "100.0",
    "onChainId": null,
    "createdAt": "2024-12-28T12:00:00.000Z"
  },
  "message": "Market created successfully"
}
```

**Notes:**
- Market is created off-chain with status `PENDING`
- No gas fees required for creation
- Market will be initialized on-chain when first user votes

---

### 2. Initialize Market

Initialize a market on-chain (backend pays gas fees).

**Endpoint:** `POST /markets/:id/initialize`

**Authentication:** Required

**Rate Limit:** 3 attempts per 5 minutes per market

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "market-uuid",
    "onChainId": "12345",
    "status": "ACTIVE",
    "transactionHash": "0xabc...",
    "blockNumber": 123456
  },
  "message": "Market initialized on-chain successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Market already initialized
- `404 Not Found`: Market not found
- `409 Conflict`: Market initialization in progress
- `500 Internal Server Error`: Blockchain transaction failed
- `503 Service Unavailable`: Relay wallet insufficient balance

**Notes:**
- This endpoint is typically called automatically by the frontend before first vote
- Backend relay wallet pays gas fees
- Idempotent: returns existing data if already initialized
- Uses PostgreSQL advisory locks to prevent race conditions

---

### 3. Get Market

Get market details with on-chain data.

**Endpoint:** `GET /markets/:id`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "market-uuid",
    "groupId": "group-uuid",
    "title": "Will Bitcoin reach $100k by end of 2024?",
    "description": "Market resolves YES if BTC price reaches $100,000 USD...",
    "imageUrl": "https://example.com/image.jpg",
    "marketType": "STANDARD",
    "status": "ACTIVE",
    "endDate": "2024-12-31T23:59:59Z",
    "minStake": "1.0",
    "maxStake": "100.0",
    "onChainId": "12345",
    "createdAt": "2024-12-28T12:00:00.000Z",
    "creator": {
      "id": "user-uuid",
      "displayName": "User_123abc",
      "avatarUrl": null
    },
    "onChainData": {
      "totalYesStake": "1500.50",
      "totalNoStake": "850.25",
      "totalStake": "2350.75",
      "yesPercentage": 63.8,
      "noPercentage": 36.2,
      "participantCount": 42,
      "isResolved": false,
      "outcome": null
    }
  }
}
```

**Notes:**
- Returns cached on-chain data if available
- On-chain data is synced every 1 minute for active markets
- If market is not initialized, `onChainData` will be null

---

### 4. Sync Market Data

Manually sync market data from blockchain.

**Endpoint:** `POST /markets/:id/sync`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "market-uuid",
    "onChainData": {
      "totalYesStake": "1500.50",
      "totalNoStake": "850.25",
      "totalStake": "2350.75",
      "yesPercentage": 63.8,
      "noPercentage": 36.2,
      "participantCount": 42,
      "isResolved": false,
      "outcome": null
    },
    "syncedAt": "2024-12-28T12:00:00.000Z"
  },
  "message": "Market data synced successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Market not initialized on-chain
- `404 Not Found`: Market not found

---

### 5. Get Group Markets

Get all markets for a specific group.

**Endpoint:** `GET /groups/:groupId/markets`

**Authentication:** Not required

**Query Parameters:**
- `status` (optional): Filter by status (`PENDING`, `ACTIVE`, `RESOLVED`, `CANCELLED`)
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```
GET /groups/group-uuid/markets?status=ACTIVE&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "markets": [
      {
        "id": "market-uuid",
        "title": "Will Bitcoin reach $100k by end of 2024?",
        "imageUrl": "https://example.com/image.jpg",
        "marketType": "STANDARD",
        "status": "ACTIVE",
        "endDate": "2024-12-31T23:59:59Z",
        "onChainId": "12345",
        "createdAt": "2024-12-28T12:00:00.000Z",
        "creator": {
          "id": "user-uuid",
          "displayName": "User_123abc"
        },
        "onChainData": {
          "totalStake": "2350.75",
          "yesPercentage": 63.8,
          "noPercentage": 36.2,
          "participantCount": 42
        }
      }
    ],
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

---

## Admin Endpoints

Admin endpoints require an admin token in the Authorization header.

### Header Format

```
Authorization: Bearer <admin_token>
```

### 1. Get Relay Wallet Balance

Get the current balance of the relay wallet.

**Endpoint:** `GET /admin/relay-wallet/balance`

**Authentication:** Admin token required

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x123...",
    "balance": "150.5",
    "balanceFormatted": "150.50 MOVE",
    "minBalance": "10.0",
    "isLow": false,
    "checkedAt": "2024-12-28T12:00:00.000Z"
  }
}
```

**Notes:**
- Balance is in MOVE tokens
- `isLow` is true when balance < `RELAY_WALLET_MIN_BALANCE`

---

### 2. Get Relay Wallet Transactions

Get recent transactions from the relay wallet.

**Endpoint:** `GET /admin/relay-wallet/transactions`

**Authentication:** Admin token required

**Query Parameters:**
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "hash": "0xabc...",
        "type": "market_initialization",
        "marketId": "market-uuid",
        "gasUsed": "0.001",
        "status": "success",
        "timestamp": "2024-12-28T12:00:00.000Z"
      }
    ],
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 3. Monitor Relay Wallet

Manually trigger relay wallet monitoring.

**Endpoint:** `POST /admin/relay-wallet/monitor`

**Authentication:** Admin token required

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": "150.5",
    "isLow": false,
    "message": "Relay wallet balance is healthy"
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Rate Limit Headers

All rate-limited endpoints include these headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
```

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 300
  }
}
```

---

## Webhooks (Coming Soon)

Webhook support for real-time market updates is planned for future releases.

---

## SDK Support

Official SDKs are planned for:
- JavaScript/TypeScript
- Python
- Go

---

## Support

For API support or questions:
- GitHub Issues: https://github.com/predictly/backend/issues
- Email: support@predictly.xyz
- Discord: https://discord.gg/predictly
