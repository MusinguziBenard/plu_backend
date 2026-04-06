// routes/comments.ts - FULLY FIXED (All TypeScript errors resolved)
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Comment } from '../models/Comment'
import { CommentLike } from '../models/CommentLike'
import { Post } from '../models/Post'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'

const router = Router()

// Helper function to safely get string from params/query
const getString = (value: any): string => {
  if (!value) return ''
  return Array.isArray(value) ? value[0] : String(value)
}

// Helper function to safely get number from query parameter
const getNumber = (value: any, defaultValue: number): number => {
  if (!value) return defaultValue
  const str = Array.isArray(value) ? value[0] : value
  const num = Number(str)
  return isNaN(num) ? defaultValue : num
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get comments for a post (top-level comments only)
router.get('/post/:postId', async (req, res) => {
  try {
    const postId = getString(req.params.postId)
    const page = getNumber(req.query.page, 1)
    const limit = getNumber(req.query.limit, 20)

    const comments = await Comment.findAll({
      where: { 
        post_id: postId,
        parent_comment_id: null
      },
      include: [{ 
        model: User, 
        attributes: ['id', 'name', 'avatar_url'] 
      }],
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: (page - 1) * limit
    })

    res.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// Get replies for a specific comment
router.get('/:commentId/replies', async (req, res) => {
  try {
    const commentId = getString(req.params.commentId)
    const page = getNumber(req.query.page, 1)
    const limit = getNumber(req.query.limit, 20)

    const replies = await Comment.findAll({
      where: { parent_comment_id: commentId },
      include: [{ 
        model: User, 
        attributes: ['id', 'name', 'avatar_url'] 
      }],
      order: [['created_at', 'ASC']],
      limit: limit,
      offset: (page - 1) * limit
    })

    res.json(replies)
  } catch (error) {
    console.error('Error fetching replies:', error)
    res.status(500).json({ error: 'Failed to fetch replies' })
  }
})

// Get single comment with its replies
router.get('/:commentId', async (req, res) => {
  try {
    const commentId = getString(req.params.commentId)

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

    res.json(comment)
  } catch (error) {
    console.error('Error fetching comment:', error)
    res.status(500).json({ error: 'Failed to fetch comment' })
  }
})

// Get comment count for a post
router.get('/count/:postId', async (req, res) => {
  try {
    const postId = getString(req.params.postId)
    const count = await Comment.count({
      where: { post_id: postId }
    })
    res.json({ postId, commentsCount: count })
  } catch (error) {
    console.error('Error getting comment count:', error)
    res.status(500).json({ error: 'Failed to get comment count' })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Add comment or reply
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { post_id, content, parent_comment_id } = req.body

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
          `${commenter?.name} replied: "${content.substring(0, 50)}"`,
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
          `${commenter?.name}: "${content.substring(0, 50)}"`,
          post.photo_url || undefined,
          { 
            postId: post_id, 
            commentId: comment.id,
            actorId: userId
          }
        )
      }
    }

    const commentWithUser = {
      ...comment.toJSON(),
      user: commenter
    }

    res.status(201).json(commentWithUser)
  } catch (error) {
    console.error('Error creating comment:', error)
    res.status(500).json({ error: 'Failed to create comment' })
  }
})

// Update comment
router.patch('/:commentId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const commentId = getString(req.params.commentId)
    const { content } = req.body
    const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

    if (!content) {
      return res.status(400).json({ error: 'Content required' })
    }

    const comment = await Comment.findByPk(commentId)
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (comment.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    comment.content = content
    await comment.save()

    res.json({ success: true, comment })
  } catch (error) {
    console.error('Error updating comment:', error)
    res.status(500).json({ error: 'Failed to update comment' })
  }
})

// Like/unlike comment
router.post('/like', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { comment_id } = req.body

    if (!comment_id) {
      return res.status(400).json({ error: 'Comment ID required' })
    }

    const existing = await CommentLike.findOne({
      where: { user_id: userId, comment_id }
    })

    if (existing) {
      await existing.destroy()
      await Comment.decrement('likes_count', { where: { id: comment_id } })
      res.json({ success: true, action: 'unliked', isLiked: false })
    } else {
      await CommentLike.create({ user_id: userId, comment_id })
      await Comment.increment('likes_count', { where: { id: comment_id } })
      
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
      
      res.json({ success: true, action: 'liked', isLiked: true })
    }
  } catch (error) {
    console.error('Error toggling comment like:', error)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Delete comment (and all replies) - FIXED
router.delete('/:commentId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const commentId = getString(req.params.commentId)
    const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

    console.log('Delete comment attempt - Comment ID:', commentId, 'User ID:', userId, 'IsAdmin:', isAdmin)

    const comment = await Comment.findByPk(commentId)
    if (!comment) {
      console.log('Comment not found:', commentId)
      return res.status(404).json({ error: 'Comment not found' })
    }

    console.log('Comment found - Owner:', comment.user_id, 'Post:', comment.post_id)

    if (comment.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Store IDs before deleting
    const postId = comment.post_id
    const parentCommentId = comment.parent_comment_id

    // Function to delete all replies recursively
    const deleteReplies = async (parentId: string) => {
      const replies = await Comment.findAll({ where: { parent_comment_id: parentId } })
      for (const reply of replies) {
        await deleteReplies(reply.id)
        await reply.destroy()
      }
    }

    // Delete all replies first
    await deleteReplies(comment.id)
    
    // Delete the comment
    await comment.destroy()

    // Update post comments count
    await Post.decrement('comments_count', { 
      where: { id: postId }
    })

    // Update parent comment replies count if it's a reply
    if (parentCommentId) {
      await Comment.decrement('replies_count', { 
        where: { id: parentCommentId }
      })
    }

    console.log('Comment deleted successfully:', commentId)
    res.json({ success: true, message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    res.status(500).json({ error: 'Failed to delete comment: ' + (error as Error).message })
  }
})

// Get user's comments
router.get('/user/my-comments', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const page = getNumber(req.query.page, 1)
    const limit = getNumber(req.query.limit, 20)

    const comments = await Comment.findAll({
      where: { user_id: userId },
      include: [
        { model: Post, attributes: ['id', 'title', 'photo_url'] },
        { model: User, attributes: ['name', 'avatar_url'] }
      ],
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: (page - 1) * limit
    })

    res.json(comments)
  } catch (error) {
    console.error('Error fetching user comments:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

export default router