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


// routes/likes.ts - ENHANCED WITH PUSH FOR ALL MILESTONES
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostLike } from '../models/PostLike'
import { Post } from '../models/Post'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'
import { Op } from 'sequelize'

const router = Router()

// Type definitions for socket events
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

interface MilestoneBroadcastData {
  postId: string;
  postTitle: string;
  postPhoto?: string;
  likesCount: number;
  milestoneLevel: string;
  message: string;
  timestamp: number;
}

// Extended Request interface for authenticated requests
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

// Organic milestone levels without numbers
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

// Helper to get route parameter
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

// Helper to emit like event via socket
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

// Helper to emit like notification to post owner
const emitLikeNotification = (io: any, data: LikeNotificationData, postOwnerId: string) => {
  if (io) {
    io.to(`user:${postOwnerId}`).emit('new_notification', {
      type: 'like',
      id: `like_${data.postId}_${data.actorId}_${Date.now()}`,
      title: 'Someone liked your post',
      message: `${data.actorName} liked "${data.postTitle.substring(0, 50)}${data.postTitle.length > 50 ? '...' : ''}"`,
      read: false,
      data: {
        postId: data.postId,
        actorId: data.actorId,
        actorName: data.actorName,
        actorAvatar: data.actorAvatar,
        postTitle: data.postTitle,
        postPhoto: data.postPhoto,
        action: 'view_post'
      },
      timestamp: data.timestamp
    })
    
    io.to(`user:${postOwnerId}`).emit('post_liked_by_user', {
      ...data,
      message: `${data.actorName} liked your post`
    })
    
    io.to(`user:${postOwnerId}`).emit('notification_received', {
      type: 'like',
      timestamp: data.timestamp
    })
  }
}

// Helper to broadcast milestone to ALL users
async function broadcastLikeMilestone(
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
  
  // 1. SOCKET.IO BROADCAST TO ALL CONNECTED USERS
  const milestoneData: MilestoneBroadcastData = {
    postId: post.id,
    postTitle: post.title,
    postPhoto: post.photo_url || undefined,
    likesCount: likesCount,
    milestoneLevel: milestone.level,
    message: broadcastMessage,
    timestamp: Date.now()
  }
  
  io.emit('post_likes_milestone', milestoneData)
  io.emit('trending_alert', {
    type: 'likes_milestone',
    postId: post.id,
    title: post.title,
    message: `${milestone.level} post: ${post.title.substring(0, 30)}`,
    timestamp: Date.now()
  })
  
  // 2. CREATE IN-APP NOTIFICATIONS FOR ALL USERS (except post owner if specified)
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
  }
  
  // 3. SEND PUSH NOTIFICATIONS FOR ALL MILESTONES (including 3)
  console.log(`Sending push notifications for ${milestone.level} milestone to all users...`)
  
  const activeTokens = await UserPushToken.findAll({
    where: { is_active: true },
    include: [{ model: User, attributes: ['id'] }]
  })
  
  const tokensToSend = excludeUserId 
    ? activeTokens.filter((token: any) => token.user_id !== excludeUserId)
    : activeTokens
  
  if (tokensToSend.length > 0) {
    const pushPromises = tokensToSend.map((token: any) => 
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
    
    Promise.allSettled(pushPromises).then(results => {
      const sent = results.filter(r => r.status === 'fulfilled' && r.value).length
      console.log(`Push notifications sent for ${milestone.level} milestone: ${sent} users`)
    })
  } else {
    console.log(`No active push tokens found for ${milestone.level} milestone`)
  }
  
  // 4. INCREMENT TRENDING SCORE (if column exists)
  try {
    await Post.increment('trending_score', { 
      by: milestone.threshold, 
      where: { id: post.id } 
    }).catch(() => {})
  } catch (error) {
    // Silently fail
  }
  
  console.log(`Milestone reached: ${milestone.level} on "${post.title}" - Broadcasted to all users with push notifications`)
  
  return milestoneData
}

// Helper to create in-app notification for post owner
async function createLikeNotification(
  postOwnerId: string,
  post: any,
  liker: any,
  postId: string
): Promise<any> {
  const { Notification } = require('../models/Notification')
  
  const notification = await Notification.create({
    user_id: postOwnerId,
    type: 'like',
    reference_id: postId,
    title: 'Someone liked your post',
    message: `${liker?.name || 'Someone'} liked "${post.title.substring(0, 60)}${post.title.length > 60 ? '...' : ''}"`,
    read: false,
    push_sent: false,
    data: JSON.stringify({
      postId: postId,
      postTitle: post.title,
      postPhoto: post.photo_url,
      actorId: liker?.id,
      actorName: liker?.name,
      actorAvatar: liker?.avatar_url,
      action: 'view_post',
      timestamp: new Date().toISOString()
    })
  })
  
  return notification
}

// Helper to send push notification for like
async function sendLikePushNotification(
  postOwnerId: string,
  post: any,
  liker: any,
  postId: string
): Promise<any> {
  const { UserPushToken } = require('../models/UserPushToken')
  
  const pushTokens = await UserPushToken.findAll({
    where: { user_id: postOwnerId, is_active: true }
  })
  
  if (pushTokens.length === 0) return null
  
  const pushPromises = pushTokens.map((token: any) => 
    pushService.sendPushNotification(
      token.expo_push_token,
      'New like on your post',
      `${liker?.name || 'Someone'} liked "${post.title.substring(0, 40)}"`,
      {
        postId: postId,
        screen: 'PostDetail',
        type: 'like',
        actorId: liker?.id,
        actorName: liker?.name,
        timestamp: Date.now()
      }
    ).catch((err: Error) => {
      console.error(`Push failed for token ${token.id}:`, err.message)
      return null
    })
  )
  
  const results = await Promise.allSettled(pushPromises)
  return results.filter(r => r.status === 'fulfilled' && r.value)
}

// Helper to check if user already liked (prevent spam)
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

// Helper to check if a like count is a milestone we should broadcast
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

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get likes count for a post - PUBLIC
router.get('/count/:postId', async (req: Request, res: Response) => {
  try {
    const postId: string = getParam(req.params, 'postId')
    const count: number = await PostLike.count({
      where: { post_id: postId }
    })
    return res.json({ postId, likesCount: count })
  } catch (error) {
    console.error('Error getting likes count:', error)
    return res.status(500).json({ error: 'Failed to get likes count' })
  }
})

// Get users who liked a post - PUBLIC
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
    console.error('Error getting users who liked post:', error)
    return res.status(500).json({ error: 'Failed to get users' })
  }
})

// Get trending posts - PUBLIC
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query
    
    const trendingPosts = await Post.findAll({
      where: { status: 'posted' },
      attributes: ['id', 'title', 'photo_url', 'likes_count', 'views_count', 'created_at'],
      order: [['likes_count', 'DESC'], ['views_count', 'DESC']],
      limit: Number(limit),
      include: [{ 
        model: User, 
        attributes: ['id', 'name', 'avatar_url'] 
      }]
    })
    
    res.json({
      trending: trendingPosts,
      message: 'Most popular posts right now'
    })
  } catch (error) {
    console.error('Error getting trending:', error)
    res.status(500).json({ error: 'Failed to get trending posts' })
  }
})

// Get hot posts (likes in last hour) - PUBLIC
router.get('/hot', async (req: Request, res: Response) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const hotPosts = await PostLike.findAll({
      where: {
        created_at: { [Op.gte]: oneHourAgo }
      },
      attributes: [
        'post_id',
        [require('sequelize').fn('COUNT', require('sequelize').col('post_id')), 'like_count']
      ],
      group: ['post_id'],
      order: [[require('sequelize').literal('like_count'), 'DESC']],
      limit: 10
    })
    
    const postIds = hotPosts.map((item: any) => item.post_id)
    
    const posts = await Post.findAll({
      where: { id: postIds, status: 'posted' },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
    })
    
    res.json({
      hot: posts,
      message: 'Posts getting the most likes recently'
    })
  } catch (error) {
    console.error('Error getting hot posts:', error)
    res.status(500).json({ error: 'Failed to get hot posts' })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get user's liked posts - PROTECTED
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id

    const likes = await PostLike.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    })

    if (!likes || likes.length === 0) {
      return res.json([])
    }

    const postIds: string[] = likes.map(like => like.post_id)

    const posts = await Post.findAll({
      where: { 
        id: postIds,
        status: 'posted'
      },
      include: [{ 
        model: User, 
        attributes: ['id', 'name', 'avatar_url', 'location'] 
      }],
      order: [['created_at', 'DESC']]
    })

    const likedPostIds = new Set(postIds)
    
    const postsWithLikeStatus = posts.map(post => ({
      ...post.toJSON(),
      isLiked: likedPostIds.has(post.id)
    }))

    return res.json(postsWithLikeStatus)
  } catch (error) {
    console.error('Error getting user likes:', error)
    return res.status(500).json({ error: 'Failed to get user likes: ' + (error as Error).message })
  }
})

// Check if user liked a specific post - PROTECTED
router.get('/check/:postId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const postId: string = getParam(req.params, 'postId')

    const like = await PostLike.findOne({
      where: { user_id: userId, post_id: postId }
    })

    const likesCount: number = await PostLike.count({
      where: { post_id: postId }
    })

    return res.json({ 
      isLiked: !!like, 
      likesCount,
      likedAt: like?.created_at || null 
    })
  } catch (error) {
    console.error('Error checking like status:', error)
    return res.status(500).json({ error: 'Failed to check like status' })
  }
})

// Toggle like/unlike - ENHANCED WITH MILESTONE BROADCASTS - PROTECTED
router.post('/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { post_id }: { post_id: string } = req.body

    if (!post_id) {
      return res.status(400).json({ error: 'Post ID required' })
    }

    // Get current likes count BEFORE toggling
    const currentLikesCount = await PostLike.count({
      where: { post_id }
    })

    // Check for spam
    const recentLike = await hasRecentlyLiked(userId, post_id)
    if (recentLike) {
      return res.status(429).json({ error: 'Please wait before liking again' })
    }

    const existing = await PostLike.findOne({
      where: { user_id: userId, post_id }
    })

    let action: 'liked' | 'unliked'
    let isLiked: boolean
    let milestoneBroadcasted = null

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

    // Get updated likes count
    const newLikesCount = await PostLike.count({
      where: { post_id }
    })

    // Get post for notifications
    const post = await Post.findByPk(post_id, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    })
    
    const io = req.app.get('io')
    
    // CHECK FOR MILESTONE AND BROADCAST TO ALL USERS
    if (action === 'liked' && post) {
      const milestone = shouldBroadcastMilestone(currentLikesCount, newLikesCount)
      
      if (milestone) {
        console.log(`Milestone reached: ${milestone.level} on post ${post_id}`)
        
        milestoneBroadcasted = await broadcastLikeMilestone(
          io,
          post,
          newLikesCount,
          milestone,
          userId
        )
      }
    }
    
    // SEND NOTIFICATIONS TO POST OWNER (only when liking, not own post)
    if (action === 'liked' && post && post.user_id !== userId) {
      const liker = await User.findByPk(userId, {
        attributes: ['id', 'name', 'avatar_url']
      })
      
      if (liker) {
        // 1. In-app notification
        const inAppNotification = await createLikeNotification(
          post.user_id,
          post,
          liker,
          post_id
        )
        console.log(`In-app notification created: ${inAppNotification.id}`)
        
        // 2. Push notification
        const pushResult = await sendLikePushNotification(
          post.user_id,
          post,
          liker,
          post_id
        )
        console.log(`Push notification: ${pushResult ? 'sent' : 'no tokens'}`)
        
        // 3. Socket.IO notification to post owner
        if (io && liker) {
          const notificationData: LikeNotificationData = {
            postId: post_id,
            actorId: userId,
            actorName: liker.name || 'Someone',
            actorAvatar: liker.avatar_url,
            postTitle: post.title,
            postPhoto: post.photo_url || undefined,
            timestamp: Date.now()
          }
          
          emitLikeNotification(io, notificationData, post.user_id)
          
          // Update unread count
          const { Notification } = require('../models/Notification')
          const unreadCount = await Notification.count({
            where: { user_id: post.user_id, read: false }
          })
          io.to(`user:${post.user_id}`).emit('unread_count_updated', {
            userId: post.user_id,
            count: unreadCount,
            timestamp: Date.now()
          })
        }
      }
    }

    // SEND SOCKET UPDATES TO EVERYONE
    if (io) {
      const likeData: LikeToggledData = {
        postId: post_id,
        userId,
        action,
        isLiked,
        likesCount: newLikesCount,
        timestamp: Date.now()
      }
      
      emitLikeEvent(io, likeData)
    }

    // Return response
    const responseData: any = { 
      success: true, 
      action, 
      isLiked,
      likesCount: newLikesCount
    }
    
    if (action === 'liked') {
      if (milestoneBroadcasted) {
        responseData.milestone = milestoneBroadcasted.milestoneLevel
        responseData.message = `${milestoneBroadcasted.milestoneLevel} milestone reached! Broadcasted to all users with push notifications.`
      } else if (post && post.user_id !== userId) {
        responseData.notificationSent = true
        responseData.message = `Post liked! Owner has been notified.`
      } else {
        responseData.message = `Post liked!`
      }
    }
    
    return res.json(responseData)
    
  } catch (error) {
    console.error('Error toggling like:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Legacy route - Like a post - PROTECTED
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { post_id }: { post_id: string } = req.body

    if (!post_id) {
      return res.status(400).json({ error: 'Post ID required' })
    }

    const existing = await PostLike.findOne({
      where: { user_id: userId, post_id }
    })

    if (existing) {
      await existing.destroy()
      await Post.decrement('likes_count', { where: { id: post_id } })
      
      const likesCount: number = await PostLike.count({
        where: { post_id }
      })

      const io = req.app.get('io')
      if (io) {
        const likeData: LikeToggledData = {
          postId: post_id,
          userId,
          action: 'unliked',
          isLiked: false,
          likesCount,
          timestamp: Date.now()
        }
        emitLikeEvent(io, likeData)
      }

      return res.json({ success: true, action: 'unliked', likesCount })
    } else {
      await PostLike.create({ user_id: userId, post_id })
      await Post.increment('likes_count', { where: { id: post_id } })
      
      const likesCount: number = await PostLike.count({
        where: { post_id }
      })

      const post = await Post.findByPk(post_id, {
        include: [{ model: User }]
      })
      
      const io = req.app.get('io')
      
      if (post && post.user_id !== userId) {
        const liker = await User.findByPk(userId, {
          attributes: ['id', 'name', 'avatar_url']
        })
        
        if (liker) {
          const inAppNotification = await createLikeNotification(
            post.user_id,
            post,
            liker,
            post_id
          )
          console.log(`In-app notification created: ${inAppNotification.id}`)
          
          const pushResult = await sendLikePushNotification(
            post.user_id,
            post,
            liker,
            post_id
          )
          console.log(`Push notification: ${pushResult ? 'sent' : 'no tokens'}`)
          
          if (io && liker) {
            const notificationData: LikeNotificationData = {
              postId: post_id,
              actorId: userId,
              actorName: liker.name || 'Someone',
              actorAvatar: liker.avatar_url,
              postTitle: post.title,
              postPhoto: post.photo_url || undefined,
              timestamp: Date.now()
            }
            
            emitLikeNotification(io, notificationData, post.user_id)
            
            const { Notification } = require('../models/Notification')
            const unreadCount = await Notification.count({
              where: { user_id: post.user_id, read: false }
            })
            io.to(`user:${post.user_id}`).emit('unread_count_updated', {
              userId: post.user_id,
              count: unreadCount,
              timestamp: Date.now()
            })
          }
        }
      }

      if (io) {
        const likeData: LikeToggledData = {
          postId: post_id,
          userId,
          action: 'liked',
          isLiked: true,
          likesCount,
          timestamp: Date.now()
        }
        emitLikeEvent(io, likeData)
      }

      return res.json({ 
        success: true, 
        action: 'liked', 
        likesCount,
        notificationSent: !!(post && post.user_id !== userId)
      })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Delete unlike - PROTECTED
router.delete('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { post_id }: { post_id: string } = req.body

    if (!post_id) {
      return res.status(400).json({ error: 'Post ID required' })
    }

    await PostLike.destroy({ where: { user_id: userId, post_id } })
    await Post.decrement('likes_count', { where: { id: post_id } })
    
    const likesCount: number = await PostLike.count({
      where: { post_id }
    })

    const io = req.app.get('io')
    if (io) {
      const likeData: LikeToggledData = {
        postId: post_id,
        userId,
        action: 'unliked',
        isLiked: false,
        likesCount,
        timestamp: Date.now()
      }
      emitLikeEvent(io, likeData)
    }

    return res.json({ success: true, action: 'unliked', likesCount })
  } catch (error) {
    console.error('Error deleting like:', error)
    return res.status(500).json({ error: 'Failed to delete like' })
  }
})

// Batch check likes for multiple posts - PROTECTED
router.post('/check-batch', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { postIds }: { postIds: string[] } = req.body

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'postIds array is required' })
    }

    const likes = await PostLike.findAll({
      where: {
        user_id: userId,
        post_id: postIds
      },
      attributes: ['post_id', 'created_at']
    })

    const likeMap: Record<string, { isLiked: boolean; likedAt: string | null }> = {}
    
    postIds.forEach((id: string) => {
      likeMap[id] = { isLiked: false, likedAt: null }
    })

    likes.forEach((like: PostLike) => {
      likeMap[like.post_id] = {
        isLiked: true,
        likedAt: like.created_at?.toISOString() || null
      }
    })

    const { fn, col } = require('sequelize')
    const likeCounts = await PostLike.findAll({
      where: { post_id: postIds },
      attributes: ['post_id', [fn('COUNT', col('post_id')), 'count']],
      group: ['post_id']
    })

    const countMap: Record<string, number> = {}
    likeCounts.forEach((item: any) => {
      countMap[item.post_id] = parseInt(item.getDataValue('count'))
    })

    postIds.forEach((id: string) => {
      if (!(id in countMap)) {
        countMap[id] = 0
      }
    })

    return res.json({
      likeStatus: likeMap,
      likesCounts: countMap
    })
  } catch (error) {
    console.error('Error batch checking likes:', error)
    return res.status(500).json({ error: 'Failed to check likes' })
  }
})

// Get milestone events for admin - PROTECTED
router.get('/milestones', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.user_metadata?.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin only' })
    }
    
    const { Notification } = require('../models/Notification')
    
    const milestoneNotifications = await Notification.findAll({
      where: { type: 'trending_post' },
      limit: 50,
      order: [['created_at', 'DESC']]
    })
    
    res.json({
      milestones: milestoneNotifications,
      count: milestoneNotifications.length
    })
  } catch (error) {
    console.error('Error getting milestones:', error)
    res.status(500).json({ error: 'Failed to get milestones' })
  }
})

// Get like stats for analytics - ADMIN ONLY
router.get('/stats/daily', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.user_metadata?.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin only' })
    }

    const { fn, col } = require('sequelize')
    
    const dailyLikes = await PostLike.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'DESC']],
      limit: 30
    })

    const totalLikes = await PostLike.count()
    const uniqueLikers = await PostLike.count({ distinct: true, col: 'user_id' })

    return res.json({
      daily: dailyLikes,
      total: totalLikes,
      uniqueLikers,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting like stats:', error)
    return res.status(500).json({ error: 'Failed to get stats' })
  }
})

export default router