// // routes/follows.ts - COMPLETELY REWRITTEN
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { Follow } from '../models/Follow'
// import { User } from '../models/User'
// import { Post } from '../models/Post'
// import pushService from '../services/expoPushNotification'

// const router = Router()

// // ============================================
// // PUBLIC ROUTES (No authentication required)
// // These MUST be defined before any auth middleware
// // ============================================

// // Get user's followers (PUBLIC)
// router.get('/followers/:userId', async (req, res) => {
//   console.log('🔥 PUBLIC GET /followers/' + req.params.userId)
//   try {
//     const userId = String(req.params.userId)
//     const { page = 1, limit = 20 } = req.query

//     const followers = await Follow.findAll({
//       where: { following_id: userId },
//       include: [{ model: User, as: 'follower', attributes: ['id', 'name', 'avatar_url'] }],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit),
//       order: [['created_at', 'DESC']]
//     })

//     const users = followers.map(f => f.follower)
//     res.json(users)
//   } catch (error) {
//     console.error('Get followers error:', error)
//     res.status(500).json({ error: 'Failed to get followers' })
//   }
// })

// // Get users a user is following (PUBLIC)
// router.get('/following/:userId', async (req, res) => {
//   console.log('🔥 PUBLIC GET /following/' + req.params.userId)
//   try {
//     const userId = String(req.params.userId)
//     const { page = 1, limit = 20 } = req.query

//     const following = await Follow.findAll({
//       where: { follower_id: userId },
//       include: [{ model: User, as: 'following', attributes: ['id', 'name', 'avatar_url'] }],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit),
//       order: [['created_at', 'DESC']]
//     })

//     const users = following.map(f => f.following)
//     res.json(users)
//   } catch (error) {
//     console.error('Get following error:', error)
//     res.status(500).json({ error: 'Failed to get following users' })
//   }
// })

// // ============================================
// // PROTECTED ROUTES (Authentication required)
// // ============================================

// // Follow a user
// router.post('/follow/:userId', requireAuth, async (req, res) => {
//   console.log('🔒 POST /follow/' + req.params.userId)
//   try {
//     const followerId = req.user.id
//     const followingId = String(req.params.userId)

//     if (followerId === followingId) {
//       return res.status(400).json({ error: 'Cannot follow yourself' })
//     }

//     const existing = await Follow.findOne({
//       where: { follower_id: followerId, following_id: followingId }
//     })

//     if (existing) {
//       return res.status(400).json({ error: 'Already following' })
//     }

//     await Follow.create({ follower_id: followerId, following_id: followingId })

//     await User.increment('following_count', { where: { id: followerId } })
//     await User.increment('followers_count', { where: { id: followingId } })

//     const follower = await User.findByPk(followerId)
//     pushService.createAndSend(
//       followingId,
//       'new_post',
//       followerId,
//       'New Follower',
//       `${follower?.name} started following you!`,
//       follower?.avatar_url || undefined,
//       { followerId, type: 'follow' }
//     )

//     res.json({ success: true, message: 'User followed' })
//   } catch (error) {
//     console.error('Follow error:', error)
//     res.status(500).json({ error: 'Failed to follow user' })
//   }
// })

// // Unfollow a user
// router.delete('/unfollow/:userId', requireAuth, async (req, res) => {
//   console.log('🔒 DELETE /unfollow/' + req.params.userId)
//   try {
//     const followerId = req.user.id
//     const followingId = String(req.params.userId)

//     await Follow.destroy({
//       where: { follower_id: followerId, following_id: followingId }
//     })

//     await User.decrement('following_count', { where: { id: followerId } })
//     await User.decrement('followers_count', { where: { id: followingId } })

//     res.json({ success: true, message: 'User unfollowed' })
//   } catch (error) {
//     console.error('Unfollow error:', error)
//     res.status(500).json({ error: 'Failed to unfollow user' })
//   }
// })

// // Check if following
// router.get('/check/:userId', requireAuth, async (req, res) => {
//   console.log('🔒 GET /check/' + req.params.userId)
//   try {
//     const followerId = req.user.id
//     const followingId = String(req.params.userId)

//     const follow = await Follow.findOne({
//       where: { follower_id: followerId, following_id: followingId }
//     })

//     res.json({ isFollowing: !!follow })
//   } catch (error) {
//     console.error('Check follow error:', error)
//     res.status(500).json({ error: 'Failed to check follow status' })
//   }
// })

// // Get feed from followed users
// router.get('/feed', requireAuth, async (req, res) => {
//   console.log('🔒 GET /feed')
//   try {
//     const userId = req.user.id
//     const { page = 1, limit = 20 } = req.query

//     const following = await Follow.findAll({
//       where: { follower_id: userId },
//       attributes: ['following_id']
//     })

//     const followingIds = following.map(f => f.following_id)
    
//     if (followingIds.length === 0) {
//       followingIds.push(userId)
//     } else {
//       followingIds.push(userId)
//     }

//     const posts = await Post.findAll({
//       where: {
//         user_id: followingIds,
//         status: 'posted'
//       },
//       include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
//       order: [['created_at', 'DESC']],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit)
//     })

//     res.json(posts)
//   } catch (error) {
//     console.error('Feed error:', error)
//     res.status(500).json({ error: 'Failed to get feed' })
//   }
// })

// export default router


// routes/follows.ts - COMPLETE WITH SOCKET.IO INTEGRATION
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { Follow } from '../models/Follow'
import { User } from '../models/User'
import { Post } from '../models/Post'
import pushService from '../services/expoPushNotification'

const router = Router()

// Type definitions for socket events
interface FollowActionData {
  followerId: string;
  followingId: string;
  action: 'followed' | 'unfollowed';
  followerName?: string;
  timestamp: number;
}

interface FollowNotificationData {
  followerId: string;
  followingId: string;
  followerName: string;
  followerAvatar?: string;
  timestamp: number;
}

interface FollowersCountData {
  userId: string;
  followersCount: number;
  followingCount: number;
  timestamp: number;
}

// Extended Request interface for authenticated requests
interface AuthRequest extends Request {
  user?: {
    id: string;
    name?: string;
    role?: string;
    user_metadata?: {
      role?: string;
    };
  };
}

// Helper to safely get route parameter
const getParam = (params: any, key: string): string => {
  const value = params[key];
  if (Array.isArray(value)) return String(value[0]);
  return String(value || '');
}

// Helper to get number from query
const getNumberQuery = (value: any, defaultValue: number): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Helper to emit follow notification via socket
const emitFollowNotification = (io: any, data: FollowNotificationData) => {
  if (io) {
    // Notify the followed user
    io.to(`user:${data.followingId}`).emit('new_follower', {
      ...data,
      message: `${data.followerName} started following you!`
    })
    
    io.to(`notifications:${data.followingId}`).emit('new_notification', {
      type: 'follow',
      title: 'New Follower',
      message: `${data.followerName} started following you!`,
      ...data
    })
  }
}

// Helper to emit follow counts update
const emitFollowCounts = async (io: any, userId: string) => {
  if (io) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'followers_count', 'following_count']
    })
    
    if (user) {
      const countData: FollowersCountData = {
        userId,
        followersCount: user.followers_count || 0,
        followingCount: user.following_count || 0,
        timestamp: Date.now()
      }
      
      io.to(`user:${userId}`).emit('follow_counts_updated', countData)
    }
  }
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get user's followers (PUBLIC)
router.get('/followers/:userId', async (req: Request, res: Response) => {
  console.log('🔥 PUBLIC GET /followers/' + req.params.userId)
  try {
    const userId: string = getParam(req.params, 'userId')
    const page: number = getNumberQuery(req.query.page, 1)
    const limit: number = getNumberQuery(req.query.limit, 20)

    const { count, rows: followers } = await Follow.findAndCountAll({
      where: { following_id: userId },
      include: [{ model: User, as: 'follower', attributes: ['id', 'name', 'avatar_url'] }],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    })

    const users = followers.map(f => f.follower)
    
    return res.json({
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get followers error:', error)
    return res.status(500).json({ error: 'Failed to get followers' })
  }
})

// Get users a user is following (PUBLIC)
router.get('/following/:userId', async (req: Request, res: Response) => {
  console.log('🔥 PUBLIC GET /following/' + req.params.userId)
  try {
    const userId: string = getParam(req.params, 'userId')
    const page: number = getNumberQuery(req.query.page, 1)
    const limit: number = getNumberQuery(req.query.limit, 20)

    const { count, rows: following } = await Follow.findAndCountAll({
      where: { follower_id: userId },
      include: [{ model: User, as: 'following', attributes: ['id', 'name', 'avatar_url'] }],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    })

    const users = following.map(f => f.following)
    
    return res.json({
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get following error:', error)
    return res.status(500).json({ error: 'Failed to get following users' })
  }
})

// Get follow counts (PUBLIC)
router.get('/counts/:userId', async (req: Request, res: Response) => {
  try {
    const userId: string = getParam(req.params, 'userId')
    
    const followersCount: number = await Follow.count({
      where: { following_id: userId }
    })
    
    const followingCount: number = await Follow.count({
      where: { follower_id: userId }
    })
    
    return res.json({
      userId,
      followersCount,
      followingCount
    })
  } catch (error) {
    console.error('Get follow counts error:', error)
    return res.status(500).json({ error: 'Failed to get follow counts' })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Follow a user
router.post('/follow/:userId', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('🔒 POST /follow/' + req.params.userId)
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const followerId: string = req.user.id
    const followingId: string = getParam(req.params, 'userId')

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    // Check if target user exists
    const targetUser = await User.findByPk(followingId, {
      attributes: ['id', 'name']
    })
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const existing = await Follow.findOne({
      where: { follower_id: followerId, following_id: followingId }
    })

    if (existing) {
      return res.status(400).json({ error: 'Already following' })
    }

    await Follow.create({ follower_id: followerId, following_id: followingId })

    await User.increment('following_count', { where: { id: followerId } })
    await User.increment('followers_count', { where: { id: followingId } })

    // Get follower info
    const follower = await User.findByPk(followerId, {
      attributes: ['id', 'name', 'avatar_url']
    })

    // Send push notification
    if (follower) {
      pushService.createAndSend(
        followingId,
        'new_post',
        followerId,
        'New Follower',
        `${follower.name || 'Someone'} started following you!`,
        follower.avatar_url || undefined,
        { followerId, type: 'follow' }
      )
    }

    // ✅ SOCKET.IO - Emit follow events
    const io = req.app.get('io')
    if (io) {
      const followData: FollowActionData = {
        followerId,
        followingId,
        action: 'followed',
        followerName: follower?.name || 'Someone',
        timestamp: Date.now()
      }

      // Notify the followed user
      io.to(`user:${followingId}`).emit('user_followed', followData)

      // Confirm to follower
      io.to(`user:${followerId}`).emit('follow_action_confirmed', {
        ...followData,
        message: `You are now following ${targetUser.name}`
      })

      // Send notification
      if (follower) {
        emitFollowNotification(io, {
          followerId,
          followingId,
          followerName: follower.name || 'Someone',
          followerAvatar: follower.avatar_url || undefined,
          timestamp: Date.now()
        })
      }

      // Update follow counts for both users
      await emitFollowCounts(io, followerId)
      await emitFollowCounts(io, followingId)
    }

    return res.json({ 
      success: true, 
      message: 'User followed',
      isFollowing: true
    })
  } catch (error) {
    console.error('Follow error:', error)
    return res.status(500).json({ error: 'Failed to follow user' })
  }
})

// Unfollow a user
router.delete('/unfollow/:userId', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('🔒 DELETE /unfollow/' + req.params.userId)
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const followerId: string = req.user.id
    const followingId: string = getParam(req.params, 'userId')

    const deleted = await Follow.destroy({
      where: { follower_id: followerId, following_id: followingId }
    })

    if (deleted === 0) {
      return res.status(404).json({ error: 'Not following this user' })
    }

    await User.decrement('following_count', { where: { id: followerId } })
    await User.decrement('followers_count', { where: { id: followingId } })

    // ✅ SOCKET.IO - Emit unfollow events
    const io = req.app.get('io')
    if (io) {
      const unfollowData: FollowActionData = {
        followerId,
        followingId,
        action: 'unfollowed',
        timestamp: Date.now()
      }

      // Notify the unfollowed user
      io.to(`user:${followingId}`).emit('user_unfollowed', unfollowData)

      // Confirm to unfollower
      io.to(`user:${followerId}`).emit('follow_action_confirmed', {
        ...unfollowData,
        message: 'You have unfollowed this user'
      })

      // Update follow counts for both users
      await emitFollowCounts(io, followerId)
      await emitFollowCounts(io, followingId)
    }

    return res.json({ 
      success: true, 
      message: 'User unfollowed',
      isFollowing: false
    })
  } catch (error) {
    console.error('Unfollow error:', error)
    return res.status(500).json({ error: 'Failed to unfollow user' })
  }
})

// Check if following
router.get('/check/:userId', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('🔒 GET /check/' + req.params.userId)
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const followerId: string = req.user.id
    const followingId: string = getParam(req.params, 'userId')

    const follow = await Follow.findOne({
      where: { follower_id: followerId, following_id: followingId }
    })

    // Also check if they follow you back
    const followsBack = await Follow.findOne({
      where: { follower_id: followingId, following_id: followerId }
    })

    return res.json({ 
      isFollowing: !!follow,
      followsBack: !!followsBack,
      mutualFollow: !!(follow && followsBack)
    })
  } catch (error) {
    console.error('Check follow error:', error)
    return res.status(500).json({ error: 'Failed to check follow status' })
  }
})

// Batch check following status
router.post('/check-batch', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { userIds }: { userIds: string[] } = req.body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' })
    }

    const follows = await Follow.findAll({
      where: {
        follower_id: userId,
        following_id: userIds
      },
      attributes: ['following_id']
    })

    const followingSet = new Set(follows.map(f => f.following_id))
    
    const result: Record<string, { isFollowing: boolean; followsBack: boolean }> = {}
    
    for (const id of userIds) {
      result[id] = {
        isFollowing: followingSet.has(id),
        followsBack: false // Would need additional query for followsBack
      }
    }

    return res.json({ followingStatus: result })
  } catch (error) {
    console.error('Batch check follow error:', error)
    return res.status(500).json({ error: 'Failed to check follow status' })
  }
})

// Get feed from followed users
router.get('/feed', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('🔒 GET /feed')
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const page: number = getNumberQuery(req.query.page, 1)
    const limit: number = getNumberQuery(req.query.limit, 20)

    const following = await Follow.findAll({
      where: { follower_id: userId },
      attributes: ['following_id']
    })

    const followingIds: string[] = following.map(f => f.following_id)
    
    // Include user's own posts
    if (!followingIds.includes(userId)) {
      followingIds.push(userId)
    }

    // If not following anyone, show only own posts
    const effectiveIds = followingIds.length > 0 ? followingIds : [userId]

    const { count, rows: posts } = await Post.findAndCountAll({
      where: {
        user_id: effectiveIds,
        status: 'posted'
      },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })

    return res.json({
      posts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Feed error:', error)
    return res.status(500).json({ error: 'Failed to get feed' })
  }
})

export default router