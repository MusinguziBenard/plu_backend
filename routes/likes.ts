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


// routes/likes.ts - COMPLETE WITH SOCKET.IO INTEGRATION
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostLike } from '../models/PostLike'
import { Post } from '../models/Post'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'

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
    // Emit to post room for real-time updates
    io.to(`post:${data.postId}`).emit('like_toggled', data)
    
    // Emit general post update
    io.to(`post:${data.postId}`).emit('post_likes_updated', {
      postId: data.postId,
      likesCount: data.likesCount,
      timestamp: data.timestamp
    })
    
    // Emit to user's personal room
    io.to(`user:${data.userId}`).emit('like_action_confirmed', {
      ...data,
      message: `Post ${data.action}`
    })
  }
}

// Helper to emit like notification
const emitLikeNotification = (io: any, data: LikeNotificationData, postOwnerId: string) => {
  if (io) {
    // Emit to post owner's notification room
    io.to(`notifications:${postOwnerId}`).emit('new_notification', {
      type: 'like',
      title: 'Someone liked your post!',
      message: `${data.actorName} liked "${data.postTitle}"`,
      ...data
    })
    
    // Emit to post owner's personal room
    io.to(`user:${postOwnerId}`).emit('post_liked_by_user', data)
  }
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

    // Get total likes count
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

// Toggle like/unlike - PROTECTED
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

    const existing = await PostLike.findOne({
      where: { user_id: userId, post_id }
    })

    let action: 'liked' | 'unliked'
    let isLiked: boolean

    if (existing) {
      // Unlike
      await existing.destroy()
      await Post.decrement('likes_count', { where: { id: post_id } })
      action = 'unliked'
      isLiked = false
    } else {
      // Like
      await PostLike.create({ user_id: userId, post_id })
      await Post.increment('likes_count', { where: { id: post_id } })
      action = 'liked'
      isLiked = true
    }

    // Get updated likes count
    const likesCount: number = await PostLike.count({
      where: { post_id }
    })

    // Get post and liker info for notification
    const post = await Post.findByPk(post_id, {
      include: [{ model: User }]
    })
    
    // Send push notification if liking (not unliking) and not own post
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

      // ✅ SOCKET.IO - Emit like notification to post owner
      const io = req.app.get('io')
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

    // ✅ SOCKET.IO - Emit like toggle event
    const io = req.app.get('io')
    if (io) {
      const likeData: LikeToggledData = {
        postId: post_id,
        userId,
        action,
        isLiked,
        likesCount,
        timestamp: Date.now()
      }
      
      emitLikeEvent(io, likeData)
    }

    return res.json({ 
      success: true, 
      action, 
      isLiked,
      likesCount 
    })
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
      // Unlike
      await existing.destroy()
      await Post.decrement('likes_count', { where: { id: post_id } })
      
      const likesCount: number = await PostLike.count({
        where: { post_id }
      })

      // ✅ SOCKET.IO
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
      // Like
      await PostLike.create({ user_id: userId, post_id })
      await Post.increment('likes_count', { where: { id: post_id } })
      
      const likesCount: number = await PostLike.count({
        where: { post_id }
      })

      // Get post for notification
      const post = await Post.findByPk(post_id, {
        include: [{ model: User }]
      })
      
      // Send push notification if not own post
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

        // ✅ SOCKET.IO - Notify post owner
        const io = req.app.get('io')
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

      // ✅ SOCKET.IO
      const io = req.app.get('io')
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

    // ✅ SOCKET.IO
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
    
    // Initialize all posts as not liked
    postIds.forEach((id: string) => {
      likeMap[id] = { isLiked: false, likedAt: null }
    })

    // Mark liked posts
    likes.forEach((like: PostLike) => {
      likeMap[like.post_id] = {
        isLiked: true,
        likedAt: like.created_at?.toISOString() || null
      }
    })

    // Get likes counts for all posts
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

    // Initialize counts for posts with no likes
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