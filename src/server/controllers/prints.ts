import { Request, Response } from 'express';
import Print from '../models/Print.js';
import User from '../models/User.js';
import { sendStatusUpdateEmail, sendNewPrintRequestNotification } from '../utils/email.js';
import { getSettings } from '../utils/settings.js';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * GET /api/prints
 * Return the active print queue (excluding completed and cancelled)
 */
export const getPrints = async (req: Request, res: Response) => {
  try {
    const prints = await Print.find({
      status: { $nin: ['completed', 'cancelled'] }
    }).sort({ priority: 1, createdAt: 1 }).exec();
    return res.json(prints);
  } catch (err) {
    console.error('Error fetching prints:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/prints/completed
 * Return completed and cancelled prints, sorted by completion time (most recent first)
 */
export const getCompletedPrints = async (req: Request, res: Response) => {
  try {
    const prints = await Print.find({
      status: { $in: ['completed', 'cancelled'] }
    }).sort({ completedAt: -1, createdAt: -1 }).exec();
    return res.json(prints);
  } catch (err) {
    console.error('Error fetching completed prints:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/prints
 * Add a new print request
 */
export const createPrint = async (req: Request, res: Response) => {
  try {
    const { userId, userEmail, userDisplayName, itemToPrint, modelUrl, notes } = req.body;
    
    if (!userId || !userEmail || !userDisplayName || !itemToPrint) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Verify user exists
    const user = await User.findById(userId).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get max queue items from settings
    const settings = await getSettings();
    const maxQueueItems = settings.maxQueueItems;

    // Count active requests for this user
    const activeCount = await Print.countDocuments({
      userId,
      status: { $in: ['new', 'ready-to-print', 'printing'] },
    }).exec();

    if (activeCount >= maxQueueItems) {
      return res.status(429).json({ 
        error: `You have reached the ${maxQueueItems} active request limit` 
      });
    }

    // Get the highest priority value and add 1
    const highestPriority = await Print.findOne().sort({ priority: -1 }).select('priority').exec();
    const newPriority = highestPriority ? highestPriority.priority + 1 : 0;

    const newPrint = new Print({
      userId,
      userEmail,
      userDisplayName,
      itemToPrint,
      modelUrl: modelUrl || '',
      notes: notes || '',
      status: 'new',
      priority: newPriority,
      createdAt: new Date(),
    });

    await newPrint.save();

    // Send notification to all admins if enabled in settings
    if (settings.notifyAdminsOnNewRequest) {
      try {
        await sendNewPrintRequestNotification(
          userDisplayName,
          userEmail,
          itemToPrint,
          notes,
          modelUrl
        );
        
        if (IS_DEVELOPMENT) {
          console.log(`Admin notification sent for new print request: ${itemToPrint}`);
        }
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError instanceof Error ? emailError.message : 'Unknown error');
        // Don't fail the request if email fails
      }
    }

    return res.status(201).json(newPrint);
  } catch (err) {
    console.error('Error adding print request:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /api/prints/:id/status
 * Update print request status
 */
export const updatePrintStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const validStatuses = ['new', 'ready-to-print', 'printing', 'completed', 'print-error', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const print = await Print.findById(id).exec();
    if (!print) {
      return res.status(404).json({ error: 'Print request not found' });
    }

    const oldStatus = print.status;
    print.status = status;
    
    // Set completedAt timestamp when status changes to completed, cancelled, or print-error
    const completionStatuses = ['completed', 'cancelled', 'print-error'];
    if (completionStatuses.includes(status) && oldStatus !== status) {
      print.completedAt = new Date();
    }
    
    await print.save();

    // Send email notification if status changed to completed, cancelled, or print-error
    const notifiableStatuses = ['completed', 'cancelled', 'print-error'];
    if (notifiableStatuses.includes(status) && oldStatus !== status) {
      try {
        await sendStatusUpdateEmail(
          print.userEmail,
          print.userDisplayName,
          print.itemToPrint,
          status,
          print.notes,
          print.modelUrl
        );
        
        if (IS_DEVELOPMENT) {
          console.log(`Status update email sent for print ${id}`);
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError instanceof Error ? emailError.message : 'Unknown error');
      }
    }

    return res.json({ success: true, print });
  } catch (err) {
    console.error('Error updating print status:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /api/prints/reorder
 * Reorder print requests
 */
export const reorderPrints = async (req: Request, res: Response) => {
  try {
    const { orderedIds, isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const updatePromises = orderedIds.map((id, index) => 
      Print.findByIdAndUpdate(id, { priority: index }).exec()
    );

    await Promise.all(updatePromises);
    return res.json({ success: true, message: 'Queue reordered successfully' });
  } catch (err) {
    console.error('Error reordering queue:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/prints/:id
 * Delete a print request
 */
export const deletePrint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const print = await Print.findById(id).exec();
    if (!print) {
      return res.status(404).json({ error: 'Print request not found' });
    }

    const isOwner = print.userId.toString() === userId;
    const isCompleted = ['completed', 'cancelled'].includes(print.status);
    
    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ error: 'You do not have permission to delete this request' });
      }
      if (isCompleted) {
        return res.status(403).json({ error: 'Cannot delete completed or cancelled requests' });
      }
    }

    await print.deleteOne();
    return res.json({ success: true, message: 'Print request deleted' });
  } catch (err) {
    console.error('Error deleting print request:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};