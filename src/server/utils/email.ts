import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { verificationEmailTemplate, statusUpdateEmailTemplate, inviteEmailTemplate } from './emailTemplates.js';
import { getSettings } from './settings.js';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

let transporter: any = null;
let lastSettingsUpdate = 0;

const getTransporter = async () => {
  const now = Date.now();
  
  // Recreate transporter if settings might have changed (check every minute)
  if (!transporter || (now - lastSettingsUpdate) > 60000) {
    const settings = await getSettings();
    
    transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass
      }
    });
    
    lastSettingsUpdate = now;
  }
  
  return transporter;
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendVerificationEmail = async (
  email: string,
  displayName: string,
  verificationToken: string
) => {
  const settings = await getSettings();
  const transport = await getTransporter();
  const verificationUrl = `${settings.appUrl}/verify-email?token=${verificationToken}`;

  if (IS_DEVELOPMENT) {
    console.log('Sending verification email to:', email);
    console.log('Verification URL:', verificationUrl);
  }

  const template = verificationEmailTemplate(displayName, verificationUrl);

  try {
    const info = await transport.sendMail({
      from: `"${settings.smtpSenderName}" <${settings.smtpUser}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
    
    if (IS_DEVELOPMENT) {
      console.log(`Verification email sent successfully to ${email}`);
      console.log('Message ID:', info.messageId);
    }
  } catch (error) {
    console.error('Error sending verification email:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to send verification email');
  }
};

export const sendStatusUpdateEmail = async (
  email: string,
  displayName: string,
  itemName: string,
  status: string,
  notes?: string,
  modelUrl?: string
) => {
  const settings = await getSettings();
  const transport = await getTransporter();

  if (IS_DEVELOPMENT) {
    console.log('Sending status update email to:', email);
    console.log('Status:', status);
    console.log('Item:', itemName);
  }

  const template = statusUpdateEmailTemplate(displayName, itemName, status, notes, modelUrl);

  try {
    const info = await transport.sendMail({
      from: `"${settings.smtpSenderName}" <${settings.smtpUser}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
    
    if (IS_DEVELOPMENT) {
      console.log(`Status update email sent successfully to ${email}`);
      console.log('Message ID:', info.messageId);
    }
  } catch (error) {
    console.error('Error sending status update email:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to send status update email');
  }
};

export const sendInviteEmail = async (
  email: string,
  invitedBy: string,
  verificationToken: string
) => {
  const settings = await getSettings();
  const transport = await getTransporter();
  const inviteUrl = `${settings.appUrl}/verify-email?token=${verificationToken}`;

  if (IS_DEVELOPMENT) {
    console.log('Sending invite email to:', email);
    console.log('Invite URL:', inviteUrl);
  }

  const template = inviteEmailTemplate(email, invitedBy, inviteUrl);

  try {
    const info = await transport.sendMail({
      from: `"${settings.smtpSenderName}" <${settings.smtpUser}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
    
    if (IS_DEVELOPMENT) {
      console.log(`Invite email sent successfully to ${email}`);
      console.log('Message ID:', info.messageId);
    }
  } catch (error) {
    console.error('Error sending invite email:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to send invite email');
  }
};

export const sendNewPrintRequestNotification = async (
  userName: string,
  userEmail: string,
  itemName: string,
  notes?: string,
  modelUrl?: string
) => {
  const settings = await getSettings();
  const transport = await getTransporter();
  
  // Import User model to get admin emails
  const User = (await import('../models/User.js')).default;
  
  // Get all admin users
  const admins = await User.find({ isAdmin: true, isVerified: true }).exec();
  
  if (admins.length === 0) {
    if (IS_DEVELOPMENT) {
      console.log('No admin users found to notify');
    }
    return;
  }

  if (IS_DEVELOPMENT) {
    console.log(`Sending new print request notification to ${admins.length} admin(s)`);
  }

  const { newPrintRequestNotificationTemplate } = await import('./emailTemplates.js');
  const template = newPrintRequestNotificationTemplate(userName, userEmail, itemName, notes, modelUrl);

  // Send email to all admins
  const emailPromises = admins.map(async (admin) => {
    try {
      const info = await transport.sendMail({
        from: `"${settings.smtpSenderName}" <${settings.smtpUser}>`,
        to: admin.email,
        subject: template.subject,
        text: template.text,
        html: template.html
      });
      
      if (IS_DEVELOPMENT) {
        console.log(`Notification sent to admin: ${admin.email}`);
      }
      
      return { success: true, email: admin.email, messageId: info.messageId };
    } catch (error) {
      console.error(`Error sending notification to admin ${admin.email}:`, error instanceof Error ? error.message : 'Unknown error');
      return { success: false, email: admin.email, error };
    }
  });

  const results = await Promise.allSettled(emailPromises);
  
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  
  if (IS_DEVELOPMENT) {
    console.log(`Successfully sent ${successCount}/${admins.length} admin notifications`);
  }
};