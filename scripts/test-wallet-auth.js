/**
 * Test Script for Wallet Authentication
 * 
 * This script demonstrates how to:
 * 1. Get sign-in message from backend
 * 2. Sign the message with Aptos wallet
 * 3. Verify signature and get JWT token
 * 
 * Usage:
 * node scripts/test-wallet-auth.js
 */

import { AptosAccount, AptosClient, HexString } from 'aptos';
import fetch from 'node-fetch';

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const WALLET_PRIVATE_KEY = '0xf1f0af3f36bbf2264d53f1869a2045345d7aae779fd2087abbabab9045729fd2'; // Replace with your private key

// Create Aptos account from private key
const account = new AptosAccount(
  HexString.ensure(WALLET_PRIVATE_KEY).toUint8Array()
);

const walletAddress = account.address().hex();
console.log('🔑 Wallet Address:', walletAddress);
console.log('🔑 Public Key:', HexString.fromUint8Array(account.pubKey().toUint8Array()).hex());

/**
 * Step 1: Get sign-in message from backend
 */
async function getSignInMessage() {
  console.log('\n📝 Step 1: Getting sign-in message...');
  
  const response = await fetch(`${BACKEND_URL}/api/auth/wallet/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress: walletAddress,
    }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Failed to get message: ${data.message}`);
  }

  console.log('✅ Message received:');
  console.log('   Nonce:', data.data.nonce);
  console.log('   Expires:', data.data.expiresAt);
  console.log('   Message:', data.data.message.substring(0, 100) + '...');
  
  return data.data;
}

/**
 * Step 2: Sign the message with wallet
 */
function signMessage(message) {
  console.log('\n✍️  Step 2: Signing message...');
  
  // Convert message to Uint8Array
  const messageBytes = new TextEncoder().encode(message);
  
  // Sign the message
  const signature = account.signBuffer(messageBytes);
  
  // Convert to hex string
  const signatureHex = HexString.fromUint8Array(signature.toUint8Array()).hex();
  const publicKeyHex = HexString.fromUint8Array(account.pubKey().toUint8Array()).hex();
  
  console.log('✅ Message signed:');
  console.log('   Signature:', signatureHex);
  console.log('   Signature Length:', signatureHex.length);
  console.log('   Public Key:', publicKeyHex);
  console.log('   Public Key Length:', publicKeyHex.length);
  
  return {
    signature: signatureHex,
    publicKey: publicKeyHex,
  };
}

/**
 * Step 3: Verify signature and get JWT token
 */
async function verifySignature(message, signature, publicKey) {
  console.log('\n🔐 Step 3: Verifying signature...');
  
  const response = await fetch(`${BACKEND_URL}/api/auth/wallet/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress: walletAddress,
      signature: signature,
      publicKey: publicKey,
      message: message,
    }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Verification failed: ${data.message}`);
  }

  console.log('✅ Verification successful!');
  console.log('   User ID:', data.data.user.id);
  console.log('   Display Name:', data.data.user.displayName);
  console.log('   JWT Token:', data.data.token.substring(0, 50) + '...');
  
  return data.data;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting Wallet Authentication Test...\n');
    console.log('=' .repeat(60));
    
    // Step 1: Get message
    const { message, nonce } = await getSignInMessage();
    
    // Step 2: Sign message
    const { signature, publicKey } = signMessage(message);
    
    // Step 3: Verify and get token
    const { user, token } = await verifySignature(message, signature, publicKey);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Authentication Complete!');
    console.log('=' .repeat(60));
    console.log('\n📋 Summary:');
    console.log('   Wallet:', walletAddress);
    console.log('   User ID:', user.id);
    console.log('   Token:', token);
    console.log('\n💡 Use this token in Authorization header:');
    console.log(`   Authorization: Bearer ${token}`);
    console.log('\n✅ You can now test the new endpoints!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
