# 🚀 Deployment Checklist - Render

**Date**: December 31, 2024  
**Backend URL**: https://backend-3ufs.onrender.com  
**Environment**: Production

---

## 📋 Pre-Deployment Checklist

### 1. ✅ Code Review
- [x] All TypeScript errors resolved (0 errors)
- [x] All validators updated (WITH_YIELD removed)
- [x] Smart contract compatibility verified
- [x] No breaking changes introduced
- [x] Documentation updated

### 2. ✅ Database Migration Ready
**Migration**: `20251231082724_add_group_settings`

**Changes**:
- Adds `defaultMarketType` field to Group table (default: STANDARD)
- Adds `allowedMarketTypes` array field to Group table (default: [STANDARD, NO_LOSS])

**Impact**: Non-breaking, backward compatible

---

## 🔧 Render Configuration

### Environment Variables

#### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-secret-key-here

# Movement Network
MOVEMENT_NETWORK=bardock
MOVEMENT_RPC_URL=https://aptos.testnet.bardock.movementlabs.xyz/v1
MOVEMENT_FAUCET_URL=https://faucet.testnet.bardock.movementlabs.xyz

# Contract
MOVEMENT_CONTRACT_ADDRESS=0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565
MOVEMENT_MODULE_NAME=predictly

# Relay Wallet (for market initialization)
RELAY_WALLET_PRIVATE_KEY=0x...
RELAY_WALLET_ADDRESS=0x...

# Server
NODE_ENV=production
PORT=3001
```

#### Optional Variables
```bash
# Rate Limiting (can disable for testing)
DISABLE_RATE_LIMIT=false

# CORS
CORS_ORIGIN=https://your-frontend.com

# Logging
LOG_LEVEL=info
```

### Build Settings

**Build Command**:
```bash
npm install && npx prisma generate && npm run build
```

**Start Command**:
```bash
npm run start
```

**Node Version**: 18.x or higher

---

## 🗄️ Database Migration Steps

### Step 1: Backup Database (Recommended)
```bash
# From Render dashboard or CLI
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run Migration
```bash
# SSH into Render shell or use local connection
cd backend
npx prisma migrate deploy
```

### Step 3: Verify Migration
```bash
# Check migration status
npx prisma migrate status

# Expected output:
# ✓ 20251231082724_add_group_settings applied
```

### Step 4: Verify Schema
```sql
-- Connect to database and verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Group' 
AND column_name IN ('defaultMarketType', 'allowedMarketTypes');

-- Expected:
-- defaultMarketType  | MarketType | 'STANDARD'
-- allowedMarketTypes | MarketType[] | '{STANDARD,NO_LOSS}'
```

---

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
# Test server is running
curl https://backend-3ufs.onrender.com/health

# Expected:
{
  "status": "ok",
  "timestamp": "2024-12-31T..."
}
```

### 2. Test New Endpoints

#### a) My Groups
```bash
curl -H "Authorization: Bearer <token>" \
  "https://backend-3ufs.onrender.com/api/groups/my-groups?page=1&limit=20"

# Expected: 200 OK with groups array
```

#### b) My Votes Statistics
```bash
curl -H "Authorization: Bearer <token>" \
  "https://backend-3ufs.onrender.com/api/predictions/my-votes/stats"

# Expected: 200 OK with statistics
```

#### c) Group Settings
```bash
# Get settings
curl -H "Authorization: Bearer <token>" \
  "https://backend-3ufs.onrender.com/api/groups/<GROUP_ID>/settings"

# Expected: 200 OK with defaultMarketType and allowedMarketTypes
```

### 3. Test WITH_YIELD Rejection (Critical!)
```bash
# Should fail with 400 Bad Request
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "<GROUP_ID>",
    "title": "Test Market",
    "marketType": "WITH_YIELD",
    "endDate": "2025-01-31T00:00:00Z"
  }' \
  "https://backend-3ufs.onrender.com/api/predictions"

# Expected: 400 Bad Request
# Error: "Invalid enum value. Expected 'STANDARD' | 'NO_LOSS', received 'WITH_YIELD'"
```

### 4. Test STANDARD Market Creation
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "<GROUP_ID>",
    "title": "Test STANDARD Market",
    "marketType": "STANDARD",
    "endDate": "2025-01-31T00:00:00Z",
    "minStake": 0.1
  }' \
  "https://backend-3ufs.onrender.com/api/predictions"

# Expected: 201 Created
```

### 5. Test NO_LOSS Market Creation
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "<GROUP_ID>",
    "title": "Test NO_LOSS Market",
    "marketType": "NO_LOSS",
    "endDate": "2025-01-31T00:00:00Z",
    "minStake": 0.1
  }' \
  "https://backend-3ufs.onrender.com/api/predictions"

# Expected: 201 Created
```

---

## 📊 Monitoring

### 1. Check Logs
```bash
# From Render dashboard
# Look for:
# - "Server running on port 3001"
# - "Database connected"
# - No error messages
```

### 2. Monitor Database
```sql
-- Check new fields are populated
SELECT id, name, "defaultMarketType", "allowedMarketTypes" 
FROM "Group" 
LIMIT 5;

-- Check existing groups got defaults
SELECT COUNT(*) FROM "Group" 
WHERE "defaultMarketType" = 'STANDARD' 
AND 'STANDARD' = ANY("allowedMarketTypes");
```

### 3. Check Relay Wallet Balance
```bash
# Ensure relay wallet has enough APT for market initialization
# Minimum: 0.1 APT per market
# Recommended: Keep at least 10 APT
```

### 4. Monitor Error Rates
- Check Render metrics for 4xx/5xx errors
- Monitor response times
- Check database connection pool

---

## 🔄 Rollback Plan

### If Deployment Fails

#### Option 1: Rollback Code
```bash
# From Render dashboard
# 1. Go to "Manual Deploy"
# 2. Select previous commit
# 3. Deploy
```

#### Option 2: Rollback Database
```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Or rollback migration
npx prisma migrate resolve --rolled-back 20251231082724_add_group_settings
```

#### Option 3: Quick Fix
```bash
# If only validator issue, can temporarily allow WITH_YIELD
# (Not recommended, but emergency option)

# In validators/groups.validator.ts and validators/predictions.validator.ts
# Change back to: z.enum(['STANDARD', 'NO_LOSS', 'WITH_YIELD'])
# Then redeploy
```

---

## 🐛 Troubleshooting

### Issue: Migration Fails

**Symptoms**: `npx prisma migrate deploy` fails

**Solutions**:
1. Check DATABASE_URL is correct
2. Verify database is accessible
3. Check if migration already applied: `npx prisma migrate status`
4. Try: `npx prisma migrate resolve --applied 20251231082724_add_group_settings`

### Issue: WITH_YIELD Still Accepted

**Symptoms**: API accepts WITH_YIELD market type

**Solutions**:
1. Verify validators are updated (check git commit)
2. Clear build cache: `npm run clean && npm run build`
3. Restart server
4. Check TypeScript compilation: `npm run build`

### Issue: Group Settings Not Found

**Symptoms**: `GET /api/groups/:id/settings` returns 404

**Solutions**:
1. Verify migration applied: `npx prisma migrate status`
2. Check database schema: `\d "Group"` in psql
3. Verify route is registered: Check `src/routes/groups.routes.ts`
4. Check logs for errors

### Issue: Relay Wallet Out of Funds

**Symptoms**: Market creation fails with "Insufficient funds"

**Solutions**:
1. Check relay wallet balance on Movement explorer
2. Fund wallet from faucet: https://faucet.testnet.bardock.movementlabs.xyz
3. Or transfer APT from another wallet
4. Minimum: 0.1 APT per market

### Issue: CORS Errors

**Symptoms**: Frontend can't access API

**Solutions**:
1. Check CORS_ORIGIN environment variable
2. Verify frontend URL is whitelisted
3. Check `src/middleware/cors.middleware.ts`
4. For testing, can temporarily set `CORS_ORIGIN=*`

---

## ✅ Deployment Success Criteria

- [ ] Server starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Database migration applied successfully
- [ ] All new endpoints return expected responses
- [ ] WITH_YIELD is properly rejected (400 error)
- [ ] STANDARD markets can be created
- [ ] NO_LOSS markets can be created
- [ ] Group settings can be read and updated
- [ ] My groups endpoint works with pagination
- [ ] My votes statistics returns correct data
- [ ] No increase in error rates
- [ ] Response times within acceptable range
- [ ] Relay wallet has sufficient balance

---

## 📚 Documentation References

- **NEW_ENDPOINTS.md** - Complete API documentation
- **CONTRACT_COMPATIBILITY.md** - Smart contract compatibility analysis
- **API_UPDATES_SUMMARY.md** - Summary of all changes
- **FRIEND_REQUIREMENTS_COMPLETE.md** - Feature summary (Indonesian)
- **Postman Collection** - `backend/postman/Predictly_API.postman_collection.json`
- **Swagger UI** - https://backend-3ufs.onrender.com/api

---

## 🎯 Quick Reference

### New Endpoints (10 total)
1. `GET /api/groups/my-groups` - My groups with filters
2. `GET /api/predictions/my-votes` - Enhanced my votes
3. `GET /api/predictions/:marketId/my-vote` - Check specific vote
4. `GET /api/groups/:id/members?role=JUDGE` - Filter members by role
5. `GET /api/predictions/my-votes/stats` - Vote statistics
6. `GET /api/predictions?marketType=NO_LOSS` - Filter by market type
7. `GET /api/groups/:id/settings` - Get group settings
8. `PUT /api/groups/:id/settings` - Update group settings
9. `GET /api/predictions/resolved-by/:userId` - Judge resolution history
10. `POST /api/groups/:groupId/judges/bulk` - Bulk assign judges

### Database Changes
- Migration: `20251231082724_add_group_settings`
- New fields: `defaultMarketType`, `allowedMarketTypes`
- Impact: Non-breaking, backward compatible

### Validator Changes
- Removed WITH_YIELD from allowed market types
- Only STANDARD and NO_LOSS accepted
- Added comments explaining future feature

---

## 🚀 Ready to Deploy!

**Status**: All checks passed ✅  
**Breaking Changes**: None  
**TypeScript Errors**: 0  
**Contract Compatibility**: Verified  

**Deploy with confidence!** 🎉
