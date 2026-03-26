# 💰 Wallet Balance API

API endpoints untuk check balance MOVE token dari wallet address.

---

## 📋 Endpoints

### 1. Get Balance by Address (Public)

**GET** `/api/wallet/balance/:address`

Check balance MOVE token untuk wallet address manapun (tidak perlu auth).

**Parameters:**
- `address` (path, required) - Wallet address (must start with 0x)

**Example Request:**
```bash
curl -X GET "https://backend-3ufs.onrender.com/api/wallet/balance/0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565",
    "balance": 125.5432,
    "unit": "MOVE"
  }
}
```

---

### 2. Get Detailed Balance by Address (Public)

**GET** `/api/wallet/balance/:address/detailed`

Check balance dengan detail lengkap (MOVE, octas, formatted).

**Parameters:**
- `address` (path, required) - Wallet address (must start with 0x)

**Example Request:**
```bash
curl -X GET "https://backend-3ufs.onrender.com/api/wallet/balance/0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565/detailed"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565",
    "balance": {
      "move": 125.5432,
      "octas": "12554320000",
      "formatted": "125.5432 MOVE"
    }
  }
}
```

---

### 3. Get My Balance (Authenticated)

**GET** `/api/wallet/balance/me`

Check balance untuk user yang sedang login.

**Auth:** Required (Bearer token)

**Example Request:**
```bash
curl -X GET "https://backend-3ufs.onrender.com/api/wallet/balance/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid-here",
    "address": "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565",
    "balance": 125.5432,
    "unit": "MOVE"
  }
}
```

---

## 🔧 Usage Examples

### JavaScript/TypeScript

```typescript
// Get balance by address
async function getWalletBalance(address: string) {
  const response = await fetch(
    `https://backend-3ufs.onrender.com/api/wallet/balance/${address}`
  );
  const data = await response.json();
  
  if (data.success) {
    console.log(`Balance: ${data.data.balance} MOVE`);
    return data.data.balance;
  }
}

// Get detailed balance
async function getDetailedBalance(address: string) {
  const response = await fetch(
    `https://backend-3ufs.onrender.com/api/wallet/balance/${address}/detailed`
  );
  const data = await response.json();
  
  if (data.success) {
    console.log(`Balance: ${data.data.balance.formatted}`);
    console.log(`Octas: ${data.data.balance.octas}`);
    return data.data.balance;
  }
}

// Get my balance (authenticated)
async function getMyBalance(token: string) {
  const response = await fetch(
    'https://backend-3ufs.onrender.com/api/wallet/balance/me',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  
  if (data.success) {
    console.log(`My Balance: ${data.data.balance} MOVE`);
    return data.data.balance;
  }
}
```

### React Example

```tsx
import { useState, useEffect } from 'react';

function WalletBalance({ address }: { address: string }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        setLoading(true);
        const response = await fetch(
          `https://backend-3ufs.onrender.com/api/wallet/balance/${address}`
        );
        const data = await response.json();
        
        if (data.success) {
          setBalance(data.data.balance);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to fetch balance');
      } finally {
        setLoading(false);
      }
    }

    if (address) {
      fetchBalance();
    }
  }, [address]);

  if (loading) return <div>Loading balance...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h3>Wallet Balance</h3>
      <p>{balance?.toFixed(4)} MOVE</p>
    </div>
  );
}
```

---

## ⚠️ Error Responses

### 400 Bad Request - Invalid Address
```json
{
  "success": false,
  "message": "Invalid wallet address format. Address must start with 0x"
}
```

### 401 Unauthorized - Not Authenticated (for /me endpoint)
```json
{
  "success": false,
  "message": "User not authenticated or wallet address not found"
}
```

### 503 Service Unavailable - RPC Down
```json
{
  "success": false,
  "message": "Movement RPC is temporarily unavailable. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch wallet balance: [error details]"
}
```

---

## 📝 Notes

### Balance Format
- **MOVE**: Human-readable format (e.g., 125.5432)
- **Octas**: Raw blockchain format (1 MOVE = 100,000,000 octas)
- **Formatted**: String with unit (e.g., "125.5432 MOVE")

### New Accounts
- Accounts that have never received tokens will return balance: 0
- No error is thrown for new/empty accounts

### RPC Availability
- If Movement RPC is down (503 error), the endpoint will return a clear error message
- Frontend should handle this gracefully and show a retry option

### Rate Limiting
- These endpoints are subject to rate limiting (if enabled)
- Consider caching balance data on frontend to reduce API calls

---

## 🚀 Testing

### Test with Postman

1. **Import Collection**: Add to your Postman collection
2. **Set Variables**:
   - `baseUrl`: `https://backend-3ufs.onrender.com`
   - `walletAddress`: Your test wallet address
   - `token`: Your JWT token (for /me endpoint)

3. **Test Requests**:
   ```
   GET {{baseUrl}}/api/wallet/balance/{{walletAddress}}
   GET {{baseUrl}}/api/wallet/balance/{{walletAddress}}/detailed
   GET {{baseUrl}}/api/wallet/balance/me
   ```

### Test with cURL

```bash
# Test public endpoint
curl "https://backend-3ufs.onrender.com/api/wallet/balance/0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"

# Test detailed endpoint
curl "https://backend-3ufs.onrender.com/api/wallet/balance/0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565/detailed"

# Test authenticated endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://backend-3ufs.onrender.com/api/wallet/balance/me"
```

---

## 🔗 Related Endpoints

- `GET /api/users/me` - Get current user profile (includes wallet address)
- `GET /api/users/:userId` - Get user by ID (includes wallet address)
- `POST /api/auth/wallet/verify` - Authenticate with wallet

---

## 📚 Additional Resources

- [Movement Network Explorer](https://explorer.movementnetwork.xyz/)
- [Movement Faucet](https://faucet.testnet.bardock.movementlabs.xyz/)
- [Aptos SDK Documentation](https://aptos.dev/sdks/ts-sdk/)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 2, 2026
