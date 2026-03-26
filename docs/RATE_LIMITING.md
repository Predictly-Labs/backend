# Rate Limiting Configuration

## Overview

Backend menggunakan PostgreSQL-based rate limiting untuk mencegah abuse. Rate limiting dapat di-disable untuk development/testing.

---

## Environment Variable

### `DISABLE_RATE_LIMIT`

**Values:**
- `true` - Disable rate limiting (untuk development/testing)
- `false` atau tidak diset - Enable rate limiting (untuk production)

**Example:**
```bash
# .env (development)
DISABLE_RATE_LIMIT=true

# .env.production (production)
DISABLE_RATE_LIMIT=false  # atau hapus variable ini
```

---

## Rate Limits (When Enabled)

### Authentication Endpoints
- **Endpoint:** `/api/auth/wallet/message`, `/api/auth/wallet/verify`
- **Limit:** 5 requests per 15 minutes per IP
- **Error:** `429 Too Many Requests`
- **Message:** "Too many authentication attempts, please try again in 15 minutes"

### Market Creation
- **Endpoint:** `POST /api/markets`
- **Limit:** 10 markets per hour per user
- **Error:** `429 Too Many Requests`
- **Message:** "Too many markets created, please try again in an hour"

### Market Initialization
- **Endpoint:** `POST /api/markets/:id/initialize`
- **Limit:** 3 attempts per 5 minutes per market
- **Error:** `429 Too Many Requests`
- **Message:** "Too many initialization attempts for this market, please try again later"

### General API
- **Limit:** 100 requests per minute per IP
- **Error:** `429 Too Many Requests`
- **Message:** "Too many requests, please slow down"

---

## Response Headers

When rate limiting is enabled, responses include:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
Retry-After: 120  (seconds, only when limit exceeded)
```

---

## How It Works

1. **Identifier:** Uses user ID (if authenticated) or IP address
2. **Storage:** Rate limit counters stored in PostgreSQL `RateLimit` table
3. **Window:** Sliding window - resets after time period expires
4. **Cleanup:** Expired records cleaned up automatically by monitoring service

---

## Disabling for Development

### Local Development

1. Edit `.env`:
```bash
DISABLE_RATE_LIMIT=true
```

2. Restart server:
```bash
npm run dev
```

3. Verify in logs:
```
⚠️  Rate limiting disabled for development
```

### Production (Render)

1. Go to Render Dashboard → Your Service → Environment
2. Add environment variable:
   - Key: `DISABLE_RATE_LIMIT`
   - Value: `true`
3. Save and redeploy

**⚠️ WARNING:** Only disable in production for testing! Re-enable for live users.

---

## Testing Rate Limits

### Test with curl:

```bash
# Make 6 requests quickly (should hit limit on 6th)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/wallet/message \
    -H "Content-Type: application/json" \
    -d '{"walletAddress": "0x123..."}' \
    -w "\nStatus: %{http_code}\n\n"
done
```

Expected output:
- Requests 1-5: `200 OK`
- Request 6: `429 Too Many Requests`

---

## Database Schema

```sql
CREATE TABLE "RateLimit" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,  -- User ID or IP
  "endpoint" TEXT NOT NULL,    -- Rate limit key
  "count" INTEGER NOT NULL,    -- Request count
  "windowStart" TIMESTAMP NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  UNIQUE("identifier", "endpoint")
);
```

---

## Security Considerations

### ✅ DO:
- Keep rate limiting ENABLED in production
- Use reasonable limits (not too strict, not too loose)
- Monitor rate limit hits in logs
- Adjust limits based on usage patterns

### ❌ DON'T:
- Disable rate limiting in production without good reason
- Set limits too low (frustrates legitimate users)
- Forget to re-enable after testing
- Use same limits for all endpoints (some need stricter limits)

---

## Troubleshooting

### "Too many requests" error during development

**Solution 1:** Disable rate limiting
```bash
# .env
DISABLE_RATE_LIMIT=true
```

**Solution 2:** Clear rate limit records
```sql
DELETE FROM "RateLimit" WHERE "identifier" = 'your_ip_or_user_id';
```

**Solution 3:** Wait for window to expire
- Auth: 15 minutes
- Market creation: 1 hour
- Market init: 5 minutes

### Rate limiting not working

1. Check environment variable:
```bash
echo $DISABLE_RATE_LIMIT
```

2. Check logs for:
```
⚠️  Rate limiting disabled for development
```

3. Verify database connection (rate limits stored in PostgreSQL)

---

## Future Improvements

- [ ] Add Redis support for better performance
- [ ] Implement token bucket algorithm
- [ ] Add per-user rate limit overrides (for premium users)
- [ ] Add rate limit analytics dashboard
- [ ] Implement IP whitelist for trusted sources

