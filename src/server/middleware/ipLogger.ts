import { Request, Response, NextFunction } from 'express';
import AccessLog from '../models/AccessLog.js';
import BannedIP from '../models/BannedIP.js';

export const logAccess = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  // Check if IP is banned
  try {
    const bannedIP = await BannedIP.findOne({ 
      ip,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    }).exec();

    if (bannedIP) {
      return res.status(403).json({ 
        error: 'Your IP address has been banned',
        reason: bannedIP.reason
      });
    }
  } catch (err) {
    console.error('Error checking banned IP:', err);
  }

  // Store original end function
  const originalEnd = res.end;

  // Override end function to log after response
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    res.end = originalEnd;
    
    // Log the access
    const log = new AccessLog({
      ip,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      userAgent: req.get('user-agent') || '',
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      success: res.statusCode < 400,
      errorMessage: res.statusCode >= 400 ? res.statusMessage : undefined,
      timestamp: new Date()
    });

    log.save().catch(err => console.error('Error logging access:', err));

    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};