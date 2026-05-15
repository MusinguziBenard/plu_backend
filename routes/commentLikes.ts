// // routes/commentLikes.ts - DEFINITIVE WORKING VERSION
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { CommentLike } from '../models/CommentLike'
// import { Comment } from '../models/Comment'
// import { Post } from '../models/Post'
// import { User } from '../models/User'
// import pushService from '../services/expoPushNotification'

// const router = Router()

// // ============================================
// // PUBLIC ROUTES - MUST BE FIRST, NO AUTH MIDDLEWARE
// // ============================================

// // Get likes count for a comment - PUBLIC
// router.get('/count/:commentId', async (req, res) => {
//   console.log('🔓 PUBLIC route hit: GET /count/' + req.params.commentId)
//   try {
//     const { commentId } = req.params
//     const count = await CommentLike.count({
//       where: { comment_id: commentId }
//     })
//     res.json({ commentId, likesCount: count })
//   } catch (error) {
//     console.error('Error:', error)
//     res.status(500).json({ error: 'Failed to get likes count' })
//   }
// })

// // Get users who liked a comment - PUBLIC
// router.get('/users/:commentId', async (req, res) => {
//   console.log('🔓 PUBLIC route hit: GET /users/' + req.params.commentId)
//   try {
//     const { commentId } = req.params
//     const likes = await CommentLike.findAll({
//       where: { comment_id: commentId },
//       include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
//     })
//     const users = likes.map(like => like.user)
//     res.json(users)
//   } catch (error) {
//     console.error('Error:', error)
//     res.status(500).json({ error: 'Failed to get users' })
//   }
// })

// // ============================================
// // PROTECTED ROUTES - ADD AUTH MIDDLEWARE TO EACH ROUTE
// // ============================================

// // Check if user liked a comment - PROTECTED
// router.get('/check/:commentId', requireAuth, async (req, res) => {
//   console.log('🔒 PROTECTED route hit: GET /check/' + req.params.commentId)
//   try {
//     const userId = req.user.id
//     const { commentId } = req.params
//     const like = await CommentLike.findOne({
//       where: { user_id: userId, comment_id: commentId }
//     })
//     res.json({ isLiked: !!like })
//   } catch (error) {
//     console.error('Error:', error)
//     res.status(500).json({ error: 'Failed to check like status' })
//   }
// })

// // Toggle like/unlike - PROTECTED
// router.post('/toggle', requireAuth, async (req, res) => {
//   console.log('🔒 PROTECTED route hit: POST /toggle')
//   try {
//     const userId = req.user.id
//     const { comment_id } = req.body

//     if (!comment_id) {
//       return res.status(400).json({ error: 'Comment ID required' })
//     }

//     const existing = await CommentLike.findOne({
//       where: { user_id: userId, comment_id }
//     })

//     if (existing) {
//       await existing.destroy()
//       await Comment.decrement('likes_count', { where: { id: comment_id } })
//       res.json({ success: true, action: 'unliked', isLiked: false })
//     } else {
//       await CommentLike.create({ user_id: userId, comment_id })
//       await Comment.increment('likes_count', { where: { id: comment_id } })
      
//       const comment = await Comment.findByPk(comment_id, {
//         include: [{ model: User }, { model: Post }]
//       })
      
//       if (comment && comment.user_id !== userId) {
//         const liker = await User.findByPk(userId)
//         pushService.createAndSend(
//           comment.user_id,
//           'comment_like',
//           comment_id,
//           'Someone liked your comment',
//           `${liker?.name || 'Someone'} liked your comment`,
//           comment.post?.photo_url || undefined,
//           { commentId: comment_id, postId: comment.post_id, actorId: userId }
//         )
//       }
      
//       res.json({ success: true, action: 'liked', isLiked: true })
//     }
//   } catch (error) {
//     console.error('Error:', error)
//     res.status(500).json({ error: 'Failed to toggle like' })
//   }
// })

// // Legacy route - PROTECTED
// router.post('/', requireAuth, async (req, res) => {
//   console.log('🔒 PROTECTED route hit: POST /')
//   try {
//     const userId = req.user.id
//     const { comment_id } = req.body
//     const existing = await CommentLike.findOne({
//       where: { user_id: userId, comment_id }
//     })
//     if (existing) {
//       await existing.destroy()
//       await Comment.decrement('likes_count', { where: { id: comment_id } })
//       res.json({ success: true, action: 'unliked' })
//     } else {
//       await CommentLike.create({ user_id: userId, comment_id })
//       await Comment.increment('likes_count', { where: { id: comment_id } })
//       const comment = await Comment.findByPk(comment_id, {
//         include: [{ model: User }, { model: Post }]
//       })
//       if (comment && comment.user_id !== userId) {
//         const liker = await User.findByPk(userId)
//         pushService.createAndSend(
//           comment.user_id,
//           'comment_like',
//           comment_id,
//           'Someone liked your comment',
//           `${liker?.name} liked your comment`,
//           comment.post?.photo_url || undefined,
//           { commentId: comment_id }
//         )
//       }
//       res.json({ success: true, action: 'liked' })
//     }
//   } catch (error) {
//     console.error('Error:', error)
//     res.status(500).json({ error: 'Failed to toggle like' })
//   }
// })

// // Delete unlike - PROTECTED
// router.delete('/', requireAuth, async (req, res) => {
//   console.log('🔒 PROTECTED route hit: DELETE /')
//   try {
//     const userId = req.user.id
//     const { comment_id } = req.body
//     await CommentLike.destroy({ where: { user_id: userId, comment_id } })
//     await Comment.decrement('likes_count', { where: { id: comment_id } })
//     res.json({ success: true, action: 'unliked' })
//   } catch (error) {
//     console.error('Error:', error)
//     res.status(500).json({ error: 'Failed to delete like' })
//   }
// })

// export default router


// routes/commentLikes.ts - COMPLETE WITH SOCKET.IO INTEGRATION (TYPE-SAFE)
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { CommentLike } from '../models/CommentLike'
import { Comment } from '../models/Comment'
import { Post } from '../models/Post'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'
import { fn, col } from 'sequelize'

const router = Router()

// Type definitions for socket events
interface CommentLikeToggledData {
  commentId: string;
  postId: string;
  userId: string;
  action: 'liked' | 'unliked';
  isLiked: boolean;
  likesCount: number;
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

// ============================================
// PUBLIC ROUTES
// ============================================

// Get likes count for a comment - PUBLIC
router.get('/count/:commentId', async (req: Request, res: Response) => {
  console.log('🔓 PUBLIC route hit: GET /count/' + req.params.commentId)
  try {
    const commentId: string = getParam(req.params, 'commentId')
    const count: number = await CommentLike.count({
      where: { comment_id: commentId }
    })
    return res.json({ commentId, likesCount: count })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Failed to get likes count' })
  }
})

// Get users who liked a comment - PUBLIC
router.get('/users/:commentId', async (req: Request, res: Response) => {
  console.log('🔓 PUBLIC route hit: GET /users/' + req.params.commentId)
  try {
    const commentId: string = getParam(req.params, 'commentId')
    const page: number = Number(req.query.page) || 1
    const limit: number = Number(req.query.limit) || 20

    const { count, rows: likes } = await CommentLike.findAndCountAll({
      where: { comment_id: commentId },
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
    console.error('Error:', error)
    return res.status(500).json({ error: 'Failed to get users' })
  }
})

// ============================================
// PROTECTED ROUTES
// ============================================

// Check if user liked a comment - PROTECTED
router.get('/check/:commentId', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('🔒 PROTECTED route hit: GET /check/' + req.params.commentId)
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const commentId: string = getParam(req.params, 'commentId')
    
    const like = await CommentLike.findOne({
      where: { user_id: userId, comment_id: commentId }
    })

    const likesCount: number = await CommentLike.count({
      where: { comment_id: commentId }
    })

    return res.json({ 
      isLiked: !!like, 
      likesCount,
      likedAt: like?.createdAt || null // ✅ Fixed: using createdAt (camelCase)
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Failed to check like status' })
  }
})

// Batch check likes for multiple comments
router.post('/check-batch', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { commentIds }: { commentIds: string[] } = req.body

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return res.status(400).json({ error: 'commentIds array is required' })
    }

    const likes = await CommentLike.findAll({
      where: {
        user_id: userId,
        comment_id: commentIds
      },
      attributes: ['comment_id', 'createdAt'] // ✅ Fixed: using createdAt
    })

    const likeMap: Record<string, { isLiked: boolean; likedAt: string | null }> = {}
    
    commentIds.forEach((id: string) => {
      likeMap[id] = { isLiked: false, likedAt: null }
    })

    likes.forEach((like: CommentLike) => {
      likeMap[like.comment_id] = {
        isLiked: true,
        likedAt: like.createdAt?.toISOString() || null // ✅ Fixed: using createdAt
      }
    })

    // Get likes counts
    const likeCounts = await CommentLike.findAll({
      where: { comment_id: commentIds },
      attributes: ['comment_id', [fn('COUNT', col('comment_id')), 'count']],
      group: ['comment_id']
    })

    const countMap: Record<string, number> = {}
    commentIds.forEach((id: string) => { countMap[id] = 0 })
    likeCounts.forEach((item: any) => {
      countMap[item.comment_id] = parseInt(item.getDataValue('count'))
    })

    return res.json({
      likeStatus: likeMap,
      likesCounts: countMap
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Failed to check likes' })
  }
})

// Toggle like/unlike - PROTECTED
router.post('/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('🔒 PROTECTED route hit: POST /toggle')
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { comment_id }: { comment_id: string } = req.body

    if (!comment_id) {
      return res.status(400).json({ error: 'Comment ID required' })
    }

    const existing = await CommentLike.findOne({
      where: { user_id: userId, comment_id }
    })

    let action: 'liked' | 'unliked'
    let isLiked: boolean

    if (existing) {
      await existing.destroy()
      await Comment.decrement('likes_count', { where: { id: comment_id } })
      action = 'unliked'
      isLiked = false
    } else {
      await CommentLike.create({ user_id: userId, comment_id })
      await Comment.increment('likes_count', { where: { id: comment_id } })
      action = 'liked'
      isLiked = true
      
      const comment = await Comment.findByPk(comment_id, {
        include: [
          { model: User, attributes: ['id', 'name'] },
          { model: Post, attributes: ['id', 'photo_url'] }
        ]
      })
      
      if (comment && comment.user_id !== userId) {
        const liker = await User.findByPk(userId, {
          attributes: ['id', 'name']
        })

        pushService.createAndSend(
          comment.user_id,
          'comment_like',
          comment_id,
          'Someone liked your comment',
          `${liker?.name || 'Someone'} liked your comment`,
          comment.post?.photo_url || undefined,
          { commentId: comment_id, postId: comment.post_id, actorId: userId }
        )

        const io = req.app.get('io')
        if (io && liker) {
          io.to(`notifications:${comment.user_id}`).emit('new_notification', {
            type: 'comment_like',
            title: 'Someone liked your comment',
            message: `${liker.name || 'Someone'} liked your comment`,
            commentId: comment_id,
            postId: comment.post_id || '',
            actorId: userId,
            actorName: liker.name || 'Someone',
            timestamp: Date.now()
          })
        }
      }
    }

    const updatedComment = await Comment.findByPk(comment_id, {
      attributes: ['id', 'likes_count', 'post_id']
    })
    const likesCount: number = updatedComment?.likes_count || 0
    const postId: string = updatedComment?.post_id || ''

    const io = req.app.get('io')
    if (io) {
      const likeData: CommentLikeToggledData = {
        commentId: comment_id,
        postId,
        userId,
        action,
        isLiked,
        likesCount,
        timestamp: Date.now()
      }

      if (postId) {
        io.to(`post:${postId}`).emit('comment_like_toggled', likeData)
      }

      io.to(`user:${userId}`).emit('comment_like_action_confirmed', {
        ...likeData,
        message: `Comment ${action}`
      })
    }

    return res.json({ 
      success: true, 
      action, 
      isLiked,
      likesCount 
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Legacy route - Like comment - PROTECTED
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('🔒 PROTECTED route hit: POST /')
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { comment_id }: { comment_id: string } = req.body

    if (!comment_id) {
      return res.status(400).json({ error: 'Comment ID required' })
    }

    const existing = await CommentLike.findOne({
      where: { user_id: userId, comment_id }
    })

    if (existing) {
      await existing.destroy()
      await Comment.decrement('likes_count', { where: { id: comment_id } })
      
      const likesCount: number = await CommentLike.count({ where: { comment_id } })
      const comment = await Comment.findByPk(comment_id, { attributes: ['post_id'] })

      const io = req.app.get('io')
      if (io && comment) {
        const likeData: CommentLikeToggledData = {
          commentId: comment_id,
          postId: comment.post_id || '',
          userId,
          action: 'unliked',
          isLiked: false,
          likesCount,
          timestamp: Date.now()
        }
        io.to(`post:${comment.post_id}`).emit('comment_like_toggled', likeData)
      }

      return res.json({ success: true, action: 'unliked', likesCount })
    } else {
      await CommentLike.create({ user_id: userId, comment_id })
      await Comment.increment('likes_count', { where: { id: comment_id } })
      
      const likesCount: number = await CommentLike.count({ where: { comment_id } })
      
      const comment = await Comment.findByPk(comment_id, {
        include: [
          { model: User, attributes: ['id', 'name'] },
          { model: Post, attributes: ['id', 'photo_url'] }
        ]
      })
      
      if (comment && comment.user_id !== userId) {
        const liker = await User.findByPk(userId, {
          attributes: ['id', 'name']
        })

        pushService.createAndSend(
          comment.user_id,
          'comment_like',
          comment_id,
          'Someone liked your comment',
          `${liker?.name || 'Someone'} liked your comment`,
          comment.post?.photo_url || undefined,
          { commentId: comment_id, postId: comment.post_id, actorId: userId }
        )

        const io = req.app.get('io')
        if (io && liker) {
          io.to(`notifications:${comment.user_id}`).emit('new_notification', {
            type: 'comment_like',
            title: 'Comment Liked',
            message: `${liker.name || 'Someone'} liked your comment`,
            timestamp: Date.now()
          })
        }
      }

      const io = req.app.get('io')
      if (io && comment) {
        const likeData: CommentLikeToggledData = {
          commentId: comment_id,
          postId: comment.post_id || '',
          userId,
          action: 'liked',
          isLiked: true,
          likesCount,
          timestamp: Date.now()
        }
        io.to(`post:${comment.post_id}`).emit('comment_like_toggled', likeData)
      }

      return res.json({ success: true, action: 'liked', likesCount })
    }
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Delete unlike - PROTECTED
router.delete('/', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('🔒 PROTECTED route hit: DELETE /')
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { comment_id }: { comment_id: string } = req.body

    if (!comment_id) {
      return res.status(400).json({ error: 'Comment ID required' })
    }

    await CommentLike.destroy({ where: { user_id: userId, comment_id } })
    await Comment.decrement('likes_count', { where: { id: comment_id } })

    const likesCount: number = await CommentLike.count({ where: { comment_id } })
    const comment = await Comment.findByPk(comment_id, { attributes: ['post_id'] })

    const io = req.app.get('io')
    if (io && comment) {
      const likeData: CommentLikeToggledData = {
        commentId: comment_id,
        postId: comment.post_id || '',
        userId,
        action: 'unliked',
        isLiked: false,
        likesCount,
        timestamp: Date.now()
      }
      io.to(`post:${comment.post_id}`).emit('comment_like_toggled', likeData)
    }

    return res.json({ success: true, action: 'unliked', likesCount })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Failed to delete like' })
  }
})

export default router