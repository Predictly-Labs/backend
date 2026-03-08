# Group Leaderboard API Documentation

## Overview

API endpoint untuk mengambil leaderboard grup berdasarkan total volume trading. Leaderboard menampilkan grup-grup dengan volume tertinggi beserta statistik lengkapnya.

---

## Endpoint

### Get Group Leaderboard

Mengambil daftar grup dengan volume tertinggi.

```
GET /api/groups/leaderboard
```

**Authentication:** Not required (Public endpoint)

---

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 10 | Jumlah grup yang ditampilkan (1-100) |
| `timeframe` | string | No | "all" | Periode waktu untuk kalkulasi volume |

### Timeframe Options

| Value | Description |
|-------|-------------|
| `all` | Semua waktu (default) |
| `day` | 24 jam terakhir |
| `week` | 7 hari terakhir |
| `month` | 30 hari terakhir |

---

## Request Examples

### Get Top 10 Groups (All Time)

```bash
GET /api/groups/leaderboard
```

### Get Top 20 Groups (Last Week)

```bash
GET /api/groups/leaderboard?limit=20&timeframe=week
```

### Get Top 5 Groups (Last 24 Hours)

```bash
GET /api/groups/leaderboard?limit=5&timeframe=day
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "id": "uuid",
      "name": "Crypto Traders",
      "description": "Professional crypto trading group",
      "iconUrl": "https://example.com/icon.png",
      "inviteCode": "ABC123",
      "createdBy": {
        "id": "uuid",
        "displayName": "John Doe",
        "avatarUrl": "https://example.com/avatar.png"
      },
      "createdAt": "2026-01-01T00:00:00.000Z",
      "stats": {
        "totalVolume": 15000.50,
        "memberCount": 150,
        "totalMarkets": 45,
        "activeMarkets": 12,
        "resolvedMarkets": 33,
        "totalParticipants": 450
      }
    },
    {
      "rank": 2,
      "id": "uuid",
      "name": "DeFi Predictions",
      "description": "DeFi market predictions",
      "iconUrl": "https://example.com/icon2.png",
      "inviteCode": "DEF456",
      "createdBy": {
        "id": "uuid",
        "displayName": "Jane Smith",
        "avatarUrl": "https://example.com/avatar2.png"
      },
      "createdAt": "2026-01-15T00:00:00.000Z",
      "stats": {
        "totalVolume": 12500.75,
        "memberCount": 120,
        "totalMarkets": 38,
        "activeMarkets": 10,
        "resolvedMarkets": 28,
        "totalParticipants": 380
      }
    }
  ],
  "message": "Leaderboard retrieved successfully",
  "meta": {
    "timeframe": "all",
    "limit": 10,
    "total": 2
  }
}
```

---

## Response Fields

### Group Object

| Field | Type | Description |
|-------|------|-------------|
| `rank` | number | Posisi di leaderboard (1 = tertinggi) |
| `id` | string | UUID grup |
| `name` | string | Nama grup |
| `description` | string \| null | Deskripsi grup |
| `iconUrl` | string \| null | URL icon grup |
| `inviteCode` | string | Kode invite untuk join grup |
| `createdBy` | object | Informasi creator grup |
| `createdAt` | string | Timestamp pembuatan grup |
| `stats` | object | Statistik grup |

### Stats Object

| Field | Type | Description |
|-------|------|-------------|
| `totalVolume` | number | Total volume trading (dalam MOVE) |
| `memberCount` | number | Jumlah member di grup |
| `totalMarkets` | number | Total market yang dibuat |
| `activeMarkets` | number | Market yang sedang aktif |
| `resolvedMarkets` | number | Market yang sudah resolved |
| `totalParticipants` | number | Total partisipan di semua market |

### Meta Object

| Field | Type | Description |
|-------|------|-------------|
| `timeframe` | string | Periode waktu yang digunakan |
| `limit` | number | Jumlah hasil yang diminta |
| `total` | number | Jumlah grup yang dikembalikan |

---

## Business Logic

### Ranking Calculation

1. **Volume Calculation:**
   - Sum semua `totalVolume` dari market di grup
   - Filter berdasarkan `timeframe` jika ditentukan
   - Hanya market dengan volume > 0 yang dihitung

2. **Sorting:**
   - Grup diurutkan berdasarkan `totalVolume` descending
   - Grup dengan volume tertinggi mendapat rank 1

3. **Filtering:**
   - Hanya grup public (`isPublic: true`) yang masuk leaderboard
   - Grup dengan volume 0 tidak ditampilkan

4. **Limit:**
   - Default: 10 grup
   - Minimum: 1 grup
   - Maximum: 100 grup

### Timeframe Filtering

```typescript
// All time (default)
No date filter

// Last 24 hours
createdAt >= (now - 24 hours)

// Last 7 days
createdAt >= (now - 7 days)

// Last 30 days
createdAt >= (now - 30 days)
```

---

## Use Cases

### 1. Homepage Leaderboard

Tampilkan top 10 grup dengan volume tertinggi di homepage:

```typescript
const response = await fetch('/api/groups/leaderboard?limit=10')
const { data } = await response.json()

// Display top 10 groups
data.forEach(group => {
  console.log(`#${group.rank} ${group.name} - ${group.stats.totalVolume} MOVE`)
})
```

### 2. Weekly Leaderboard

Tampilkan top performers minggu ini:

```typescript
const response = await fetch('/api/groups/leaderboard?limit=20&timeframe=week')
const { data } = await response.json()

// Display weekly top 20
```

### 3. Daily Trending

Tampilkan grup paling aktif hari ini:

```typescript
const response = await fetch('/api/groups/leaderboard?limit=5&timeframe=day')
const { data } = await response.json()

// Display today's top 5
```

---

## Frontend Integration Example

### React Hook

```typescript
import { useState, useEffect } from 'react'

interface LeaderboardGroup {
  rank: number
  id: string
  name: string
  description: string | null
  iconUrl: string | null
  stats: {
    totalVolume: number
    memberCount: number
    totalMarkets: number
    activeMarkets: number
    resolvedMarkets: number
    totalParticipants: number
  }
}

export const useGroupLeaderboard = (
  limit: number = 10,
  timeframe: 'all' | 'day' | 'week' | 'month' = 'all'
) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groups/leaderboard?limit=${limit}&timeframe=${timeframe}`
        )
        
        const result = await response.json()
        
        if (result.success) {
          setLeaderboard(result.data)
        } else {
          setError(result.message || 'Failed to fetch leaderboard')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [limit, timeframe])

  return { leaderboard, isLoading, error }
}
```

### Usage in Component

```typescript
import { useGroupLeaderboard } from '@/hooks/useGroupLeaderboard'

export const LeaderboardPage = () => {
  const { leaderboard, isLoading, error } = useGroupLeaderboard(10, 'week')

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Top Groups This Week</h1>
      {leaderboard.map(group => (
        <div key={group.id}>
          <span>#{group.rank}</span>
          <h2>{group.name}</h2>
          <p>Volume: {group.stats.totalVolume} MOVE</p>
          <p>Members: {group.stats.memberCount}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Performance Considerations

### Database Query Optimization

1. **Indexes:**
   - `Group.isPublic` - Filter public groups
   - `PredictionMarket.createdAt` - Timeframe filtering
   - `PredictionMarket.groupId` - Join optimization

2. **Query Strategy:**
   - Fetch all public groups with markets in one query
   - Calculate stats in application layer
   - Sort and limit in application layer

3. **Caching Recommendations:**
   - Cache leaderboard for 5-10 minutes
   - Invalidate cache when new market created/resolved
   - Use Redis for production

### Example Caching (Redis)

```typescript
// Pseudo-code
const cacheKey = `leaderboard:${timeframe}:${limit}`
const cached = await redis.get(cacheKey)

if (cached) {
  return JSON.parse(cached)
}

const leaderboard = await fetchLeaderboard()
await redis.setex(cacheKey, 300, JSON.stringify(leaderboard)) // 5 min cache

return leaderboard
```

---

## Error Handling

### Validation Errors

```json
{
  "success": false,
  "message": "Invalid limit parameter",
  "statusCode": 400
}
```

### Server Errors

```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

---

## Testing

### Manual Testing with cURL

```bash
# Test default parameters
curl http://localhost:3000/api/groups/leaderboard

# Test with custom limit
curl http://localhost:3000/api/groups/leaderboard?limit=20

# Test with timeframe
curl http://localhost:3000/api/groups/leaderboard?timeframe=week

# Test with both parameters
curl http://localhost:3000/api/groups/leaderboard?limit=5&timeframe=day
```

### Expected Behavior

1. ✅ Returns groups sorted by volume (highest first)
2. ✅ Only includes public groups
3. ✅ Filters by timeframe correctly
4. ✅ Respects limit parameter (1-100)
5. ✅ Excludes groups with 0 volume
6. ✅ Includes rank field (1-based)
7. ✅ Returns complete stats for each group

---

## Related Endpoints

- `GET /api/groups` - List all public groups
- `GET /api/groups/:id` - Get group details
- `GET /api/groups/:id/members` - Get group members
- `GET /api/groups/:groupId/markets` - Get group markets

---

## Changelog

### Version 1.0.0 (2026-03-08)
- Initial release
- Support for timeframe filtering (all, day, week, month)
- Configurable limit (1-100)
- Public groups only
- Sorted by total volume

---

## Future Enhancements

### Planned Features

1. **Additional Sorting Options:**
   - Sort by member count
   - Sort by active markets
   - Sort by growth rate

2. **Category Filtering:**
   - Filter by market type (STANDARD, NO_LOSS)
   - Filter by category/tags

3. **User-Specific Leaderboard:**
   - Show user's groups ranking
   - Compare with other groups

4. **Historical Data:**
   - Track rank changes over time
   - Show trending up/down indicators

5. **Advanced Stats:**
   - Average market volume
   - Win rate statistics
   - User engagement metrics

---

**Last Updated:** 2026-03-08  
**API Version:** 1.0.0  
**Status:** Production Ready ✅
