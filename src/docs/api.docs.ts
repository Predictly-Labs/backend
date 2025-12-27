/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Check if the API is running
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   example: "2024-12-13T07:35:29.651Z"
 *                 service:
 *                   type: string
 *                   example: predictly-backend
 */

/**
 * @swagger
 * /api/auth/wallet/message:
 *   post:
 *     tags: [Auth]
 *     summary: Get sign-in message for wallet authentication
 *     description: Generate a message to be signed by the user's wallet. The nonce expires after 5 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *                 description: Movement/Aptos wallet address
 *     responses:
 *       200:
 *         description: Sign-in message generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Sign in to Predictly\n\nWallet: 0x9161...\nNonce: abc123\nTimestamp: 1234567890\n\nThis request will not trigger a blockchain transaction or cost any gas fees."
 *                     nonce:
 *                       type: string
 *                       example: "abc123xyz"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       429:
 *         description: Too many requests (5 attempts per 15 minutes)

/**
 * @swagger
 * /api/auth/wallet/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify wallet signature and authenticate
 *     description: Verify the signed message and authenticate the user. Returns JWT token for subsequent requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - signature
 *               - message
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *               signature:
 *                 type: string
 *                 example: "0xc9b1008bc9a32c5e859c8624e6d088de..."
 *                 description: Hex-encoded signature from wallet
 *               publicKey:
 *                 type: string
 *                 example: "0xa799e03c79e6d1779a84d8b254f61b14..."
 *                 description: Public key (optional, required in production)
 *               message:
 *                 type: string
 *                 example: "Sign in to Predictly\n\nWallet: 0x9161...\nNonce: abc123..."
 *                 description: The exact message that was signed
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIs..."
 *       401:
 *         description: Signature verification failed
 *       429:
 *         description: Too many requests (5 attempts per 15 minutes)

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized

/**
 * @swagger
 * /api/users/auth/privy:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate with Privy (DEPRECATED)
 *     deprecated: true
 *     description: |
 *       **DEPRECATED**: Use `/api/auth/wallet/message` and `/api/auth/wallet/verify` instead.
 *       
 *       Register or login user with Privy ID. Returns JWT token for subsequent requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - privyId
 *             properties:
 *               privyId:
 *                 type: string
 *                 example: "did:privy:test123"
 *                 description: Privy user ID from frontend
 *               walletAddress:
 *                 type: string
 *                 example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af"
 *                 description: Movement wallet address
 *               displayName:
 *                 type: string
 *                 example: "Bang Isal"
 *               avatarUrl:
 *                 type: string
 *                 example: "https://ipfs.io/ipfs/Qm..."
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIs..."
 *                 message:
 *                   type: string
 *                   example: "Welcome back!"
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /api/users/leaderboard:
 *   get:
 *     tags: [Users]
 *     summary: Get leaderboard
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Filter by group (optional)
 *     responses:
 *       200:
 *         description: Leaderboard data
 */

/**
 * @swagger
 * /api/groups:
 *   get:
 *     tags: [Groups]
 *     summary: List public groups
 *     description: Get a paginated list of all public groups with their stats
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by group name or description
 *     responses:
 *       200:
 *         description: List of groups with pagination metadata
 *
 *   post:
 *     tags: [Groups]
 *     summary: Create a new group
 *     description: Create a new prediction group. The creator automatically becomes the group admin.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Crypto Enthusiasts"
 *               description:
 *                 type: string
 *                 example: "A group for crypto price predictions"
 *               iconUrl:
 *                 type: string
 *                 example: "https://ipfs.io/ipfs/Qm..."
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the group is visible in public listings
 *     responses:
 *       201:
 *         description: Group created successfully
 *       401:
 *         description: Unauthorized - JWT token required
 */

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     tags: [Groups]
 *     summary: Get group detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group detail with members and markets
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /api/groups/join:
 *   post:
 *     tags: [Groups]
 *     summary: Join a group with invite code
 *     description: Join an existing group using a unique invite code. Each user can only join a group once.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 example: "ABC123"
 *                 description: The unique invite code for the group
 *     responses:
 *       201:
 *         description: Successfully joined the group
 *       400:
 *         description: Invalid invite code or user is already a member
 *       401:
 *         description: Unauthorized - JWT token required
 */

/**
 * @swagger
 * /api/groups/{groupId}/members/{userId}/role:
 *   put:
 *     tags: [Groups]
 *     summary: Update member role
 *     description: |
 *       Change a member's role within the group. Only admins can perform this action.
 *       
 *       **Available Roles:**
 *       - `ADMIN` - Full control over the group
 *       - `JUDGE` - Can resolve prediction markets
 *       - `MODERATOR` - Can manage members
 *       - `MEMBER` - Can participate in predictions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, JUDGE, MODERATOR, MEMBER]
 *                 example: "JUDGE"
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Forbidden - Only admins can change roles
 *       404:
 *         description: Group or user not found
 */

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     tags: [Upload]
 *     summary: Upload image to IPFS (Pinata)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ipfsHash:
 *                   type: string
 *                 ipfsUrl:
 *                   type: string
 *                 gatewayUrl:
 *                   type: string
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token from wallet authentication
 *     adminToken:
 *       type: apiKey
 *       in: header
 *       name: X-Admin-Token
 *       description: Admin token for protected endpoints
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         privyId:
 *           type: string
 *           nullable: true
 *           description: Legacy Privy ID (deprecated)
 *         walletAddress:
 *           type: string
 *           description: Movement/Aptos wallet address (primary identifier)
 *         displayName:
 *           type: string
 *         avatarUrl:
 *           type: string
 *         totalPredictions:
 *           type: integer
 *         correctPredictions:
 *           type: integer
 *         totalEarnings:
 *           type: number
 *         currentStreak:
 *           type: integer
 *         isPro:
 *           type: boolean
 *         createdAt:
 *           type: string
 *     Group:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         iconUrl:
 *           type: string
 *         inviteCode:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         createdAt:
 *           type: string
 *     Market:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Off-chain market ID
 *         onChainId:
 *           type: string
 *           nullable: true
 *           description: On-chain market ID (null if PENDING)
 *         groupId:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, ACTIVE, RESOLVED]
 *           description: |
 *             - PENDING: Created off-chain, not yet on blockchain
 *             - ACTIVE: Initialized on-chain, accepting votes
 *             - RESOLVED: Market outcome determined
 *         marketType:
 *           type: string
 *           enum: [STANDARD, NO_LOSS, WITH_YIELD]
 *         endDate:
 *           type: string
 *           format: date-time
 *         minStake:
 *           type: number
 *         maxStake:
 *           type: number
 *         yesPool:
 *           type: number
 *           description: Total YES votes (synced from blockchain)
 *         noPool:
 *           type: number
 *           description: Total NO votes (synced from blockchain)
 *         participantCount:
 *           type: integer
 *         createdAt:
 *           type: string
 */


/**
 * @swagger
 * /api/predictions:
 *   get:
 *     tags: [Predictions]
 *     summary: List prediction markets
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Filter by group
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PENDING, RESOLVED, DISPUTED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of markets
 *
 *   post:
 *     tags: [Predictions]
 *     summary: Create a new prediction market
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - title
 *               - endDate
 *             properties:
 *               groupId:
 *                 type: string
 *                 example: "uuid-here"
 *               title:
 *                 type: string
 *                 example: "Will BTC reach $100k by end of 2024?"
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               marketType:
 *                 type: string
 *                 enum: [STANDARD, NO_LOSS, WITH_YIELD]
 *                 default: STANDARD
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               minStake:
 *                 type: number
 *                 default: 0.1
 *               maxStake:
 *                 type: number
 *     responses:
 *       201:
 *         description: Market created
 *       403:
 *         description: Not a group member
 */

/**
 * @swagger
 * /api/predictions/{id}:
 *   get:
 *     tags: [Predictions]
 *     summary: Get market details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Market details with votes
 *       404:
 *         description: Market not found
 */

/**
 * @swagger
 * /api/predictions/{id}/vote:
 *   post:
 *     tags: [Predictions]
 *     summary: Place a vote on a market
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prediction
 *               - amount
 *             properties:
 *               prediction:
 *                 type: string
 *                 enum: [YES, NO]
 *               amount:
 *                 type: number
 *                 example: 1.5
 *     responses:
 *       201:
 *         description: Vote placed
 *       400:
 *         description: Already voted or invalid amount
 */

/**
 * @swagger
 * /api/predictions/{id}/resolve:
 *   post:
 *     tags: [Predictions]
 *     summary: Resolve a market (Judge/Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - outcome
 *             properties:
 *               outcome:
 *                 type: string
 *                 enum: [YES, NO, INVALID]
 *               resolutionNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Market resolved
 *       403:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/predictions/{id}/claim:
 *   post:
 *     tags: [Predictions]
 *     summary: Claim reward for a resolved market
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reward claimed
 *       400:
 *         description: Not eligible or already claimed
 */

/**
 * @swagger
 * /api/predictions/my-votes:
 *   get:
 *     tags: [Predictions]
 *     summary: Get current user's votes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's votes with mock yield
 */

/**
 * @swagger
 * /api/markets:
 *   post:
 *     tags: [Markets (Hybrid)]
 *     summary: Create market off-chain (FREE)
 *     description: |
 *       Create a new prediction market off-chain. This is FREE - no gas fees required.
 *       Market will be in PENDING status until initialized on-chain.
 *       
 *       **Hybrid System Flow:**
 *       1. Create market off-chain (FREE) → Status: PENDING
 *       2. Initialize on-chain (backend pays gas) → Status: ACTIVE
 *       3. Users vote on-chain (users pay gas)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - question
 *               - endTime
 *             properties:
 *               groupId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-here"
 *               question:
 *                 type: string
 *                 example: "Will Bitcoin reach $100k by end of 2025?"
 *               description:
 *                 type: string
 *                 example: "Market resolves YES if BTC hits $100k, NO otherwise"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-31T23:59:59Z"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["YES", "NO"]
 *     responses:
 *       201:
 *         description: Market created off-chain (PENDING status)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "PENDING"
 *                     question:
 *                       type: string
 *       429:
 *         description: Rate limited (10 markets per hour)

/**
 * @swagger
 * /api/markets/{id}/initialize:
 *   post:
 *     tags: [Markets (Hybrid)]
 *     summary: Initialize market on-chain (Backend pays gas)
 *     description: |
 *       Initialize a PENDING market on the blockchain. The backend relay wallet pays the gas fees.
 *       After initialization, market status changes to ACTIVE and users can start voting.
 *       
 *       **Race Condition Protection:** Uses PostgreSQL advisory locks to prevent duplicate initialization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Market ID from off-chain creation
 *     responses:
 *       200:
 *         description: Market initialized on-chain
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     onChainId:
 *                       type: string
 *                       example: "9"
 *                       description: Market ID on the blockchain
 *                     txHash:
 *                       type: string
 *                       example: "0x31bcbbf910e992de..."
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *       400:
 *         description: Market already initialized or invalid status
 *       429:
 *         description: Rate limited (3 attempts per 5 minutes per market)

/**
 * @swagger
 * /api/markets/{id}:
 *   get:
 *     tags: [Markets (Hybrid)]
 *     summary: Get market details with on-chain data
 *     description: |
 *       Get market details including both off-chain metadata and on-chain state.
 *       For ACTIVE markets, fetches live data from the blockchain.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Market details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     onChainId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [PENDING, ACTIVE, RESOLVED]
 *                     question:
 *                       type: string
 *                     yesPool:
 *                       type: number
 *                       description: Total YES votes (from blockchain)
 *                     noPool:
 *                       type: number
 *                       description: Total NO votes (from blockchain)
 *                     participantCount:
 *                       type: number
 *       404:
 *         description: Market not found

/**
 * @swagger
 * /api/markets/{id}/sync:
 *   post:
 *     tags: [Markets (Hybrid)]
 *     summary: Sync market data from blockchain
 *     description: Manually trigger sync of on-chain data to database cache
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Market data synced
 *       400:
 *         description: Market not initialized on-chain

/**
 * @swagger
 * /api/groups/{groupId}/markets:
 *   get:
 *     tags: [Markets (Hybrid)]
 *     summary: Get markets for a group
 *     description: List all markets in a group with optional status filter
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, RESOLVED]
 *         description: Filter by market status
 *     responses:
 *       200:
 *         description: List of markets

/**
 * @swagger
 * /api/admin/relay-wallet/balance:
 *   get:
 *     tags: [Admin]
 *     summary: Get relay wallet balance
 *     description: Check the balance of the backend relay wallet (requires admin token)
 *     security:
 *       - adminToken: []
 *     responses:
 *       200:
 *         description: Relay wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                       example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *                     balance:
 *                       type: number
 *                       example: 19.4825
 *                       description: Balance in MOVE tokens
 *                     minBalance:
 *                       type: number
 *                       example: 10
 *                       description: Minimum recommended balance
 *       401:
 *         description: Invalid admin token
 */


/**
 * @swagger
 * /api/subscriptions/checkout:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create checkout session
 *     description: Generate a mock checkout URL for Pro subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 default: monthly
 *     responses:
 *       200:
 *         description: Checkout URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutUrl:
 *                   type: string
 *                 plan:
 *                   type: string
 *                 price:
 *                   type: number
 *                 currency:
 *                   type: string
 */

/**
 * @swagger
 * /api/subscriptions/status:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get subscription status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isPro:
 *                   type: boolean
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                 daysRemaining:
 *                   type: integer
 */

/**
 * @swagger
 * /api/subscriptions/webhook:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Webhook to activate subscription (mock)
 *     description: Simulates payment webhook to activate Pro status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - plan
 *               - transactionId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               plan:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription activated
 */
