// routes/likes.ts - COMPLETE FIXED VERSION
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostLike } from '../models/PostLike'
import { Post } from '../models/Post'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'

const router = Router()

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get likes count for a post - PUBLIC
router.get('/count/:postId', async (req, res) => {
  try {
    const { postId } = req.params
    const count = await PostLike.count({
      where: { post_id: postId }
    })
    res.json({ postId, likesCount: count })
  } catch (error) {
    console.error('Error getting likes count:', error)
    res.status(500).json({ error: 'Failed to get likes count' })
  }
})

// Get users who liked a post - PUBLIC
router.get('/users/:postId', async (req, res) => {
  try {
    const { postId } = req.params
    const { page = 1, limit = 20 } = req.query

    const likes = await PostLike.findAll({
      where: { post_id: postId },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['created_at', 'DESC']]
    })

    const users = likes.map(like => like.user)
    res.json(users)
  } catch (error) {
    console.error('Error getting users who liked post:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get user's liked posts - PROTECTED
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    console.log('Fetching liked posts for user:', userId)

    // Get all likes for the user with created_at
    const likes = await PostLike.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    })

    if (!likes || likes.length === 0) {
      return res.json([])
    }

    // Get all post IDs
    const postIds = likes.map(like => like.post_id)

    // Fetch the posts
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

    // Create a map for quick lookup
    const likedPostIds = new Set(postIds)
    
    // Map isLiked property to each post
    const postsWithLikeStatus = posts.map(post => ({
      ...post.toJSON(),
      isLiked: likedPostIds.has(post.id)
    }))

    res.json(postsWithLikeStatus)
  } catch (error) {
    console.error('Error getting user likes:', error)
    res.status(500).json({ error: 'Failed to get user likes: ' + (error as Error).message })
  }
})

// Check if user liked a specific post - PROTECTED
router.get('/check/:postId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { postId } = req.params

    const like = await PostLike.findOne({
      where: { user_id: userId, post_id: postId }
    })

    res.json({ isLiked: !!like })
  } catch (error) {
    console.error('Error checking like status:', error)
    res.status(500).json({ error: 'Failed to check like status' })
  }
})

// Toggle like/unlike - PROTECTED
router.post('/toggle', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { post_id } = req.body

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
      res.json({ success: true, action: 'unliked', isLiked: false })
    } else {
      // Like
      await PostLike.create({ user_id: userId, post_id })
      await Post.increment('likes_count', { where: { id: post_id } })
      
      const post = await Post.findByPk(post_id, {
        include: [{ model: User }]
      })
      
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
      }
      
      res.json({ success: true, action: 'liked', isLiked: true })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Legacy route - PROTECTED
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { post_id } = req.body

    const existing = await PostLike.findOne({
      where: { user_id: userId, post_id }
    })

    if (existing) {
      await existing.destroy()
      await Post.decrement('likes_count', { where: { id: post_id } })
      res.json({ success: true, action: 'unliked' })
    } else {
      await PostLike.create({ user_id: userId, post_id })
      await Post.increment('likes_count', { where: { id: post_id } })
      
      const post = await Post.findByPk(post_id, {
        include: [{ model: User }]
      })
      
      if (post && post.user_id !== userId) {
        const liker = await User.findByPk(userId)
        pushService.createAndSend(
          post.user_id,
          'like',
          post_id,
          'Someone liked your post!',
          `${liker?.name || 'Someone'} liked "${post.title.substring(0, 50)}"`,
          post.photo_url || undefined,
          { postId: post_id }
        )
      }
      
      res.json({ success: true, action: 'liked' })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Delete unlike - PROTECTED
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { post_id } = req.body

    await PostLike.destroy({ where: { user_id: userId, post_id } })
    await Post.decrement('likes_count', { where: { id: post_id } })
    
    res.json({ success: true, action: 'unliked' })
  } catch (error) {
    console.error('Error deleting like:', error)
    res.status(500).json({ error: 'Failed to delete like' })
  }
})

export default router