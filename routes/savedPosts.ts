// routes/savedPosts.ts
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { SavedPost } from '../models/SavedPost'
import { Post } from '../models/Post'
import { User } from '../models/User'

const router = Router()
router.use(requireAuth)

// Save a post
router.post('/save/:postId', async (req, res) => {
  try {
    const userId = req.user.id
    const { postId } = req.params

    const existing = await SavedPost.findOne({
      where: { user_id: userId, post_id: postId }
    })

    if (existing) {
      return res.status(400).json({ error: 'Post already saved' })
    }

    await SavedPost.create({ user_id: userId, post_id: postId })
    res.json({ success: true, message: 'Post saved' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save post' })
  }
})

// Unsave a post
router.delete('/unsave/:postId', async (req, res) => {
  try {
    const userId = req.user.id
    const { postId } = req.params

    await SavedPost.destroy({
      where: { user_id: userId, post_id: postId }
    })

    res.json({ success: true, message: 'Post unsaved' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsave post' })
  }
})

// Get user's saved posts
router.get('/my-saved', async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const savedPosts = await SavedPost.findAll({
      where: { user_id: userId },
      include: [{
        model: Post,
        where: { status: 'posted' },
        include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
      }],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    })

    const posts = savedPosts.map(sp => sp.post)
    res.json(posts)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get saved posts' })
  }
})

// Check if post is saved
router.get('/check/:postId', async (req, res) => {
  try {
    const userId = req.user.id
    const { postId } = req.params

    const saved = await SavedPost.findOne({
      where: { user_id: userId, post_id: postId }
    })

    res.json({ isSaved: !!saved })
  } catch (error) {
    res.status(500).json({ error: 'Failed to check saved status' })
  }
})

export default router