import mongoose, { Schema, Document } from 'mongoose';

export interface IServerSettings extends Document {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSenderName: string;
  adminPassword: string;
  maxQueueItems: number;
  lockoutAttempts: number;
  lockoutDuration: number; // in minutes
  appUrl: string; // URL for email verification links
  notifyAdminsOnNewRequest: boolean;
  updatedAt: Date;
}

const ServerSettingsSchema = new Schema<IServerSettings>({
  smtpHost: { type: String, default: 'smtp.gmail.com' },
  smtpPort: { type: Number, default: 587 },
  smtpUser: { type: String, default: '' },
  smtpPass: { type: String, default: '' },
  smtpSenderName: { type: String, default: '3D Print Queue' },
  adminPassword: { type: String, required: true },
  maxQueueItems: { type: Number, default: 5 },
  lockoutAttempts: { type: Number, default: 3 },
  lockoutDuration: { type: Number, default: 15 },
  appUrl: { type: String, default: '' }, // Will be set on first admin login
  notifyAdminsOnNewRequest: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IServerSettings>('ServerSettings', ServerSettingsSchema);