import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getUsers,
  updateUser,
  deleteUser,
  sendInvite,
  resendUserVerification,
  getServerSettings,
  updateServerSettings,
  testEmail,
  getAccessLogs,
  getBannedIPs,
  banIP,
  unbanIP,
  getAccessStats
} from '../controllers/admin.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// User management
router.get('/users', getUsers);
router.patch('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.post('/invite-user', sendInvite);
router.post('/resend-verification', resendUserVerification);

// Server settings
router.get('/settings', getServerSettings);
router.put('/settings', updateServerSettings);
router.post('/test-email', testEmail);

// Access logs and IP management
router.get('/access-logs', getAccessLogs);
router.get('/access-stats', getAccessStats);
router.get('/banned-ips', getBannedIPs);
router.post('/ban-ip', banIP);
router.post('/unban-ip', unbanIP);

export default router;