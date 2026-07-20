import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { CallRoom } from '../models/CallRoom';
import { User } from '../models/User';
import { Op } from 'sequelize';

const router = Router();
router.use(requireAuth);

// GET call history
router.get('/history', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { count, rows } = await CallRoom.findAndCountAll({
      where: {
        [Op.or]: [
          { caller_id: userId },
          { callee_id: userId }
        ],
        status: { [Op.ne]: 'pending' }
      },
      include: [
        { model: User, as: 'caller', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'callee', attributes: ['id', 'name', 'avatar_url'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    const calls = rows.map(call => {
      const isOutgoing = call.caller_id === userId;
      const otherUser = isOutgoing ? call.callee : call.caller;
      return {
        id: call.id,
        room_id: call.room_id,
        type: call.call_type,
        status: call.status,
        isOutgoing,
        duration: call.duration || 0,
        started_at: call.started_at,
        ended_at: call.ended_at,
        created_at: call.created_at,
        with: {
          id: otherUser?.id,
          name: otherUser?.name || 'Unknown',
          avatar: otherUser?.avatar_url
        }
      };
    });

    res.json({
      calls,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Call history error:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// GET missed calls count
router.get('/missed-count', async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    
    const count = await CallRoom.count({
      where: {
        callee_id: userId,
        status: 'missed'
      }
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get missed calls' });
  }
});

export default router;