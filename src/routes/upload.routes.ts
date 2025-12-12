import { Router } from 'express';
import { uploadImage, upload } from '../controllers/upload.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Image upload (optional auth for tracking)
router.post('/image', optionalAuthMiddleware, upload.single('file'), uploadImage);

export default router;
