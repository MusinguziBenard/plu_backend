// routes/posts.ts — FINAL FIXED VERSION
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Post } from '../models/Post'

const router = Router()

// PUBLIC FEED — NO AUTH NEEDED
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

// PROTECTED ROUTES
router.use(requireAuth)

// USER: SUBMIT POST
router.post('/create', async (req: any, res) => {
  const { title, description, media_url, media_type, category } = req.body
  const userId = req.user.id

  if (!title || !media_url || !category) {
    return res.status(400).json({ error: 'Title, media, and category required' })
  }

  const validCategories = ['entertainment', 'community', 'service', 'poster', 'news', 'rally']
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' })
  }

  try {
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
      message: 'Post submitted for review!',
      post: { id: post.id, title: post.title, status: post.status }
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN ROUTES — FIXED ROLE CHECK
const isAdmin = (req: any) => req.user.user_metadata?.role === 'admin'

router.post('/approve/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })

  const post = await Post.findByPk(req.params.id)
  if (!post) return res.status(404).json({ error: 'Post not found' })

  post.status = 'posted'
  await post.save()

  res.json({ success: true, message: 'POST IS NOW LIVE!' })
})

router.delete('/admin/delete/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })

  const post = await Post.findByPk(req.params.id)
  if (!post) return res.status(404).json({ error: 'Not found' })
  await post.destroy()
  res.json({ success: true, message: 'Post deleted' })
})

router.get('/admin/pending', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })

  const posts = await Post.findAll({
    where: { status: 'pending' },
    include: [{ model: require('../models/User').User, attributes: ['name', 'phone'] }],
    order: [['created_at', 'DESC']]
  })
  res.json(posts)
})

export default router