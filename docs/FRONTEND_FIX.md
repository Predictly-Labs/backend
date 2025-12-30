# Fix untuk Frontend - Nightly Wallet Authentication

## ⚠️ TEMPORARY FIX ACTIVE (Backend Updated)

**Status:** Backend sekarang menerima authentication TANPA `publicKey` sebagai temporary fix.
- ✅ Login akan bekerja jika signature format valid (64 bytes)
- ⚠️ Frontend TETAP harus diperbaiki untuk mengirim `publicKey` untuk keamanan penuh
- 🔄 Backend perlu di-rebuild/redeploy di Render untuk apply fix ini

---

## Masalah dari Logs:

```
Signature: [object Object]  ❌ SALAH - harus string
Public Key: NOT PROVIDED    ❌ SALAH - harus dikirim
```

---

## Kode Frontend yang SALAH ❌

```typescript
// ❌ JANGAN SEPERTI INI
const signedMessage = await window.aptos.signMessage({
  message: messageData.message,
  nonce: messageData.nonce
});

// Kirim langsung object (SALAH!)
const verifyResponse = await fetch('/api/auth/wallet/verify', {
  method: 'POST',
  body: JSON.stringify({
    walletAddress: signedMessage.address,
    signature: signedMessage,           // ❌ SALAH - ini object!
    publicKey: signedMessage.publicKey, // ❌ Mungkin undefined
    message: messageData.message
  })
});
```

---

## Kode Frontend yang BENAR ✅

```typescript
// ✅ GUNAKAN INI
const signedMessage = await window.aptos.signMessage({
  message: messageData.message,
  nonce: messageData.nonce
});

console.log('Signed message response:', signedMessage);
// Cek struktur response dari Nightly

// Extract signature dan publicKey dengan benar
const verifyResponse = await fetch('/api/auth/wallet/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: signedMessage.address,
    signature: signedMessage.signature,    // ✅ String hex
    publicKey: signedMessage.publicKey,    // ✅ String hex
    message: messageData.message           // ✅ Exact message
  })
});
```

---

## Complete Working Example

```typescript
// hooks/useWalletAuth.ts
import { useState } from 'react';

interface SignMessageResponse {
  address: string;
  signature: string;
  publicKey?: string;
  fullMessage?: string;
}

export function useWalletAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get wallet address from Nightly
      const account = await window.aptos.account();
      const walletAddress = account.address;

      console.log('👛 Wallet Address:', walletAddress);

      // Step 1: Get sign-in message from backend
      console.log('📝 Step 1: Getting sign-in message...');
      const messageResponse = await fetch('https://backend-3ufs.onrender.com/api/auth/wallet/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to get sign-in message');
      }

      const { data: messageData } = await messageResponse.json();
      console.log('✅ Message received');
      console.log('Message:', messageData.message);
      console.log('Nonce:', messageData.nonce);

      // Step 2: Sign message with Nightly wallet
      console.log('✍️  Step 2: Requesting signature from Nightly wallet...');
      
      const signedMessage: SignMessageResponse = await window.aptos.signMessage({
        message: messageData.message,
        nonce: messageData.nonce
      });

      console.log('✅ Message signed by wallet');
      console.log('Signed response:', signedMessage);

      // Validate response structure
      if (!signedMessage.signature) {
        console.error('❌ No signature in response:', signedMessage);
        throw new Error('Wallet did not return a signature');
      }

      // Extract values correctly
      const signature = typeof signedMessage.signature === 'string' 
        ? signedMessage.signature 
        : JSON.stringify(signedMessage.signature);

      const publicKey = signedMessage.publicKey || signedMessage.address;

      console.log('📤 Sending to backend:');
      console.log('  - Wallet Address:', walletAddress);
      console.log('  - Signature:', signature.substring(0, 20) + '...');
      console.log('  - Public Key:', publicKey);
      console.log('  - Message length:', messageData.message.length);

      // Step 3: Verify signature with backend
      console.log('🔐 Step 3: Verifying signature...');
      const verifyResponse = await fetch('https://backend-3ufs.onrender.com/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress,
          signature: signature,
          publicKey: publicKey,
          message: messageData.message
        })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        console.error('❌ Verification failed:', errorData);
        throw new Error(errorData.error?.message || 'Signature verification failed');
      }

      const { data: authData } = await verifyResponse.json();
      console.log('✅ Authentication successful!');
      console.log('User:', authData.user);

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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return { login, logout, loading, error };
}
```

---

## Debugging Tips

### 1. Check Nightly Response Structure

```typescript
const signedMessage = await window.aptos.signMessage({
  message: messageData.message,
  nonce: messageData.nonce
});

// Log untuk debug
console.log('=== NIGHTLY RESPONSE ===');
console.log('Type:', typeof signedMessage);
console.log('Keys:', Object.keys(signedMessage));
console.log('Full object:', JSON.stringify(signedMessage, null, 2));
console.log('Signature type:', typeof signedMessage.signature);
console.log('Signature value:', signedMessage.signature);
console.log('PublicKey type:', typeof signedMessage.publicKey);
console.log('PublicKey value:', signedMessage.publicKey);
console.log('=======================');
```

### 2. Validate Before Sending

```typescript
// Validate signature format
if (!signedMessage.signature || typeof signedMessage.signature !== 'string') {
  throw new Error('Invalid signature format from wallet');
}

// Validate signature is hex string
if (!signedMessage.signature.startsWith('0x')) {
  throw new Error('Signature must be hex string starting with 0x');
}

// Validate signature length (Ed25519 = 64 bytes = 128 hex chars + 0x)
if (signedMessage.signature.length !== 130) {
  console.warn('⚠️  Unexpected signature length:', signedMessage.signature.length);
}
```

---

## Alternative: Handle Different Wallet Formats

Jika Nightly mengembalikan format berbeda:

```typescript
function extractSignature(signedMessage: any): string {
  // Case 1: Direct string
  if (typeof signedMessage.signature === 'string') {
    return signedMessage.signature;
  }
  
  // Case 2: Nested in object
  if (signedMessage.signature?.signature) {
    return signedMessage.signature.signature;
  }
  
  // Case 3: Uint8Array or Buffer
  if (signedMessage.signature?.data) {
    return '0x' + Buffer.from(signedMessage.signature.data).toString('hex');
  }
  
  throw new Error('Cannot extract signature from wallet response');
}

function extractPublicKey(signedMessage: any): string {
  // Try publicKey field
  if (signedMessage.publicKey && typeof signedMessage.publicKey === 'string') {
    return signedMessage.publicKey;
  }
  
  // Fallback to address
  if (signedMessage.address) {
    return signedMessage.address;
  }
  
  throw new Error('Cannot extract public key from wallet response');
}

// Usage
const signature = extractSignature(signedMessage);
const publicKey = extractPublicKey(signedMessage);
```

---

## Testing Checklist

- [ ] Signature adalah string (bukan object)
- [ ] Signature dimulai dengan `0x`
- [ ] Signature length = 130 characters (0x + 128 hex)
- [ ] Public key adalah string
- [ ] Public key dimulai dengan `0x`
- [ ] Message EXACT sama dengan yang dari backend
- [ ] Wallet address match dengan public key

---

## Expected Backend Logs (Success)

```
========================================
🔐 SIGNATURE VERIFICATION REQUEST
========================================
Wallet Address: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773
Signature: 0xa882f74ebbeea51ef8429bb03f896675f50be5d1d32e787ff1f660d6c49174c3e0e358fd1232d77a10821b5a5850d6afe69b8e5ee6c352ae59297cdd0356060a
Public Key: 0x6bedcb44e4d586950e78281e071845cb852e96f01348919a6e98abf2b7aa1773
Message length: 239
========================================

📝 Extracted nonce: dmDIiRkWUp6faDzaB0k27h9hQvY7mx2P
✅ Nonce found in database
✅ Nonce is valid and not expired
🔍 Verifying signature...
✅ Signature parsed successfully
Signature bytes length: 64
✅ Using provided public key for verification
✅ Public key matches wallet address
✅ Signature verification result: true
✅ Signature verification successful!
```

---

## Quick Fix Summary

**Masalah:** Frontend mengirim `signature` sebagai object dan tidak mengirim `publicKey`

**Solusi:** 
```typescript
// Pastikan ini string, bukan object!
body: JSON.stringify({
  walletAddress: signedMessage.address,
  signature: signedMessage.signature,    // ✅ MUST BE STRING
  publicKey: signedMessage.publicKey,    // ✅ MUST BE PROVIDED
  message: messageData.message
})
```

Minta teman kamu cek response dari `window.aptos.signMessage()` dan pastikan extract signature dan publicKey dengan benar! 🔍
