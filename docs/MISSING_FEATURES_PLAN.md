# Missing Features - Implementation Plan

## Overview

This document outlines the missing API endpoints and features identified during brainstorming session.
Implementation is divided into 3 sprints based on priority.

---

## Sprint 1: Critical Features (Week 1)

### 1. My Groups Endpoint ⚠️ CRITICAL

**Problem:** Users cannot easily see groups they are members of.

**Endpoints to Add:**

#### 1.1 GET /api/groups/my-groups

**Description:** List all groups where authenticated user is a member

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `role` (optional: ADMIN | JUDGE | MODERATOR | MEMBER)
- `search` (optional: string)
- `sort` (optional: recent | active | members)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "group-id",
      "name": "Hackathon Team",
      "iconUrl": "...",
      "userRole": "ADMIN",
      "joinedAt": "2024-01-01T00:00:00Z",
      "stats": {
        "memberCount": 5,
        "activeMarkets": 3,
        "totalVolume": 1000
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```


**Implementation Steps:**

1. Add route in `groups.routes.ts`:
```typescript
router.get('/my-groups', authMiddleware, getMyGroups);
```

2. Add controller in `groups.controller.ts`:
```typescript
export async function getMyGroups(req: Request, res: Response) {
  const userId = req.user!.id;
  const { page, limit, role, search, sort } = req.query;
  
  // Query GroupMember where userId matches
  // Include group details, stats
  // Apply filters and pagination
}
```

3. Add validator in `groups.validator.ts`:
```typescript
export const myGroupsQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  role: z.enum(['ADMIN', 'JUDGE', 'MODERATOR', 'MEMBER']).optional(),
  search: z.string().optional(),
  sort: z.enum(['recent', 'active', 'members']).optional(),
});
```

**Database Query:**
```typescript
const memberships = await prisma.groupMember.findMany({
  where: {
    userId,
    ...(role && { role }),
    ...(search && {
      group: {
        name: { contains: search, mode: 'insensitive' }
      }
    })
  },
  include: {
    group: {
      include: {
        _count: { select: { members: true, markets: true } },
        markets: { where: { status: 'ACTIVE' } }
      }
    }
  },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: sort === 'recent' ? { joinedAt: 'desc' } : undefined
});
```

---

### 2. Pagination for My Votes ⚠️ CRITICAL

**Problem:** `/api/predictions/my-votes` returns all votes without pagination.

**Endpoint to Update:**

#### 2.1 GET /api/predictions/my-votes (Add Pagination)

**New Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (optional: ACTIVE | RESOLVED | PENDING)
- `groupId` (optional: string)
- `outcome` (optional: won | lost | pending)

**Updated Response:**
```json
{
  "success": true,
  "data": [...votes],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Implementation Steps:**

1. Update validator in `predictions.validator.ts`:
```typescript
export const myVotesQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  status: z.enum(['ACTIVE', 'RESOLVED', 'PENDING']).optional(),
  groupId: z.string().uuid().optional(),
  outcome: z.enum(['won', 'lost', 'pending']).optional(),
});
```

2. Update controller in `predictions.controller.ts`:
```typescript
export async function getUserVotes(req: Request, res: Response) {
  const userId = req.user!.id;
  const { page, limit, status, groupId, outcome } = req.query;
  
  const where = {
    userId,
    ...(status && { market: { status } }),
    ...(groupId && { market: { groupId } }),
    ...(outcome === 'won' && { 
      market: { 
        status: 'RESOLVED',
        outcome: { not: null }
      },
      // Check if prediction matches outcome
    })
  };
  
  const [votes, total] = await Promise.all([
    prisma.vote.findMany({
      where,
      include: { market: {...} },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.vote.count({ where })
  ]);
  
  return successResponse(res, votes, undefined, 200, {
    page, limit, total, totalPages: Math.ceil(total / limit)
  });
}
```

---

### 3. Check My Vote on Specific Market ⚠️ CRITICAL

**Problem:** Frontend needs to know if user already voted on a market.

**Endpoint to Add:**

#### 3.1 GET /api/predictions/:marketId/my-vote

**Description:** Get authenticated user's vote on a specific market

**Response (if voted):**
```json
{
  "success": true,
  "data": {
    "id": "vote-id",
    "marketId": "market-id",
    "prediction": "YES",
    "amount": 100,
    "createdAt": "2024-01-01T00:00:00Z",
    "hasClaimedReward": false,
    "rewardAmount": null
  }
}
```

**Response (if not voted):**
```json
{
  "success": true,
  "data": null
}
```

**Implementation Steps:**

1. Add route in `predictions.routes.ts`:
```typescript
router.get('/:marketId/my-vote', authMiddleware, getMyVoteOnMarket);
```

2. Add controller in `predictions.controller.ts`:
```typescript
export async function getMyVoteOnMarket(req: Request, res: Response) {
  const userId = req.user!.id;
  const { marketId } = req.params;
  
  const vote = await prisma.vote.findUnique({
    where: {
      marketId_userId: { marketId, userId }
    },
    include: {
      market: {
        select: { id: true, title: true, status: true, outcome: true }
      }
    }
  });
  
  return successResponse(res, vote);
}
```

---

## Sprint 2: High Priority Features (Week 2)

### 4. Filter Group Members by Role

**Endpoint to Update:**

#### 4.1 GET /api/groups/:id/members (Add Role Filter)

**New Query Parameters:**
- `role` (optional: ADMIN | JUDGE | MODERATOR | MEMBER)

**Implementation:**

Update `groups.controller.ts`:
```typescript
export async function getGroupMembers(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.query;
  
  const members = await prisma.groupMember.findMany({
    where: { 
      groupId: id,
      ...(role && { role })
    },
    include: { user: {...} },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }]
  });
  
  return successResponse(res, members);
}
```

---

### 5. My Predictions Stats

**Endpoint to Add:**

#### 5.1 GET /api/predictions/my-votes/stats

**Description:** Get aggregate statistics for user's predictions

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVotes": 50,
    "totalInvested": 5000,
    "totalEarnings": 6500,
    "roi": 0.30,
    "winRate": 0.65,
    "activeVotes": 10,
    "resolvedVotes": 40,
    "wonVotes": 26,
    "lostVotes": 14,
    "averageStake": 100,
    "byGroup": [
      {
        "groupId": "group-1",
        "groupName": "Hackathon",
        "votes": 20,
        "earnings": 2000
      }
    ]
  }
}
```

**Implementation:**

Add controller in `predictions.controller.ts`:
```typescript
export async function getMyVotesStats(req: Request, res: Response) {
  const userId = req.user!.id;
  
  // Aggregate queries
  const totalVotes = await prisma.vote.count({ where: { userId } });
  const votes = await prisma.vote.findMany({
    where: { userId },
    include: { market: { select: { status, outcome, groupId, group: true } } }
  });
  
  // Calculate stats
  const totalInvested = votes.reduce((sum, v) => sum + v.amount, 0);
  const totalEarnings = votes.reduce((sum, v) => sum + (v.rewardAmount || 0), 0);
  const resolvedVotes = votes.filter(v => v.market.status === 'RESOLVED');
  const wonVotes = resolvedVotes.filter(v => 
    (v.prediction === 'YES' && v.market.outcome === 'YES') ||
    (v.prediction === 'NO' && v.market.outcome === 'NO')
  );
  
  // Group by group
  const byGroup = // ... aggregate by groupId
  
  return successResponse(res, {
    totalVotes,
    totalInvested,
    totalEarnings,
    roi: (totalEarnings - totalInvested) / totalInvested,
    winRate: wonVotes.length / resolvedVotes.length,
    // ... more stats
  });
}
```

---

### 6. Filter Markets by Type

**Endpoint to Update:**

#### 6.1 GET /api/markets (Add marketType Filter)

**New Query Parameters:**
- `marketType` (optional: STANDARD | NO_LOSS | WITH_YIELD)

**Implementation:**

Update `markets.controller.ts`:
```typescript
export async function getMarkets(req: Request, res: Response) {
  const { page, limit, search, status, groupId, marketType } = req.query;
  
  const where = {
    ...(status && { status }),
    ...(groupId && { groupId }),
    ...(marketType && { marketType }),
    ...(search && { /* search logic */ })
  };
  
  // ... rest of implementation
}
```

---

## Sprint 3: Polish & Enhancement (Week 3)

### 7. Group Settings (Default Market Type)

**Database Migration:**

Add to `Group` model in `schema.prisma`:
```prisma
model Group {
  // ... existing fields
  
  // Settings
  defaultMarketType MarketType @default(STANDARD)
  allowedMarketTypes MarketType[] @default([STANDARD, NO_LOSS])
}
```

**Endpoints to Add:**

#### 7.1 GET /api/groups/:id/settings

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

#### 7.2 PUT /api/groups/:id/settings (Admin only)

**Request Body:**
```json
{
  "defaultMarketType": "NO_LOSS",
  "allowedMarketTypes": ["NO_LOSS", "WITH_YIELD"]
}
```

---

### 8. Judge Resolution History

**Endpoint to Add:**

#### 8.1 GET /api/users/:userId/resolved-markets

**Description:** Get markets resolved by a specific judge

**Query Parameters:**
- `page`, `limit` (pagination)
- `groupId` (optional: filter by group)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "market-id",
      "title": "Will BTC hit $100k?",
      "outcome": "YES",
      "resolvedAt": "2024-01-01T00:00:00Z",
      "resolutionNote": "Price reached $100k on Jan 1",
      "group": {
        "id": "group-id",
        "name": "Crypto Predictions"
      }
    }
  ],
  "pagination": {...}
}
```

---

### 9. Bulk Judge Assignment

**Endpoint to Add:**

#### 9.1 POST /api/groups/:groupId/judges/bulk

**Description:** Assign multiple users as judges at once (Admin only)

**Request Body:**
```json
{
  "userIds": ["user-1", "user-2", "user-3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assigned": 3,
    "failed": 0,
    "results": [
      { "userId": "user-1", "status": "success" },
      { "userId": "user-2", "status": "success" },
      { "userId": "user-3", "status": "success" }
    ]
  }
}
```

---

## Testing Checklist

### Sprint 1 Tests:
- [ ] GET /api/groups/my-groups returns user's groups
- [ ] GET /api/groups/my-groups?role=ADMIN filters correctly
- [ ] GET /api/predictions/my-votes pagination works
- [ ] GET /api/predictions/my-votes?status=ACTIVE filters correctly
- [ ] GET /api/predictions/:marketId/my-vote returns vote or null

### Sprint 2 Tests:
- [ ] GET /api/groups/:id/members?role=JUDGE filters judges
- [ ] GET /api/predictions/my-votes/stats calculates correctly
- [ ] GET /api/markets?marketType=NO_LOSS filters correctly

### Sprint 3 Tests:
- [ ] GET /api/groups/:id/settings returns settings
- [ ] PUT /api/groups/:id/settings updates (admin only)
- [ ] GET /api/users/:id/resolved-markets returns history
- [ ] POST /api/groups/:id/judges/bulk assigns multiple judges

---

## API Documentation Updates

After implementation, update:
1. `backend/docs/API_DOCUMENTATION.md`
2. `backend/src/docs/api.docs.ts` (Swagger)
3. `backend/README.md` (endpoint list)
4. Postman collection

---

## Database Migrations

### Sprint 3 Migration:

```sql
-- Add settings to Group table
ALTER TABLE "Group" 
ADD COLUMN "defaultMarketType" "MarketType" DEFAULT 'STANDARD',
ADD COLUMN "allowedMarketTypes" "MarketType"[] DEFAULT ARRAY['STANDARD', 'NO_LOSS']::"MarketType"[];
```

---

## Frontend Integration Notes

### Sprint 1:
- Dashboard: Use `GET /api/groups/my-groups` for "My Groups" tab
- Market Detail: Use `GET /api/predictions/:marketId/my-vote` to check if voted
- Profile: Use paginated `GET /api/predictions/my-votes` for history

### Sprint 2:
- Group Settings: Show judges using `GET /api/groups/:id/members?role=JUDGE`
- Profile Stats: Display stats from `GET /api/predictions/my-votes/stats`
- Market List: Add filter for `marketType`

### Sprint 3:
- Group Admin: Use settings endpoints for configuration
- Judge Profile: Show resolution history
- Bulk Actions: Use bulk judge assignment

---

## Performance Considerations

1. **Indexing:**
   - Add index on `GroupMember(userId, role)`
   - Add index on `Vote(userId, marketId)`
   - Add index on `PredictionMarket(marketType, status)`

2. **Caching:**
   - Cache `my-votes/stats` for 5 minutes
   - Cache group settings for 10 minutes

3. **Pagination:**
   - Always use pagination for list endpoints
   - Default limit: 20, max: 100

---

## Rollout Plan

### Week 1 (Sprint 1):
- Day 1-2: Implement My Groups endpoint
- Day 3-4: Add pagination to My Votes
- Day 5: Add My Vote check endpoint
- Day 6-7: Testing & bug fixes

### Week 2 (Sprint 2):
- Day 1-2: Role filtering & stats endpoints
- Day 3-4: Market type filtering
- Day 5-7: Testing & documentation

### Week 3 (Sprint 3):
- Day 1-3: Group settings & migrations
- Day 4-5: Judge history & bulk actions
- Day 6-7: Final testing & deployment

---

## Success Metrics

- [ ] All critical endpoints (Sprint 1) deployed
- [ ] API response time < 500ms for all endpoints
- [ ] Test coverage > 80% for new endpoints
- [ ] Documentation updated
- [ ] Frontend successfully integrated
- [ ] No breaking changes to existing endpoints

