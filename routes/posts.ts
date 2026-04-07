// routes/posts.ts (updated)
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Post } from '../models/Post'
import { PostLike } from '../models/PostLike'
import { PostView } from '../models/PostView'
import { pushService } from '../services/expoPushNotification'
import { Op } from 'sequelize'

const router = Router()

// =================================
// 1. PUBLIC ROUTES
// =================================
router.get('/feed', async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const offset = (Number(page) - 1) * Number(limit)
  
  const posts = await Post.findAll({
    where: { status: 'posted' },
    include: [{ 
      model: require('../models/User').User, 
      attributes: ['name', 'avatar_url', 'location'] 
    }],
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset
  })
  res.json(posts)
})

// Add this after your existing routes, before the protectedRouter
router.get('/:id/poll', async (req, res) => {
  try {
    const postId = req.params.id
    const Poll = require('../models/Poll').Poll
    const PollOption = require('../models/PollOption').PollOption
    
    const poll = await Poll.findOne({
      where: { post_id: postId, is_active: true },
      include: [{ model: PollOption }]
    })
    
    if (!poll) {
      return res.json({ hasPoll: false })
    }
    
    res.json({ hasPoll: true, poll })
  } catch (error) {
    console.error('Error fetching poll:', error)
    res.status(500).json({ error: 'Failed to fetch poll' })
  }
})


router.get('/:id', async (req, res) => {
  const post = await Post.findByPk(req.params.id, {
    include: [{ 
      model: require('../models/User').User, 
      attributes: ['name', 'avatar_url', 'location'] 
    }]
  })
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' })
  }
  
  res.json(post)
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

// Track view
router.post('/:id/view', async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.user?.id
    
    await Post.increment('views_count', { where: { id: postId } })
    
    if (userId) {
      await PostView.create({
        user_id: userId,
        post_id: postId,
        viewed_at: new Date()
      })
    }
    
    res.json({ success: true })
  } catch (err) {
    console.error('View tracking error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// =================================
// 2. PROTECTED ROUTES
// =================================
const protectedRouter = Router()
protectedRouter.use(requireAuth)

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

  // Notify admins about new post
  const admins = await require('../models/User').User.findAll({
    where: { role: 'admin' }
  })
  
  for (const admin of admins) {
    await pushService.createAndSend(
      admin.id,
      'new_post',
      post.id,
      'New Post Needs Review',
      `${req.user.name || 'A user'} submitted: "${title.substring(0, 50)}"`,
      media_url,
      { postId: post.id, action: 'review' }
    )
  }

  res.json({
    success: true,
    message: 'Post submitted!',
    post: { id: post.id, title: post.title, status: post.status }
  })
})

// ADMIN ROUTES
const isAdmin = (req: any) => 
  req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

protectedRouter.post('/approve/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
  const post = await Post.findByPk(req.params.id, {
    include: [{ model: require('../models/User').User }]
  })
  
  if (!post) return res.status(404).json({ error: 'Not found' })
  
  post.status = 'posted'
  await post.save()
  
  // Notify post owner
  await pushService.createAndSend(
    post.user_id,
    'post_approved',
    post.id,
    'Your Post is Live! 🎉',
    `"${post.title}" has been approved and is now visible to everyone`,
    post.photo_url || undefined,
    { postId: post.id, action: 'view' }
  )
  
  res.json({ success: true, message: 'LIVE!' })
})

protectedRouter.post('/reject/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
  const { reason } = req.body
  const post = await Post.findByPk(req.params.id)
  
  if (!post) return res.status(404).json({ error: 'Not found' })
  
  post.status = 'rejected'
  await post.save()
  
  // Notify post owner
  await pushService.createAndSend(
    post.user_id,
    'post_rejected',
    post.id,
    'Post Not Approved',
    reason || 'Your post was not approved. Please check the guidelines and try again.',
    undefined,
    { postId: post.id }
  )
  
  res.json({ success: true, message: 'Rejected' })
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

protectedRouter.patch('/update/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
  const { title, category, media_url, description } = req.body
  const post = await Post.findByPk(req.params.id)
  if (!post) return res.status(404).json({ error: 'Not found' })

  if (title !== undefined) post.title = title
  if (category !== undefined) post.category = category
  if (media_url !== undefined) post.photo_url = media_url
  if (description !== undefined) post.description = description

  await post.save()
  res.json({ success: true })
})

router.use(protectedRouter)

export default router