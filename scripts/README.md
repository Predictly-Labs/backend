# Wallet Authentication Test Scripts

Scripts untuk testing wallet authentication dengan backend API.

## 📁 Files

1. **test-wallet-auth.js** - Node.js script untuk testing dari command line
2. **test-wallet-auth-browser.html** - Browser-based testing dengan UI yang bagus

## 🚀 Option 1: Node.js Script (Command Line)

### Prerequisites
```bash
npm install aptos node-fetch
```

### Setup
**⚠️ SECURITY WARNING: NEVER commit your private key to Git!**

**IMPORTANT**: This script requires you to set your private key as an environment variable. The script will NOT run if the private key is not set properly.

Set your private key as environment variable:
```bash
# Linux/Mac
export TEST_WALLET_PRIVATE_KEY="0xYOUR_PRIVATE_KEY_HERE"
export BACKEND_URL="http://localhost:3001"  # Optional

# Windows (CMD)
set TEST_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
set BACKEND_URL=http://localhost:3001

# Windows (PowerShell)
$env:TEST_WALLET_PRIVATE_KEY="0xYOUR_PRIVATE_KEY_HERE"
$env:BACKEND_URL="http://localhost:3001"
```

**Note**: The script will exit with an error if `TEST_WALLET_PRIVATE_KEY` is not set. This is a safety feature to prevent accidental exposure of private keys.

### Run
```bash
node scripts/test-wallet-auth.js
```

### Output
```
🚀 Starting Wallet Authentication Test...

============================================================
📝 Step 1: Getting sign-in message...
✅ Message received:
   Nonce: abc123
   Expires: 2024-12-31T12:05:00Z
   Message: Sign this message to authenticate with Predictly...

✍️  Step 2: Signing message...
✅ Message signed:
   Signature: 0x1234567890abcdef...
   Signature Length: 130
   Public Key: 0xabcdef1234567890...
   Public Key Length: 66

🔐 Step 3: Verifying signature...
✅ Verification successful!
   User ID: uuid-here
   Display Name: User_abc123

============================================================
🎉 Authentication Complete!
============================================================

📋 Summary:
   Wallet: 0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565
   User ID: uuid-here
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

💡 Use this token in Authorization header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ You can now test the new endpoints!
```

## 🌐 Option 2: Browser Script (Recommended)

### Setup
1. Pastikan backend sudah running di `http://localhost:3001`
2. Install Aptos wallet extension (Petra atau Martian)
3. Buka `test-wallet-auth-browser.html` di browser

### Steps
1. **Connect Wallet** - Klik tombol "Connect Wallet"
2. **Get Message** - Klik "Get Message" untuk request message dari backend
3. **Sign & Verify** - Klik "Sign & Verify" untuk sign dan verify signature

### Features
- ✅ Beautiful UI dengan gradient background
- ✅ Step-by-step process
- ✅ Real-time logging
- ✅ Copy token button
- ✅ Error handling
- ✅ Works dengan Petra, Martian, dan wallet Aptos lainnya

## 🔧 Troubleshooting

### Error: "No Aptos wallet found"
**Solution:** Install Petra atau Martian wallet extension

### Error: "Invalid signature format"
**Solution:** 
- Pastikan wallet return signature dalam format hex (0x...)
- Check signature length harus 130 characters (0x + 128 hex)
- Check public key length harus 66 characters (0x + 64 hex)

### Error: "Invalid or expired nonce"
**Solution:**
- Nonce expired setelah 5 menit
- Request message baru dari step 1

### Error: "CORS error"
**Solution:**
- Pastikan backend CORS sudah configured untuk allow origin kamu
- Atau buka HTML file via local server (tidak langsung file://)

## 📝 Testing New Endpoints

Setelah dapat JWT token, kamu bisa test endpoint baru:

### 1. My Groups
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/groups/my-groups?page=1&limit=20"
```

### 2. My Votes Statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/predictions/my-votes/stats"
```

### 3. Check My Vote
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/predictions/MARKET_ID/my-vote"
```

### 4. Group Settings
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/groups/GROUP_ID/settings"
```

## 🎯 Quick Testing dengan Postman

1. Run browser script untuk get token
2. Copy token dari UI
3. Buka Postman
4. Set collection variable `token` dengan token yang di-copy
5. Test semua endpoint di folder "Missing API Features (v2.1)"

## 💡 Tips

- **Development Mode:** Backend accept signature dengan format yang valid (64 bytes) even kalau verification gagal
- **Production Mode:** Harus proper signature verification
- **Token Expiry:** JWT token expired setelah 7 hari (default)
- **Nonce Expiry:** Nonce expired setelah 5 menit

## 🔐 Security Notes

- **NEVER commit private keys** ke git
- **NEVER share private keys** dengan siapa pun
- **Use environment variables** untuk sensitive data
- **Test scripts** hanya untuk development/testing

## 📚 References

- [Aptos SDK Documentation](https://aptos.dev/sdks/ts-sdk/)
- [Petra Wallet Docs](https://petra.app/docs)
- [Martian Wallet Docs](https://docs.martianwallet.xyz/)
