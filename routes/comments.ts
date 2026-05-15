// // routes/comments.ts - FULLY FIXED (All TypeScript errors resolved)
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { Comment } from '../models/Comment'
// import { CommentLike } from '../models/CommentLike'
// import { Post } from '../models/Post'
// import { User } from '../models/User'
// import pushService from '../services/expoPushNotification'

// const router = Router()

// // Helper function to safely get string from params/query
// const getString = (value: any): string => {
//   if (!value) return ''
//   return Array.isArray(value) ? value[0] : String(value)
// }

// // Helper function to safely get number from query parameter
// const getNumber = (value: any, defaultValue: number): number => {
//   if (!value) return defaultValue
//   const str = Array.isArray(value) ? value[0] : value
//   const num = Number(str)
//   return isNaN(num) ? defaultValue : num
// }

// // ============================================
// // PUBLIC ROUTES (No authentication required)
// // ============================================

// // Get comments for a post (top-level comments only)
// router.get('/post/:postId', async (req, res) => {
//   try {
//     const postId = getString(req.params.postId)
//     const page = getNumber(req.query.page, 1)
//     const limit = getNumber(req.query.limit, 20)

//     const comments = await Comment.findAll({
//       where: { 
//         post_id: postId,
//         parent_comment_id: null
//       },
//       include: [{ 
//         model: User, 
//         attributes: ['id', 'name', 'avatar_url'] 
//       }],
//       order: [['created_at', 'DESC']],
//       limit: limit,
//       offset: (page - 1) * limit
//     })

//     res.json(comments)
//   } catch (error) {
//     console.error('Error fetching comments:', error)
//     res.status(500).json({ error: 'Failed to fetch comments' })
//   }
// })

// // Get replies for a specific comment
// router.get('/:commentId/replies', async (req, res) => {
//   try {
//     const commentId = getString(req.params.commentId)
//     const page = getNumber(req.query.page, 1)
//     const limit = getNumber(req.query.limit, 20)

//     const replies = await Comment.findAll({
//       where: { parent_comment_id: commentId },
//       include: [{ 
//         model: User, 
//         attributes: ['id', 'name', 'avatar_url'] 
//       }],
//       order: [['created_at', 'ASC']],
//       limit: limit,
//       offset: (page - 1) * limit
//     })

//     res.json(replies)
//   } catch (error) {
//     console.error('Error fetching replies:', error)
//     res.status(500).json({ error: 'Failed to fetch replies' })
//   }
// })

// // Get single comment with its replies
// router.get('/:commentId', async (req, res) => {
//   try {
//     const commentId = getString(req.params.commentId)

//     const comment = await Comment.findByPk(commentId, {
//       include: [
//         { model: User, attributes: ['id', 'name', 'avatar_url'] },
//         { 
//           model: Comment, 
//           as: 'replies',
//           include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
//           order: [['created_at', 'ASC']],
//           limit: 10
//         }
//       ]
//     })

//     if (!comment) {
//       return res.status(404).json({ error: 'Comment not found' })
//     }

//     res.json(comment)
//   } catch (error) {
//     console.error('Error fetching comment:', error)
//     res.status(500).json({ error: 'Failed to fetch comment' })
//   }
// })

// // Get comment count for a post
// router.get('/count/:postId', async (req, res) => {
//   try {
//     const postId = getString(req.params.postId)
//     const count = await Comment.count({
//       where: { post_id: postId }
//     })
//     res.json({ postId, commentsCount: count })
//   } catch (error) {
//     console.error('Error getting comment count:', error)
//     res.status(500).json({ error: 'Failed to get comment count' })
//   }
// })

// // ============================================
// // PROTECTED ROUTES (Authentication required)
// // ============================================

// // Add comment or reply
// router.post('/', requireAuth, async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { post_id, content, parent_comment_id } = req.body

//     if (!post_id || !content) {
//       return res.status(400).json({ error: 'Post ID and content required' })
//     }

//     const post = await Post.findByPk(post_id)
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' })
//     }

//     if (parent_comment_id) {
//       const parentComment = await Comment.findByPk(parent_comment_id)
//       if (!parentComment) {
//         return res.status(404).json({ error: 'Parent comment not found' })
//       }
//     }

//     const comment = await Comment.create({
//       user_id: userId,
//       post_id,
//       content,
//       parent_comment_id: parent_comment_id || null
//     })

//     await Post.increment('comments_count', { where: { id: post_id } })
    
//     if (parent_comment_id) {
//       await Comment.increment('replies_count', { where: { id: parent_comment_id } })
//     }

//     const commenter = await User.findByPk(userId, {
//       attributes: ['id', 'name', 'avatar_url']
//     })

//     if (parent_comment_id) {
//       const parentComment = await Comment.findByPk(parent_comment_id, {
//         include: [{ model: User, attributes: ['id', 'name'] }]
//       })
      
//       if (parentComment && parentComment.user_id !== userId) {
//         pushService.createAndSend(
//           parentComment.user_id,
//           'comment_reply',
//           parent_comment_id,
//           'Someone replied to your comment',
//           `${commenter?.name} replied: "${content.substring(0, 50)}"`,
//           post.photo_url || undefined,
//           { 
//             postId: post_id, 
//             commentId: comment.id,
//             parentCommentId: parent_comment_id,
//             actorId: userId
//           }
//         )
//       }
//     } else {
//       if (post.user_id !== userId) {
//         pushService.createAndSend(
//           post.user_id,
//           'comment',
//           post_id,
//           'New comment on your post',
//           `${commenter?.name}: "${content.substring(0, 50)}"`,
//           post.photo_url || undefined,
//           { 
//             postId: post_id, 
//             commentId: comment.id,
//             actorId: userId
//           }
//         )
//       }
//     }

//     const commentWithUser = {
//       ...comment.toJSON(),
//       user: commenter
//     }

//     res.status(201).json(commentWithUser)
//   } catch (error) {
//     console.error('Error creating comment:', error)
//     res.status(500).json({ error: 'Failed to create comment' })
//   }
// })

// // Update comment
// router.patch('/:commentId', requireAuth, async (req, res) => {
//   try {
//     const userId = req.user.id
//     const commentId = getString(req.params.commentId)
//     const { content } = req.body
//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

//     if (!content) {
//       return res.status(400).json({ error: 'Content required' })
//     }

//     const comment = await Comment.findByPk(commentId)
//     if (!comment) {
//       return res.status(404).json({ error: 'Comment not found' })
//     }

//     if (comment.user_id !== userId && !isAdmin) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     comment.content = content
//     await comment.save()

//     res.json({ success: true, comment })
//   } catch (error) {
//     console.error('Error updating comment:', error)
//     res.status(500).json({ error: 'Failed to update comment' })
//   }
// })

// // Like/unlike comment
// router.post('/like', requireAuth, async (req, res) => {
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
//         include: [
//           { model: User, attributes: ['id', 'name'] },
//           { model: Post, attributes: ['id', 'title', 'photo_url'] }
//         ]
//       })
      
//       if (comment && comment.user_id !== userId) {
//         const liker = await User.findByPk(userId, {
//           attributes: ['id', 'name']
//         })
        
//         pushService.createAndSend(
//           comment.user_id,
//           'comment_like',
//           comment_id,
//           'Someone liked your comment',
//           `${liker?.name || 'Someone'} liked your comment`,
//           comment.post?.photo_url || undefined,
//           { 
//             commentId: comment_id,
//             postId: comment.post_id,
//             actorId: userId
//           }
//         )
//       }
      
//       res.json({ success: true, action: 'liked', isLiked: true })
//     }
//   } catch (error) {
//     console.error('Error toggling comment like:', error)
//     res.status(500).json({ error: 'Failed to toggle like' })
//   }
// })

// // Delete comment (and all replies) - FIXED
// router.delete('/:commentId', requireAuth, async (req, res) => {
//   try {
//     const userId = req.user.id
//     const commentId = getString(req.params.commentId)
//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

//     console.log('Delete comment attempt - Comment ID:', commentId, 'User ID:', userId, 'IsAdmin:', isAdmin)

//     const comment = await Comment.findByPk(commentId)
//     if (!comment) {
//       console.log('Comment not found:', commentId)
//       return res.status(404).json({ error: 'Comment not found' })
//     }

//     console.log('Comment found - Owner:', comment.user_id, 'Post:', comment.post_id)

//     if (comment.user_id !== userId && !isAdmin) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     // Store IDs before deleting
//     const postId = comment.post_id
//     const parentCommentId = comment.parent_comment_id

//     // Function to delete all replies recursively
//     const deleteReplies = async (parentId: string) => {
//       const replies = await Comment.findAll({ where: { parent_comment_id: parentId } })
//       for (const reply of replies) {
//         await deleteReplies(reply.id)
//         await reply.destroy()
//       }
//     }

//     // Delete all replies first
//     await deleteReplies(comment.id)
    
//     // Delete the comment
//     await comment.destroy()

//     // Update post comments count
//     await Post.decrement('comments_count', { 
//       where: { id: postId }
//     })

//     // Update parent comment replies count if it's a reply
//     if (parentCommentId) {
//       await Comment.decrement('replies_count', { 
//         where: { id: parentCommentId }
//       })
//     }

//     console.log('Comment deleted successfully:', commentId)
//     res.json({ success: true, message: 'Comment deleted successfully' })
//   } catch (error) {
//     console.error('Error deleting comment:', error)
//     res.status(500).json({ error: 'Failed to delete comment: ' + (error as Error).message })
//   }
// })

// // Get user's comments
// router.get('/user/my-comments', requireAuth, async (req, res) => {
//   try {
//     const userId = req.user.id
//     const page = getNumber(req.query.page, 1)
//     const limit = getNumber(req.query.limit, 20)

//     const comments = await Comment.findAll({
//       where: { user_id: userId },
//       include: [
//         { model: Post, attributes: ['id', 'title', 'photo_url'] },
//         { model: User, attributes: ['name', 'avatar_url'] }
//       ],
//       order: [['created_at', 'DESC']],
//       limit: limit,
//       offset: (page - 1) * limit
//     })

//     res.json(comments)
//   } catch (error) {
//     console.error('Error fetching user comments:', error)
//     res.status(500).json({ error: 'Failed to fetch comments' })
//   }
// })

// export default router

// routes/comments.ts - COMPLETE WITH SOCKET.IO INTEGRATION
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { Comment } from '../models/Comment'
import { CommentLike } from '../models/CommentLike'
import { Post } from '../models/Post'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'

const router = Router()

// Type definitions for socket events
interface CommentCreatedData {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId: string | null;
  user?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  timestamp: number;
}

interface CommentUpdatedData {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
  timestamp: number;
}

interface CommentDeletedData {
  commentId: string;
  postId: string;
  parentCommentId: string | null;
  deletedBy: string;
  timestamp: number;
}

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

// Helper functions
const getString = (value: any): string => {
  if (!value) return ''
  return Array.isArray(value) ? value[0] : String(value)
}

const getNumber = (value: any, defaultValue: number): number => {
  if (!value) return defaultValue
  const str = Array.isArray(value) ? value[0] : value
  const num = Number(str)
  return isNaN(num) ? defaultValue : num
}

const isAdmin = (req: AuthRequest): boolean => {
  if (!req.user) return false
  return req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get comments for a post (top-level comments only)
router.get('/post/:postId', async (req: Request, res: Response) => {
  try {
    const postId: string = getString(req.params.postId)
    const page: number = getNumber(req.query.page, 1)
    const limit: number = getNumber(req.query.limit, 20)

    const { count, rows: comments } = await Comment.findAndCountAll({
      where: { 
        post_id: postId,
        parent_comment_id: null
      },
      include: [{ 
        model: User, 
        attributes: ['id', 'name', 'avatar_url'] 
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })

    return res.json({
      comments,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// Get replies for a specific comment
router.get('/:commentId/replies', async (req: Request, res: Response) => {
  try {
    const commentId: string = getString(req.params.commentId)
    const page: number = getNumber(req.query.page, 1)
    const limit: number = getNumber(req.query.limit, 20)

    const { count, rows: replies } = await Comment.findAndCountAll({
      where: { parent_comment_id: commentId },
      include: [{ 
        model: User, 
        attributes: ['id', 'name', 'avatar_url'] 
      }],
      order: [['created_at', 'ASC']],
      limit,
      offset: (page - 1) * limit
    })

    return res.json({
      replies,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching replies:', error)
    return res.status(500).json({ error: 'Failed to fetch replies' })
  }
})

// Get single comment with its replies
router.get('/:commentId', async (req: Request, res: Response) => {
  try {
    const commentId: string = getString(req.params.commentId)

    const comment = await Comment.findByPk(commentId, {
      include: [
        { model: User, attributes: ['id', 'name', 'avatar_url'] },
        { 
          model: Comment, 
          as: 'replies',
          include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
          order: [['created_at', 'ASC']],
          limit: 10
        }
      ]
    })

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    return res.json(comment)
  } catch (error) {
    console.error('Error fetching comment:', error)
    return res.status(500).json({ error: 'Failed to fetch comment' })
  }
})

// Get comment count for a post
router.get('/count/:postId', async (req: Request, res: Response) => {
  try {
    const postId: string = getString(req.params.postId)
    const count: number = await Comment.count({
      where: { post_id: postId }
    })
    return res.json({ postId, commentsCount: count })
  } catch (error) {
    console.error('Error getting comment count:', error)
    return res.status(500).json({ error: 'Failed to get comment count' })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Add comment or reply
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { post_id, content, parent_comment_id }: {
      post_id: string;
      content: string;
      parent_comment_id?: string;
    } = req.body

    if (!post_id || !content) {
      return res.status(400).json({ error: 'Post ID and content required' })
    }

    const post = await Post.findByPk(post_id)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (parent_comment_id) {
      const parentComment = await Comment.findByPk(parent_comment_id)
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' })
      }
    }

    const comment = await Comment.create({
      user_id: userId,
      post_id,
      content,
      parent_comment_id: parent_comment_id || null
    })

    await Post.increment('comments_count', { where: { id: post_id } })
    
    if (parent_comment_id) {
      await Comment.increment('replies_count', { where: { id: parent_comment_id } })
    }

    const commenter = await User.findByPk(userId, {
      attributes: ['id', 'name', 'avatar_url']
    })

    // Send push notifications
    if (parent_comment_id) {
      const parentComment = await Comment.findByPk(parent_comment_id, {
        include: [{ model: User, attributes: ['id', 'name'] }]
      })
      
      if (parentComment && parentComment.user_id !== userId) {
        pushService.createAndSend(
          parentComment.user_id,
          'comment_reply',
          parent_comment_id,
          'Someone replied to your comment',
          `${commenter?.name || 'Someone'} replied: "${content.substring(0, 50)}"`,
          post.photo_url || undefined,
          { 
            postId: post_id, 
            commentId: comment.id,
            parentCommentId: parent_comment_id,
            actorId: userId
          }
        )
      }
    } else {
      if (post.user_id !== userId) {
        pushService.createAndSend(
          post.user_id,
          'comment',
          post_id,
          'New comment on your post',
          `${commenter?.name || 'Someone'}: "${content.substring(0, 50)}"`,
          post.photo_url || undefined,
          { 
            postId: post_id, 
            commentId: comment.id,
            actorId: userId
          }
        )
      }
    }

    // ✅ SOCKET.IO - Emit comment created events
    const io = req.app.get('io')
    if (io) {
      const commentData: CommentCreatedData = {
        commentId: comment.id,
        postId: post_id,
        userId,
        content,
        parentCommentId: parent_comment_id || null,
        user: commenter ? {
          id: commenter.id,
          name: commenter.name || 'Unknown',
          avatar_url: commenter.avatar_url || null
        } : undefined,
        timestamp: Date.now()
      }

      // Emit to post room
      if (parent_comment_id) {
        io.to(`post:${post_id}`).emit('comment_reply_added', commentData)
      } else {
        io.to(`post:${post_id}`).emit('new_comment', commentData)
      }

      // Notify post owner if it's a top-level comment
      if (!parent_comment_id && post.user_id !== userId) {
        io.to(`notifications:${post.user_id}`).emit('new_notification', {
          type: 'comment',
          title: 'New Comment',
          message: `${commenter?.name || 'Someone'} commented on your post`,
          ...commentData
        })
      }

      // Notify parent comment owner if it's a reply
      if (parent_comment_id) {
        const parentComment = await Comment.findByPk(parent_comment_id, {
          attributes: ['user_id']
        })
        if (parentComment && parentComment.user_id !== userId) {
          io.to(`notifications:${parentComment.user_id}`).emit('new_notification', {
            type: 'comment_reply',
            title: 'New Reply',
            message: `${commenter?.name || 'Someone'} replied to your comment`,
            ...commentData
          })
        }
      }
    }

    const commentWithUser = {
      ...comment.toJSON(),
      user: commenter
    }

    return res.status(201).json(commentWithUser)
  } catch (error) {
    console.error('Error creating comment:', error)
    return res.status(500).json({ error: 'Failed to create comment' })
  }
})

// Update comment
router.patch('/:commentId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const commentId: string = getString(req.params.commentId)
    const { content }: { content: string } = req.body

    if (!content) {
      return res.status(400).json({ error: 'Content required' })
    }

    const comment = await Comment.findByPk(commentId)
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (comment.user_id !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    comment.content = content
    await comment.save()

    // ✅ SOCKET.IO - Emit comment updated event
    const io = req.app.get('io')
    if (io) {
      const updateData: CommentUpdatedData = {
        commentId,
        postId: comment.post_id,
        userId,
        content,
        timestamp: Date.now()
      }

      io.to(`post:${comment.post_id}`).emit('comment_updated', updateData)
    }

    return res.json({ success: true, comment })
  } catch (error) {
    console.error('Error updating comment:', error)
    return res.status(500).json({ error: 'Failed to update comment' })
  }
})

// Like/unlike comment
router.post('/like', requireAuth, async (req: AuthRequest, res: Response) => {
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
      
      // Send push notification
      const comment = await Comment.findByPk(comment_id, {
        include: [
          { model: User, attributes: ['id', 'name'] },
          { model: Post, attributes: ['id', 'title', 'photo_url'] }
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
          { 
            commentId: comment_id,
            postId: comment.post_id,
            actorId: userId
          }
        )
      }
    }

    // Get updated likes count
    const updatedComment = await Comment.findByPk(comment_id, {
      attributes: ['id', 'likes_count', 'post_id']
    })

    // ✅ SOCKET.IO - Emit comment like event
    const io = req.app.get('io')
    if (io && updatedComment) {
      const likeData: CommentLikeToggledData = {
        commentId: comment_id,
        postId: updatedComment.post_id,
        userId,
        action,
        isLiked,
        likesCount: updatedComment.likes_count,
        timestamp: Date.now()
      }

      io.to(`post:${updatedComment.post_id}`).emit('comment_like_toggled', likeData)
    }

    return res.json({ 
      success: true, 
      action, 
      isLiked,
      likesCount: updatedComment?.likes_count || 0
    })
  } catch (error) {
    console.error('Error toggling comment like:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Delete comment (and all replies)
router.delete('/:commentId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const commentId: string = getString(req.params.commentId)

    console.log('Delete comment attempt - Comment ID:', commentId, 'User ID:', userId)

    const comment = await Comment.findByPk(commentId)
    if (!comment) {
      console.log('Comment not found:', commentId)
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (comment.user_id !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const postId: string = comment.post_id
    const parentCommentId: string | null = comment.parent_comment_id

    // Delete all replies recursively
    const deleteReplies = async (parentId: string): Promise<void> => {
      const replies = await Comment.findAll({ where: { parent_comment_id: parentId } })
      for (const reply of replies) {
        await deleteReplies(reply.id)
        await reply.destroy()
      }
    }

    await deleteReplies(comment.id)
    await comment.destroy()

    // Update counts
    await Post.decrement('comments_count', { where: { id: postId } })

    if (parentCommentId) {
      await Comment.decrement('replies_count', { where: { id: parentCommentId } })
    }

    // ✅ SOCKET.IO - Emit comment deleted event
    const io = req.app.get('io')
    if (io) {
      const deleteData: CommentDeletedData = {
        commentId,
        postId,
        parentCommentId,
        deletedBy: userId,
        timestamp: Date.now()
      }

      io.to(`post:${postId}`).emit('comment_deleted', deleteData)
    }

    console.log('Comment deleted successfully:', commentId)
    return res.json({ success: true, message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return res.status(500).json({ error: 'Failed to delete comment: ' + (error as Error).message })
  }
})

// Get user's comments
router.get('/user/my-comments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const page: number = getNumber(req.query.page, 1)
    const limit: number = getNumber(req.query.limit, 20)

    const { count, rows: comments } = await Comment.findAndCountAll({
      where: { user_id: userId },
      include: [
        { model: Post, attributes: ['id', 'title', 'photo_url'] },
        { model: User, attributes: ['name', 'avatar_url'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })

    return res.json({
      comments,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching user comments:', error)
    return res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

export default router