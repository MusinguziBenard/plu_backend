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


// routes/posts.ts - ENHANCED WITH MAXIMUM NOTIFICATION COVERAGE (FIXED TYPES)
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Post } from '../models/Post'
import { PostLike } from '../models/PostLike'
import { PostView } from '../models/PostView'
import { pushService } from '../services/expoPushNotification'
import { Op } from 'sequelize'

const router = Router()

// Type definitions
interface User {
  id: string;
  name?: string;
  avatar_url?: string;
  role?: string;
}

interface PostWithUser extends Post {
  User?: User;
}

interface PushTokenWithUser {
  id: string;
  user_id: string;
  expo_push_token: string;
  is_active: boolean;
  User?: User;
}

// Helper function to get all users except specified
async function getAllUsersExcept(excludeUserId: string): Promise<User[]> {
  const { User } = require('../models/User')
  return await User.findAll({
    where: { id: { [Op.ne]: excludeUserId } },
    attributes: ['id', 'name', 'avatar_url']
  }) as User[]
}

// Helper to broadcast to all users via all channels
async function broadcastToAllUsers(io: any, event: string, data: any, excludeUserId?: string): Promise<void> {
  if (!io) return
  
  // 1. Socket.IO broadcast to all connected users
  io.emit(event, data)
  
  // 2. Also emit to individual user rooms for redundancy
  const { User } = require('../models/User')
  const allUsers = await User.findAll({
    where: excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {},
    attributes: ['id']
  }) as User[]
  
  // Emit to each user's room (good for tracking who received it)
  for (const user of allUsers) {
    io.to(`user:${user.id}`).emit(`${event}_personal`, {
      ...data,
      userId: user.id
    })
  }
}

// Helper to create notifications for ALL users
async function createNotificationForAllUsers(
  post: any, 
  postOwner: User | null, 
  excludeUserId?: string
): Promise<any[]> {
  const { Notification } = require('../models/Notification')
  const { User } = require('../models/User')
  
  // Get all users
  const allUsers = await User.findAll({
    where: excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {},
    attributes: ['id']
  }) as User[]
  
  if (allUsers.length === 0) return []
  
  // Create notification object template
  const notificationTemplate = {
    type: 'new_post',
    reference_id: post.id,
    title: '📢 New Post Available!',
    message: `${postOwner?.name || 'Someone'} just posted: "${post.title.substring(0, 60)}${post.title.length > 60 ? '...' : ''}"`,
    read: false,
    push_sent: false,
    data: JSON.stringify({
      postId: post.id,
      postTitle: post.title,
      postPhoto: post.photo_url,
      userName: postOwner?.name,
      category: post.category,
      timestamp: new Date().toISOString()
    })
  }
  
  // Create notifications in batches to avoid memory issues
  const batchSize = 100
  const notifications = []
  
  for (let i = 0; i < allUsers.length; i += batchSize) {
    const batch = allUsers.slice(i, i + batchSize)
    const notificationBatch = batch.map((user: User) => ({
      user_id: user.id,
      ...notificationTemplate
    }))
    
    const created = await Notification.bulkCreate(notificationBatch, {
      ignoreDuplicates: true
    })
    notifications.push(...created)
  }
  
  return notifications
}

// Helper to send push notifications to ALL active users
async function sendPushToAllUsers(post: any, postOwner: User | null, excludeUserId?: string): Promise<any[]> {
  const { UserPushToken } = require('../models/UserPushToken')
  const { User } = require('../models/User')
  
  // Get all active push tokens
  const activeTokens = await UserPushToken.findAll({
    where: { is_active: true },
    include: [{ model: User, attributes: ['id'] }]
  }) as PushTokenWithUser[]
  
  if (activeTokens.length === 0) return []
  
  // Filter out excluded user if needed
  const tokensToSend = excludeUserId 
    ? activeTokens.filter((token: PushTokenWithUser) => token.user_id !== excludeUserId)
    : activeTokens
  
  // Send push notifications in parallel with error handling
  const pushPromises = tokensToSend.map((token: PushTokenWithUser) => 
    pushService.sendPushNotification(
      token.expo_push_token,
      '📢 New Post Alert!',
      `${postOwner?.name || 'Someone'} shared: "${post.title.substring(0, 50)}"`,
      { 
        postId: post.id, 
        screen: 'Feed',
        type: 'new_post',
        timestamp: Date.now()
      }
    ).catch((err: Error) => {
      console.error(`Push failed for token ${token.id}:`, err.message)
      return null
    })
  )
  
  const results = await Promise.allSettled(pushPromises)
  return results.filter((r: PromiseSettledResult<any>) => r.status === 'fulfilled' && r.value)
}

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

// Get poll for a post
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

// Get single post
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

// Get post likes count
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
    const userId = (req as any).user?.id
    
    await Post.increment('views_count', { where: { id: postId } })
    
    if (userId) {
      await PostView.create({
        user_id: userId,
        post_id: postId,
        viewed_at: new Date()
      })
    }
    
    const io = req.app.get('io')
    if (io) {
      const updatedPost = await Post.findByPk(postId, { attributes: ['views_count'] })
      io.to(`post:${postId}`).emit('view_count_updated', {
        postId,
        viewsCount: updatedPost?.views_count || 0,
        timestamp: Date.now()
      })
    }
    
    res.json({ success: true })
  } catch (err) {
    console.error('View tracking error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Public feed endpoint
router.get('/public-feed', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const posts = await Post.findAll({
      where: { status: 'posted' },
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: offset
    });
    res.json(posts);
  } catch (error: any) {
    console.error('Public feed error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get new posts count for real-time updates
router.get('/new-posts-count', async (req, res) => {
  try {
    const { after } = req.query
    const where: any = { status: 'posted' }
    
    if (after) {
      where.created_at = { [Op.gt]: new Date(after as string) }
    }
    
    const count = await Post.count({ where })
    res.json({ count, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Error getting new posts count:', error)
    res.status(500).json({ error: 'Failed to get count' })
  }
})

// 2. PROTECTED ROUTES
const protectedRouter = Router()
protectedRouter.use(requireAuth)

// Create post
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

  // Notify admins
  const admins = await require('../models/User').User.findAll({
    where: { role: 'admin' }
  }) as User[]
  
  for (const admin of admins) {
    await pushService.createAndSend(
      admin.id,
      'new_post',
      post.id,
      '📝 New Post Needs Review',
      `${req.user.name || 'A user'} submitted: "${title.substring(0, 50)}"`,
      media_url,
      { postId: post.id, action: 'review' }
    )
  }

  const io = req.app.get('io')
  if (io) {
    // Notify admins via Socket.IO
    io.to('admins').emit('new_post_submitted', {
      postId: post.id,
      title,
      userId,
      userName: req.user.name,
      timestamp: Date.now()
    })
    
    // Notify the creator
    io.to(`user:${userId}`).emit('post_created', {
      postId: post.id,
      title,
      message: 'Post submitted for review! You will be notified when it goes live.',
      timestamp: Date.now()
    })
  }

  res.json({
    success: true,
    message: 'Post submitted! You will be notified when approved.',
    post: { id: post.id, title: post.title, status: post.status }
  })
})

// Approve post - ENHANCED WITH FULL BROADCAST
protectedRouter.post('/approve/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
  const post = await Post.findByPk(req.params.id, {
    include: [{ model: require('../models/User').User }]
  }) as PostWithUser | null
  
  if (!post) return res.status(404).json({ error: 'Not found' })
  
  post.status = 'posted'
  await post.save()
  
  const postOwner = post.User || null
  const io = req.app.get('io')
  
  // ==========================================
  // 1. NOTIFY POST OWNER
  // ==========================================
  await pushService.createAndSend(
    post.user_id,
    'post_approved',
    post.id,
    '✅ Your Post is Live! 🎉',
    `"${post.title}" has been approved and is now visible to everyone!`,
    post.photo_url || undefined,
    { postId: post.id, action: 'view' }
  )
  
  if (io) {
    io.to(`user:${post.user_id}`).emit('post_approved', {
      postId: post.id,
      title: post.title,
      message: 'Your post is now live and reaching people! 🚀',
      timestamp: Date.now()
    })
  }
  
  // ==========================================
  // 2. NOTIFY ALL OTHER USERS (IN-APP NOTIFICATIONS)
  // ==========================================
  console.log(`Creating notifications for all users about post: ${post.id}`)
  const notifications = await createNotificationForAllUsers(post, postOwner, post.user_id)
  console.log(`Created ${notifications.length} in-app notifications`)
  
  // ==========================================
  // 3. SEND PUSH NOTIFICATIONS TO ALL ACTIVE USERS
  // ==========================================
  console.log(`Sending push notifications to all active users...`)
  const pushResults = await sendPushToAllUsers(post, postOwner, post.user_id)
  console.log(`Sent ${pushResults.length} push notifications`)
  
  // ==========================================
  // 4. SOCKET.IO BROADCAST TO ALL CONNECTED USERS
  // ==========================================
  if (io) {
    // Prepare post data for broadcast
    const postData = {
      id: post.id,
      title: post.title,
      description: post.description,
      photo_url: post.photo_url,
      video_url: post.video_url,
      category: post.category,
      user: {
        id: postOwner?.id,
        name: postOwner?.name,
        avatar_url: postOwner?.avatar_url
      },
      created_at: post.created_at,
      views_count: post.views_count || 0
    }
    
    // Broadcast to all connected users
    io.emit('new_post_live', {
      post: postData,
      alert: {
        title: '📢 New Post!',
        message: `${postOwner?.name || 'Someone'} just shared: "${post.title.substring(0, 50)}"`,
        action: 'view_post'
      },
      timestamp: Date.now()
    })
    
    // Also emit to individual user rooms for better tracking
    const { User } = require('../models/User')
    const allUsers = await User.findAll({
      where: { id: { [Op.ne]: post.user_id } },
      attributes: ['id']
    }) as User[]
    
    for (const user of allUsers) {
      io.to(`user:${user.id}`).emit('feed_update_available', {
        newPostId: post.id,
        count: 1,
        timestamp: Date.now()
      })
    }
    
    // Notify admins of completion
    io.to('admins').emit('post_moderated', {
      postId: post.id,
      action: 'approved',
      broadcasted: true,
      notificationsSent: notifications.length,
      pushSent: pushResults.length,
      timestamp: Date.now()
    })
  }
  
  // ==========================================
  // 5. TRIGGER ADDITIONAL BACKGROUND EVENTS
  // ==========================================
  // Emit to any feed listeners
  if (io) {
    io.emit('feed_refresh_needed', {
      reason: 'new_post',
      timestamp: Date.now()
    })
  }
  
  res.json({ 
    success: true, 
    message: `Post approved! Broadcasted to ${notifications.length} users via in-app, ${pushResults.length} via push, and all connected via Socket.IO`,
    stats: {
      inAppNotifications: notifications.length,
      pushNotifications: pushResults.length,
      postId: post.id
    }
  })
})

// Reject post
protectedRouter.post('/reject/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
  const { reason } = req.body
  const post = await Post.findByPk(req.params.id) as Post | null
  
  if (!post) return res.status(404).json({ error: 'Not found' })
  
  post.status = 'rejected'
  await post.save()
  
  await pushService.createAndSend(
    post.user_id,
    'post_rejected',
    post.id,
    'Post Not Approved',
    reason || 'Your post was not approved. Please check the guidelines and try again.',
    undefined,
    { postId: post.id }
  )
  
  const io = req.app.get('io')
  if (io) {
    io.to(`user:${post.user_id}`).emit('post_rejected', {
      postId: post.id,
      reason: reason || 'Not specified',
      message: 'Your post was not approved. Please review guidelines and resubmit.',
      timestamp: Date.now()
    })
  }
  
  res.json({ success: true, message: 'Rejected' })
})

// Admin delete post
protectedRouter.delete('/admin/delete/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
  const post = await Post.findByPk(req.params.id) as Post | null
  if (!post) return res.status(404).json({ error: 'Not found' })
  
  const postId = post.id
  const postUserId = post.user_id
  await post.destroy()
  
  const io = req.app.get('io')
  if (io) {
    io.to(`post:${postId}`).emit('post_removed', { postId, timestamp: Date.now() })
    io.to(`user:${postUserId}`).emit('post_deleted_admin', {
      postId,
      message: 'Your post was removed by an administrator',
      timestamp: Date.now()
    })
    
    // Notify all users to remove this post from their feeds
    io.emit('post_removed_broadcast', {
      postId,
      reason: 'removed_by_admin',
      timestamp: Date.now()
    })
  }
  
  res.json({ success: true })
})

// Get pending posts
protectedRouter.get('/admin/pending', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  const posts = await Post.findAll({
    where: { status: 'pending' },
    include: [{ model: require('../models/User').User, attributes: ['name', 'phone'] }],
    order: [['created_at', 'DESC']]
  })
  res.json(posts)
})

// Update post
protectedRouter.patch('/update/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
  const { title, category, media_url, description } = req.body
  const post = await Post.findByPk(req.params.id) as Post | null
  if (!post) return res.status(404).json({ error: 'Not found' })

  if (title !== undefined) post.title = title
  if (category !== undefined) post.category = category
  if (media_url !== undefined) post.photo_url = media_url
  if (description !== undefined) post.description = description

  await post.save()
  
  const io = req.app.get('io')
  if (io) {
    io.to(`post:${post.id}`).emit('post_updated', {
      postId: post.id,
      type: 'content_update',
      timestamp: Date.now()
    })
    
    // Also broadcast update to feed listeners
    io.emit('post_content_updated', {
      postId: post.id,
      timestamp: Date.now()
    })
  }
  
  res.json({ success: true })
})

// Add endpoint to get notification stats for debugging
protectedRouter.get('/stats/broadcast', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only' })
  
  const { Notification } = require('../models/Notification')
  const { UserPushToken } = require('../models/UserPushToken')
  
  const recentNotifications = await Notification.count({
    where: {
      type: 'new_post',
      created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  })
  
  const activeTokens = await UserPushToken.count({
    where: { is_active: true }
  })
  
  res.json({
    stats: {
      last24hInAppNotifications: recentNotifications,
      activePushTokens: activeTokens,
      timestamp: new Date().toISOString()
    }
  })
})

// Helper function
const isAdmin = (req: any): boolean => 
  req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

router.use(protectedRouter)

export default router