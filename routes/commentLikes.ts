// routes/commentLikes.ts - DEFINITIVE WORKING VERSION
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { CommentLike } from '../models/CommentLike'
import { Comment } from '../models/Comment'
import { Post } from '../models/Post'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'

const router = Router()

// ============================================
// PUBLIC ROUTES - MUST BE FIRST, NO AUTH MIDDLEWARE
// ============================================

// Get likes count for a comment - PUBLIC
router.get('/count/:commentId', async (req, res) => {
  console.log('🔓 PUBLIC route hit: GET /count/' + req.params.commentId)
  try {
    const { commentId } = req.params
    const count = await CommentLike.count({
      where: { comment_id: commentId }
    })
    res.json({ commentId, likesCount: count })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to get likes count' })
  }
})

// Get users who liked a comment - PUBLIC
router.get('/users/:commentId', async (req, res) => {
  console.log('🔓 PUBLIC route hit: GET /users/' + req.params.commentId)
  try {
    const { commentId } = req.params
    const likes = await CommentLike.findAll({
      where: { comment_id: commentId },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
    })
    const users = likes.map(like => like.user)
    res.json(users)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// ============================================
// PROTECTED ROUTES - ADD AUTH MIDDLEWARE TO EACH ROUTE
// ============================================

// Check if user liked a comment - PROTECTED
router.get('/check/:commentId', requireAuth, async (req, res) => {
  console.log('🔒 PROTECTED route hit: GET /check/' + req.params.commentId)
  try {
    const userId = req.user.id
    const { commentId } = req.params
    const like = await CommentLike.findOne({
      where: { user_id: userId, comment_id: commentId }
    })
    res.json({ isLiked: !!like })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to check like status' })
  }
})

// Toggle like/unlike - PROTECTED
router.post('/toggle', requireAuth, async (req, res) => {
  console.log('🔒 PROTECTED route hit: POST /toggle')
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
        include: [{ model: User }, { model: Post }]
      })
      
      if (comment && comment.user_id !== userId) {
        const liker = await User.findByPk(userId)
        pushService.createAndSend(
          comment.user_id,
          'comment_like',
          comment_id,
          'Someone liked your comment',
          `${liker?.name || 'Someone'} liked your comment`,
          comment.post?.photo_url || undefined,
          { commentId: comment_id, postId: comment.post_id, actorId: userId }
        )
      }
      
      res.json({ success: true, action: 'liked', isLiked: true })
    }
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Legacy route - PROTECTED
router.post('/', requireAuth, async (req, res) => {
  console.log('🔒 PROTECTED route hit: POST /')
  try {
    const userId = req.user.id
    const { comment_id } = req.body
    const existing = await CommentLike.findOne({
      where: { user_id: userId, comment_id }
    })
    if (existing) {
      await existing.destroy()
      await Comment.decrement('likes_count', { where: { id: comment_id } })
      res.json({ success: true, action: 'unliked' })
    } else {
      await CommentLike.create({ user_id: userId, comment_id })
      await Comment.increment('likes_count', { where: { id: comment_id } })
      const comment = await Comment.findByPk(comment_id, {
        include: [{ model: User }, { model: Post }]
      })
      if (comment && comment.user_id !== userId) {
        const liker = await User.findByPk(userId)
        pushService.createAndSend(
          comment.user_id,
          'comment_like',
          comment_id,
          'Someone liked your comment',
          `${liker?.name} liked your comment`,
          comment.post?.photo_url || undefined,
          { commentId: comment_id }
        )
      }
      res.json({ success: true, action: 'liked' })
    }
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Delete unlike - PROTECTED
router.delete('/', requireAuth, async (req, res) => {
  console.log('🔒 PROTECTED route hit: DELETE /')
  try {
    const userId = req.user.id
    const { comment_id } = req.body
    await CommentLike.destroy({ where: { user_id: userId, comment_id } })
    await Comment.decrement('likes_count', { where: { id: comment_id } })
    res.json({ success: true, action: 'unliked' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to delete like' })
  }
})

export default router