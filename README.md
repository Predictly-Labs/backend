# Predictly Backend API

Backend API server for Predictly - a social prediction market platform for friend groups built on Movement Network.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js 18+ | Runtime |
| Express.js | Web framework |
| TypeScript | Language |
| PostgreSQL | Database |
| Prisma | ORM |
| Pinata | IPFS storage |
| JWT | Authentication |

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
npm run db:generate
npm run db:push

# Start server
npm run dev
```

Server runs at `http://localhost:3001`

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/predictly"

# Pinata (IPFS)
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs

# JWT
JWT_SECRET=your_secret_key

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000
```

## API Documentation

Interactive API docs available at: `http://localhost:3001/api`

## Endpoints

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/auth/privy` | No | Register/login with Privy ID |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me` | Yes | Get current user profile |
| PUT | `/api/users/me` | Yes | Update profile |
| GET | `/api/users/:id` | No | Get user by ID |
| GET | `/api/users/:id/stats` | No | Get user statistics |
| GET | `/api/users/leaderboard` | No | Get leaderboard |

### Groups
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/groups` | Yes | Create new group |
| GET | `/api/groups` | No | List public groups |
| GET | `/api/groups/:id` | No | Get group details |
| PUT | `/api/groups/:id` | Yes | Update group (admin) |
| DELETE | `/api/groups/:id` | Yes | Delete group (admin) |
| POST | `/api/groups/join` | Yes | Join with invite code |

### Group Members
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/groups/:id/members` | No | List members |
| PUT | `/api/groups/:gid/members/:uid/role` | Yes | Update role (admin) |
| DELETE | `/api/groups/:gid/members/:uid` | Yes | Remove member |

### Upload
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/image` | Yes | Upload image to IPFS |

## Authentication Flow

1. Frontend authenticates user with Privy
2. Frontend sends `privyId` to `POST /api/users/auth/privy`
3. Backend returns JWT token
4. Use token in header: `Authorization: Bearer <token>`

## Testing

Import Postman collection from `postman/Predictly_API.postman_collection.json`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Entry point
│   ├── app.ts            # Express app setup
│   ├── config/           # Environment, database, swagger
│   ├── controllers/      # Request handlers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic (Pinata, invite)
│   ├── middleware/       # Auth, validation, error handling
│   ├── validators/       # Zod schemas
│   ├── types/            # TypeScript types
│   ├── utils/            # Helper functions
│   └── docs/             # Swagger documentation
├── prisma/
│   └── schema.prisma     # Database schema
├── postman/
│   └── *.json            # Postman collection
└── package.json
```

## Database Schema

- **User** - User accounts with stats
- **Group** - Prediction groups
- **GroupMember** - Group membership with roles (ADMIN, JUDGE, MODERATOR, MEMBER)
- **PredictionMarket** - Prediction markets (coming soon)
- **Vote** - User votes/bets (coming soon)
- **Badge** - Achievement badges
