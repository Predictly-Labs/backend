import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Predictly API',
      version: '1.0.0',
      description: `
# Prediction Market for Friend Groups

Predictly is a social prediction market platform that allows small groups of friends to create, join, and resolve predictions about anything relevant to their daily lives.

---

## Authentication

Most endpoints require a JWT token. To obtain a token:

1. Send a POST request to \`/api/users/auth/privy\` with your privyId
2. Use the returned token in the header: \`Authorization: Bearer <token>\`

---

## Quick Start

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Register/Login | \`POST /api/users/auth/privy\` |
| 2 | Create Group | \`POST /api/groups\` |
| 3 | Join Group | \`POST /api/groups/join\` |
| 4 | List Groups | \`GET /api/groups\` |

---

## Features

- **Groups** - Create and manage prediction groups with friends
- **Predictions** - Create YES/NO prediction markets
- **Voting** - Stake on predictions and earn rewards
- **Leaderboard** - Track top predictors
- **IPFS Upload** - Store images on decentralized storage
      `,
      contact: {
        name: 'Predictly Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Groups', description: 'Group management' },
      { name: 'Upload', description: 'File upload to IPFS' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
