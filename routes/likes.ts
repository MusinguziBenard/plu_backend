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

// routes/likes.ts - WORKING CODE WITH MILESTONE BROADCASTS ADDED (FIXED)
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
  postTitle: string;
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

// ============ MILESTONE CONFIGURATION ============
const MILESTONES = [3, 5, 10, 25, 50, 100, 250, 500, 1000];
const MILESTONE_NAMES: Record<number, string> = {
  3: 'getting attention',
  5: 'gaining traction',
  10: 'popular',
  25: 'very popular',
  50: 'trending',
  100: 'hot',
  250: 'viral',
  500: 'extremely viral',
  1000: 'legendary'
};

// ============ Broadcast milestone to all users ============
async function broadcastMilestoneToAllUsers(
  io: any,
  post: any, 
  likesCount: number, 
  milestone: number, 
  excludeUserId?: string
) {
  try {
    const { User: UserModel } = require('../models/User');
    const { Notification } = require('../models/Notification');
    const { UserPushToken } = require('../models/UserPushToken');
    
    const milestoneName = MILESTONE_NAMES[milestone];
    const broadcastMessage = `"${post.title.substring(0, 40)}" is ${milestoneName}`;
    
    console.log(`🎯 MILESTONE: ${milestone} likes (${milestoneName}) on post ${post.id}`);
    
    if (io) {
      // Socket broadcast to all connected users
      io.emit('post_likes_milestone', {
        postId: post.id,
        postTitle: post.title,
        postPhoto: post.photo_url,
        likesCount: likesCount,
        milestoneLevel: milestoneName,
        message: broadcastMessage,
        timestamp: Date.now()
      });
      
      io.emit('trending_alert', {
        type: 'likes_milestone',
        postId: post.id,
        title: post.title,
        message: `${milestoneName} post: ${post.title.substring(0, 30)}`,
        timestamp: Date.now()
      });
    }
    
    // Create in-app notifications for all users
    const allUsers = await UserModel.findAll({
      where: excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {},
      attributes: ['id']
    });
    
    if (allUsers.length > 0) {
      const notificationTemplate = {
        type: 'trending_post',
        reference_id: post.id,
        title: `${milestoneName} post alert`,
        message: broadcastMessage,
        read: false,
        push_sent: false,
        data: JSON.stringify({
          postId: post.id,
          postTitle: post.title,
          postPhoto: post.photo_url,
          likesCount: likesCount,
          milestoneLevel: milestoneName,
          action: 'view_post'
        })
      };
      
      const batchSize = 100;
      for (let i = 0; i < allUsers.length; i += batchSize) {
        const batch = allUsers.slice(i, i + batchSize);
        const notificationBatch = batch.map((user: any) => ({
          user_id: user.id,
          ...notificationTemplate
        }));
        await Notification.bulkCreate(notificationBatch, { ignoreDuplicates: true });
      }
      console.log(`📝 Created ${allUsers.length} in-app notifications for milestone`);
    }
    
    // Send push notifications to all users
    const activeTokens = await UserPushToken.findAll({
      where: { is_active: true },
      include: [{ model: UserModel, attributes: ['id'] }]
    });
    
    const tokensToSend = excludeUserId 
      ? activeTokens.filter((token: any) => token.user_id !== excludeUserId)
      : activeTokens;
    
    if (tokensToSend.length > 0) {
      console.log(`📱 Sending push to ${tokensToSend.length} users for ${milestoneName} milestone`);
      
      for (const token of tokensToSend) {
        pushService.sendPushNotification(
          token.expo_push_token,
          `${milestoneName} post alert`,
          broadcastMessage,
          {
            postId: post.id,
            screen: 'PostDetail',
            type: 'trending_alert',
            milestoneLevel: milestoneName,
            timestamp: Date.now()
          }
        ).catch(err => console.error('Push failed:', err.message));
      }
    }
    
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}
// ============ END NEW CODE ============

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

// Helper to emit like notification
const emitLikeNotification = (io: any, data: LikeNotificationData, postOwnerId: string) => {
  if (io) {
    io.to(`notifications:${postOwnerId}`).emit('new_notification', {
      type: 'like',
      title: 'Someone liked your post!',
      message: `${data.actorName} liked "${data.postTitle}"`,
      ...data
    })
    
    io.to(`user:${postOwnerId}`).emit('post_liked_by_user', data)
  }
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

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

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id

    console.log('Fetching liked posts for user:', userId)

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

// ============================================
// UPDATED Toggle like/unlike - WITH MILESTONE BROADCASTS
// ============================================
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

    // Get like count BEFORE toggling
    const oldLikesCount = await PostLike.count({ where: { post_id } })

    const existing = await PostLike.findOne({
      where: { user_id: userId, post_id }
    })

    let action: 'liked' | 'unliked'
    let isLiked: boolean

    if (existing) {
      // Unlike (original code)
      await existing.destroy()
      await Post.decrement('likes_count', { where: { id: post_id } })
      action = 'unliked'
      isLiked = false
    } else {
      // Like (original code)
      await PostLike.create({ user_id: userId, post_id })
      await Post.increment('likes_count', { where: { id: post_id } })
      action = 'liked'
      isLiked = true
    }

    // Get updated likes count
    const newLikesCount = await PostLike.count({ where: { post_id } })

    // Get post info (needed for milestone and notifications)
    const post = await Post.findByPk(post_id, {
      include: [{ model: User }]
    })
    
    // Get io instance
    const io = req.app.get('io')
    
    // ============ CHECK FOR MILESTONE ============
    if (action === 'liked' && post) {
      for (const milestone of MILESTONES) {
        if (oldLikesCount < milestone && newLikesCount >= milestone) {
          await broadcastMilestoneToAllUsers(io, post, newLikesCount, milestone, userId);
          break;
        }
      }
    }
    // ============ END NEW CODE ============
    
    // Send push notification if liking (not unliking) and not own post (original code)
    if (action === 'liked' && post && post.user_id !== userId) {
      const liker = await User.findByPk(userId)
      
      pushService.createAndSend(
        post.user_id,
        'like',
        post_id,
        'Someone liked your post!',
        `${liker?.name || 'Someone'} liked "${post.title.substring(0, 50)}"`,
        post.photo_url || undefined,
        { postId: post_id, actorId: userId }
      )

      if (io && liker) {
        const notificationData: LikeNotificationData = {
          postId: post_id,
          actorId: userId,
          actorName: liker.name || 'Someone',
          postTitle: post.title.substring(0, 50),
          timestamp: Date.now()
        }
        
        emitLikeNotification(io, notificationData, post.user_id)
      }
    }

    // Socket.IO - Emit like toggle event (original code)
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

    return res.json({ 
      success: true, 
      action, 
      isLiked,
      likesCount: newLikesCount 
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Legacy route - Like a post (original code with milestone added)
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
      // Get like count BEFORE liking for milestone check
      const oldLikesCount = await PostLike.count({ where: { post_id } })
      
      await PostLike.create({ user_id: userId, post_id })
      await Post.increment('likes_count', { where: { id: post_id } })
      
      const likesCount: number = await PostLike.count({
        where: { post_id }
      })

      const post = await Post.findByPk(post_id, {
        include: [{ model: User }]
      })
      
      const io = req.app.get('io')
      
      // ============ CHECK FOR MILESTONE ============
      if (post) {
        for (const milestone of MILESTONES) {
          if (oldLikesCount < milestone && likesCount >= milestone) {
            await broadcastMilestoneToAllUsers(io, post, likesCount, milestone, userId);
            break;
          }
        }
      }
      // ============ END NEW CODE ============
      
      if (post && post.user_id !== userId) {
        const liker = await User.findByPk(userId)
        
        pushService.createAndSend(
          post.user_id,
          'like',
          post_id,
          'Someone liked your post!',
          `${liker?.name || 'Someone'} liked "${post.title.substring(0, 50)}"`,
          post.photo_url || undefined,
          { postId: post_id, actorId: userId }
        )

        if (io && liker) {
          const notificationData: LikeNotificationData = {
            postId: post_id,
            actorId: userId,
            actorName: liker.name || 'Someone',
            postTitle: post.title.substring(0, 50),
            timestamp: Date.now()
          }
          
          emitLikeNotification(io, notificationData, post.user_id)
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

      return res.json({ success: true, action: 'liked', likesCount })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Delete unlike - PROTECTED (original code preserved)
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

// Batch check likes for multiple posts - PROTECTED (original code preserved)
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

export default router 