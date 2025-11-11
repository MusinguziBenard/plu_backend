// routes/likes.ts — FINAL: TOGGLE + STATE (Uganda Ready)
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostLike } from '../models/PostLike'
import { Post } from '../models/Post'

const router = Router()
router.use(requireAuth)

// GET: User's liked posts (with full post data)
router.get('/', async (req, res) => {
  const userId = req.user.id

  const likes = await PostLike.findAll({
    where: { user_id: userId },
    include: [{
      model: Post,
      include: [{ model: require('../models/User').User, attributes: ['name', 'avatar_url'] }]
    }]
  })

  const posts = likes.map((like: any) => ({
    ...like.post.toJSON(),
    isLiked: true
  }))

  res.json(posts)
})

// TOGGLE: Like or Unlike
router.post('/', async (req, res) => {
  const userId = req.user.id
  const { post_id } = req.body

  const existing = await PostLike.findOne({
    where: { user_id: userId, post_id }
  })

  if (existing) {
    // Already liked → UNLIKE
    await existing.destroy()
    res.json({ success: true, action: 'unliked' })
  } else {
    // Not liked → LIKE
    await PostLike.create({ user_id: userId, post_id })
    res.json({ success: true, action: 'liked' })
  }
})

// DELETE: Unlike (optional, keep for legacy)
router.delete('/', async (req, res) => {
  const userId = req.user.id
  const { post_id } = req.body

  await PostLike.destroy({ where: { user_id: userId, post_id } })
  res.json({ success: true, action: 'unliked' })
})

export default router