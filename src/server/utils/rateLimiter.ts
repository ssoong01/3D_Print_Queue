import { LRUCache } from 'lru-cache';
import { getSettings } from './settings.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Cache for tracking failed admin registration attempts
// Key: IP address, Value: { count, resetAt }
const adminRegisterAttempts = new LRUCache<string, RateLimitEntry>({
  max: 1000, // Store up to 1000 IP addresses
  ttl: 1000 * 60 * 60, // 1 hour TTL
});

export const checkAdminRegisterRateLimit = async (ip: string): Promise<{ allowed: boolean; remainingAttempts?: number; lockedUntil?: Date }> => {
  const settings = await getSettings();
  const MAX_ATTEMPTS = settings.lockoutAttempts;
  const LOCKOUT_DURATION = settings.lockoutDuration * 60 * 1000; // Convert minutes to ms
  
  const now = Date.now();
  const entry = adminRegisterAttempts.get(ip);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if lockout period has expired
  if (now >= entry.resetAt) {
    adminRegisterAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // User is still locked out
  if (entry.count >= MAX_ATTEMPTS) {
    return { 
      allowed: false, 
      lockedUntil: new Date(entry.resetAt) 
    };
  }

  // User has remaining attempts
  return { 
    allowed: true, 
    remainingAttempts: MAX_ATTEMPTS - entry.count 
  };
};

export const recordFailedAdminRegisterAttempt = async (ip: string): Promise<void> => {
  const settings = await getSettings();
  const LOCKOUT_DURATION = settings.lockoutDuration * 60 * 1000;
  
  const now = Date.now();
  const entry = adminRegisterAttempts.get(ip);

  if (!entry) {
    // First failed attempt
    adminRegisterAttempts.set(ip, {
      count: 1,
      resetAt: now + LOCKOUT_DURATION
    });
  } else {
    // Increment failed attempts
    adminRegisterAttempts.set(ip, {
      count: entry.count + 1,
      resetAt: now + LOCKOUT_DURATION
    });
  }
};

export const clearAdminRegisterAttempts = (ip: string): void => {
  adminRegisterAttempts.delete(ip);
};