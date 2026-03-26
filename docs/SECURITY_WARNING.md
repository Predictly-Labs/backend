# 🔐 SECURITY WARNING

## ⚠️ CRITICAL: Private Keys and Sensitive Data

### Files That Contain Sensitive Information

The following files contain **PRIVATE KEYS** and **SENSITIVE DATA** that must **NEVER** be committed to Git:

1. **`.env`** - Contains:
   - `MOVEMENT_PRIVATE_KEY` - Your wallet private key
   - `RELAY_WALLET_PRIVATE_KEY` - Relay wallet private key
   - `JWT_SECRET` - JWT signing secret
   - `ADMIN_TOKEN` - Admin authentication token
   - `PINATA_API_KEY` & `PINATA_SECRET_KEY` - IPFS credentials
   - `DATABASE_URL` - Database connection string with password

2. **`.env.production`** - Production environment variables
3. **`.env.local`** - Local development overrides

### ✅ Protection Status

These files are protected by `.gitignore`:
```
.env
.env.local
.env.*.local
.env.production
.env.staging
```

### 🚨 If You Accidentally Committed Private Keys

If you accidentally committed private keys to Git, follow these steps **IMMEDIATELY**:

#### 1. Rotate All Keys
- **Generate new wallet**: Create a new Aptos wallet and transfer funds
- **Update JWT_SECRET**: Generate a new random secret
- **Update ADMIN_TOKEN**: Generate a new UUID
- **Rotate API keys**: Generate new Pinata API keys
- **Change database password**: Update PostgreSQL password

#### 2. Remove from Git History
```bash
# WARNING: This rewrites Git history!
# Coordinate with your team before doing this

# Remove file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (dangerous!)
git push origin --force --all
git push origin --force --tags
```

#### 3. Notify Your Team
- Inform all team members about the security incident
- Ensure everyone pulls the cleaned history
- Verify no one has copies of the old keys

#### 4. Monitor for Suspicious Activity
- Check wallet transactions on Movement explorer
- Monitor database access logs
- Check API usage for unusual patterns

### 🛡️ Best Practices

#### For Development
1. **Never hardcode secrets** in source code
2. **Use environment variables** for all sensitive data
3. **Use `.env.example`** as a template (without real values)
4. **Double-check** before committing: `git diff --cached`
5. **Use pre-commit hooks** to prevent accidental commits

#### For Testing Scripts
The `test-wallet-auth.js` script now requires environment variables:
```bash
# Set private key as environment variable
export TEST_WALLET_PRIVATE_KEY="0xYOUR_PRIVATE_KEY_HERE"

# Script will exit with error if not set
node scripts/test-wallet-auth.js
```

**The script will NOT run** if `TEST_WALLET_PRIVATE_KEY` is not set. This prevents accidental exposure.

#### For Production
1. **Use Render's environment variables** dashboard
2. **Never commit** `.env.production` to Git
3. **Rotate keys regularly** (every 90 days)
4. **Use different keys** for dev/staging/production
5. **Enable 2FA** on all service accounts

### 📋 Security Checklist

Before every commit:
- [ ] Run `git status` to check staged files
- [ ] Verify no `.env` files are staged
- [ ] Check for hardcoded secrets: `grep -r "0x[a-f0-9]\{64\}" src/`
- [ ] Review diff: `git diff --cached`
- [ ] Ensure test scripts use environment variables

### 🔍 How to Check if Keys Were Exposed

#### Check Git History
```bash
# Search for private keys in history
git log -p | grep -i "private_key"
git log -p | grep -E "0x[a-f0-9]{64}"

# Check if .env was ever committed
git log --all --full-history -- backend/.env
```

#### Check GitHub (if using)
```bash
# Search in GitHub
# Go to: https://github.com/YOUR_REPO/search
# Search for: "MOVEMENT_PRIVATE_KEY" or "0xf1f0af3f36bbf2264d53f1869a2045345d7aae779fd2087abbabab9045729fd2"
```

### 🆘 Emergency Contacts

If you discover a security breach:
1. **Immediately** transfer funds from compromised wallet
2. **Rotate all keys** as described above
3. **Notify team lead** or security officer
4. **Document the incident** for post-mortem

### 📚 Additional Resources

- [Aptos Security Best Practices](https://aptos.dev/guides/security/)
- [Git Secret Management](https://git-secret.io/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## 🎯 Quick Reference

### Safe Files to Commit
✅ `.env.example` - Template without real values
✅ Source code files (`.ts`, `.js`)
✅ Configuration files (without secrets)
✅ Documentation files

### NEVER Commit
❌ `.env` - Contains real secrets
❌ `.env.production` - Production secrets
❌ `.env.local` - Local overrides
❌ Any file with private keys
❌ Database dumps with real data

---

**Remember**: Once a secret is committed to Git, assume it's compromised. Rotate immediately!
