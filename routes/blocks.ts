import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { Block } from '../models/Block';
import { User } from '../models/User';

const router = Router();
router.use(requireAuth);

// GET blocked users
router.get('/', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    
    const blocks = await Block.findAll({
      where: { blocker_id: userId },
      include: [{
        model: User,
        as: 'blocked',
        attributes: ['id', 'name', 'phone', 'avatar_url']
      }],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      blocks: blocks.map(b => ({
        id: b.blocked.id,
        name: b.blocked.name,
        phone: b.blocked.phone,
        avatar: b.blocked.avatar_url,
        blockedAt: b.created_at,
        reason: b.reason
      }))
    });
  } catch (error) {
    console.error('Get blocks error:', error);
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
});

// CHECK if user is blocked
router.get('/check/:userId', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const targetUserId = req.params.userId;
    
    const block = await Block.findOne({
      where: {
        blocker_id: userId,
        blocked_id: targetUserId
      }
    });
    
    res.json({ isBlocked: !!block });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check block status' });
  }
});

// ========== NEW: UNBLOCK USER ==========
router.delete('/unblock/:userId', async (req: any, res: Response) => {
  try {
    const blockerId = req.user.id;
    const blockedId = req.params.userId;

    // Find and delete the block
    const deleted = await Block.destroy({
      where: {
        blocker_id: blockerId,
        blocked_id: blockedId
      }
    });

    if (deleted === 0) {
      return res.status(404).json({ 
        error: 'Block not found or user was not blocked' 
      });
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${blockerId}`).emit('user_unblocked', {
        userId: blockedId,
        timestamp: Date.now()
      });
    }

    res.json({ 
      success: true, 
      message: 'User unblocked successfully',
      userId: blockedId
    });
  } catch (error) {
    console.error('Unblock error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// ========== NEW: BLOCK USER ==========
router.post('/block/:userId', async (req: any, res: Response) => {
  try {
    const blockerId = req.user.id;
    const blockedId = req.params.userId;
    const { reason } = req.body;

    // Check if already blocked
    const existing = await Block.findOne({
      where: {
        blocker_id: blockerId,
        blocked_id: blockedId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    // Don't allow blocking yourself
    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    // Create block
    const block = await Block.create({
      blocker_id: blockerId,
      blocked_id: blockedId,
      reason: reason || 'Blocked'
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${blockerId}`).emit('user_blocked', {
        userId: blockedId,
        reason: reason || 'Blocked',
        timestamp: Date.now()
      });
    }

    res.json({
      success: true,
      message: 'User blocked successfully',
      block: {
        id: block.id,
        userId: blockedId,
        reason: block.reason,
        createdAt: block.created_at
      }
    });
  } catch (error) {
    console.error('Block error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

export default router;