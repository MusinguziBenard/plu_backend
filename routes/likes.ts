// // routes/likes.ts - COMPLETE FIXED VERSION
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { PostLike } from '../models/PostLike'
// import { Post } from '../models/Post'
// import { User } from '../models/User'
// import pushService from '../services/expoPushNotification'

// const router = Router()

// // ============================================
// // PUBLIC ROUTES (No authentication required)
// // ============================================

// // Get likes count for a post - PUBLIC
// router.get('/count/:postId', async (req, res) => {
//   try {
//     const { postId } = req.params
//     const count = await PostLike.count({
//       where: { post_id: postId }
//     })
//     res.json({ postId, likesCount: count })
//   } catch (error) {
//     console.error('Error getting likes count:', error)
//     res.status(500).json({ error: 'Failed to get likes count' })
//   }
// })

// // Get users who liked a post - PUBLIC
// router.get('/users/:postId', async (req, res) => {
//   try {
//     const { postId } = req.params
//     const { page = 1, limit = 20 } = req.query

//     const likes = await PostLike.findAll({
//       where: { post_id: postId },
//       include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit),
//       order: [['created_at', 'DESC']]
//     })

//     const users = likes.map(like => like.user)
//     res.json(users)
//   } catch (error) {
//     console.error('Error getting users who liked post:', error)
//     res.status(500).json({ error: 'Failed to get users' })
//   }
// })

// // ============================================
// // PROTECTED ROUTES (Authentication required)
// // ============================================

// // Get user's liked posts - PROTECTED
// router.get('/', requireAuth, async (req, res) => {
//   try {
//     const userId = req.user.id

//     console.log('Fetching liked posts for user:', userId)

//     // Get all likes for the user with created_at
//     const likes = await PostLike.findAll({
//       where: { user_id: userId },
//       order: [['created_at', 'DESC']]
//     })

//     if (!likes || likes.length === 0) {
//       return res.json([])
//     }

//     // Get all post IDs
//     const postIds = likes.map(like => like.post_id)

//     // Fetch the posts
//     const posts = await Post.findAll({
//       where: { 
//         id: postIds,
//         status: 'posted'
//       },
//       include: [{ 
//         model: User, 
//         attributes: ['id', 'name', 'avatar_url', 'location'] 
//       }],
//       order: [['created_at', 'DESC']]
//     })

//     // Create a map for quick lookup
//     const likedPostIds = new Set(postIds)
    
//     // Map isLiked property to each post
//     const postsWithLikeStatus = posts.map(post => ({
//       ...post.toJSON(),
//       isLiked: likedPostIds.has(post.id)
//     }))

//     res.json(postsWithLikeStatus)
//   } catch (error) {
//     console.error('Error getting user likes:', error)
//     res.status(500).json({ error: 'Failed to get user likes: ' + (error as Error).message })
//   }
// })

// // Check if user liked a specific post - PROTECTED
// router.get('/check/:postId', requireAuth, async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { postId } = req.params

//     const like = await PostLike.findOne({
//       where: { user_id: userId, post_id: postId }
//     })

//     res.json({ isLiked: !!like })
//   } catch (error) {
//     console.error('Error checking like status:', error)
//     res.status(500).json({ error: 'Failed to check like status' })
//   }
// })

// // Toggle like/unlike - PROTECTED
// router.post('/toggle', requireAuth, async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { post_id } = req.body

//     if (!post_id) {
//       return res.status(400).json({ error: 'Post ID required' })
//     }

//     const existing = await PostLike.findOne({
//       where: { user_id: userId, post_id }
//     })

//     if (existing) {
//       // Unlike
//       await existing.destroy()
//       await Post.decrement('likes_count', { where: { id: post_id } })
//       res.json({ success: true, action: 'unliked', isLiked: false })
//     } else {
//       // Like
//       await PostLike.create({ user_id: userId, post_id })
//       await Post.increment('likes_count', { where: { id: post_id } })
      
//       const post = await Post.findByPk(post_id, {
//         include: [{ model: User }]
//       })
      
//       if (post && post.user_id !== userId) {
//         const liker = await User.findByPk(userId)
//         pushService.createAndSend(
//           post.user_id,
//           'like',
//           post_id,
//           'Someone liked your post!',
//           `${liker?.name || 'Someone'} liked "${post.title.substring(0, 50)}"`,
//           post.photo_url || undefined,
//           { postId: post_id, actorId: userId }
//         )
//       }
      
//       res.json({ success: true, action: 'liked', isLiked: true })
//     }
//   } catch (error) {
//     console.error('Error toggling like:', error)
//     res.status(500).json({ error: 'Failed to toggle like' })
//   }
// })

// // Legacy route - PROTECTED
// router.post('/', requireAuth, async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { post_id } = req.body

//     const existing = await PostLike.findOne({
//       where: { user_id: userId, post_id }
//     })

//     if (existing) {
//       await existing.destroy()
//       await Post.decrement('likes_count', { where: { id: post_id } })
//       res.json({ success: true, action: 'unliked' })
//     } else {
//       await PostLike.create({ user_id: userId, post_id })
//       await Post.increment('likes_count', { where: { id: post_id } })
      
//       const post = await Post.findByPk(post_id, {
//         include: [{ model: User }]
//       })
      
//       if (post && post.user_id !== userId) {
//         const liker = await User.findByPk(userId)
//         pushService.createAndSend(
//           post.user_id,
//           'like',
//           post_id,
//           'Someone liked your post!',
//           `${liker?.name || 'Someone'} liked "${post.title.substring(0, 50)}"`,
//           post.photo_url || undefined,
//           { postId: post_id }
//         )
//       }
      
//       res.json({ success: true, action: 'liked' })
//     }
//   } catch (error) {
//     console.error('Error toggling like:', error)
//     res.status(500).json({ error: 'Failed to toggle like' })
//   }
// })

// // Delete unlike - PROTECTED
// router.delete('/', requireAuth, async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { post_id } = req.body

//     await PostLike.destroy({ where: { user_id: userId, post_id } })
//     await Post.decrement('likes_count', { where: { id: post_id } })
    
//     res.json({ success: true, action: 'unliked' })
//   } catch (error) {
//     console.error('Error deleting like:', error)
//     res.status(500).json({ error: 'Failed to delete like' })
//   }
// })

// export default router


// routes/likes.ts - ENHANCED WITH MAXIMUM PUSH NOTIFICATIONS
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostLike } from '../models/PostLike'
import { Post } from '../models/Post'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'
import { Op } from 'sequelize'

const router = Router()

// Type definitions
interface LikeToggledData {
  postId: string;
  userId: string;
  action: 'liked' | 'unliked';
  isLiked: boolean;
  likesCount: number;
  timestamp: number;
}

interface LikeNotificationData {
  postId: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  postTitle: string;
  postPhoto?: string;
  timestamp: number;
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
    user_metadata?: {
      role?: string;
    };
  };
}

// Milestone levels for push notifications - EVERY milestone sends push
const LIKE_MILESTONES = [
  { threshold: 3, level: 'getting attention', message: 'is getting some attention' },
  { threshold: 5, level: 'gaining traction', message: 'is gaining traction' },
  { threshold: 10, level: 'popular', message: 'is becoming popular' },
  { threshold: 25, level: 'very popular', message: 'is very popular' },
  { threshold: 50, level: 'trending', message: 'is trending' },
  { threshold: 100, level: 'hot', message: 'is hot' },
  { threshold: 250, level: 'viral', message: 'is going viral' },
  { threshold: 500, level: 'extremely viral', message: 'is extremely viral' },
  { threshold: 1000, level: 'legendary', message: 'has reached legendary status' }
]

const getParam = (params: any, key: string): string => {
  const value = params[key];
  if (Array.isArray(value)) return String(value[0]);
  return String(value || '');
}

const getNumberQuery = (value: any, defaultValue: number): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

const emitLikeEvent = (io: any, data: LikeToggledData) => {
  if (io) {
    io.to(`post:${data.postId}`).emit('like_toggled', data)
    io.to(`post:${data.postId}`).emit('post_likes_updated', {
      postId: data.postId,
      likesCount: data.likesCount,
      timestamp: data.timestamp
    })
    io.to(`user:${data.userId}`).emit('like_action_confirmed', {
      ...data,
      message: `Post ${data.action}`
    })
  }
}

const emitLikeNotification = (io: any, data: LikeNotificationData, postOwnerId: string) => {
  if (io) {
    io.to(`user:${postOwnerId}`).emit('new_notification', {
      type: 'like',
      id: `like_${data.postId}_${data.actorId}_${Date.now()}`,
      title: 'Someone liked your post',
      message: `${data.actorName} liked "${data.postTitle.substring(0, 50)}"`,
      read: false,
      data: {
        postId: data.postId,
        actorId: data.actorId,
        actorName: data.actorName,
        postTitle: data.postTitle,
        action: 'view_post'
      },
      timestamp: data.timestamp
    })
    
    io.to(`user:${postOwnerId}`).emit('post_liked_by_user', data)
    io.to(`user:${postOwnerId}`).emit('notification_received', {
      type: 'like',
      timestamp: data.timestamp
    })
  }
}

// BROADCAST MILESTONE TO ALL USERS WITH PUSH
async function broadcastMilestoneToAllUsers(
  io: any,
  post: any,
  likesCount: number,
  milestone: typeof LIKE_MILESTONES[0],
  excludeUserId?: string
) {
  if (!io) return

  const { User } = require('../models/User')
  const { Notification } = require('../models/Notification')
  const { UserPushToken } = require('../models/UserPushToken')
  
  const broadcastMessage = `"${post.title.substring(0, 40)}" ${milestone.message}`
  
  console.log(`🎯 MILESTONE: ${milestone.level} - Broadcasting to ALL users`)
  
  // 1. SOCKET.IO to all connected users
  io.emit('post_likes_milestone', {
    postId: post.id,
    postTitle: post.title,
    postPhoto: post.photo_url,
    likesCount: likesCount,
    milestoneLevel: milestone.level,
    message: broadcastMessage,
    timestamp: Date.now()
  })
  
  io.emit('trending_alert', {
    type: 'likes_milestone',
    postId: post.id,
    title: post.title,
    message: `${milestone.level} post: ${post.title.substring(0, 30)}`,
    timestamp: Date.now()
  })
  
  // 2. IN-APP NOTIFICATIONS for all users
  const allUsers = await User.findAll({
    where: excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {},
    attributes: ['id']
  })
  
  if (allUsers.length > 0) {
    const notificationTemplate = {
      type: 'trending_post',
      reference_id: post.id,
      title: `${milestone.level} post alert`,
      message: broadcastMessage,
      read: false,
      push_sent: false,
      data: JSON.stringify({
        postId: post.id,
        postTitle: post.title,
        postPhoto: post.photo_url,
        likesCount: likesCount,
        milestoneLevel: milestone.level,
        action: 'view_post'
      })
    }
    
    const batchSize = 100
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize)
      const notificationBatch = batch.map((user: any) => ({
        user_id: user.id,
        ...notificationTemplate
      }))
      await Notification.bulkCreate(notificationBatch, { ignoreDuplicates: true })
    }
    console.log(`📝 Created ${allUsers.length} in-app notifications for milestone`)
  }
  
  // 3. PUSH NOTIFICATIONS to ALL users with active tokens
  const activeTokens = await UserPushToken.findAll({
    where: { is_active: true },
    include: [{ model: User, attributes: ['id'] }]
  })
  
  const tokensToSend = excludeUserId 
    ? activeTokens.filter((token: any) => token.user_id !== excludeUserId)
    : activeTokens
  
  if (tokensToSend.length > 0) {
    console.log(`📱 Sending push to ${tokensToSend.length} users for ${milestone.level} milestone`)
    
    // Send in batches to avoid overwhelming
    const batchSize = 50
    for (let i = 0; i < tokensToSend.length; i += batchSize) {
      const batch = tokensToSend.slice(i, i + batchSize)
      const pushPromises = batch.map((token: any) => 
        pushService.sendPushNotification(
          token.expo_push_token,
          `${milestone.level} post alert`,
          broadcastMessage,
          {
            postId: post.id,
            screen: 'PostDetail',
            type: 'trending_alert',
            milestoneLevel: milestone.level,
            timestamp: Date.now()
          }
        ).catch((err: Error) => {
          console.error(`Push failed:`, err.message)
          return null
        })
      )
      
      await Promise.allSettled(pushPromises)
    }
    console.log(`✅ Push notifications sent for ${milestone.level} milestone`)
  }
  
  // 4. Update post trending score
  try {
    await Post.increment('trending_score', { 
      by: milestone.threshold, 
      where: { id: post.id } 
    }).catch(() => {})
  } catch (error) {}
  
  return true
}

function getMilestoneForCount(count: number): typeof LIKE_MILESTONES[0] | null {
  for (let i = LIKE_MILESTONES.length - 1; i >= 0; i--) {
    if (count >= LIKE_MILESTONES[i].threshold) {
      return LIKE_MILESTONES[i]
    }
  }
  return null
}

function shouldBroadcastMilestone(oldCount: number, newCount: number): typeof LIKE_MILESTONES[0] | null {
  const oldMilestone = getMilestoneForCount(oldCount)
  const newMilestone = getMilestoneForCount(newCount)
  
  if (newMilestone && (!oldMilestone || oldMilestone.threshold !== newMilestone.threshold)) {
    return newMilestone
  }
  return null
}

async function hasRecentlyLiked(userId: string, postId: string): Promise<boolean> {
  const recentLike = await PostLike.findOne({
    where: {
      user_id: userId,
      post_id: postId,
      created_at: { [Op.gt]: new Date(Date.now() - 1000) }
    }
  })
  return !!recentLike
}

// ============================================
// PUBLIC ROUTES
// ============================================

router.get('/count/:postId', async (req: Request, res: Response) => {
  try {
    const postId: string = getParam(req.params, 'postId')
    const count: number = await PostLike.count({ where: { post_id: postId } })
    return res.json({ postId, likesCount: count })
  } catch (error) {
    console.error('Error getting likes count:', error)
    return res.status(500).json({ error: 'Failed to get likes count' })
  }
})

router.get('/users/:postId', async (req: Request, res: Response) => {
  try {
    const postId: string = getParam(req.params, 'postId')
    const page: number = getNumberQuery(req.query.page, 1)
    const limit: number = getNumberQuery(req.query.limit, 20)

    const { count, rows: likes } = await PostLike.findAndCountAll({
      where: { post_id: postId },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    })

    const users = likes.map(like => like.user)
    return res.json({ users, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } })
  } catch (error) {
    console.error('Error getting users who liked post:', error)
    return res.status(500).json({ error: 'Failed to get users' })
  }
})

// ============================================
// PROTECTED ROUTES
// ============================================

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    const userId: string = req.user.id
    const likes = await PostLike.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']] })
    if (!likes || likes.length === 0) return res.json([])
    const postIds: string[] = likes.map(like => like.post_id)
    const posts = await Post.findAll({
      where: { id: postIds, status: 'posted' },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url', 'location'] }],
      order: [['created_at', 'DESC']]
    })
    const likedPostIds = new Set(postIds)
    const postsWithLikeStatus = posts.map(post => ({ ...post.toJSON(), isLiked: likedPostIds.has(post.id) }))
    return res.json(postsWithLikeStatus)
  } catch (error) {
    console.error('Error getting user likes:', error)
    return res.status(500).json({ error: 'Failed to get user likes: ' + (error as Error).message })
  }
})

router.get('/check/:postId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    const userId: string = req.user.id
    const postId: string = getParam(req.params, 'postId')
    const like = await PostLike.findOne({ where: { user_id: userId, post_id: postId } })
    const likesCount: number = await PostLike.count({ where: { post_id: postId } })
    return res.json({ isLiked: !!like, likesCount, likedAt: like?.created_at || null })
  } catch (error) {
    console.error('Error checking like status:', error)
    return res.status(500).json({ error: 'Failed to check like status' })
  }
})

// MAIN TOGGLE ROUTE - ENHANCED WITH MILESTONE BROADCASTS
router.post('/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    const userId: string = req.user.id
    const { post_id }: { post_id: string } = req.body
    if (!post_id) return res.status(400).json({ error: 'Post ID required' })

    const currentLikesCount = await PostLike.count({ where: { post_id } })
    const recentLike = await hasRecentlyLiked(userId, post_id)
    if (recentLike) return res.status(429).json({ error: 'Please wait before liking again' })

    const existing = await PostLike.findOne({ where: { user_id: userId, post_id } })
    let action: 'liked' | 'unliked'
    let isLiked: boolean

    if (existing) {
      await existing.destroy()
      await Post.decrement('likes_count', { where: { id: post_id } })
      action = 'unliked'
      isLiked = false
    } else {
      await PostLike.create({ user_id: userId, post_id })
      await Post.increment('likes_count', { where: { id: post_id } })
      action = 'liked'
      isLiked = true
    }

    const newLikesCount = await PostLike.count({ where: { post_id } })
    const post = await Post.findByPk(post_id, { include: [{ model: User, attributes: ['id', 'name', 'email'] }] })
    const io = req.app.get('io')
    let milestoneBroadcasted = null

    // CHECK FOR MILESTONE AND BROADCAST TO ALL USERS
    if (action === 'liked' && post) {
      const milestone = shouldBroadcastMilestone(currentLikesCount, newLikesCount)
      if (milestone) {
        console.log(`🎯 Milestone reached: ${milestone.level} on post ${post_id}`)
        milestoneBroadcasted = await broadcastMilestoneToAllUsers(io, post, newLikesCount, milestone, userId)
      }
    }

    // SEND NOTIFICATION TO POST OWNER
    if (action === 'liked' && post && post.user_id !== userId) {
      const liker = await User.findByPk(userId, { attributes: ['id', 'name', 'avatar_url'] })
      if (liker) {
        // Create in-app notification
        const { Notification } = require('../models/Notification')
        await Notification.create({
          user_id: post.user_id,
          type: 'like',
          reference_id: post_id,
          title: 'Someone liked your post',
          message: `${liker.name || 'Someone'} liked "${post.title.substring(0, 60)}"`,
          read: false,
          push_sent: false,
          data: JSON.stringify({ postId: post_id, actorId: userId, actorName: liker.name, action: 'view_post' })
        })
        
        // Send push to post owner
        pushService.createAndSend(
          post.user_id,
          'like',
          post_id,
          'Someone liked your post',
          `${liker.name || 'Someone'} liked "${post.title.substring(0, 50)}"`,
          post.photo_url || undefined,
          { postId: post_id, actorId: userId }
        )
        
        // Socket notification to post owner
        if (io && liker) {
          emitLikeNotification(io, {
            postId: post_id,
            actorId: userId,
            actorName: liker.name || 'Someone',
            postTitle: post.title,
            timestamp: Date.now()
          }, post.user_id)
        }
      }
    }

    // Socket update to everyone
    if (io) {
      emitLikeEvent(io, {
        postId: post_id,
        userId,
        action,
        isLiked,
        likesCount: newLikesCount,
        timestamp: Date.now()
      })
    }

    const responseData: any = { success: true, action, isLiked, likesCount: newLikesCount }
    if (milestoneBroadcasted) {
      responseData.milestone = `Milestone reached! Broadcasted to all users.`
    }
    return res.json(responseData)

  } catch (error) {
    console.error('Error toggling like:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    const userId: string = req.user.id
    const { post_id }: { post_id: string } = req.body
    if (!post_id) return res.status(400).json({ error: 'Post ID required' })

    const existing = await PostLike.findOne({ where: { user_id: userId, post_id } })
    const io = req.app.get('io')

    if (existing) {
      await existing.destroy()
      await Post.decrement('likes_count', { where: { id: post_id } })
      const likesCount = await PostLike.count({ where: { post_id } })
      if (io) emitLikeEvent(io, { postId: post_id, userId, action: 'unliked', isLiked: false, likesCount, timestamp: Date.now() })
      return res.json({ success: true, action: 'unliked', likesCount })
    } else {
      await PostLike.create({ user_id: userId, post_id })
      await Post.increment('likes_count', { where: { id: post_id } })
      const likesCount = await PostLike.count({ where: { post_id } })
      const post = await Post.findByPk(post_id, { include: [{ model: User }] })

      // Check milestone
      const milestone = shouldBroadcastMilestone(likesCount - 1, likesCount)
      if (milestone && post) {
        await broadcastMilestoneToAllUsers(io, post, likesCount, milestone, userId)
      }

      if (post && post.user_id !== userId) {
        const liker = await User.findByPk(userId)
        pushService.createAndSend(post.user_id, 'like', post_id, 'Someone liked your post', `${liker?.name || 'Someone'} liked "${post.title.substring(0, 50)}"`, post.photo_url || undefined, { postId: post_id, actorId: userId })
        if (io && liker) emitLikeNotification(io, { postId: post_id, actorId: userId, actorName: liker.name || 'Someone', postTitle: post.title, timestamp: Date.now() }, post.user_id)
      }

      if (io) emitLikeEvent(io, { postId: post_id, userId, action: 'liked', isLiked: true, likesCount, timestamp: Date.now() })
      return res.json({ success: true, action: 'liked', likesCount })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

router.delete('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    const userId: string = req.user.id
    const { post_id }: { post_id: string } = req.body
    if (!post_id) return res.status(400).json({ error: 'Post ID required' })

    await PostLike.destroy({ where: { user_id: userId, post_id } })
    await Post.decrement('likes_count', { where: { id: post_id } })
    const likesCount = await PostLike.count({ where: { post_id } })

    const io = req.app.get('io')
    if (io) emitLikeEvent(io, { postId: post_id, userId, action: 'unliked', isLiked: false, likesCount, timestamp: Date.now() })

    return res.json({ success: true, action: 'unliked', likesCount })
  } catch (error) {
    console.error('Error deleting like:', error)
    return res.status(500).json({ error: 'Failed to delete like' })
  }
})

router.post('/check-batch', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    const userId: string = req.user.id
    const { postIds }: { postIds: string[] } = req.body
    if (!Array.isArray(postIds) || postIds.length === 0) return res.status(400).json({ error: 'postIds array is required' })

    const likes = await PostLike.findAll({ where: { user_id: userId, post_id: postIds }, attributes: ['post_id', 'created_at'] })
    const likeMap: Record<string, { isLiked: boolean; likedAt: string | null }> = {}
    postIds.forEach((id: string) => { likeMap[id] = { isLiked: false, likedAt: null } })
    likes.forEach((like: PostLike) => { likeMap[like.post_id] = { isLiked: true, likedAt: like.created_at?.toISOString() || null } })

    const { fn, col } = require('sequelize')
    const likeCounts = await PostLike.findAll({ where: { post_id: postIds }, attributes: ['post_id', [fn('COUNT', col('post_id')), 'count']], group: ['post_id'] })
    const countMap: Record<string, number> = {}
    likeCounts.forEach((item: any) => { countMap[item.post_id] = parseInt(item.getDataValue('count')) })
    postIds.forEach((id: string) => { if (!(id in countMap)) countMap[id] = 0 })

    return res.json({ likeStatus: likeMap, likesCounts: countMap })
  } catch (error) {
    console.error('Error batch checking likes:', error)
    return res.status(500).json({ error: 'Failed to check likes' })
  }
})

export default router