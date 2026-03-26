/**
 * Generate Postman Auth Token
 *
 * Script ini otomatis:
 * 1. Get sign-in message dari backend
 * 2. Sign dengan private key
 * 3. Verify dan dapat JWT token
 * 4. Output semua variable yang perlu di-set di Postman
 *
 * Usage:
 *   node scripts/generate-postman-token.js
 *
 * Optional env vars:
 *   BACKEND_URL=http://localhost:3001
 *   MOVEMENT_PRIVATE_KEY=0xYOUR_KEY
 */

import { AptosAccount, HexString } from 'aptos';
import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const PRIVATE_KEY = process.env.MOVEMENT_PRIVATE_KEY || '';

const account = new AptosAccount(HexString.ensure(PRIVATE_KEY).toUint8Array());
const walletAddress = account.address().hex();
const publicKey = HexString.fromUint8Array(account.pubKey().toUint8Array()).hex();

async function run() {
  console.log('='.repeat(60));
  console.log('🔑 Wallet Address:', walletAddress);
  console.log('🔑 Public Key    :', publicKey);
  console.log('='.repeat(60));

  // Step 1: Get message
  console.log('\n📝 Getting sign-in message...');
  const msgRes = await fetch(`${BACKEND_URL}/api/auth/wallet/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });
  const msgData = await msgRes.json();
  if (!msgData.success) throw new Error(`Failed to get message: ${msgData.message}`);
  const message = msgData.data.message;
  console.log('✅ Message received');

  // Step 2: Sign
  console.log('\n✍️  Signing message...');
  const messageBytes = new TextEncoder().encode(message);
  const sigBytes = account.signBuffer(messageBytes).toUint8Array();
  const signature = HexString.fromUint8Array(sigBytes).hex();
  console.log('✅ Signature:', signature);
  console.log('   Length   :', sigBytes.length, 'bytes (should be 64)');

  // Step 3: Verify
  console.log('\n🔐 Verifying with backend...');
  const verifyRes = await fetch(`${BACKEND_URL}/api/auth/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, signature, publicKey, message }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) throw new Error(`Verification failed: ${verifyData.message}`);

  const token = verifyData.data.token;
  const userId = verifyData.data.user.id;

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SUCCESS! Copy values below ke Postman Collection Variables:');
  console.log('='.repeat(60));
  console.log('\nVariable Name    | Value');
  console.log('-'.repeat(60));
  console.log(`token            | ${token}`);
  console.log(`userId           | ${userId}`);
  console.log(`walletAddress    | ${walletAddress}`);
  console.log('='.repeat(60));
  console.log('\n💡 Cara set di Postman:');
  console.log('   1. Buka collection Predictly API');
  console.log('   2. Klik tab "Variables"');
  console.log('   3. Set nilai di atas ke kolom "Current Value"');
  console.log('   4. Klik Save');
  console.log('\n✅ Token siap dipakai!');
}

run().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
