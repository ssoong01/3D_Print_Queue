import { Response } from 'express';
import Showcase from '../models/Showcase.js';
import { AuthRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Get uploads directory from environment or use default (project root)
const UPLOADS_DIR = process.env.UPLOADS_DIR 
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), 'uploads');

/**
 * GET /api/showcase
 * Get all showcase images, sorted by newest first
 */
export const getShowcaseImages = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const images = await Showcase.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .exec();

    const total = await Showcase.countDocuments().exec();

    return res.json({
      images,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (err) {
    console.error('Error fetching showcase images:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/showcase
 * Add new showcase image (URL)
 */
export const addShowcaseImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl, caption } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid image URL' });
    }

    const showcase = new Showcase({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userDisplayName: req.user!.displayName,
      imageUrl,
      isUpload: false,
      caption: caption || undefined,
      createdAt: new Date()
    });

    await showcase.save();

    if (IS_DEVELOPMENT) {
      console.log(`Showcase image added by ${req.user!.email}: ${imageUrl}`);
    }

    return res.status(201).json(showcase);
  } catch (err) {
    console.error('Error adding showcase image:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/showcase/upload
 * Upload showcase image file
 */
export const uploadShowcaseImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { caption } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

    const showcase = new Showcase({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userDisplayName: req.user!.displayName,
      imageUrl,
      isUpload: true,
      caption: caption || undefined,
      createdAt: new Date()
    });

    await showcase.save();

    if (IS_DEVELOPMENT) {
      console.log(`Showcase image uploaded by ${req.user!.email}: ${imageUrl}`);
      console.log(`File saved to: ${req.file.path}`);
    }

    return res.status(201).json(showcase);
  } catch (err) {
    console.error('Error uploading showcase image:', err);
    // Delete uploaded file if database save fails
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/showcase/:id
 * Delete showcase image
 */
export const deleteShowcaseImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const showcase = await Showcase.findById(id).exec();
    if (!showcase) {
      return res.status(404).json({ error: 'Showcase image not found' });
    }

    // Only allow deletion by owner or admin
    if (showcase.userId.toString() !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this image' });
    }

    // Delete physical file if it was an upload
    if (showcase.isUpload) {
      const filename = showcase.imageUrl.split('/').pop();
      const filePath = path.join(UPLOADS_DIR, filename!);
      
      fs.unlink(filePath, (err) => {
        if (err && IS_DEVELOPMENT) {
          console.error('Error deleting file:', err);
        } else if (IS_DEVELOPMENT) {
          console.log(`Deleted file: ${filePath}`);
        }
      });
    }

    await showcase.deleteOne();

    if (IS_DEVELOPMENT) {
      console.log(`Showcase image deleted: ${id}`);
    }

    return res.json({ success: true, message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting showcase image:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};