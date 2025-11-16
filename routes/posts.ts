// routes/posts.ts — FINAL: PUBLIC ROUTES FIRST, NO AUTH
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Post } from '../models/Post'
import { PostLike } from '../models/PostLike'

// MAIN ROUTER
const router = Router()

// =================================
// 1. PUBLIC ROUTES (NO AUTH EVER)
// =================================
router.get('/feed', async (req, res) => {
  const posts = await Post.findAll({
    where: { status: 'posted' },
    include: [{ 
      model: require('../models/User').User, 
      attributes: ['name', 'avatar_url', 'location'] 
    }],
    order: [['created_at', 'DESC']],
    limit: 100
  })
  res.json(posts)
})

router.get('/:id/likes', async (req, res) => {
  try {
    const count = await PostLike.count({ where: { post_id: req.params.id } })
    res.json({ post_id: req.params.id, likes: count })
  } catch (err) {
    console.error('Likes error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// =================================
// 2. PROTECTED ROUTES (AUTH REQUIRED)
// =================================
const protectedRouter = Router()
protectedRouter.use(requireAuth)  // ← Only here

protectedRouter.post('/create', async (req: any, res) => {
  const { title, description, media_url, media_type, category } = req.body
  const userId = req.user.id

  if (!title || !media_url || !category) {
    return res.status(400).json({ error: 'Title, media, and category required' })
  }

  const validCategories = ['entertainment', 'community', 'service', 'poster', 'news', 'rally']
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' })
  }

  const post = await Post.create({
    user_id: userId,
    title,
    description: description || '',
    video_url: media_type === 'video' ? media_url : null,
    photo_url: media_type !== 'video' ? media_url : null,
    status: 'pending',
    category,
  })

  res.json({
    success: true,
    message: 'Post submitted!',
    post: { id: post.id, title: post.title, status: post.status }
  })
})

// ADMIN
// routes/posts.ts — FINAL: 403 FIXED
const isAdmin = (req: any) => 
  req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'  // ← CHECK BOTH
protectedRouter.post('/approve/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  const post = await Post.findByPk(req.params.id)
  if (!post) return res.status(404).json({ error: 'Not found' })
  post.status = 'posted'
  await post.save()
  res.json({ success: true, message: 'LIVE!' })
})

protectedRouter.delete('/admin/delete/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  const post = await Post.findByPk(req.params.id)
  if (!post) return res.status(404).json({ error: 'Not found' })
  await post.destroy()
  res.json({ success: true })
})

protectedRouter.get('/admin/pending', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  const posts = await Post.findAll({
    where: { status: 'pending' },
    include: [{ model: require('../models/User').User, attributes: ['name', 'phone'] }],
    order: [['created_at', 'DESC']]
  })
  res.json(posts)
})

// Mount protected routes under same paths
router.use(protectedRouter)

export default router