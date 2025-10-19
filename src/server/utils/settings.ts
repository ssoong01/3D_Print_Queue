import ServerSettings from '../models/ServerSettings.js';
import bcrypt from 'bcrypt';

let cachedSettings: any = null;
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

export const getSettings = async () => {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - lastFetch) < CACHE_DURATION) {
    return cachedSettings;
  }

  let settings = await ServerSettings.findOne().exec();
  
  if (!settings) {
    // Create default settings
    const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin';
    const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
    
    // Determine default app URL based on ports
    const webPort = process.env.WEB_PORT || '8080';
    const defaultAppUrl = `http://localhost:${webPort}`;
    
    settings = new ServerSettings({
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      smtpSenderName: '3D Print Queue',
      adminPassword: hashedPassword,
      maxQueueItems: 5,
      lockoutAttempts: 3,
      lockoutDuration: 15,
      appUrl: defaultAppUrl,
      notifyAdminsOnNewRequest: true
    });
    
    await settings.save();
  }

  cachedSettings = settings;
  lastFetch = now;
  
  return settings;
};

export const updateSettings = async (updates: any) => {
  let settings = await ServerSettings.findOne().exec();
  
  if (!settings) {
    settings = new ServerSettings(updates);
  } else {
    Object.assign(settings, updates);
    settings.updatedAt = new Date();
  }
  
  await settings.save();
  
  // Clear cache
  cachedSettings = null;
  
  return settings;
};

export const clearSettingsCache = () => {
  cachedSettings = null;
};