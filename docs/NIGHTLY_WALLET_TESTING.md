# Testing Authentication dengan Nightly Wallet

## Problem yang Sering Terjadi

Error `401 Unauthorized - Signature verification failed` biasanya disebabkan oleh:

1. **Message format tidak sama** - Whitespace, newline, atau encoding berbeda
2. **Signature format salah** - Hex encoding tidak sesuai
3. **Public key tidak match** - Public key tidak sesuai dengan wallet address
4. **Nonce expired** - Terlalu lama antara get message dan verify (> 5 menit)

---

## Step-by-Step Testing yang Benar

### **Step 1: Get Sign-In Message**

```bash
POST http://localhost:3001/api/auth/wallet/message
Content-Type: application/json

{
  "walletAddress": "0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Sign in to Predictly\n\nWallet: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773\nNonce: k3TTyD8feP7Vc9SJnC1bJVoPq3jbSbFR\nTimestamp: 1767108382403\n\nThis request will not trigger a blockchain transaction or cost any gas fees.",
    "nonce": "k3TTyD8feP7Vc9SJnC1bJVoPq3jbSbFR",
    "expiresAt": "2024-12-30T12:08:02.403Z"
  }
}
```

**PENTING:** 
- Copy **EXACT** message dari response
- Jangan edit atau format ulang
- Simpan untuk Step 3

---

### **Step 2: Sign Message dengan Nightly Wallet**

Di frontend (React/Next.js):

```typescript
// 1. Request message from backend
const response = await fetch('http://localhost:3001/api/auth/wallet/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    walletAddress: account.address 
  })
});

const { data } = await response.json();
const { message, nonce } = data;

// 2. Sign with Nightly wallet
const signedMessage = await window.aptos.signMessage({
  message: message,  // EXACT message from backend
  nonce: nonce
});

console.log('Signed Message:', signedMessage);
// Output:
// {
//   address: "0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773",
//   signature: "0x81e8ce9312f7bccdf0c6d7a211_99bbd40e1ccdf7b3ccbb294b96db9ec6c097680c0f",
//   publicKey: "0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773"
// }
```

---

### **Step 3: Verify Signature**

```bash
POST http://localhost:3001/api/auth/wallet/verify
Content-Type: application/json

{
  "walletAddress": "0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773",
  "signature": "0x81e8ce9312f7bccdf0c6d7a211_99bbd40e1ccdf7b3ccbb294b96db9ec6c097680c0f",
  "publicKey": "0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773",
  "message": "Sign in to Predictly\n\nWallet: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773\nNonce: k3TTyD8feP7Vc9SJnC1bJVoPq3jbSbFR\nTimestamp: 1767108382403\n\nThis request will not trigger a blockchain transaction or cost any gas fees."
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "walletAddress": "0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773",
      "displayName": "User_7aa1773",
      "totalPredictions": 0,
      "correctPredictions": 0,
      "totalEarnings": 0,
      "isPro": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Authentication successful"
}
```

---

## Debugging Tips

### **Check Backend Logs**

Setelah call `/verify`, cek terminal backend untuk log detail:

```
========================================
🔐 SIGNATURE VERIFICATION REQUEST
========================================
Wallet Address: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773
Signature: 0x81e8ce9312f7bccdf0c6d7a211_99bbd40e1ccdf7b3ccbb294b96db9ec6c097680c0f
Public Key: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773
Message (raw): "Sign in to Predictly\n\nWallet: 0x6bedcb44e4d586950e..."
Message length: 150
========================================

📝 Extracted nonce: k3TTyD8feP7Vc9SJnC1bJVoPq3jbSbFR
✅ Nonce found in database
✅ Nonce is valid and not expired
🔍 Verifying signature...
✅ Signature parsed successfully
Signature bytes length: 64
✅ Using provided public key for verification
🔍 Starting Aptos signature verification...
  - Wallet Address: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773
  - Public Key Hex: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773
  - Signature Length: 64
  - Message Length: 150
✅ Public key created successfully
  - Derived Address: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773
  - Expected Address: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773
✅ Public key matches wallet address
🔍 Verifying signature...
✅ Signature verification result: true
✅ Signature verification successful!
```

### **Common Errors**

#### **Error: "Invalid message format: nonce not found"**
- Message format salah
- Pastikan message dari Step 1 tidak diubah

#### **Error: "Invalid or expired nonce"**
- Nonce sudah expired (> 5 menit)
- Atau nonce tidak ditemukan di database
- Ulangi dari Step 1

#### **Error: "Public key does not match wallet address"**
- Public key yang dikirim salah
- Pastikan public key dari Nightly wallet response

#### **Error: "Signature verification failed"**
- Signature tidak valid
- Kemungkinan message yang di-sign berbeda dengan message yang dikirim
- Pastikan EXACT message yang sama

---

## Frontend Integration Example

```typescript
// hooks/useWalletAuth.ts
import { useState } from 'react';

export function useWalletAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get message
      console.log('📝 Step 1: Getting sign-in message...');
      const messageResponse = await fetch('http://localhost:3001/api/auth/wallet/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to get sign-in message');
      }

      const { data: messageData } = await messageResponse.json();
      console.log('✅ Message received:', messageData.message);

      // Step 2: Sign with wallet
      console.log('✍️  Step 2: Signing message with wallet...');
      const signedMessage = await window.aptos.signMessage({
        message: messageData.message,
        nonce: messageData.nonce
      });

      console.log('✅ Message signed:', {
        address: signedMessage.address,
        signature: signedMessage.signature.substring(0, 20) + '...',
        publicKey: signedMessage.publicKey
      });

      // Step 3: Verify signature
      console.log('🔐 Step 3: Verifying signature...');
      const verifyResponse = await fetch('http://localhost:3001/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: signedMessage.address,
          signature: signedMessage.signature,
          publicKey: signedMessage.publicKey,
          message: messageData.message  // EXACT message from Step 1
        })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error?.message || 'Signature verification failed');
      }

      const { data: authData } = await verifyResponse.json();
      console.log('✅ Authentication successful!');

      // Save token
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));

      return authData;

    } catch (err: any) {
      console.error('❌ Authentication error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
```

---

## Testing dengan Postman

Jika testing manual dengan Postman:

1. **Get Message** → Copy response message
2. **Sign Manual** → Gunakan script Node.js atau Python untuk sign
3. **Verify** → Paste signature dan message yang SAMA PERSIS

**Node.js Script untuk Sign:**
```javascript
const { Account, Ed25519PrivateKey } = require('@aptos-labs/ts-sdk');

const PRIVATE_KEY = "your_private_key_without_0x";
const MESSAGE = `PASTE_EXACT_MESSAGE_HERE`;

const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
const account = Account.fromPrivateKey({ privateKey });

const messageBytes = new TextEncoder().encode(MESSAGE);
const signature = account.sign(messageBytes);

console.log({
  walletAddress: account.accountAddress.toString(),
  publicKey: account.publicKey.toString(),
  signature: signature.toString(),
  message: MESSAGE
});
```

---

## Production Considerations

1. **HTTPS Only** - Signature verification harus via HTTPS di production
2. **Rate Limiting** - Sudah ada (5 requests per 15 menit)
3. **Nonce TTL** - 5 menit (cukup untuk user flow normal)
4. **Token Expiry** - JWT valid 7 hari
5. **Public Key Required** - Di production, public key wajib disertakan

---

## Support

Jika masih error:
1. Cek backend logs untuk detail error
2. Pastikan message EXACT sama
3. Pastikan nonce belum expired
4. Pastikan public key match dengan wallet address
5. Test dengan wallet lain (Petra, Martian) untuk compare

