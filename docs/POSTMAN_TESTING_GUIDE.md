# Postman Testing Guide - Hybrid Market System

## Setup

1. **Import Collection**
   - Open Postman
   - Click "Import" → Select `backend/postman/Predictly_API.postman_collection.json`

2. **Set Collection Variables**
   - Click on the collection → Variables tab
   - Set these variables:
     - `baseUrl`: `http://localhost:3001`
     - `adminToken`: Copy from your `.env` file (ADMIN_TOKEN value)
     - `walletAddress`: Your wallet address for testing

## Testing Wallet Authentication Flow

### Step 1: Get Sign-In Message

1. Open request: **Wallet Authentication → 1. Get Sign-In Message**
2. Make sure `walletAddress` variable is set
3. Click **Send**
4. Check the **Console** (bottom of Postman) - you'll see:
   ```
   Sign-in message saved!
   Message: Sign in to Predictly
   
   Wallet: 0x...
   Nonce: ...
   Timestamp: ...
   
   This request will not trigger a blockchain transaction or cost any gas fees.
   ```
5. **Copy the entire message** (including newlines)

### Step 2: Sign the Message with Your Wallet

You need to sign the message using your Aptos/Movement wallet. Here are the options:

#### Option A: Using Aptos CLI (Recommended for Testing)
```bash
# Install Aptos CLI if you haven't
# https://aptos.dev/tools/aptos-cli/install-cli/

# Sign the message
aptos key sign --private-key-file <path-to-private-key> --message "YOUR_MESSAGE_HERE"
```

#### Option B: Using TypeScript/JavaScript
```typescript
import { Ed25519PrivateKey, Ed25519Signature } from '@aptos-labs/ts-sdk';

const privateKey = Ed25519PrivateKey.fromString('0x...');
const message = "YOUR_MESSAGE_HERE";
const signature = privateKey.sign(Buffer.from(message, 'utf-8'));
console.log('Signature:', signature.toString());
```

#### Option C: Using Movement Wallet Extension
- Open Movement wallet
- Go to Settings → Developer Tools → Sign Message
- Paste the message
- Copy the signature

### Step 3: Verify Signature & Login

1. Open request: **Wallet Authentication → 2. Verify Signature & Login**
2. In the Body tab, replace `YOUR_WALLET_SIGNATURE_HERE` with your actual signature
3. The `message` field will be auto-filled from Step 1
4. Click **Send**
5. If successful, the JWT token will be auto-saved to `token` variable
6. Check Console for: `Token saved!`

### Step 4: Get Current User

1. Open request: **Wallet Authentication → 3. Get Current User**
2. The `Authorization` header will use the saved token automatically
3. Click **Send**
4. You should see your user profile

## Testing Market Creation Flow

### Step 1: Create Market (Off-Chain)

1. Open request: **Markets (Hybrid System) → 1. Create Market Off-Chain**
2. Make sure you're authenticated (token is set)
3. Update the body with your test data:
   ```json
   {
     "groupId": "YOUR_GROUP_ID",
     "question": "Will Bitcoin reach $100k by end of 2025?",
     "description": "Market resolves YES if BTC hits $100k, NO otherwise",
     "endTime": "2025-12-31T23:59:59Z",
     "options": ["YES", "NO"]
   }
   ```
4. Click **Send**
5. Market will be created with status `PENDING`
6. The `marketId` will be auto-saved

### Step 2: Initialize Market (On-Chain)

1. Open request: **Markets (Hybrid System) → 2. Initialize Market On-Chain**
2. The `marketId` from Step 1 is auto-filled in the URL
3. Click **Send**
4. Backend relay wallet will pay gas to create market on-chain
5. Market status changes to `ACTIVE`
6. `onChainId` will be stored

### Step 3: Get Market Details

1. Open request: **Markets (Hybrid System) → 3. Get Market Details**
2. Click **Send**
3. You'll see both off-chain and on-chain data

### Step 4: Sync Market Data

1. Open request: **Markets (Hybrid System) → 5. Sync Market Data**
2. Click **Send**
3. Latest on-chain data will be fetched and cached

## Testing Admin Endpoints

### Get Relay Wallet Balance

1. Open request: **Admin Endpoints → Get Relay Wallet Balance**
2. Make sure `adminToken` variable is set correctly
3. Click **Send**
4. You'll see the relay wallet balance in MOVE

## Common Issues

### Issue 1: JSON Parse Error with Message
**Error**: `Bad control character in string literal`

**Solution**: This is now fixed! The message is automatically escaped using `JSON.stringify()`. Just make sure you:
1. Run Step 1 (Get Sign-In Message) first
2. Don't manually edit the `signInMessage` variable
3. The message will be properly formatted automatically

### Issue 2: Invalid Signature
**Error**: `Invalid signature`

**Solution**: 
- Make sure you're signing the EXACT message from Step 1 (including all newlines)
- Use the same wallet address that you requested the message for
- Check that your signature is in the correct format (hex string)

### Issue 3: Nonce Expired
**Error**: `Nonce not found or expired`

**Solution**:
- Nonces expire after 5 minutes
- Get a new message (Step 1) and sign it again
- Complete the verification within 5 minutes

### Issue 4: Rate Limited
**Error**: `Too many requests`

**Solution**:
- Auth endpoints: Wait 15 minutes (5 attempts per 15 min)
- Market creation: Wait 1 hour (10 markets per hour)
- Market initialization: Wait 5 minutes (3 attempts per 5 min)

### Issue 5: Relay Wallet Balance Low
**Error**: `Insufficient relay wallet balance`

**Solution**:
- Check balance using Admin endpoint
- Fund the relay wallet address shown in server logs
- Minimum balance: 10 MOVE (configurable in .env)

## Auto-Saved Variables

These variables are automatically saved during testing:
- `signInMessage` - From Step 1 (Get Sign-In Message)
- `nonce` - From Step 1
- `token` - From Step 2 (Verify Signature)
- `userId` - From Step 2
- `marketId` - From market creation

## Tips

1. **Check Console**: Always check Postman Console (View → Show Postman Console) for detailed logs
2. **Environment**: Make sure you're using the correct environment (Development/Production)
3. **Server Running**: Ensure backend server is running on `http://localhost:3001`
4. **Redis Running**: Redis must be running for nonce storage
5. **Database**: PostgreSQL must be accessible

## Testing Checklist

- [ ] Health check endpoint works
- [ ] Can get sign-in message
- [ ] Can verify signature and login
- [ ] Can get current user profile
- [ ] Can create market off-chain
- [ ] Can initialize market on-chain
- [ ] Can get market details with on-chain data
- [ ] Can sync market data
- [ ] Can check relay wallet balance (admin)
- [ ] Rate limiting works correctly

---

**Need Help?**
- Check server logs for detailed error messages
- Review API documentation: `backend/docs/API_DOCUMENTATION.md`
- Check implementation summary: `backend/docs/IMPLEMENTATION_SUMMARY.md`
