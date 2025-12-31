# New API Endpoints - Missing Features Implementation

This document lists all new endpoints added in the Missing API Features implementation.

## Sprint 1: Critical Features

### 1. My Groups Endpoint
**GET** `/api/groups/my-groups`

Get list of groups where the current user is a member.

**Auth:** Required

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `role` (string, optional) - Filter by role: ADMIN, JUDGE, MODERATOR, MEMBER
- `search` (string, optional) - Search by group name
- `sort` (string, optional) - Sort by: recent, active, members

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Crypto Enthusiasts",
      "description": "...",
      "iconUrl": "https://...",
      "isPublic": true,
      "userRole": "MEMBER",
      "joinedAt": "2024-01-01T00:00:00Z",
      "stats": {
        "memberCount": 42,
        "activeMarkets": 5,
        "totalVolume": 1250.50
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### 2. Enhanced My Votes Endpoint
**GET** `/api/predictions/my-votes`

Get current user's vote history with enhanced pagination and filters.

**Auth:** Required

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `status` (string, optional) - Filter by market status: ACTIVE, RESOLVED, PENDING
- `groupId` (string, optional) - Filter by group ID
- `outcome` (string, optional) - Filter by outcome: won, lost, pending

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "marketId": "uuid",
      "prediction": "YES",
      "amount": 10.0,
      "hasClaimedReward": false,
      "rewardAmount": null,
      "mockYield": 0.0137,
      "daysSinceVote": 5,
      "createdAt": "2024-01-01T00:00:00Z",
      "market": {
        "id": "uuid",
        "title": "Will BTC reach $100k?",
        "status": "ACTIVE",
        "outcome": null,
        "endDate": "2024-12-31T23:59:59Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

### 3. Check My Vote Endpoint
**GET** `/api/predictions/:marketId/my-vote`

Check if current user has voted on a specific market.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "marketId": "uuid",
    "prediction": "YES",
    "amount": 10.0,
    "createdAt": "2024-01-01T00:00:00Z",
    "hasClaimedReward": false,
    "rewardAmount": null,
    "market": {
      "id": "uuid",
      "title": "Will BTC reach $100k?",
      "status": "ACTIVE",
      "outcome": null
    }
  }
}
```

Or if no vote:
```json
{
  "success": true,
  "data": null,
  "message": "No vote found for this market"
}
```

## Sprint 2: High Priority Features

### 4. Filter Group Members by Role
**GET** `/api/groups/:id/members?role=JUDGE`

Get group members with optional role filter.

**Auth:** Optional

**Query Parameters:**
- `role` (string, optional) - Filter by role: ADMIN, JUDGE, MODERATOR, MEMBER

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "role": "JUDGE",
      "joinedAt": "2024-01-01T00:00:00Z",
      "user": {
        "id": "uuid",
        "displayName": "John Doe",
        "avatarUrl": "https://...",
        "walletAddress": "0x...",
        "totalPredictions": 42,
        "correctPredictions": 28
      }
    }
  ]
}
```

### 5. My Votes Statistics
**GET** `/api/predictions/my-votes/stats`

Get aggregate statistics for current user's votes.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVotes": 42,
    "totalInvested": 420.0,
    "totalEarnings": 525.50,
    "roi": 0.2512,
    "winRate": 0.6667,
    "activeVotes": 15,
    "resolvedVotes": 27,
    "wonVotes": 18,
    "lostVotes": 9,
    "averageStake": 10.0,
    "byGroup": [
      {
        "groupId": "uuid",
        "groupName": "Crypto Enthusiasts",
        "votes": 20,
        "earnings": 250.50
      }
    ]
  }
}
```

### 6. Filter Markets by Type
**GET** `/api/predictions?marketType=NO_LOSS`

List prediction markets with market type filter.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `groupId` (string, optional)
- `status` (string, optional)
- `marketType` (string, optional) - Filter by type: STANDARD, NO_LOSS, WITH_YIELD

## Sprint 3: Polish Features

### 7. Get Group Settings
**GET** `/api/groups/:id/settings`

Get group settings (default market type and allowed types).

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "defaultMarketType": "STANDARD",
    "allowedMarketTypes": ["STANDARD", "NO_LOSS"]
  }
}
```

### 8. Update Group Settings
**PUT** `/api/groups/:id/settings`

Update group settings (Admin only).

**Auth:** Required (Admin)

**Request Body:**
```json
{
  "defaultMarketType": "NO_LOSS",
  "allowedMarketTypes": ["STANDARD", "NO_LOSS", "WITH_YIELD"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "defaultMarketType": "NO_LOSS",
    "allowedMarketTypes": ["STANDARD", "NO_LOSS", "WITH_YIELD"]
  },
  "message": "Settings updated successfully"
}
```

### 9. Judge Resolution History
**GET** `/api/predictions/resolved-by/:userId`

Get list of markets resolved by a specific judge.

**Auth:** Optional

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "onChainId": "5",
      "title": "Will BTC reach $100k?",
      "status": "RESOLVED",
      "outcome": "YES",
      "resolvedAt": "2024-01-15T00:00:00Z",
      "resolutionNote": "Bitcoin reached $100k on Jan 15",
      "participantCount": 42,
      "group": {
        "id": "uuid",
        "name": "Crypto Enthusiasts"
      },
      "creator": {
        "id": "uuid",
        "displayName": "John Doe",
        "avatarUrl": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

### 10. Bulk Assign Judges
**POST** `/api/groups/:groupId/judges/bulk`

Assign multiple users as judges in a group (Admin only).

**Auth:** Required (Admin)

**Request Body:**
```json
{
  "userIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": [
      {
        "id": "uuid",
        "role": "JUDGE",
        "user": {
          "id": "uuid-1",
          "displayName": "John Doe"
        }
      }
    ],
    "failed": [
      {
        "userId": "uuid-3",
        "error": "User uuid-3 is not a member of this group"
      }
    ],
    "summary": {
      "total": 3,
      "succeeded": 2,
      "failed": 1
    }
  },
  "message": "Bulk judge assignment completed"
}
```

## Getting Bearer Token

Before testing these endpoints, you need to get a JWT Bearer token. There are 2 ways:

### Option 1: Wallet Authentication (Production Method)

**Step 1:** Get sign-in message
```bash
POST /api/auth/wallet/message
{
  "walletAddress": "0x..."
}
```

**Step 2:** Sign message with your Aptos wallet (Petra, Martian, etc.)

**Step 3:** Verify signature
```bash
POST /api/auth/wallet/verify
{
  "walletAddress": "0x...",
  "signature": "0x...",  // From wallet
  "publicKey": "0x...",  // From wallet
  "message": "..."       // From step 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // ← Use this!
    "user": { ... }
  }
}
```

### Option 2: Legacy Auth (Quick Testing)

For quick testing without wallet:

```bash
POST /api/users/auth/privy
{
  "walletAddress": "0x...",
  "displayName": "Test User"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // ← Use this!
    "user": { ... }
  }
}
```

### Testing Tools

We provide 2 scripts to help you get the token:

1. **Browser UI** (Recommended): Open `backend/scripts/test-wallet-auth-browser.html`
   - Beautiful UI with step-by-step process
   - Works with Petra, Martian, and other Aptos wallets
   - Copy token button for easy testing

2. **Node.js Script**: Run `node backend/scripts/test-wallet-auth.js`
   - Command-line testing
   - Requires private key

See `backend/scripts/README.md` for detailed instructions.

## Postman Collection

Import the updated Postman collection from `backend/postman/Predictly_API.postman_collection.json` to test these endpoints.

### Testing Flow

1. **Authenticate:** Use wallet authentication to get JWT token
2. **Create/Join Group:** Create or join a group
3. **Test My Groups:** `GET /api/groups/my-groups`
4. **Create Market:** Create a prediction market
5. **Place Vote:** Vote on the market
6. **Check My Vote:** `GET /api/predictions/:marketId/my-vote`
7. **View Stats:** `GET /api/predictions/my-votes/stats`
8. **Filter Members:** `GET /api/groups/:id/members?role=JUDGE`
9. **Update Settings:** `PUT /api/groups/:id/settings` (as admin)
10. **Bulk Assign:** `POST /api/groups/:groupId/judges/bulk` (as admin)

## Error Responses

All endpoints follow the standard error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
