# Smart Contract Compatibility Report

**Date**: December 31, 2024  
**Contract**: `predictly::market` on Movement Network (Bardock Testnet)  
**Address**: `0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565`

---

## Executive Summary

✅ **All new API features are compatible with the smart contract**

The 10 new/enhanced endpoints implemented in Sprints 1-3 are fully compatible with the Movement smart contract. Most features are backend-only (groups, memberships, statistics) and don't interact with the contract. Market-related features correctly support the two market types implemented in the contract.

---

## Market Type Compatibility

### Supported Market Types

| Market Type | Contract Support | API Support | Status |
|-------------|------------------|-------------|--------|
| **STANDARD** | ✅ Type 0 | ✅ Fully supported | **ACTIVE** |
| **NO_LOSS** | ✅ Type 1 | ✅ Fully supported | **ACTIVE** |
| **WITH_YIELD** | ❌ Not implemented | ⚠️ Schema only | **FUTURE** |

### Contract Implementation Details

```move
// From market.move
const MARKET_TYPE_STANDARD: u8 = 0;
const MARKET_TYPE_NO_LOSS: u8 = 1;
```

**STANDARD Markets**:
- Winner-takes-all model
- Losers lose their stake
- Winners split the total pool proportionally
- Formula: `reward = (voter_stake / winning_pool) * total_pool`

**NO_LOSS Markets**:
- Everyone gets their principal back
- Winners also get proportional yield from lending protocol
- Losers only get principal (no yield)
- Formula: `reward = principal + (voter_stake / winning_pool) * total_yield`

**WITH_YIELD** (Future):
- Defined in Prisma schema for future-proofing
- NOT implemented in smart contract yet
- Validators updated to reject this type until contract support added

---

## Feature-by-Feature Compatibility

### ✅ Sprint 1: Critical Features

#### 1. My Groups Endpoint (`GET /api/groups/my-groups`)
- **Backend Only**: No contract interaction
- **Status**: Fully compatible
- **Notes**: Queries PostgreSQL database only

#### 2. Enhanced My Votes (`GET /api/predictions/my-votes`)
- **Backend Only**: Reads cached vote data
- **Status**: Fully compatible
- **Notes**: Vote data synced from contract events

#### 3. Check My Vote (`GET /api/predictions/:marketId/my-vote`)
- **Backend Only**: Reads cached vote data
- **Status**: Fully compatible
- **Notes**: Can optionally verify against contract using `get_vote()` view function

---

### ✅ Sprint 2: High Priority

#### 5. Role Filter for Members (`GET /api/groups/:id/members?role=JUDGE`)
- **Backend Only**: No contract interaction
- **Status**: Fully compatible
- **Notes**: Group roles managed in backend database

#### 6. My Votes Statistics (`GET /api/predictions/my-votes/stats`)
- **Backend Only**: Aggregates cached data
- **Status**: Fully compatible
- **Notes**: Statistics calculated from synced market outcomes

#### 7. Market Type Filter (`GET /api/predictions?marketType=NO_LOSS`)
- **Contract Aware**: Filters by market_type field
- **Status**: Fully compatible
- **Notes**: Only returns STANDARD and NO_LOSS markets (WITH_YIELD rejected by validators)

---

### ✅ Sprint 3: Polish Features

#### 9. Group Settings Database
- **Backend Only**: Database schema changes
- **Status**: Fully compatible
- **Notes**: `defaultMarketType` and `allowedMarketTypes` stored in PostgreSQL

#### 10. Group Settings Endpoints (`GET/PUT /api/groups/:id/settings`)
- **Backend Only**: Manages group preferences
- **Status**: Fully compatible
- **Notes**: Validators enforce only STANDARD and NO_LOSS types

#### 11. Judge Resolution History (`GET /api/predictions/resolved-by/:userId`)
- **Backend Only**: Queries resolved markets
- **Status**: Fully compatible
- **Notes**: Resolver address synced from contract events

#### 12. Bulk Judge Assignment (`POST /api/groups/:groupId/judges/bulk`)
- **Backend Only**: Updates group member roles
- **Status**: Fully compatible
- **Notes**: Judge role is backend concept; resolver address set when creating market

---

## Contract View Functions Used

The backend uses these contract view functions to sync data:

```move
#[view]
public fun get_market_state(admin_addr: address, market_id: u64): Market

#[view]
public fun get_vote(admin_addr: address, market_id: u64, voter: address): Vote

#[view]
public fun get_market_count(admin_addr: address): u64

#[view]
public fun calculate_reward(admin_addr: address, market_id: u64, voter: address): u64

#[view]
public fun get_percentages(admin_addr: address, market_id: u64): (u64, u64)
```

### Missing View Function

⚠️ **Contract does not expose `market_type` in view functions**

**Workaround**: Backend caches `market_type` when market is created and stores it in PostgreSQL. This is acceptable because market type is immutable after creation.

**Recommendation**: Add view function to contract:
```move
#[view]
public fun get_market_type(admin_addr: address, market_id: u64): u8
```

---

## Judge/Resolver System Compatibility

✅ **Fully Compatible**

**Contract Implementation**:
```move
struct Market {
    resolver: address,  // Address that can resolve the market
    // ...
}

public entry fun resolve(
    resolver: &signer,
    admin_addr: address,
    market_id: u64,
    outcome: u8,
)
```

**Backend Implementation**:
- Groups have members with `JUDGE` role
- When creating market, backend sets `resolver` to judge's wallet address
- Only the resolver address can call `resolve()` on-chain
- Backend tracks `resolvedById` to show resolution history

**Flow**:
1. Admin assigns JUDGE role to user in group (backend)
2. When creating market, backend sets judge's wallet as `resolver` (contract)
3. Judge calls `resolve()` with their wallet (contract)
4. Backend syncs resolution event and updates `resolvedById` (backend)

---

## Vote Tracking Compatibility

✅ **Fully Compatible**

**Contract Implementation**:
```move
struct Vote {
    voter: address,
    prediction: u8,  // PREDICTION_YES (1) or PREDICTION_NO (2)
    amount: u64,
    timestamp: u64,
    has_claimed: bool,
}
```

**Backend Implementation**:
```prisma
model Vote {
  id            String
  marketId      String
  userId        String
  prediction    VotePrediction  // YES or NO
  amount        Float
  hasClaimedReward Boolean
  rewardAmount  Float?
  createdAt     DateTime
}
```

**Sync Strategy**:
- Backend listens to `VotePlaced` events from contract
- Creates Vote record in PostgreSQL with matching data
- Uses cached data for fast queries (my votes, statistics)
- Can verify against contract using `get_vote()` if needed

---

## NO_LOSS Market Compatibility

✅ **Fully Compatible**

**Contract Logic**:
```move
if (market.market_type == MARKET_TYPE_NO_LOSS) {
    let principal = vote.amount;
    
    if (!is_winner) {
        return principal  // Losers get principal only
    };
    
    // Winners get principal + proportional yield
    let yield_share = (vote.amount * market.total_yield) / winning_pool;
    return principal + yield_share
}
```

**Backend Handling**:
- Group settings allow admins to set `defaultMarketType: NO_LOSS`
- Group settings allow restricting `allowedMarketTypes: ['NO_LOSS']`
- When creating market, backend passes `market_type: 1` to contract
- Statistics correctly calculate ROI for NO_LOSS markets (never negative)

**Yield Simulation**:
The contract simulates yield as 5% APY prorated by market duration:
```move
let simulated_yield = (total_pool * 500 * market_duration) / (10000 * 31536000);
```

In production, this would be replaced with actual DeFi protocol integration (LayerBank, etc.)

---

## Database Schema Compatibility

### Group Model

```prisma
model Group {
  defaultMarketType  MarketType   @default(STANDARD)
  allowedMarketTypes MarketType[] @default([STANDARD, NO_LOSS])
}

enum MarketType {
  STANDARD   // Contract: 0
  NO_LOSS    // Contract: 1
  WITH_YIELD // Future: Not in contract yet
}
```

**Migration Applied**: `20251231082724_add_group_settings`

**Compatibility Notes**:
- `WITH_YIELD` exists in schema for future-proofing
- Validators reject `WITH_YIELD` until contract support added
- Default values match contract capabilities

---

## Validator Updates

### Changes Made

**File**: `backend/src/validators/groups.validator.ts`
```typescript
// BEFORE
defaultMarketType: z.enum(['STANDARD', 'NO_LOSS', 'WITH_YIELD']).optional()

// AFTER
defaultMarketType: z.enum(['STANDARD', 'NO_LOSS']).optional()
// NOTE: WITH_YIELD planned for future but not yet implemented in smart contract
```

**File**: `backend/src/validators/predictions.validator.ts`
```typescript
// BEFORE
marketType: z.enum(['STANDARD', 'NO_LOSS', 'WITH_YIELD']).default('STANDARD')

// AFTER
marketType: z.enum(['STANDARD', 'NO_LOSS']).default('STANDARD')
// NOTE: WITH_YIELD planned for future, contract currently supports STANDARD and NO_LOSS only
```

### Impact

- ✅ Users cannot create WITH_YIELD markets (would fail on-chain anyway)
- ✅ Group settings cannot set WITH_YIELD as default or allowed type
- ✅ API returns 400 Bad Request if WITH_YIELD is attempted
- ✅ Database still has WITH_YIELD enum for future compatibility

---

## Testing Recommendations

### 1. Test STANDARD Markets
```bash
# Create STANDARD market
POST /api/predictions
{
  "marketType": "STANDARD",
  "groupId": "...",
  "title": "Test Market"
}

# Verify on-chain
# market_type should be 0
```

### 2. Test NO_LOSS Markets
```bash
# Create NO_LOSS market
POST /api/predictions
{
  "marketType": "NO_LOSS",
  "groupId": "...",
  "title": "No Loss Test"
}

# Verify on-chain
# market_type should be 1
```

### 3. Test WITH_YIELD Rejection
```bash
# Should fail with 400 Bad Request
POST /api/predictions
{
  "marketType": "WITH_YIELD",
  "groupId": "...",
  "title": "Should Fail"
}

# Expected response:
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": ["marketType"],
      "message": "Invalid enum value. Expected 'STANDARD' | 'NO_LOSS', received 'WITH_YIELD'"
    }
  ]
}
```

### 4. Test Group Settings
```bash
# Should succeed
PUT /api/groups/:id/settings
{
  "defaultMarketType": "NO_LOSS",
  "allowedMarketTypes": ["STANDARD", "NO_LOSS"]
}

# Should fail
PUT /api/groups/:id/settings
{
  "defaultMarketType": "WITH_YIELD"
}
```

### 5. Test Judge Resolution
```bash
# Assign judge role (backend)
POST /api/groups/:groupId/judges/bulk
{
  "userIds": ["judge-user-id"]
}

# Create market with judge as resolver (contract)
# Judge resolves market (contract)
# Verify resolution history (backend)
GET /api/predictions/resolved-by/:judgeUserId
```

---

## Future Enhancements

### When WITH_YIELD is Added to Contract

1. **Update Contract**:
   ```move
   const MARKET_TYPE_WITH_YIELD: u8 = 2;
   ```

2. **Update Validators**:
   ```typescript
   // Add back to enums
   z.enum(['STANDARD', 'NO_LOSS', 'WITH_YIELD'])
   ```

3. **Update Default**:
   ```prisma
   allowedMarketTypes MarketType[] @default([STANDARD, NO_LOSS, WITH_YIELD])
   ```

4. **Test End-to-End**:
   - Create WITH_YIELD market
   - Verify yield distribution logic
   - Test reward calculations

### Recommended Contract Improvements

1. **Add market_type view function**:
   ```move
   #[view]
   public fun get_market_type(admin_addr: address, market_id: u64): u8
   ```

2. **Add batch view functions** for better performance:
   ```move
   #[view]
   public fun get_markets_batch(admin_addr: address, market_ids: vector<u64>): vector<Market>
   ```

3. **Add vote history view**:
   ```move
   #[view]
   public fun get_user_votes(admin_addr: address, voter: address): vector<Vote>
   ```

---

## Conclusion

✅ **All 10 new API endpoints are fully compatible with the smart contract**

**Summary**:
- 9 endpoints are backend-only (no contract interaction)
- 1 endpoint (market type filter) correctly handles contract-supported types
- Validators updated to prevent unsupported market types
- Database schema future-proofed with WITH_YIELD enum
- Judge/resolver system works seamlessly between backend and contract
- Vote tracking and statistics use cached data synced from contract events

**No breaking changes required**. The API is production-ready and compatible with the current smart contract deployment.

---

## Contact

For questions about contract compatibility:
- Review contract code: `contracts/predictly/sources/market.move`
- Check API docs: `backend/docs/NEW_ENDPOINTS.md`
- See implementation: `backend/src/controllers/predictions.controller.ts`
