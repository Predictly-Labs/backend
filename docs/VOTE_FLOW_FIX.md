# Vote Flow Fix - Client-Side Signing Implementation

## 📋 Overview

Dokumentasi ini menjelaskan perbaikan bug "Balance tidak berkurang setelah vote" dengan mengimplementasikan client-side signing untuk transaksi vote.

**Status:**
- ✅ Backend: SIAP (tidak perlu perubahan)
- ⚠️ Frontend: PERLU DIUPDATE

---

## 🐛 Masalah

### Current Flow (SALAH ❌)

```
User klik "Vote YES 10 MOVE"
         ↓
Frontend → POST /api/predictions/:id/vote
         ↓
Backend save ke database
         ↓
Response: "Vote berhasil!" ✅
         ↓
Balance GAK berkurang ❌ (tidak ada transaksi blockchain)
```

**Masalah:**
- Vote hanya disimpan di database
- Tidak ada transaksi ke blockchain
- Balance user tidak berkurang
- `onChainTxHash` selalu `null`

---

## ✅ Solusi

### Correct Flow (3-Step Process)

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Build Transaction Payload                      │
├─────────────────────────────────────────────────────────┤
│ Frontend → POST /api/contract/build/place-vote         │
│                                                         │
│ Request:                                                │
│ {                                                       │
│   "marketId": 1,              // onChainId (integer)   │
│   "prediction": "YES",                                  │
│   "amount": 1000000000        // dalam octas           │
│ }                                                       │
│                                                         │
│ Response:                                               │
│ {                                                       │
│   "success": true,                                      │
│   "data": {                                             │
│     "payload": {                                        │
│       "function": "0x...::market::place_vote",         │
│       "functionArguments": [...]                       │
│     },                                                  │
│     "contractAddress": "0x..."                         │
│   }                                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Sign & Submit Transaction (Client-Side)        │
├─────────────────────────────────────────────────────────┤
│ Frontend → wallet.signAndSubmitTransaction(payload)    │
│         ↓                                               │
│ Wallet popup: "Approve transaction?"                   │
│         ↓                                               │
│ User approve                                            │
│         ↓                                               │
│ Transaction submitted ke Movement blockchain           │
│         ↓                                               │
│ Smart contract execute:                                │
│   - coin::withdraw() dari user wallet                  │
│   - Transfer ke market vault                           │
│   - Record vote on-chain                               │
│         ↓                                               │
│ Response: { hash: "0xabc123..." }                      │
│         ↓                                               │
│ ✅ Balance berkurang!                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Record Vote in Database                        │
├─────────────────────────────────────────────────────────┤
│ Frontend → POST /api/predictions/:id/vote              │
│                                                         │
│ Request:                                                │
│ {                                                       │
│   "prediction": "YES",                                  │
│   "amount": 10,                                         │
│   "txHash": "0xabc123..."  // dari step 2              │
│ }                                                       │
│                                                         │
│ Backend:                                                │
│   - Save vote dengan onChainTxHash                     │
│   - Update market pools                                │
│                                                         │
│ Response:                                               │
│ {                                                       │
│   "success": true,                                      │
│   "data": {                                             │
│     "id": "...",                                        │
│     "onChainTxHash": "0xabc123...",                    │
│     ...                                                 │
│   }                                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Status

### ✅ API Endpoints (Sudah Ada)

#### 1. Build Transaction Payload
```
POST /api/contract/build/place-vote
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "marketId": 1,           // integer (onChainId)
  "prediction": "YES",     // "YES" | "NO"
  "amount": 1000000000     // octas (1 MOVE = 100,000,000 octas)
}

Response:
{
  "success": true,
  "data": {
    "payload": {
      "function": "0x9161980...::market::place_vote",
      "functionArguments": [
        "0x9161980...",  // contract address
        "1",             // market_id
        "1",             // prediction (1=YES, 2=NO)
        "1000000000"     // amount in octas
      ]
    },
    "contractAddress": "0x9161980..."
  }
}
```

#### 2. Record Vote
```
POST /api/predictions/:id/vote
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "prediction": "YES",
  "amount": 10,
  "txHash": "0xabc123..."  // OPTIONAL (untuk client-side signing)
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "marketId": "uuid",
    "userId": "uuid",
    "prediction": "YES",
    "amount": 10,
    "onChainTxHash": "0xabc123...",  // ← Sekarang ada!
    "createdAt": "2026-03-08T..."
  }
}
```

### ✅ Database Schema

```prisma
model PredictionMarket {
  id        String  @id @default(uuid())
  onChainId String? @unique  // ← Mapping ke on-chain market ID
  ...
}

model Vote {
  id            String  @id @default(uuid())
  onChainTxHash String? @unique  // ← Transaction hash dari blockchain
  ...
}
```

### ✅ Service Functions

File: `backend/src/services/contract.service.ts`

```typescript
// Build payload untuk client-side signing
buildPlaceVotePayload(params: {
  marketId: number;
  prediction: number;  // 1=YES, 2=NO
  amount: number;      // dalam octas
}): InputEntryFunctionData

// Conversion utilities
moveToOctas(move: number): number  // 1 MOVE → 100,000,000 octas
octasToMove(octas: number): number // 100,000,000 octas → 1 MOVE

// Constants
PREDICTION_YES = 1
PREDICTION_NO = 2
```

---

## 🎨 Frontend Changes Required

### File 1: `interface-v1/src/providers/WalletProvider.tsx`

**Status:** ⚠️ PERLU DIUPDATE

**Tambahkan:**

```typescript
interface WalletContextType {
  connected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
  signMessage: (message: string) => Promise<{ signature: string; publicKey: string }>
  signAndSubmitTransaction: (payload: any) => Promise<string>  // ← TAMBAH INI
}

// Implementasi
const signAndSubmitTransaction = async (payload: any): Promise<string> => {
  if (!currentWallet) {
    throw new Error('No wallet connected')
  }

  try {
    // Sign & submit transaction
    const response = await currentWallet.signAndSubmitTransaction(payload)
    
    // Return transaction hash
    return response.hash
  } catch (error) {
    console.error('Failed to sign and submit transaction:', error)
    throw error
  }
}
```

---

### File 2: `interface-v1/src/hooks/usePlaceVote.ts`

**Status:** ⚠️ PERLU DIUPDATE TOTAL

**Current Implementation (SALAH):**

```typescript
const placeVote = async (predictionId: string, voteData: PlaceVoteData) => {
  // Langsung save ke database tanpa blockchain
  const response = await fetch(
    `${API_URL}/predictions/${predictionId}/vote`,
    {
      method: 'POST',
      body: JSON.stringify(voteData)
    }
  )
  return response.json()
}
```

**New Implementation (BENAR):**

```typescript
import { useWallet } from '@/providers/WalletProvider'

interface PlaceVoteData {
  prediction: 'YES' | 'NO'
  amount: number
}

export const usePlaceVote = () => {
  const [isVoting, setIsVoting] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)
  const { token } = useAuth()
  const { signAndSubmitTransaction } = useWallet()  // ← TAMBAH INI

  const placeVote = useCallback(async (
    predictionId: string,
    voteData: PlaceVoteData
  ): Promise<VoteResponse | null> => {
    if (!token) {
      setVoteError('Authentication required')
      return null
    }

    setIsVoting(true)
    setVoteError(null)

    try {
      // ============================================
      // STEP 1: Get market data untuk onChainId
      // ============================================
      const marketResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/predictions/${predictionId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      const marketResult = await marketResponse.json()
      
      if (!marketResult.success) {
        throw new Error('Failed to fetch market data')
      }

      const market = marketResult.data
      
      // Validate market has onChainId
      if (!market.onChainId) {
        throw new Error('Market is not deployed on-chain')
      }

      // ============================================
      // STEP 2: Build transaction payload
      // ============================================
      const amountInOctas = Math.floor(voteData.amount * 100_000_000)
      
      const buildResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contract/build/place-vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            marketId: parseInt(market.onChainId),
            prediction: voteData.prediction,
            amount: amountInOctas
          })
        }
      )

      const buildResult = await buildResponse.json()
      
      if (!buildResult.success) {
        throw new Error(buildResult.message || 'Failed to build transaction')
      }

      const { payload } = buildResult.data

      // ============================================
      // STEP 3: Sign & submit transaction
      // ============================================
      const txHash = await signAndSubmitTransaction(payload)
      
      if (!txHash) {
        throw new Error('Transaction failed - no hash returned')
      }

      // ============================================
      // STEP 4: Record vote in database
      // ============================================
      const recordResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/predictions/${predictionId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            prediction: voteData.prediction,
            amount: voteData.amount,
            txHash: txHash  // ← Include transaction hash
          })
        }
      )

      const recordResult = await recordResponse.json()

      if (!recordResponse.ok || !recordResult.success) {
        throw new Error(recordResult.message || 'Failed to record vote')
      }

      return recordResult.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place vote'
      setVoteError(errorMessage)
      return null
    } finally {
      setIsVoting(false)
    }
  }, [token, signAndSubmitTransaction])

  return {
    placeVote,
    isVoting,
    voteError
  }
}
```

---

## 🔐 Smart Contract Function

File: `contracts/predictly/sources/market.move`

```move
public entry fun place_vote(
    voter: &signer,           // ← User wallet (HARUS user, bukan relay!)
    admin_addr: address,      // Contract address
    market_id: u64,           // On-chain market ID
    prediction: u8,           // 1 = YES, 2 = NO
    amount: u64,              // Amount dalam octas
) acquires MarketRegistry, VoteRegistry, MarketVault {
    let voter_addr = signer::address_of(voter);  // ← Ambil address dari signer
    
    // ... validations ...
    
    // Transfer coins dari voter ke vault
    let stake_coins = coin::withdraw<AptosCoin>(voter, amount);  // ← Balance berkurang!
    
    // ... record vote ...
}
```

**Kenapa HARUS client-side signing:**
- Line `signer::address_of(voter)` → Ambil address dari yang sign transaction
- Line `coin::withdraw<AptosCoin>(voter, amount)` → Withdraw dari wallet yang sign
- Kalau relay wallet yang sign → voter = relay wallet ❌
- Kalau user wallet yang sign → voter = user wallet ✅

---

## 📊 Data Mapping

### Database ID vs On-Chain ID

```typescript
// Database (UUID)
predictionId: "3ff0ea81-7087-46ed-803d-c4d40cff2fbd"

// On-Chain (Integer)
onChainId: "1"

// Mapping
PredictionMarket {
  id: "3ff0ea81-7087-46ed-803d-c4d40cff2fbd",  // UUID untuk database
  onChainId: "1"                                // Integer untuk smart contract
}
```

### Amount Conversion

```typescript
// Frontend (MOVE)
amount: 10

// Smart Contract (Octas)
amount: 1000000000

// Conversion
1 MOVE = 100,000,000 octas
10 MOVE = 1,000,000,000 octas

// Code
const OCTAS_PER_MOVE = 100_000_000
const amountInOctas = Math.floor(amount * OCTAS_PER_MOVE)
```

### Prediction Mapping

```typescript
// Frontend
prediction: "YES" | "NO"

// Smart Contract
prediction: 1 | 2

// Mapping
"YES" → 1 (PREDICTION_YES)
"NO"  → 2 (PREDICTION_NO)
```

---

## ⚠️ Error Handling

### Possible Errors

```typescript
// 1. Wallet not connected
if (!wallet.connected) {
  throw new Error('Please connect your wallet first')
}

// 2. Market not on-chain
if (!market.onChainId) {
  throw new Error('Market is not deployed on-chain')
}

// 3. User rejected transaction
try {
  const txHash = await signAndSubmitTransaction(payload)
} catch (error) {
  if (error.code === 4001) {
    throw new Error('Transaction rejected by user')
  }
  throw error
}

// 4. Transaction failed on-chain
if (!txHash) {
  throw new Error('Transaction failed - no hash returned')
}

// 5. Database save failed after successful on-chain tx
// This is critical - vote is on-chain but not in DB
// Should retry or log for manual intervention
```

---

## ✅ Testing Checklist

### Backend Testing

- [x] `POST /api/contract/build/place-vote` returns valid payload
- [x] `POST /api/predictions/:id/vote` accepts optional `txHash`
- [x] Vote saved with `onChainTxHash` when `txHash` provided
- [x] Vote saved with `onChainTxHash: null` when `txHash` not provided (backward compatible)

### Frontend Testing

- [ ] Wallet connection works
- [ ] `signAndSubmitTransaction` function added to WalletProvider
- [ ] Step 1: Build payload request successful
- [ ] Step 2: Wallet popup appears for signing
- [ ] Step 2: Transaction submitted to blockchain
- [ ] Step 2: Transaction hash returned
- [ ] Step 3: Vote recorded in database with txHash
- [ ] Balance decreases after vote
- [ ] Error handling for each step works

### Integration Testing

- [ ] Full flow: Build → Sign → Submit → Record
- [ ] Balance verification before and after vote
- [ ] On-chain vote verification
- [ ] Database vote verification with txHash
- [ ] Error scenarios handled gracefully

---

## 📝 Summary

### Backend Changes
**TIDAK ADA** - Backend sudah siap 100%

### Frontend Changes
**2 files:**
1. `WalletProvider.tsx` - Add `signAndSubmitTransaction()`
2. `usePlaceVote.ts` - Implement 3-step flow

### Key Points
- ✅ Backend API sudah lengkap
- ✅ Database schema sudah siap
- ⚠️ Frontend perlu implement client-side signing
- ⚠️ User wallet HARUS yang sign (bukan relay wallet)
- ✅ Balance akan berkurang setelah fix

---

## 🔗 Related Files

### Backend
- `backend/src/controllers/contract.controller.ts` - Build payload endpoint
- `backend/src/controllers/predictions.controller.ts` - Record vote endpoint
- `backend/src/services/contract.service.ts` - Contract utilities
- `backend/src/validators/predictions.validator.ts` - Vote validation
- `backend/prisma/schema.prisma` - Database schema

### Frontend
- `interface-v1/src/providers/WalletProvider.tsx` - Wallet integration
- `interface-v1/src/hooks/usePlaceVote.ts` - Vote hook
- `interface-v1/src/components/pages/(app)/market-detail/index.tsx` - Vote UI

### Smart Contract
- `contracts/predictly/sources/market.move` - place_vote function

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check error message di console
2. Verify wallet connection
3. Check market has `onChainId`
4. Verify transaction hash returned
5. Check database for vote record

---

**Last Updated:** 2026-03-08
**Status:** Backend Ready ✅ | Frontend Pending ⚠️
