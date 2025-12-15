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
 * /api/users/auth/privy:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate with Privy
 *     description: Register or login user with Privy ID. Returns JWT token for subsequent requests.
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
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         privyId:
 *           type: string
 *         walletAddress:
 *           type: string
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
