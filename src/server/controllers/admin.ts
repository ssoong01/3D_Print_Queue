import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import User from '../models/User.js';
import AccessLog from '../models/AccessLog.js';
import BannedIP from '../models/BannedIP.js';
import { getSettings, updateSettings, clearSettingsCache } from '../utils/settings.js';
import { generateVerificationToken, sendInviteEmail } from '../utils/email.js';
import bcrypt from 'bcrypt';

// Get all users
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
    
    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { displayName, isAdmin, isVerified } = req.body;

    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (displayName) user.displayName = displayName;
    if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;

    await user.save();

    const updatedUser = user.toObject();
    delete (updatedUser as any).password;

    return res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting yourself
    if (userId === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(userId).exec();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Send invite
export const sendInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() }).exec();
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create pending user
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName: email.split('@')[0],
      isAdmin: false,
      isVerified: false,
      verificationToken,
      verificationTokenExpires
    });

    await user.save();

    // Send invite email
    await sendInviteEmail(email, req.user!.displayName, verificationToken);

    return res.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      email
    });
  } catch (err) {
    console.error('Error sending invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Resend verification
export const resendUserVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body; // Changed from userId in params

    const user = await User.findOne({ email: email.toLowerCase() }).exec();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'User is already verified' });
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email
    const { sendVerificationEmail } = await import('../utils/email.js');
    await sendVerificationEmail(user.email, user.displayName, verificationToken);

    return res.json({ 
      success: true, 
      message: 'Verification email sent'
    });
  } catch (err) {
    console.error('Error resending verification:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get settings
export const getServerSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getSettings();
    
    // Return settings with current values
    const sanitized = {
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpSenderName: settings.smtpSenderName,
      lockoutAttempts: settings.lockoutAttempts,
      lockoutDuration: settings.lockoutDuration,
      maxQueueItems: settings.maxQueueItems,
      notifyAdminsOnNewRequest: settings.notifyAdminsOnNewRequest,
      appUrl: settings.appUrl,
      hasSmtpPass: !!settings.smtpPass,
      hasAdminPassword: !!settings.adminPassword
    };

    return res.json(sanitized);
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update settings
export const updateServerSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      smtpHost, 
      smtpPort, 
      smtpUser, 
      smtpPass,
      smtpSenderName,
      adminPassword,
      maxLoginAttempts,
      lockoutDuration,
      maxQueueItems,
      notifyAdminsOnNewRequest,
      appUrl
    } = req.body;

    const updates: any = {};

    if (smtpHost !== undefined) updates.smtpHost = smtpHost;
    if (smtpPort !== undefined) updates.smtpPort = parseInt(smtpPort);
    if (smtpUser !== undefined) updates.smtpUser = smtpUser;
    if (smtpPass) updates.smtpPass = smtpPass; // Only update if provided
    if (smtpSenderName !== undefined) updates.smtpSenderName = smtpSenderName;
    if (maxLoginAttempts !== undefined) updates.lockoutAttempts = parseInt(maxLoginAttempts);
    if (lockoutDuration !== undefined) updates.lockoutDuration = parseInt(lockoutDuration);
    if (maxQueueItems !== undefined) updates.maxQueueItems = parseInt(maxQueueItems);
    if (notifyAdminsOnNewRequest !== undefined) updates.notifyAdminsOnNewRequest = notifyAdminsOnNewRequest;
    if (appUrl !== undefined) updates.appUrl = appUrl;

    // Hash admin password if provided
    if (adminPassword) {
      const bcrypt = await import('bcrypt');
      updates.adminPassword = await bcrypt.hash(adminPassword, 10);
    }

    await updateSettings(updates);
    clearSettingsCache();

    return res.json({ 
      success: true, 
      message: 'Settings updated successfully' 
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Test email
export const testEmail = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getSettings();
    const { sendVerificationEmail } = await import('../utils/email.js');
    
    // Send test email to the admin user
    await sendVerificationEmail(
      req.user!.email,
      req.user!.displayName,
      'test-token-not-for-verification'
    );

    return res.json({ 
      success: true, 
      message: 'Test email sent successfully' 
    });
  } catch (err) {
    console.error('Error sending test email:', err);
    return res.status(500).json({ error: 'Failed to send test email' });
  }
};

// Get access logs
export const getAccessLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, ip, success } = req.query;
    
    const query: any = {};
    if (ip) query.ip = ip;
    if (success !== undefined) query.success = success === 'true';

    const logs = await AccessLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .exec();

    const total = await AccessLog.countDocuments(query).exec();

    return res.json({
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (err) {
    console.error('Error fetching access logs:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get banned IPs
export const getBannedIPs = async (req: AuthRequest, res: Response) => {
  try {
    const bannedIPs = await BannedIP.find().sort({ bannedAt: -1 }).exec();
    return res.json(bannedIPs);
  } catch (err) {
    console.error('Error fetching banned IPs:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Ban IP
export const banIP = async (req: AuthRequest, res: Response) => {
  try {
    const { ip, reason, duration } = req.body;

    if (!ip || !reason) {
      return res.status(400).json({ error: 'IP and reason are required' });
    }

    // Check if already banned
    const existing = await BannedIP.findOne({ ip }).exec();
    if (existing) {
      return res.status(409).json({ error: 'IP is already banned' });
    }

    const bannedIP = new BannedIP({
      ip,
      reason,
      bannedBy: req.user!.email,
      expiresAt: duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : undefined
    });

    await bannedIP.save();

    return res.json({ 
      success: true, 
      message: 'IP banned successfully',
      bannedIP
    });
  } catch (err) {
    console.error('Error banning IP:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Unban IP
export const unbanIP = async (req: AuthRequest, res: Response) => {
  try {
    const { ip } = req.body; // Changed from req.params to req.body

    if (!ip) {
      return res.status(400).json({ error: 'IP address required' });
    }

    const result = await BannedIP.findOneAndDelete({ ip }).exec();
    if (!result) {
      return res.status(404).json({ error: 'IP address not found' });
    }

    return res.json({ 
      success: true, 
      message: 'IP unbanned successfully'
    });
  } catch (err) {
    console.error('Error unbanning IP:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get access stats
export const getAccessStats = async (req: AuthRequest, res: Response) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [totalRequests, successfulRequests, uniqueIPs, topEndpoints] = await Promise.all([
      AccessLog.countDocuments({ timestamp: { $gte: last24h } }).exec(),
      AccessLog.countDocuments({ timestamp: { $gte: last24h }, success: true }).exec(),
      AccessLog.distinct('ip', { timestamp: { $gte: last24h } }).exec(),
      AccessLog.aggregate([
        { $match: { timestamp: { $gte: last24h } } },
        { $group: { _id: '$endpoint', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).exec()
    ]);

    return res.json({
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      uniqueIPs: uniqueIPs.length,
      topEndpoints
    });
  } catch (err) {
    console.error('Error fetching access stats:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};