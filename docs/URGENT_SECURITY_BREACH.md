# 🚨 URGENT: SECURITY BREACH DETECTED

**Date**: December 31, 2024  
**Severity**: CRITICAL  
**Status**: REQUIRES IMMEDIATE ACTION

---

## ⚠️ PRIVATE KEY EXPOSED IN GIT HISTORY

Your private key `0xf1f0af3f36bbf2264d53f1869a2045345d7aae779fd2087abbabab9045729fd2` has been committed to Git history in **2 locations**:

### Exposed Commits:

1. **Commit `35c96b0`** - File: `scripts/test-wallet-auth.js`
   - Hardcoded private key in test script
   - Commit message: "docs(api,groups,predictions): Add comprehensive documentation..."

2. **Commit `1c9ac35`** - File: `.env.example`
   - Private key in example file (should be placeholder)
   - Commit message: "feat: Implement initial backend application..."

### Associated Wallet Address:
`0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565`

---

## 🔥 IMMEDIATE ACTIONS REQUIRED

### Priority 1: Secure Your Funds (DO THIS NOW!)

#### 1. Check Wallet Balance
```bash
# Check on Movement Explorer
https://explorer.movementnetwork.xyz/account/0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565
```

#### 2. Transfer All Funds IMMEDIATELY
If there are any funds in this wallet, transfer them to a NEW wallet NOW:

```bash
# Create new wallet (use Petra or Martian wallet)
# Transfer ALL APT tokens to new wallet
# Transfer ALL other assets to new wallet
```

#### 3. Generate New Wallet
```bash
# Option 1: Use Petra Wallet
# - Install Petra extension
# - Create new wallet
# - Save seed phrase SECURELY (offline)
# - Get new address and private key

# Option 2: Use Aptos CLI
aptos init --network testnet
# Save the private key from .aptos/config.yaml
```

---

### Priority 2: Update Environment Variables

#### 1. Update `.env` File
```bash
# Replace with NEW wallet credentials
MOVEMENT_PRIVATE_KEY=0xYOUR_NEW_PRIVATE_KEY_HERE
RELAY_WALLET_PRIVATE_KEY=0xYOUR_NEW_PRIVATE_KEY_HERE
```

#### 2. Update Render Environment Variables
```bash
# Go to Render Dashboard
# Settings > Environment
# Update:
# - MOVEMENT_PRIVATE_KEY
# - RELAY_WALLET_PRIVATE_KEY
```

#### 3. Redeploy Backend
```bash
# Trigger manual deploy on Render
# Or push new commit to trigger auto-deploy
```

---

### Priority 3: Clean Git History

⚠️ **WARNING**: This will rewrite Git history. Coordinate with your team first!

#### Option A: Remove Specific Commits (Recommended)
```bash
# Backup first!
git clone --mirror . ../predictly-backup

# Remove the file from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/test-wallet-auth.js" \
  --prune-empty --tag-name-filter cat -- --all

# Also remove .env.example with private key
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.example" \
  --prune-empty --tag-name-filter cat -- 1c9ac35^..1c9ac35

# Force push (DANGEROUS!)
git push origin --force --all
git push origin --force --tags
```

#### Option B: Use BFG Repo-Cleaner (Easier)
```bash
# Install BFG
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Backup first!
git clone --mirror . ../predictly-backup

# Remove private key from all history
java -jar bfg.jar --replace-text passwords.txt

# Where passwords.txt contains:
# 0xf1f0af3f36bbf2264d53f1869a2045345d7aae779fd2087abbabab9045729fd2

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

#### Option C: Start Fresh Repository (Nuclear Option)
```bash
# If the repository is not shared yet, easiest option:

# 1. Delete .git folder
rm -rf .git

# 2. Initialize new repository
git init
git add .
git commit -m "Initial commit (cleaned)"

# 3. Force push to remote
git remote add origin YOUR_REPO_URL
git push -u origin main --force
```

---

### Priority 4: Rotate All Secrets

Even if you clean Git history, assume all secrets are compromised:

#### 1. JWT Secret
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update in .env and Render
JWT_SECRET=NEW_SECRET_HERE
```

#### 2. Admin Token
```bash
# Generate new UUID
node -e "console.log(require('crypto').randomUUID())"

# Update in .env and Render
ADMIN_TOKEN=NEW_UUID_HERE
```

#### 3. Database Password
```bash
# Change PostgreSQL password
ALTER USER postgres WITH PASSWORD 'new_secure_password';

# Update DATABASE_URL in .env and Render
```

#### 4. Pinata API Keys
```bash
# Go to Pinata dashboard
# Revoke old API keys
# Generate new API keys
# Update in .env and Render
```

---

## 📋 Verification Checklist

After completing all actions:

- [ ] Funds transferred from compromised wallet
- [ ] New wallet created and secured
- [ ] `.env` updated with new credentials
- [ ] Render environment variables updated
- [ ] Backend redeployed successfully
- [ ] Git history cleaned (or new repo created)
- [ ] All team members notified
- [ ] All team members pulled cleaned history
- [ ] JWT secret rotated
- [ ] Admin token rotated
- [ ] Database password changed
- [ ] Pinata API keys rotated
- [ ] No suspicious transactions on old wallet
- [ ] New wallet funded for operations
- [ ] Contract redeployed with new wallet (if needed)

---

## 🔍 How This Happened

### Root Causes:
1. **Hardcoded private key** in `test-wallet-auth.js` (commit 35c96b0)
2. **Real private key** in `.env.example` instead of placeholder (commit 1c9ac35)
3. **Committed before security review**

### Prevention Measures Implemented:
1. ✅ Updated `test-wallet-auth.js` to use environment variables
2. ✅ Added validation to exit if private key not set
3. ✅ Created `SECURITY_WARNING.md` with best practices
4. ✅ Updated `README.md` with security warnings
5. ✅ Verified `.env` is in `.gitignore`

---

## 🛡️ Future Prevention

### Pre-Commit Checks
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash

# Check for private keys
if git diff --cached | grep -E "0x[a-f0-9]{64}"; then
    echo "❌ ERROR: Private key detected in commit!"
    echo "Please remove private keys before committing."
    exit 1
fi

# Check for .env files
if git diff --cached --name-only | grep -E "\.env$"; then
    echo "❌ ERROR: .env file detected in commit!"
    echo ".env files should never be committed."
    exit 1
fi
```

### Use Git-Secrets
```bash
# Install git-secrets
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add '0x[a-f0-9]{64}'
git secrets --add 'PRIVATE_KEY.*=.*0x'
```

### Code Review Checklist
- [ ] No hardcoded secrets
- [ ] All secrets use environment variables
- [ ] `.env` not committed
- [ ] `.env.example` has placeholders only
- [ ] Test scripts require environment variables

---

## 📞 Need Help?

If you're unsure about any step:
1. **Stop and ask for help** - Don't rush
2. **Backup everything** before making changes
3. **Test in development** before production
4. **Document what you did** for post-mortem

---

## 📚 References

- [Aptos Security Best Practices](https://aptos.dev/guides/security/)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Filter-Branch](https://git-scm.com/docs/git-filter-branch)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

**Remember**: Once a secret is in Git history, assume it's compromised forever. Always rotate!
