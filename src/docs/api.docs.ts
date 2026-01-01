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
 */

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
 */

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
 */

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
 *   put:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: "Updated Name"
 *               avatarUrl:
 *                 type: string
 *                 example: "https://example.com/avatar.png"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 */

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Get public profile information for any user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/users/{userId}/stats:
 *   get:
 *     tags: [Users]
 *     summary: Get user statistics
 *     description: Get detailed statistics for a user including prediction accuracy and earnings
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User statistics
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
 *                     totalPredictions:
 *                       type: integer
 *                       example: 42
 *                     correctPredictions:
 *                       type: integer
 *                       example: 28
 *                     accuracy:
 *                       type: number
 *                       example: 66.67
 *                     totalEarnings:
 *                       type: number
 *                       example: 125.50
 *                     currentStreak:
 *                       type: integer
 *                       example: 5
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/users/leaderboard:
 *   get:
 *     tags: [Users]
 *     summary: Get leaderboard
 *     description: Get ranked list of users by prediction accuracy and earnings
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by group (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of users to return
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/User'
 *                       - type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           accuracy:
 *                             type: number
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
 *     description: Get detailed information about a group including members and markets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group detail with members and markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Group'
 *                     - type: object
 *                       properties:
 *                         memberCount:
 *                           type: integer
 *                         marketCount:
 *                           type: integer
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /api/groups/{groupId}/members:
 *   get:
 *     tags: [Groups]
 *     summary: Get group members
 *     description: Get list of all members in a group with their roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     responses:
 *       200:
 *         description: List of group members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                       role:
 *                         type: string
 *                         enum: [ADMIN, JUDGE, MODERATOR, MEMBER]
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Not a member of this group
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
 *           enum: [STANDARD, NO_LOSS]
 *           description: Market type (WITH_YIELD planned for future)
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
 *                 enum: [STANDARD, NO_LOSS]
 *                 default: STANDARD
 *                 description: Market type (WITH_YIELD planned for future)
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
 *               - title
 *               - endDate
 *             properties:
 *               groupId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-here"
 *               title:
 *                 type: string
 *                 example: "Will Bitcoin reach $100k by end of 2024?"
 *               description:
 *                 type: string
 *                 example: "Bitcoin price prediction market"
 *               marketType:
 *                 type: string
 *                 enum: [STANDARD, NO_LOSS]
 *                 default: STANDARD
 *                 description: Type of market - STANDARD or NO_LOSS (WITH_YIELD planned for future)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59Z"
 *               minStake:
 *                 type: number
 *                 example: 1.0
 *                 default: 0.1
 *               maxStake:
 *                 type: number
 *                 example: 100.0
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
 *                   $ref: '#/components/schemas/Market'
 *       403:
 *         description: Not a group member
 *       429:
 *         description: Rate limited (10 markets per hour)
 */

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
 *                       description: Transaction hash on blockchain
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *       400:
 *         description: Market already initialized or invalid status
 *       429:
 *         description: Rate limited (3 attempts per 5 minutes per market)
 */

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
 */

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
 */

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
 */

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
 * /api/admin/relay-wallet/transactions:
 *   get:
 *     tags: [Admin]
 *     summary: Get relay wallet transaction history
 *     description: Get list of transactions made by the relay wallet (requires admin token)
 *     security:
 *       - adminToken: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of transactions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Transaction history
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           hash:
 *                             type: string
 *                           type:
 *                             type: string
 *                             example: "initialize_market"
 *                           marketId:
 *                             type: string
 *                           gasUsed:
 *                             type: number
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       401:
 *         description: Invalid admin token
 */

/**
 * @swagger
 * /api/admin/relay-wallet/monitor:
 *   post:
 *     tags: [Admin]
 *     summary: Manually trigger relay wallet monitoring
 *     description: Check relay wallet balance and send alerts if below threshold (requires admin token)
 *     security:
 *       - adminToken: []
 *     responses:
 *       200:
 *         description: Monitoring completed
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
 *                     balance:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [healthy, warning, critical]
 *                     message:
 *                       type: string
 *       401:
 *         description: Invalid admin token
 */

/**
 * @swagger
 * /api/contract/info:
 *   get:
 *     tags: [Contract]
 *     summary: Get smart contract information
 *     description: Get contract address, admin address, and market count
 *     responses:
 *       200:
 *         description: Contract information
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
 *                     contractAddress:
 *                       type: string
 *                     adminAddress:
 *                       type: string
 *                     marketCount:
 *                       type: number
 */

/**
 * @swagger
 * /api/contract/markets/{marketId}:
 *   get:
 *     tags: [Contract]
 *     summary: Get market data from blockchain
 *     description: Fetch market state directly from smart contract
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: On-chain market ID
 *     responses:
 *       200:
 *         description: Market data from blockchain
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
 *                       type: number
 *                     creator:
 *                       type: string
 *                     title:
 *                       type: string
 *                     status:
 *                       type: number
 *                     outcome:
 *                       type: number
 *                     yesPool:
 *                       type: number
 *                     noPool:
 *                       type: number
 */

/**
 * @swagger
 * /api/contract/markets/{marketId}/votes/{voterAddress}:
 *   get:
 *     tags: [Contract]
 *     summary: Get vote data from blockchain
 *     description: Fetch vote information directly from smart contract
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: On-chain market ID
 *       - in: path
 *         name: voterAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Voter wallet address
 *     responses:
 *       200:
 *         description: Vote data from blockchain
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
 *                     voter:
 *                       type: string
 *                     prediction:
 *                       type: number
 *                     amount:
 *                       type: number
 *                     hasClaimed:
 *                       type: boolean
 */

/**
 * @swagger
 * /api/contract/build/create-market:
 *   post:
 *     tags: [Contract]
 *     summary: Build create market transaction payload
 *     description: Generate transaction payload for creating market on-chain (user signs and submits)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - endTime
 *               - resolver
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               endTime:
 *                 type: integer
 *                 description: Unix timestamp
 *               minStake:
 *                 type: number
 *                 description: In octas (1 MOVE = 100000000 octas)
 *               maxStake:
 *                 type: number
 *               resolver:
 *                 type: string
 *                 description: Wallet address of resolver
 *               marketType:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 0=STANDARD, 1=NO_LOSS
 *     responses:
 *       200:
 *         description: Transaction payload generated
 */

/**
 * @swagger
 * /api/contract/build/place-vote:
 *   post:
 *     tags: [Contract]
 *     summary: Build place vote transaction payload
 *     description: Generate transaction payload for placing vote on-chain (user signs and submits)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - marketId
 *               - prediction
 *               - amount
 *             properties:
 *               marketId:
 *                 type: integer
 *                 description: On-chain market ID
 *               prediction:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: 1=YES, 2=NO
 *               amount:
 *                 type: number
 *                 description: In octas (1 MOVE = 100000000 octas)
 *     responses:
 *       200:
 *         description: Transaction payload generated
 */

/**
 * @swagger
 * /api/contract/build/resolve:
 *   post:
 *     tags: [Contract]
 *     summary: Build resolve transaction payload
 *     description: Generate transaction payload for resolving market on-chain (resolver signs and submits)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - marketId
 *               - outcome
 *             properties:
 *               marketId:
 *                 type: integer
 *                 description: On-chain market ID
 *               outcome:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: 1=YES, 2=NO, 3=INVALID
 *     responses:
 *       200:
 *         description: Transaction payload generated
 */

/**
 * @swagger
 * /api/contract/build/claim:
 *   post:
 *     tags: [Contract]
 *     summary: Build claim reward transaction payload
 *     description: Generate transaction payload for claiming reward on-chain (user signs and submits)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - marketId
 *             properties:
 *               marketId:
 *                 type: integer
 *                 description: On-chain market ID
 *     responses:
 *       200:
 *         description: Transaction payload generated
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


/**
 * @swagger
 * /api/wallet/balance/{address}:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet balance by address
 *     description: |
 *       Check MOVE token balance for any wallet address. No authentication required.
 *       
 *       **New Endpoint - Wallet Balance API**
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address (must start with 0x)
 *         example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
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
 *                     address:
 *                       type: string
 *                       example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *                     balance:
 *                       type: number
 *                       example: 125.5432
 *                       description: Balance in MOVE tokens
 *                     unit:
 *                       type: string
 *                       example: "MOVE"
 *       400:
 *         description: Invalid wallet address format
 *       503:
 *         description: Movement RPC temporarily unavailable
 *       500:
 *         description: Failed to fetch wallet balance
 */

/**
 * @swagger
 * /api/wallet/balance/{address}/detailed:
 *   get:
 *     tags: [Wallet]
 *     summary: Get detailed wallet balance by address
 *     description: |
 *       Check wallet balance with detailed format including MOVE, octas, and formatted string.
 *       No authentication required.
 *       
 *       **New Endpoint - Wallet Balance API**
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address (must start with 0x)
 *         example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *     responses:
 *       200:
 *         description: Detailed wallet balance retrieved successfully
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
 *                     address:
 *                       type: string
 *                       example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *                     balance:
 *                       type: object
 *                       properties:
 *                         move:
 *                           type: number
 *                           example: 125.5432
 *                           description: Balance in MOVE tokens
 *                         octas:
 *                           type: string
 *                           example: "12554320000"
 *                           description: Balance in octas (1 MOVE = 100,000,000 octas)
 *                         formatted:
 *                           type: string
 *                           example: "125.5432 MOVE"
 *                           description: Human-readable formatted balance
 *       400:
 *         description: Invalid wallet address format
 *       503:
 *         description: Movement RPC temporarily unavailable
 *       500:
 *         description: Failed to fetch wallet balance
 */

/**
 * @swagger
 * /api/wallet/balance/me:
 *   get:
 *     tags: [Wallet]
 *     summary: Get authenticated user's wallet balance
 *     description: |
 *       Check MOVE token balance for the currently authenticated user's wallet.
 *       Requires authentication.
 *       
 *       **New Endpoint - Wallet Balance API**
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's wallet balance retrieved successfully
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
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: "user-uuid-here"
 *                     address:
 *                       type: string
 *                       example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *                     balance:
 *                       type: number
 *                       example: 125.5432
 *                       description: Balance in MOVE tokens
 *                     unit:
 *                       type: string
 *                       example: "MOVE"
 *       401:
 *         description: User not authenticated or wallet address not found
 *       503:
 *         description: Movement RPC temporarily unavailable
 *       500:
 *         description: Failed to fetch wallet balance
 */

/**
 * @swagger
 * /api/groups/my-groups:
 *   get:
 *     tags: [Groups]
 *     summary: Get user's groups
 *     description: |
 *       Get list of groups where the current user is a member with pagination and filters.
 *       
 *       **New Endpoint - Sprint 1**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, JUDGE, MODERATOR, MEMBER]
 *         description: Filter by user's role in groups
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by group name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, active, members]
 *         description: Sort by recent join, active markets, or member count
 *     responses:
 *       200:
 *         description: List of user's groups with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       iconUrl:
 *                         type: string
 *                       isPublic:
 *                         type: boolean
 *                       userRole:
 *                         type: string
 *                         enum: [ADMIN, JUDGE, MODERATOR, MEMBER]
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                       stats:
 *                         type: object
 *                         properties:
 *                           memberCount:
 *                             type: integer
 *                           activeMarkets:
 *                             type: integer
 *                           totalVolume:
 *                             type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/predictions/my-votes/stats:
 *   get:
 *     tags: [Predictions]
 *     summary: Get user's vote statistics
 *     description: |
 *       Get aggregate statistics for current user's votes including ROI, win rate, and earnings.
 *       
 *       **New Endpoint - Sprint 2**
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vote statistics
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
 *                     totalVotes:
 *                       type: integer
 *                       example: 42
 *                     totalInvested:
 *                       type: number
 *                       example: 420.0
 *                     totalEarnings:
 *                       type: number
 *                       example: 525.50
 *                     roi:
 *                       type: number
 *                       example: 0.2512
 *                       description: Return on investment (decimal)
 *                     winRate:
 *                       type: number
 *                       example: 0.6667
 *                       description: Win rate (decimal)
 *                     activeVotes:
 *                       type: integer
 *                       example: 15
 *                     resolvedVotes:
 *                       type: integer
 *                       example: 27
 *                     wonVotes:
 *                       type: integer
 *                       example: 18
 *                     lostVotes:
 *                       type: integer
 *                       example: 9
 *                     averageStake:
 *                       type: number
 *                       example: 10.0
 *                     byGroup:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           groupId:
 *                             type: string
 *                           groupName:
 *                             type: string
 *                           votes:
 *                             type: integer
 *                           earnings:
 *                             type: number
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/predictions/{marketId}/my-vote:
 *   get:
 *     tags: [Predictions]
 *     summary: Check user's vote on specific market
 *     description: |
 *       Check if current user has voted on a specific market and get vote details.
 *       
 *       **New Endpoint - Sprint 1**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Market ID
 *     responses:
 *       200:
 *         description: Vote details or null if not voted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   oneOf:
 *                     - type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         marketId:
 *                           type: string
 *                         prediction:
 *                           type: string
 *                           enum: [YES, NO]
 *                         amount:
 *                           type: number
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         hasClaimedReward:
 *                           type: boolean
 *                         rewardAmount:
 *                           type: number
 *                           nullable: true
 *                         market:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             status:
 *                               type: string
 *                             outcome:
 *                               type: string
 *                               nullable: true
 *                     - type: "null"
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Market not found
 */

/**
 * @swagger
 * /api/predictions/resolved-by/{userId}:
 *   get:
 *     tags: [Predictions]
 *     summary: Get markets resolved by a judge
 *     description: |
 *       Get list of markets resolved by a specific user (judge history).
 *       
 *       **New Endpoint - Sprint 3**
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (judge)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of resolved markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       onChainId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       outcome:
 *                         type: string
 *                       resolvedAt:
 *                         type: string
 *                         format: date-time
 *                       resolutionNote:
 *                         type: string
 *                       participantCount:
 *                         type: integer
 *                       group:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                       creator:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           avatarUrl:
 *                             type: string
 *                 pagination:
 *                   type: object
 */

/**
 * @swagger
 * /api/groups/{id}/settings:
 *   get:
 *     tags: [Groups]
 *     summary: Get group settings
 *     description: |
 *       Get group settings including default market type and allowed market types.
 *       
 *       **New Endpoint - Sprint 3**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group settings
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
 *                     defaultMarketType:
 *                       type: string
 *                       enum: [STANDARD, NO_LOSS]
 *                       description: Default market type (WITH_YIELD planned for future)
 *                     allowedMarketTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [STANDARD, NO_LOSS]
 *                       description: Allowed market types (WITH_YIELD planned for future)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *   put:
 *     tags: [Groups]
 *     summary: Update group settings
 *     description: |
 *       Update group settings (Admin only).
 *       
 *       **New Endpoint - Sprint 3**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaultMarketType:
 *                 type: string
 *                 enum: [STANDARD, NO_LOSS]
 *                 description: Default market type (WITH_YIELD planned for future)
 *               allowedMarketTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [STANDARD, NO_LOSS]
 *                 description: Allowed market types (WITH_YIELD planned for future)
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid settings (e.g., defaultMarketType not in allowedMarketTypes)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can update settings
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /api/groups/{groupId}/judges/bulk:
 *   post:
 *     tags: [Groups]
 *     summary: Bulk assign judges
 *     description: |
 *       Assign multiple users as judges in a group (Admin only).
 *       
 *       **New Endpoint - Sprint 3**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 example: ["uuid-1", "uuid-2", "uuid-3"]
 *     responses:
 *       200:
 *         description: Bulk assignment completed
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
 *                     successful:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           role:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               displayName:
 *                                 type: string
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         succeeded:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can assign judges
 */
