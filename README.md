# Predictly Backend API

Backend API server for Predictly-Labs prediction market platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Storage**: Pinata (IPFS)
- **Auth**: JWT + Privy

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Pinata account (for IPFS)
- Privy account (for auth)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/predictly"
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
PRIVY_APP_ID=your_app_id
PRIVY_APP_SECRET=your_secret
JWT_SECRET=your_jwt_secret
```

4. Generate Prisma client:

```bash
npm run db:generate
```

5. Push database schema:

```bash
npm run db:push
```

6. Start development server:

```bash
npm run dev
```

## API Endpoints

### Health

- `GET /api/health` - Health check

### Auth

- `POST /api/users/auth/privy` - Authenticate with Privy

### Users

- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/stats` - Get user stats
- `GET /api/users/leaderboard` - Get leaderboard

### Groups

- `POST /api/groups` - Create group
- `GET /api/groups` - List public groups
- `GET /api/groups/:id` - Get group by ID
- `POST /api/groups/join` - Join with invite code
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Members

- `GET /api/groups/:id/members` - List members
- `PUT /api/groups/:groupId/members/:userId/role` - Update role
- `DELETE /api/groups/:groupId/members/:userId` - Remove member

### Upload

- `POST /api/upload/image` - Upload image to IPFS

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
src/
├── index.ts          # Entry point
├── app.ts            # Express app
├── config/           # Configuration
├── routes/           # API routes
├── controllers/      # Request handlers
├── services/         # Business logic
├── middleware/       # Express middleware
├── validators/       # Zod schemas
├── types/            # TypeScript types
└── utils/            # Helper functions
```

## License

MIT
