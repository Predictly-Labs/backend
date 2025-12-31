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

# Rate Limiting (optional)
# Set to 'true' to disable rate limiting for development/testing
DISABLE_RATE_LIMIT=true

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/predictly"

# Movement Network
MOVEMENT_RPC_URL=https://testnet.movementnetwork.xyz/v1
MOVEMENT_CONTRACT_ADDRESS=0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565
RELAY_WALLET_PRIVATE_KEY=your_private_key

# Pinata (IPFS)
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs

# JWT
JWT_SECRET=your_secret_key

# Admin
ADMIN_TOKEN=your_admin_token

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000
```

See [docs/RATE_LIMITING.md](docs/RATE_LIMITING.md) for rate limiting configuration.

## Documentation

### API Documentation
Interactive API docs (Swagger UI): `http://localhost:3001/api`

Production: `https://backend-3ufs.onrender.com/api`

### New Endpoints Documentation
- [New Endpoints Guide](docs/NEW_ENDPOINTS.md) - Complete guide for all new endpoints added

### Feature Documentation
- [Missing Features Summary](docs/FEATURES_SUMMARY.md) - Overview of missing features
- [Implementation Plan](docs/MISSING_FEATURES_PLAN.md) - Detailed implementation guide
- [Quick Reference](docs/MISSING_FEATURES_QUICK_REF.md) - Quick reference for developers

### Other Documentation
- [Rate Limiting](docs/RATE_LIMITING.md) - Rate limiting configuration
- [Frontend Fix](docs/FRONTEND_FIX.md) - Frontend authentication fixes
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) - Deployment guide
- [Nightly Wallet Testing](docs/NIGHTLY_WALLET_TESTING.md) - Wallet testing guide

## Endpoints

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |

### Wallet Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/wallet/message` | No | Get sign-in message for wallet |
| POST | `/api/auth/wallet/verify` | No | Verify signature and authenticate |
| GET | `/api/auth/me` | Yes | Get current authenticated user |

### Legacy Authentication (Deprecated)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/auth/privy` | No | Register/login with Privy ID (DEPRECATED) |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me` | Yes | Get current user profile |
| PUT | `/api/users/me` | Yes | Update profile |
| GET | `/api/users/:userId` | No | Get user by ID |
| GET | `/api/users/:userId/stats` | No | Get user statistics |
| GET | `/api/users/leaderboard` | No | Get leaderboard |

### Groups
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/groups` | Yes | Create new group |
| GET | `/api/groups` | No | List public groups |
| GET | `/api/groups/my-groups` | Yes | Get user's groups with filters |
| GET | `/api/groups/:id` | Yes | Get group details |
| PUT | `/api/groups/:id` | Yes | Update group (admin) |
| DELETE | `/api/groups/:id` | Yes | Delete group (admin) |
| POST | `/api/groups/join` | Yes | Join with invite code |
| GET | `/api/groups/:groupId/members` | No | List group members (with role filter) |
| PUT | `/api/groups/:gid/members/:uid/role` | Yes | Update member role (admin) |
| DELETE | `/api/groups/:gid/members/:uid` | Yes | Remove member (admin) |
| GET | `/api/groups/:id/settings` | Yes | Get group settings |
| PUT | `/api/groups/:id/settings` | Yes | Update group settings (admin) |
| POST | `/api/groups/:gid/judges/bulk` | Yes | Bulk assign judges (admin) |

### Markets (Hybrid System)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/markets` | Yes | Create market off-chain (FREE) |
| POST | `/api/markets/:id/initialize` | Yes | Initialize market on-chain (backend pays gas) |
| GET | `/api/markets/:id` | No | Get market details with on-chain data |
| POST | `/api/markets/:id/sync` | Yes | Sync market data from blockchain |
| GET | `/api/groups/:groupId/markets` | No | Get markets for a group |

### Contract (On-Chain)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/contract/info` | No | Get smart contract information |
| GET | `/api/contract/markets/:marketId` | No | Get market data from blockchain |
| GET | `/api/contract/markets/:marketId/votes/:voter` | No | Get vote data from blockchain |
| POST | `/api/contract/build/create-market` | Yes | Build create market transaction payload |
| POST | `/api/contract/build/place-vote` | Yes | Build place vote transaction payload |
| POST | `/api/contract/build/resolve` | Yes | Build resolve transaction payload |
| POST | `/api/contract/build/claim` | Yes | Build claim reward transaction payload |

### Admin Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/relay-wallet/balance` | Admin | Get relay wallet balance |
| GET | `/api/admin/relay-wallet/transactions` | Admin | Get relay wallet transaction history |
| POST | `/api/admin/relay-wallet/monitor` | Admin | Manually trigger wallet monitoring |

### Predictions (Legacy)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/predictions` | No | List prediction markets (with marketType filter) |
| POST | `/api/predictions` | Yes | Create new market |
| GET | `/api/predictions/:id` | Optional | Get market details |
| POST | `/api/predictions/:id/vote` | Yes | Place a vote |
| POST | `/api/predictions/:id/resolve` | Yes | Resolve market (Judge/Admin) |
| POST | `/api/predictions/:id/claim` | Yes | Claim reward |
| GET | `/api/predictions/my-votes` | Yes | Get user's votes (with pagination & filters) |
| GET | `/api/predictions/my-votes/stats` | Yes | Get user's vote statistics |
| GET | `/api/predictions/:marketId/my-vote` | Yes | Check vote on specific market |
| GET | `/api/predictions/resolved-by/:userId` | No | Get markets resolved by judge |

### Subscriptions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/subscriptions/checkout` | Yes | Create checkout session |
| GET | `/api/subscriptions/status` | Yes | Get subscription status |
| POST | `/api/subscriptions/webhook` | No | Webhook to activate Pro |

### Upload
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/image` | Yes | Upload image to IPFS |

## Authentication Flow

### Wallet-Based Authentication (Current)

1. Frontend requests sign-in message: `POST /api/auth/wallet/message` with `walletAddress`
2. Backend generates message with nonce (expires in 5 minutes)
3. User signs message with their wallet (Movement/Aptos)
4. Frontend sends signature: `POST /api/auth/wallet/verify` with `walletAddress`, `signature`, `publicKey`, `message`
5. Backend verifies signature and returns JWT token
6. Use token in header: `Authorization: Bearer <token>`

### Privy Authentication (Deprecated)

1. Frontend authenticates user with Privy
2. Frontend sends `privyId` to `POST /api/users/auth/privy`
3. Backend returns JWT token
4. Use token in header: `Authorization: Bearer <token>`

## Hybrid Market System

The backend implements a hybrid on-chain/off-chain system:

1. **Create Market (Off-Chain)** - FREE, no gas fees
   - `POST /api/markets` creates market in database
   - Status: `PENDING`
   
2. **Initialize Market (On-Chain)** - Backend pays gas
   - `POST /api/markets/:id/initialize` deploys to blockchain
   - Backend relay wallet pays gas fees
   - Status changes to `ACTIVE`
   - Returns `onChainId` for blockchain interactions
   
3. **Vote/Resolve/Claim** - Users interact directly with smart contract
   - Users pay their own gas fees
   - Backend syncs data from blockchain every 1 minute
   - Manual sync: `POST /api/markets/:id/sync`

### Admin Monitoring

- Check relay wallet balance: `GET /api/admin/relay-wallet/balance`
- View transaction history: `GET /api/admin/relay-wallet/transactions`
- Trigger monitoring: `POST /api/admin/relay-wallet/monitor`
- Requires `X-Admin-Token` header

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
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, validation, error handling
│   ├── validators/       # Zod schemas
│   ├── utils/            # Helper functions
│   └── docs/             # Swagger documentation
├── prisma/
│   └── schema.prisma     # Database schema
├── postman/
│   └── *.json            # Postman collection
└── package.json
```

## Database Schema

- **User** - User accounts with stats and Pro subscription
- **Group** - Prediction groups with invite codes
- **GroupMember** - Membership with roles (ADMIN, JUDGE, MODERATOR, MEMBER)
- **PredictionMarket** - YES/NO prediction markets
- **Vote** - User votes with stake amounts and rewards
