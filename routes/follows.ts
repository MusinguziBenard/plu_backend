// routes/follows.ts - COMPLETELY REWRITTEN
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Follow } from '../models/Follow'
import { User } from '../models/User'
import { Post } from '../models/Post'
import pushService from '../services/expoPushNotification'

const router = Router()

// ============================================
// PUBLIC ROUTES (No authentication required)
// These MUST be defined before any auth middleware
// ============================================

// Get user's followers (PUBLIC)
router.get('/followers/:userId', async (req, res) => {
  console.log('🔥 PUBLIC GET /followers/' + req.params.userId)
  try {
    const userId = String(req.params.userId)
    const { page = 1, limit = 20 } = req.query

    const followers = await Follow.findAll({
      where: { following_id: userId },
      include: [{ model: User, as: 'follower', attributes: ['id', 'name', 'avatar_url'] }],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['created_at', 'DESC']]
    })

    const users = followers.map(f => f.follower)
    res.json(users)
  } catch (error) {
    console.error('Get followers error:', error)
    res.status(500).json({ error: 'Failed to get followers' })
  }
})

// Get users a user is following (PUBLIC)
router.get('/following/:userId', async (req, res) => {
  console.log('🔥 PUBLIC GET /following/' + req.params.userId)
  try {
    const userId = String(req.params.userId)
    const { page = 1, limit = 20 } = req.query

    const following = await Follow.findAll({
      where: { follower_id: userId },
      include: [{ model: User, as: 'following', attributes: ['id', 'name', 'avatar_url'] }],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['created_at', 'DESC']]
    })

    const users = following.map(f => f.following)
    res.json(users)
  } catch (error) {
    console.error('Get following error:', error)
    res.status(500).json({ error: 'Failed to get following users' })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Follow a user
router.post('/follow/:userId', requireAuth, async (req, res) => {
  console.log('🔒 POST /follow/' + req.params.userId)
  try {
    const followerId = req.user.id
    const followingId = String(req.params.userId)

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
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

    const follower = await User.findByPk(followerId)
    pushService.createAndSend(
      followingId,
      'new_post',
      followerId,
      'New Follower',
      `${follower?.name} started following you!`,
      follower?.avatar_url || undefined,
      { followerId, type: 'follow' }
    )

    res.json({ success: true, message: 'User followed' })
  } catch (error) {
    console.error('Follow error:', error)
    res.status(500).json({ error: 'Failed to follow user' })
  }
})

// Unfollow a user
router.delete('/unfollow/:userId', requireAuth, async (req, res) => {
  console.log('🔒 DELETE /unfollow/' + req.params.userId)
  try {
    const followerId = req.user.id
    const followingId = String(req.params.userId)

    await Follow.destroy({
      where: { follower_id: followerId, following_id: followingId }
    })

    await User.decrement('following_count', { where: { id: followerId } })
    await User.decrement('followers_count', { where: { id: followingId } })

    res.json({ success: true, message: 'User unfollowed' })
  } catch (error) {
    console.error('Unfollow error:', error)
    res.status(500).json({ error: 'Failed to unfollow user' })
  }
})

// Check if following
router.get('/check/:userId', requireAuth, async (req, res) => {
  console.log('🔒 GET /check/' + req.params.userId)
  try {
    const followerId = req.user.id
    const followingId = String(req.params.userId)

    const follow = await Follow.findOne({
      where: { follower_id: followerId, following_id: followingId }
    })

    res.json({ isFollowing: !!follow })
  } catch (error) {
    console.error('Check follow error:', error)
    res.status(500).json({ error: 'Failed to check follow status' })
  }
})

// Get feed from followed users
router.get('/feed', requireAuth, async (req, res) => {
  console.log('🔒 GET /feed')
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const following = await Follow.findAll({
      where: { follower_id: userId },
      attributes: ['following_id']
    })

    const followingIds = following.map(f => f.following_id)
    
    if (followingIds.length === 0) {
      followingIds.push(userId)
    } else {
      followingIds.push(userId)
    }

    const posts = await Post.findAll({
      where: {
        user_id: followingIds,
        status: 'posted'
      },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    })

    res.json(posts)
  } catch (error) {
    console.error('Feed error:', error)
    res.status(500).json({ error: 'Failed to get feed' })
  }
})

export default router