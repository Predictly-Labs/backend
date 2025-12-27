# Migration Guide: Hybrid Market System

This guide provides step-by-step instructions for migrating from the Privy-based authentication system to the new hybrid market system with wallet-based authentication.

## Overview

The hybrid market system introduces:
- **Wallet-based authentication** (replacing Privy)
- **Off-chain market creation** (free for users)
- **On-chain voting** (users pay gas fees)
- **Lazy initialization** (backend pays gas for first vote)
- **Relay wallet** (backend wallet for market initialization)

## Prerequisites

Before starting the migration, ensure you have:
- [x] PostgreSQL database (version 9.1+)
- [x] Redis server running
- [x] Movement Network RPC access
- [x] Funded wallet for relay operations
- [x] Node.js 18+ installed

## Migration Steps

### 1. Database Migration

#### 1.1 Backup Your Database

```bash
# Create a backup before migration
pg_dump -U username -d predictly > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 Run Prisma Migration

```bash
cd backend
npm install
npx prisma migrate deploy
```

This will apply the migration `20251227171843_wallet_auth_migration` which:
- Makes `privyId` nullable (backward compatibility)
- Makes `walletAddress` required and unique
- Changes default market status to `PENDING`
- Adds `InitializationLock` table

#### 1.3 Verify Migration

```bash
npx prisma studio
```

Check that:
- User table has nullable `privyId`
- User table has unique `walletAddress`
- Market table has `PENDING` as default status
- InitializationLock table exists

### 2. Environment Configuration

#### 2.1 Update Environment Variables

Copy the new `.env.example` to your `.env` file and update:

```bash
cp .env.example .env.new
# Merge with your existing .env
```

#### 2.2 Required New Variables

Add these to your `.env`:

```env
# Redis (required for nonce storage)
REDIS_URL=redis://localhost:6379

# Relay Wallet (use same key as deployed contract)
RELAY_WALLET_PRIVATE_KEY=your_private_key_here
RELAY_WALLET_MIN_BALANCE=10

# Admin Token (generate secure token)
ADMIN_TOKEN=$(openssl rand -hex 32)
```

#### 2.3 Optional Variables

These are optional but recommended:

```env
# Movement Network (if not already set)
MOVEMENT_RPC_URL=https://testnet.movementnetwork.xyz/v1
MOVEMENT_CONTRACT_ADDRESS=0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565
```

### 3. Relay Wallet Setup

#### 3.1 Fund Relay Wallet

The relay wallet needs MOVE tokens to pay gas fees for market initialization.

```bash
# Check relay wallet address
curl http://localhost:3001/api/admin/relay-wallet/balance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Recommended balance**: At least 100 MOVE tokens for production

#### 3.2 Monitor Balance

Set up monitoring to alert when balance is low:

```bash
# The backend automatically monitors balance every 1 minute
# Warnings are logged when balance < RELAY_WALLET_MIN_BALANCE
```

### 4. Redis Setup

#### 4.1 Install Redis (if not installed)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Download from https://redis.io/download

#### 4.2 Verify Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### 5. Deploy Backend

#### 5.1 Install Dependencies

```bash
cd backend
npm install
```

#### 5.2 Generate Prisma Client

```bash
npx prisma generate
```

#### 5.3 Build TypeScript

```bash
npm run build
```

#### 5.4 Start Server

```bash
# Development
npm run dev

# Production
npm start
```

#### 5.5 Verify Server Health

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-28T..."
}
```

### 6. Data Migration (Existing Users)

#### 6.1 Migrate Existing Privy Users

If you have existing users with Privy authentication, they can continue using the system. The new wallet-based auth is backward compatible.

**Option 1: Keep Privy users as-is**
- No action needed
- Users can continue using Privy auth endpoint

**Option 2: Migrate to wallet-based auth**
- Users need to re-authenticate with wallet
- Their `walletAddress` will be linked to existing account

#### 6.2 Update Existing Markets

Existing markets with `ACTIVE` status will continue to work. New markets will be created with `PENDING` status.

```sql
-- Optional: Update existing markets to PENDING if needed
UPDATE "Market" 
SET status = 'PENDING' 
WHERE status = 'ACTIVE' AND "onChainId" IS NULL;
```

### 7. Testing

#### 7.1 Test Wallet Authentication

```bash
# 1. Get sign-in message
curl -X POST http://localhost:3001/api/auth/wallet/message \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x123..."}'

# 2. Sign message with wallet (use frontend or CLI)

# 3. Verify signature
curl -X POST http://localhost:3001/api/auth/wallet/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x123...",
    "signature": "0xabc...",
    "message": "..."
  }'
```

#### 7.2 Test Market Creation

```bash
# Create market (off-chain, free)
curl -X POST http://localhost:3001/api/markets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Will it rain tomorrow?",
    "description": "Test market",
    "endTime": "2024-12-31T23:59:59Z",
    "groupId": "group-id"
  }'
```

#### 7.3 Test Market Initialization

```bash
# Initialize market (on-chain, backend pays gas)
curl -X POST http://localhost:3001/api/markets/MARKET_ID/initialize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Monitoring Setup

#### 8.1 Check Monitoring Logs

The backend automatically runs monitoring tasks every 1 minute:
- Relay wallet balance monitoring
- Expired lock cleanup
- Expired nonce cleanup
- Active market sync

```bash
# Check logs for monitoring output
tail -f logs/app.log | grep "🔍"
```

#### 8.2 Set Up Alerts (Optional)

Configure alerts for:
- Low relay wallet balance (< 10 MOVE)
- High initialization failure rate
- Slow API responses

### 9. Rollback Procedure

If you need to rollback the migration:

#### 9.1 Restore Database

```bash
# Stop backend server
npm stop

# Restore from backup
psql -U username -d predictly < backup_YYYYMMDD_HHMMSS.sql

# Rollback migration
npx prisma migrate resolve --rolled-back 20251227171843_wallet_auth_migration
```

#### 9.2 Revert Code

```bash
git checkout <previous-commit>
npm install
npm run build
npm start
```

## Deployment Checklist

Use this checklist before deploying to production:

- [ ] Database backup created
- [ ] Prisma migration applied successfully
- [ ] Redis server running and accessible
- [ ] Environment variables configured
- [ ] Relay wallet funded (>100 MOVE recommended)
- [ ] Admin token generated and secured
- [ ] Backend server starts without errors
- [ ] Health check endpoint returns OK
- [ ] Wallet authentication tested
- [ ] Market creation tested
- [ ] Market initialization tested
- [ ] Monitoring logs show no errors
- [ ] Frontend updated to use new auth endpoints

## Troubleshooting

### Issue: Migration fails with "column already exists"

**Solution**: The migration is idempotent. If it fails, check if the column already exists and manually adjust the migration.

### Issue: Redis connection error

**Solution**: 
1. Check if Redis is running: `redis-cli ping`
2. Verify REDIS_URL in .env
3. Check firewall rules

### Issue: Relay wallet insufficient balance

**Solution**:
1. Check balance: `curl http://localhost:3001/api/admin/relay-wallet/balance`
2. Fund wallet with MOVE tokens
3. Verify transaction on Movement explorer

### Issue: Market initialization fails

**Solution**:
1. Check relay wallet balance
2. Check contract address is correct
3. Check RPC URL is accessible
4. Review error logs for details

### Issue: Nonce expired or invalid

**Solution**:
1. Nonces expire after 5 minutes
2. Request new sign-in message
3. Sign and verify within 5 minutes

## Support

For issues or questions:
- Check logs: `tail -f logs/app.log`
- Review error messages in API responses
- Check database state with Prisma Studio
- Verify environment variables are correct

## Next Steps

After successful migration:
1. Update frontend to use wallet-based authentication
2. Test complete user flow (auth → create market → vote)
3. Monitor relay wallet balance regularly
4. Set up automated alerts for production
5. Update API documentation for clients
