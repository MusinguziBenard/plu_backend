// // routes/posts.ts (updated)
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { Post } from '../models/Post'
// import { PostLike } from '../models/PostLike'
// import { PostView } from '../models/PostView'
// import { pushService } from '../services/expoPushNotification'
// import { Op } from 'sequelize'

// const router = Router()

// // =================================
// // 1. PUBLIC ROUTES
// // =================================
// router.get('/feed', async (req, res) => {
//   const { page = 1, limit = 20 } = req.query
//   const offset = (Number(page) - 1) * Number(limit)
  
//   const posts = await Post.findAll({
//     where: { status: 'posted' },
//     include: [{ 
//       model: require('../models/User').User, 
//       attributes: ['name', 'avatar_url', 'location'] 
//     }],
//     order: [['created_at', 'DESC']],
//     limit: Number(limit),
//     offset
//   })
//   res.json(posts)
// })

// // Add this after your existing routes, before the protectedRouter
// router.get('/:id/poll', async (req, res) => {
//   try {
//     const postId = req.params.id
//     const Poll = require('../models/Poll').Poll
//     const PollOption = require('../models/PollOption').PollOption
    
//     const poll = await Poll.findOne({
//       where: { post_id: postId, is_active: true },
//       include: [{ model: PollOption }]
//     })
    
//     if (!poll) {
//       return res.json({ hasPoll: false })
//     }
    
//     res.json({ hasPoll: true, poll })
//   } catch (error) {
//     console.error('Error fetching poll:', error)
//     res.status(500).json({ error: 'Failed to fetch poll' })
//   }
// })


// router.get('/:id', async (req, res) => {
//   const post = await Post.findByPk(req.params.id, {
//     include: [{ 
//       model: require('../models/User').User, 
//       attributes: ['name', 'avatar_url', 'location'] 
//     }]
//   })
  
//   if (!post) {
//     return res.status(404).json({ error: 'Post not found' })
//   }
  
//   res.json(post)
// })

// router.get('/:id/likes', async (req, res) => {
//   try {
//     const count = await PostLike.count({ where: { post_id: req.params.id } })
//     res.json({ post_id: req.params.id, likes: count })
//   } catch (err) {
//     console.error('Likes error:', err)
//     res.status(500).json({ error: 'Server error' })
//   }
// })

// // Track view
// router.post('/:id/view', async (req, res) => {
//   try {
//     const postId = req.params.id
//     const userId = req.user?.id
    
//     await Post.increment('views_count', { where: { id: postId } })
    
//     if (userId) {
//       await PostView.create({
//         user_id: userId,
//         post_id: postId,
//         viewed_at: new Date()
//       })
//     }
    
//     res.json({ success: true })
//   } catch (err) {
//     console.error('View tracking error:', err)
//     res.status(500).json({ error: 'Server error' })
//   }
// })

// // =================================
// // 2. PROTECTED ROUTES
// // =================================
// const protectedRouter = Router()
// protectedRouter.use(requireAuth)

// protectedRouter.post('/create', async (req: any, res) => {
//   const { title, description, media_url, media_type, category } = req.body
//   const userId = req.user.id

//   if (!title || !media_url || !category) {
//     return res.status(400).json({ error: 'Title, media, and category required' })
//   }

//   const validCategories = ['entertainment', 'community', 'service', 'poster', 'news', 'rally']
//   if (!validCategories.includes(category)) {
//     return res.status(400).json({ error: 'Invalid category' })
//   }

//   const post = await Post.create({
//     user_id: userId,
//     title,
//     description: description || '',
//     video_url: media_type === 'video' ? media_url : null,
//     photo_url: media_type !== 'video' ? media_url : null,
//     status: 'pending',
//     category,
//   })

//   // Notify admins about new post
//   const admins = await require('../models/User').User.findAll({
//     where: { role: 'admin' }
//   })
  
//   for (const admin of admins) {
//     await pushService.createAndSend(
//       admin.id,
//       'new_post',
//       post.id,
//       'New Post Needs Review',
//       `${req.user.name || 'A user'} submitted: "${title.substring(0, 50)}"`,
//       media_url,
//       { postId: post.id, action: 'review' }
//     )
//   }

//   res.json({
//     success: true,
//     message: 'Post submitted!',
//     post: { id: post.id, title: post.title, status: post.status }
//   })
// })

// // ADMIN ROUTES
// const isAdmin = (req: any) => 
//   req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

// protectedRouter.post('/approve/:id', async (req: any, res) => {
//   if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
//   const post = await Post.findByPk(req.params.id, {
//     include: [{ model: require('../models/User').User }]
//   })
  
//   if (!post) return res.status(404).json({ error: 'Not found' })
  
//   post.status = 'posted'
//   await post.save()
  
//   // Notify post owner
//   await pushService.createAndSend(
//     post.user_id,
//     'post_approved',
//     post.id,
//     'Your Post is Live! 🎉',
//     `"${post.title}" has been approved and is now visible to everyone`,
//     post.photo_url || undefined,
//     { postId: post.id, action: 'view' }
//   )
  
//   res.json({ success: true, message: 'LIVE!' })
// })

// protectedRouter.post('/reject/:id', async (req: any, res) => {
//   if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
//   const { reason } = req.body
//   const post = await Post.findByPk(req.params.id)
  
//   if (!post) return res.status(404).json({ error: 'Not found' })
  
//   post.status = 'rejected'
//   await post.save()
  
//   // Notify post owner
//   await pushService.createAndSend(
//     post.user_id,
//     'post_rejected',
//     post.id,
//     'Post Not Approved',
//     reason || 'Your post was not approved. Please check the guidelines and try again.',
//     undefined,
//     { postId: post.id }
//   )
  
//   res.json({ success: true, message: 'Rejected' })
// })

// protectedRouter.delete('/admin/delete/:id', async (req: any, res) => {
//   if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
//   const post = await Post.findByPk(req.params.id)
//   if (!post) return res.status(404).json({ error: 'Not found' })
//   await post.destroy()
//   res.json({ success: true })
// })

// protectedRouter.get('/admin/pending', async (req: any, res) => {
//   if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
//   const posts = await Post.findAll({
//     where: { status: 'pending' },
//     include: [{ model: require('../models/User').User, attributes: ['name', 'phone'] }],
//     order: [['created_at', 'DESC']]
//   })
//   res.json(posts)
// })

// protectedRouter.patch('/update/:id', async (req: any, res) => {
//   if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
//   const { title, category, media_url, description } = req.body
//   const post = await Post.findByPk(req.params.id)
//   if (!post) return res.status(404).json({ error: 'Not found' })

//   if (title !== undefined) post.title = title
//   if (category !== undefined) post.category = category
//   if (media_url !== undefined) post.photo_url = media_url
//   if (description !== undefined) post.description = description

//   await post.save()
//   res.json({ success: true })
// })

// router.use(protectedRouter)

// export default router


// routes/posts.ts (FIXED TYPE ERRORS)
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { Post } from '../models/Post'
import { PostLike } from '../models/PostLike'
import { PostView } from '../models/PostView'
import { User } from '../models/User'
import { pushService } from '../services/expoPushNotification'
import { Op } from 'sequelize'

const router = Router()

// Type definitions for socket events
interface PostCreatedData {
  postId: string;
  userId: string;
  title: string;
  category: string;
  mediaUrl: string;
  status: string;
  timestamp: number;
}

interface PostApprovedData {
  postId: string;
  userId: string;
  title: string;
  timestamp: number;
}

interface PostRejectedData {
  postId: string;
  userId: string;
  reason: string;
  timestamp: number;
}

interface PostDeletedData {
  postId: string;
  timestamp: number;
}

interface PostViewedData {
  postId: string;
  userId: string | null;
  viewsCount: number;
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

// Helper function to check if user is admin
const isAdmin = (req: AuthRequest): boolean => {
  if (!req.user) return false;
  return req.user.role === 'admin' || req.user.user_metadata?.role === 'admin';
}

// Helper to safely get post ID from params
const getPostId = (params: any): string => {
  const id = params.id;
  return Array.isArray(id) ? id[0] : String(id);
}

// =================================
// 1. PUBLIC ROUTES
// =================================

// Get public feed
router.get('/feed', async (req: Request, res: Response) => {
  try {
    const page: number = Number(req.query.page) || 1
    const limit: number = Number(req.query.limit) || 20
    const offset: number = (page - 1) * limit
    
    const { count, rows: posts } = await Post.findAndCountAll({
      where: { status: 'posted' },
      include: [{ 
        model: User, 
        attributes: ['name', 'avatar_url', 'location'] 
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    })
    
    res.json({
      posts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Feed error:', error)
    res.status(500).json({ error: 'Failed to get feed' })
  }
})

// Get poll for a post
router.get('/:id/poll', async (req: Request, res: Response) => {
  try {
    const postId = getPostId(req.params)
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

// Get single post
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const postId = getPostId(req.params)
    const post = await Post.findByPk(postId, {
      include: [{ 
        model: User, 
        attributes: ['name', 'avatar_url', 'location'] 
      }]
    })
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    
    res.json(post)
  } catch (error) {
    console.error('Get post error:', error)
    res.status(500).json({ error: 'Failed to get post' })
  }
})

// Get post likes count
router.get('/:id/likes', async (req: Request, res: Response) => {
  try {
    const postId = getPostId(req.params)
    const count: number = await PostLike.count({ where: { post_id: postId } })
    res.json({ post_id: postId, likes: count })
  } catch (err) {
    console.error('Likes error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Track view
router.post('/:id/view', async (req: AuthRequest, res: Response) => {
  try {
    const postId = getPostId(req.params)
    const userId: string | null = req.user?.id || null
    
    // Increment view count
    await Post.increment('views_count', { where: { id: postId } })
    
    // Record view if user is logged in
    if (userId) {
      await PostView.create({
        user_id: userId,
        post_id: postId,
        viewed_at: new Date()
      })
    }
    
    // Get updated post
    const post = await Post.findByPk(postId, {
      attributes: ['id', 'views_count']
    })
    
    // SOCKET.IO - Emit view event
    const io = req.app.get('io')
    if (io && post) {
      const viewData: PostViewedData = {
        postId,
        userId,
        viewsCount: post.views_count,
        timestamp: Date.now()
      }
      
      io.to(`post:${postId}`).emit('view_count_updated', viewData)
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

// Create new post
protectedRouter.post('/create', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { title, description, media_url, media_type, category } = req.body
    const userId: string = req.user.id

    if (!title || !media_url || !category) {
      return res.status(400).json({ error: 'Title, media, and category required' })
    }

    const validCategories: string[] = ['entertainment', 'community', 'service', 'poster', 'news', 'rally']
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
    const admins = await User.findAll({
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

    // SOCKET.IO - Emit new post events
    const io = req.app.get('io')
    if (io) {
      const postData: PostCreatedData = {
        postId: post.id,
        userId,
        title,
        category,
        mediaUrl: media_url,
        status: 'pending',
        timestamp: Date.now()
      }

      // Notify all admins
      for (const admin of admins) {
        io.to(`user:${admin.id}`).emit('new_post_pending', postData)
      }

      // Emit to admin room
      io.to('admins').emit('new_post_submitted', postData)

      // Confirm to creator
      io.to(`user:${userId}`).emit('post_created', {
        ...postData,
        message: 'Your post has been submitted for review'
      })
    }

    return res.json({
      success: true,
      message: 'Post submitted for review!',
      post: { id: post.id, title: post.title, status: post.status }
    })
  } catch (error) {
    console.error('Create post error:', error)
    return res.status(500).json({ error: 'Failed to create post' })
  }
})

// Approve post (Admin only)
protectedRouter.post('/approve/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' })
    }
    
    const postId = getPostId(req.params)
    const post = await Post.findByPk(postId, {
      include: [{ model: User }]
    })
    
    if (!post) {
      return res.status(404).json({ error: 'Not found' })
    }
    
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
    
    // SOCKET.IO - Emit post approved events
    const io = req.app.get('io')
    if (io) {
      const approvedData: PostApprovedData = {
        postId: post.id,
        userId: post.user_id,
        title: post.title,
        timestamp: Date.now()
      }

      // Notify post owner
      io.to(`user:${post.user_id}`).emit('post_approved', {
        ...approvedData,
        message: 'Your post has been approved and is now live!'
      })

      // Broadcast new post to all users
      io.emit('feed_new_post', {
        postId: post.id,
        userId: post.user_id,
        title: post.title,
        post: post.toJSON(),
        timestamp: Date.now()
      })

      // Notify admins
      io.to('admins').emit('post_moderated', {
        postId: post.id,
        action: 'approved',
        moderatedBy: req.user.id,
        timestamp: Date.now()
      })
    }
    
    return res.json({ success: true, message: 'LIVE!' })
  } catch (error) {
    console.error('Approve post error:', error)
    return res.status(500).json({ error: 'Failed to approve post' })
  }
})

// Reject post (Admin only)
protectedRouter.post('/reject/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' })
    }
    
    const postId = getPostId(req.params)
    const { reason } = req.body
    const post = await Post.findByPk(postId)
    
    if (!post) {
      return res.status(404).json({ error: 'Not found' })
    }
    
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
    
    // SOCKET.IO - Emit post rejected events
    const io = req.app.get('io')
    if (io) {
      const rejectedData: PostRejectedData = {
        postId: post.id,
        userId: post.user_id,
        reason: reason || 'Not specified',
        timestamp: Date.now()
      }

      // Notify post owner
      io.to(`user:${post.user_id}`).emit('post_rejected', {
        ...rejectedData,
        message: 'Your post was not approved'
      })

      // Notify admins
      io.to('admins').emit('post_moderated', {
        postId: post.id,
        action: 'rejected',
        moderatedBy: req.user.id,
        timestamp: Date.now()
      })
    }
    
    return res.json({ success: true, message: 'Rejected' })
  } catch (error) {
    console.error('Reject post error:', error)
    return res.status(500).json({ error: 'Failed to reject post' })
  }
})

// Admin delete post
protectedRouter.delete('/admin/delete/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' })
    }
    
    const postId = getPostId(req.params)
    const post = await Post.findByPk(postId)
    if (!post) {
      return res.status(404).json({ error: 'Not found' })
    }
    
    const postUserId: string = post.user_id
    
    await post.destroy()
    
    // SOCKET.IO - Emit post deleted events
    const io = req.app.get('io')
    if (io) {
      // Notify post owner
      io.to(`user:${postUserId}`).emit('post_deleted_admin', {
        postId,
        message: 'Your post has been removed by an admin',
        timestamp: Date.now()
      })

      // Notify all users viewing this post
      io.to(`post:${postId}`).emit('post_removed', {
        postId,
        reason: 'admin_deletion',
        timestamp: Date.now()
      })

      // Notify admins
      io.to('admins').emit('post_moderated', {
        postId,
        action: 'deleted',
        moderatedBy: req.user.id,
        timestamp: Date.now()
      })
    }
    
    return res.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return res.status(500).json({ error: 'Failed to delete post' })
  }
})

// Get pending posts (Admin only)
protectedRouter.get('/admin/pending', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' })
    }
    
    const posts = await Post.findAll({
      where: { status: 'pending' },
      include: [{ model: User, attributes: ['name', 'phone'] }],
      order: [['created_at', 'DESC']]
    })
    
    return res.json(posts)
  } catch (error) {
    console.error('Get pending posts error:', error)
    return res.status(500).json({ error: 'Failed to get pending posts' })
  }
})

// Update post (Admin only)
protectedRouter.patch('/update/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' })
    }
    
    const postId = getPostId(req.params)
    const { title, category, media_url, description } = req.body
    const post = await Post.findByPk(postId)
    if (!post) {
      return res.status(404).json({ error: 'Not found' })
    }

    if (title !== undefined) post.title = title
    if (category !== undefined) post.category = category
    if (media_url !== undefined) post.photo_url = media_url
    if (description !== undefined) post.description = description

    await post.save()
    
    // SOCKET.IO - Emit post updated event
    const io = req.app.get('io')
    if (io) {
      io.to(`post:${post.id}`).emit('post_updated', {
        postId: post.id,
        type: 'content_update',
        timestamp: Date.now()
      })
      
      io.to('admins').emit('post_edited', {
        postId: post.id,
        editedBy: req.user.id,
        timestamp: Date.now()
      })
    }
    
    return res.json({ success: true })
  } catch (error) {
    console.error('Update post error:', error)
    return res.status(500).json({ error: 'Failed to update post' })
  }
})

router.use(protectedRouter)

export default router