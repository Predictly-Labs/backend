# Missing Features - Quick Reference

## 🔴 Sprint 1: Critical (Week 1)

### 1. My Groups
```
GET /api/groups/my-groups
  ?page=1&limit=20
  &role=ADMIN
  &search=hackathon
  &sort=recent|active|members
```

### 2. My Votes (Paginated)
```
GET /api/predictions/my-votes
  ?page=1&limit=20
  &status=ACTIVE|RESOLVED|PENDING
  &groupId=xxx
  &outcome=won|lost|pending
```

### 3. Check My Vote
```
GET /api/predictions/:marketId/my-vote
```

---

## 🟡 Sprint 2: High Priority (Week 2)

### 4. Filter Members by Role
```
GET /api/groups/:id/members?role=JUDGE
```

### 5. My Votes Stats
```
GET /api/predictions/my-votes/stats
```

### 6. Filter Markets by Type
```
GET /api/markets?marketType=NO_LOSS
```

---

## 🟢 Sprint 3: Polish (Week 3)

### 7. Group Settings
```
GET /api/groups/:id/settings
PUT /api/groups/:id/settings
```

### 8. Judge History
```
GET /api/users/:userId/resolved-markets
```

### 9. Bulk Judge Assignment
```
POST /api/groups/:groupId/judges/bulk
```

---

## Implementation Checklist

### Files to Modify:

**Sprint 1:**
- [ ] `backend/src/routes/groups.routes.ts`
- [ ] `backend/src/controllers/groups.controller.ts`
- [ ] `backend/src/validators/groups.validator.ts`
- [ ] `backend/src/routes/predictions.routes.ts`
- [ ] `backend/src/controllers/predictions.controller.ts`
- [ ] `backend/src/validators/predictions.validator.ts`

**Sprint 2:**
- [ ] `backend/src/controllers/groups.controller.ts` (update)
- [ ] `backend/src/controllers/predictions.controller.ts` (add stats)
- [ ] `backend/src/controllers/markets.controller.ts` (add filter)

**Sprint 3:**
- [ ] `backend/prisma/schema.prisma` (add Group settings)
- [ ] Run migration
- [ ] `backend/src/controllers/groups.controller.ts` (settings endpoints)
- [ ] `backend/src/controllers/users.controller.ts` (judge history)

---

## Database Queries Reference

### My Groups Query:
```typescript
prisma.groupMember.findMany({
  where: { userId, role: 'ADMIN' },
  include: {
    group: {
      include: {
        _count: { select: { members: true, markets: true } }
      }
    }
  }
})
```

### My Votes Query (Paginated):
```typescript
prisma.vote.findMany({
  where: { 
    userId,
    market: { status: 'ACTIVE', groupId: 'xxx' }
  },
  skip: (page - 1) * limit,
  take: limit
})
```

### Check My Vote:
```typescript
prisma.vote.findUnique({
  where: {
    marketId_userId: { marketId, userId }
  }
})
```

---

## Testing Commands

```bash
# Sprint 1
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/groups/my-groups

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/predictions/my-votes?page=1&limit=10

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/predictions/market-123/my-vote

# Sprint 2
curl http://localhost:3001/api/groups/group-123/members?role=JUDGE

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/predictions/my-votes/stats

curl http://localhost:3001/api/markets?marketType=NO_LOSS

# Sprint 3
curl http://localhost:3001/api/groups/group-123/settings

curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"defaultMarketType":"NO_LOSS"}' \
  http://localhost:3001/api/groups/group-123/settings
```

---

## Priority Matrix

| Feature | Priority | Effort | Impact | Sprint |
|---------|----------|--------|--------|--------|
| My Groups | 🔴 Critical | Medium | High | 1 |
| My Votes Pagination | 🔴 Critical | Low | High | 1 |
| Check My Vote | 🔴 Critical | Low | High | 1 |
| Filter Members by Role | 🟡 High | Low | Medium | 2 |
| My Votes Stats | 🟡 High | Medium | Medium | 2 |
| Filter Markets by Type | 🟡 High | Low | Medium | 2 |
| Group Settings | 🟢 Medium | High | Low | 3 |
| Judge History | 🟢 Medium | Medium | Low | 3 |
| Bulk Judge Assignment | 🟢 Low | Medium | Low | 3 |

---

## Estimated Time

- **Sprint 1:** 5-7 days (Critical features)
- **Sprint 2:** 4-5 days (High priority)
- **Sprint 3:** 5-6 days (Polish + migration)

**Total:** ~3 weeks for complete implementation

---

## Dependencies

### Sprint 1:
- No dependencies
- Can start immediately

### Sprint 2:
- Depends on Sprint 1 completion
- Reuses Sprint 1 patterns

### Sprint 3:
- Requires database migration
- Test thoroughly before production

---

## Rollback Plan

### If Sprint 1 Issues:
- Revert routes in `groups.routes.ts`
- Revert controllers
- No database changes needed

### If Sprint 3 Issues:
- Rollback migration:
```sql
ALTER TABLE "Group" 
DROP COLUMN "defaultMarketType",
DROP COLUMN "allowedMarketTypes";
```

---

## Success Criteria

### Sprint 1:
- ✅ Users can see their groups
- ✅ Pagination works for votes
- ✅ Can check if voted on market

### Sprint 2:
- ✅ Can filter judges in group
- ✅ Stats display correctly
- ✅ Market type filter works

### Sprint 3:
- ✅ Group settings persist
- ✅ Judge history displays
- ✅ Bulk assignment works

