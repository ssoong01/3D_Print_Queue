import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateVerificationToken, sendVerificationEmail } from '../utils/email.js';
import { 
  checkAdminRegisterRateLimit, 
  recordFailedAdminRegisterAttempt, 
  clearAdminRegisterAttempts 
} from '../utils/rateLimiter.js';
import { getSettings } from '../utils/settings.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const SALT_ROUNDS = 10;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

const isEmailConfigured = async (): Promise<boolean> => {
  const settings = await getSettings();
  return !!(settings.smtpHost && settings.smtpUser && settings.smtpPass);
};

export const login = async (
  req: Request<{}, {}, { email: string; password: string }>,
  res: Response
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).exec();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Allow unverified admin users to login if email is not configured
    const emailConfigured = await isEmailConfigured();
    if (!user.isVerified && !(user.isAdmin && !emailConfigured)) {
      return res.status(403).json({ 
        error: 'Email not verified',
        needsVerification: true,
        email: user.email
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        displayName: user.displayName,
        isAdmin: user.isAdmin 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    if (IS_DEVELOPMENT) {
      console.log(`Login successful: ${user.email}`);
    }
    
    return res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        displayName: user.displayName,
        isAdmin: user.isAdmin
      } 
    });
  } catch (err) {
    console.error('Login error:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, isAdmin, adminPassword } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Get settings for admin password check
    const settings = await getSettings();
    const emailConfigured = await isEmailConfigured();

    if (isAdmin) {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const rateLimitCheck = await checkAdminRegisterRateLimit(clientIp);

      if (!rateLimitCheck.allowed) {
        const minutesRemaining = Math.ceil((rateLimitCheck.lockedUntil!.getTime() - Date.now()) / 60000);
        if (IS_DEVELOPMENT) {
          console.log(`Admin registration blocked for IP ${clientIp} - locked out until ${rateLimitCheck.lockedUntil}`);
        }
        return res.status(429).json({ 
          error: `Too many failed admin registration attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
          lockedUntil: rateLimitCheck.lockedUntil,
          isLocked: true
        });
      }

      // Verify admin password against settings
      const adminPasswordMatch = await bcrypt.compare(adminPassword, settings.adminPassword);
      if (!adminPasswordMatch) {
        await recordFailedAdminRegisterAttempt(clientIp);
        const updatedCheck = await checkAdminRegisterRateLimit(clientIp);
        
        if (IS_DEVELOPMENT) {
          console.log(`Failed admin registration attempt from IP ${clientIp} - ${updatedCheck.remainingAttempts} attempts remaining`);
        }
        
        if (updatedCheck.remainingAttempts === 0) {
          return res.status(401).json({ 
            error: `Invalid admin password. You have been locked out for ${settings.lockoutDuration} minutes due to too many failed attempts.`,
            isLocked: true,
            lockedUntil: new Date(Date.now() + settings.lockoutDuration * 60 * 1000)
          });
        }
        
        return res.status(401).json({ 
          error: `Invalid admin password. ${updatedCheck.remainingAttempts} attempt${updatedCheck.remainingAttempts !== 1 ? 's' : ''} remaining before lockout.`,
          remainingAttempts: updatedCheck.remainingAttempts
        });
      }

      clearAdminRegisterAttempts(clientIp);
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() }).exec();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Auto-verify admin users if email is not configured
    const shouldAutoVerify = isAdmin && !emailConfigured;
    const verificationToken = shouldAutoVerify ? undefined : generateVerificationToken();
    const verificationTokenExpires = shouldAutoVerify ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (IS_DEVELOPMENT) {
      console.log('Creating user:', { email: email.toLowerCase(), isAdmin, shouldAutoVerify });
      if (verificationToken) {
        console.log('Verification token generated (length):', verificationToken.length);
      }
    }
    
    if (shouldAutoVerify && IS_DEVELOPMENT) {
      console.log('Auto-verifying admin user because email is not configured');
    }

    const user = new User({ 
      email: email.toLowerCase(), 
      password: hash, 
      displayName,
      isAdmin: isAdmin || false,
      isVerified: shouldAutoVerify,
      verificationToken,
      verificationTokenExpires
    });
    await user.save();

    if (shouldAutoVerify) {
      if (IS_DEVELOPMENT) {
        console.log('Admin user auto-verified successfully:', user.email);
      }
      
      // Return token immediately for auto-verified admin
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          displayName: user.displayName,
          isAdmin: user.isAdmin 
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );
      
      return res.status(201).json({
        message: 'Admin registration successful. Email verification bypassed - please configure email settings.',
        autoVerified: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          isAdmin: user.isAdmin
        }
      });
    }

    if (IS_DEVELOPMENT) {
      console.log('User saved, sending verification email to:', user.email);
    }

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.displayName, verificationToken!);
      if (IS_DEVELOPMENT) {
        console.log('Verification email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError instanceof Error ? emailError.message : 'Unknown error');
      // Don't fail registration if email fails
    }

    return res.status(201).json({ 
      message: 'Registration successful. Please check your email to verify your account.',
      email: user.email,
      needsVerification: true
    });
  } catch (err) {
    console.error('Registration error:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (IS_DEVELOPMENT) {
      console.log('Verification attempt received');
    }

    if (!token || typeof token !== 'string') {
      if (IS_DEVELOPMENT) {
        console.log('Invalid token format');
      }
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const user = await User.findOne({ verificationToken: token }).exec();

    if (!user) {
      if (IS_DEVELOPMENT) {
        console.log('No user found with this token');
      }
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    if (user.isVerified) {
      if (IS_DEVELOPMENT) {
        console.log('User already verified:', user.email);
      }
      return res.json({ 
        message: 'Email already verified! You can log in now.',
        verified: true,
        alreadyVerified: true
      });
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      if (IS_DEVELOPMENT) {
        console.log('Token expired for user:', user.email);
      }
      return res.status(400).json({ 
        error: 'Verification token has expired. Please request a new verification email.',
        expired: true,
        email: user.email
      });
    }

    if (IS_DEVELOPMENT) {
      console.log('Verifying user:', user.email);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    if (IS_DEVELOPMENT) {
      console.log('User verified successfully:', user.email);
    }

    return res.json({ 
      message: 'Email verified successfully! You can now log in.',
      verified: true
    });
  } catch (err) {
    console.error('Verification error:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (IS_DEVELOPMENT) {
      console.log('Resending verification email for:', user.email);
    }

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    await sendVerificationEmail(user.email, user.displayName, verificationToken);

    if (IS_DEVELOPMENT) {
      console.log('Verification email resent successfully to:', user.email);
    }

    return res.json({ 
      message: 'Verification email sent. Please check your inbox.',
      email: user.email
    });
  } catch (err) {
    console.error('Resend verification error:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};