import { Request, Response } from 'express';
import multer from 'multer';
import { uploadToPinata } from '../services/pinata.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * Upload image to IPFS via Pinata
 * POST /api/upload/image
 */
export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const { buffer, originalname, mimetype } = req.file;

    // Get optional metadata from body
    const { type } = req.body; // e.g., 'avatar', 'group-icon', 'market-image'

    const result = await uploadToPinata(buffer, originalname, {
      type: type || 'image',
      uploadedBy: req.user?.id || 'anonymous',
      contentType: mimetype,
    });

    return successResponse(res, {
      ipfsHash: result.ipfsHash,
      ipfsUrl: result.ipfsUrl,
      gatewayUrl: result.gatewayUrl,
    }, 'Image uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(res, 'Failed to upload image', 500);
  }
}
