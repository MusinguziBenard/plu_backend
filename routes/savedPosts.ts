// // routes/savedPosts.ts
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { SavedPost } from '../models/SavedPost'
// import { Post } from '../models/Post'
// import { User } from '../models/User'

// const router = Router()
// router.use(requireAuth)

// // Save a post
// router.post('/save/:postId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { postId } = req.params

//     const existing = await SavedPost.findOne({
//       where: { user_id: userId, post_id: postId }
//     })

//     if (existing) {
//       return res.status(400).json({ error: 'Post already saved' })
//     }

//     await SavedPost.create({ user_id: userId, post_id: postId })
//     res.json({ success: true, message: 'Post saved' })
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to save post' })
//   }
// })

// // Unsave a post
// router.delete('/unsave/:postId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { postId } = req.params

//     await SavedPost.destroy({
//       where: { user_id: userId, post_id: postId }
//     })

//     res.json({ success: true, message: 'Post unsaved' })
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to unsave post' })
//   }
// })

// // Get user's saved posts
// router.get('/my-saved', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { page = 1, limit = 20 } = req.query

//     const savedPosts = await SavedPost.findAll({
//       where: { user_id: userId },
//       include: [{
//         model: Post,
//         where: { status: 'posted' },
//         include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
//       }],
//       order: [['created_at', 'DESC']],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit)
//     })

//     const posts = savedPosts.map(sp => sp.post)
//     res.json(posts)
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get saved posts' })
//   }
// })

// // Check if post is saved
// router.get('/check/:postId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { postId } = req.params

//     const saved = await SavedPost.findOne({
//       where: { user_id: userId, post_id: postId }
//     })

//     res.json({ isSaved: !!saved })
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to check saved status' })
//   }
// })

// export default router

// routes/savedPosts.ts
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { SavedPost } from '../models/SavedPost'
import { Post } from '../models/Post'
import { User } from '../models/User'
import { Op } from 'sequelize'

const router = Router()
router.use(requireAuth)

// Type definitions for socket events
interface PostSavedData {
  postId: string;
  userId: string;
  timestamp: number;
}

interface PostUnsavedData {
  postId: string;
  userId: string;
  timestamp: number;
}

interface SavedPostsCountData {
  postId: string;
  savedCount: number;
  timestamp: number;
}

// Save a post
router.post('/save/:postId', async (req, res) => {
  try {
    const userId: string = req.user.id
    const { postId } = req.params

    const existing = await SavedPost.findOne({
      where: { user_id: userId, post_id: postId }
    })

    if (existing) {
      return res.status(400).json({ error: 'Post already saved' })
    }

    await SavedPost.create({ user_id: userId, post_id: postId })

    // Get updated saved count
    const savedCount: number = await SavedPost.count({
      where: { post_id: postId }
    })

    // Socket.IO - Emit save events
    const io = req.app.get('io')
    
    const savedData: PostSavedData = {
      postId,
      userId,
      timestamp: Date.now()
    }
    
    const countData: SavedPostsCountData = {
      postId,
      savedCount,
      timestamp: Date.now()
    }

    // Emit to the post room for real-time UI updates
    io.to(`post:${postId}`).emit('post_saved', savedData)
    
    // Emit saved count update
    io.to(`post:${postId}`).emit('saved_count_updated', countData)
    
    // Emit to user's personal room for saved posts list update
    io.to(`user:${userId}`).emit('saved_posts_updated', {
      type: 'save',
      postId,
      timestamp: Date.now()
    })
    
    // General post update event
    io.to(`post:${postId}`).emit('post_updated', {
      postId,
      type: 'saved',
      userId,
      savedCount,
      timestamp: Date.now()
    })

    res.json({ 
      success: true, 
      message: 'Post saved',
      savedCount 
    })
  } catch (error) {
    console.error('Save post error:', error)
    res.status(500).json({ error: 'Failed to save post' })
  }
})

// Unsave a post
router.delete('/unsave/:postId', async (req, res) => {
  try {
    const userId: string = req.user.id
    const { postId } = req.params

    const deleted = await SavedPost.destroy({
      where: { user_id: userId, post_id: postId }
    })

    if (deleted === 0) {
      return res.status(404).json({ error: 'Post was not saved' })
    }

    // Get updated saved count
    const savedCount: number = await SavedPost.count({
      where: { post_id: postId }
    })

    // Socket.IO - Emit unsave events
    const io = req.app.get('io')
    
    const unsavedData: PostUnsavedData = {
      postId,
      userId,
      timestamp: Date.now()
    }
    
    const countData: SavedPostsCountData = {
      postId,
      savedCount,
      timestamp: Date.now()
    }
    
    // Emit to the post room
    io.to(`post:${postId}`).emit('post_unsaved', unsavedData)
    
    // Emit updated count
    io.to(`post:${postId}`).emit('saved_count_updated', countData)
    
    // Emit to user's personal room
    io.to(`user:${userId}`).emit('saved_posts_updated', {
      type: 'unsave',
      postId,
      timestamp: Date.now()
    })
    
    // General post update event
    io.to(`post:${postId}`).emit('post_updated', {
      postId,
      type: 'unsaved',
      userId,
      savedCount,
      timestamp: Date.now()
    })

    res.json({ 
      success: true, 
      message: 'Post unsaved',
      savedCount 
    })
  } catch (error) {
    console.error('Unsave post error:', error)
    res.status(500).json({ error: 'Failed to unsave post' })
  }
})

// Get user's saved posts
router.get('/my-saved', async (req, res) => {
  try {
    const userId: string = req.user.id
    const page: number = Number(req.query.page) || 1
    const limit: number = Number(req.query.limit) || 20

    const { count, rows: savedPosts } = await SavedPost.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: Post,
        where: { status: 'posted' },
        include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })

    const posts = savedPosts.map((sp: SavedPost) => sp.post)
    
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
    console.error('Get saved posts error:', error)
    res.status(500).json({ error: 'Failed to get saved posts' })
  }
})

// Check if post is saved
router.get('/check/:postId', async (req, res) => {
  try {
    const userId: string = req.user.id
    const { postId } = req.params

    const saved = await SavedPost.findOne({
      where: { user_id: userId, post_id: postId }
    })

    // Get total saved count
    const savedCount: number = await SavedPost.count({
      where: { post_id: postId }
    })

    res.json({ 
      isSaved: !!saved,
      savedCount,
      savedAt: saved?.created_at || null
    })
  } catch (error) {
    console.error('Check saved status error:', error)
    res.status(500).json({ error: 'Failed to check saved status' })
  }
})

// Get saved count for a post (public info)
router.get('/count/:postId', async (req, res) => {
  try {
    const { postId } = req.params
    const savedCount: number = await SavedPost.count({
      where: { post_id: postId }
    })

    res.json({ postId, savedCount })
  } catch (error) {
    console.error('Get saved count error:', error)
    res.status(500).json({ error: 'Failed to get saved count' })
  }
})

// Batch check saved status for multiple posts
router.post('/check-batch', async (req, res) => {
  try {
    const userId: string = req.user.id
    const { postIds }: { postIds: string[] } = req.body

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'postIds array is required' })
    }

    const savedPosts = await SavedPost.findAll({
      where: {
        user_id: userId,
        post_id: { [Op.in]: postIds }
      },
      attributes: ['post_id', 'created_at']
    })

    const savedMap: Record<string, { isSaved: boolean; savedAt: string | null }> = {}
    
    // Initialize all posts as not saved
    postIds.forEach((id: string) => {
      savedMap[id] = { isSaved: false, savedAt: null }
    })

    // Mark saved posts
    savedPosts.forEach((sp: SavedPost) => {
      savedMap[sp.post_id] = {
        isSaved: true,
        savedAt: sp.created_at?.toISOString() || null
      }
    })

    // Get saved counts for all posts
    const savedCounts = await SavedPost.findAll({
      where: { post_id: { [Op.in]: postIds } },
      attributes: ['post_id', [require('sequelize').fn('COUNT', require('sequelize').col('post_id')), 'count']],
      group: ['post_id']
    })

    const countMap: Record<string, number> = {}
    savedCounts.forEach((item: any) => {
      countMap[item.post_id] = parseInt(item.getDataValue('count'))
    })

    res.json({
      savedStatus: savedMap,
      savedCounts: countMap
    })
  } catch (error) {
    console.error('Batch check error:', error)
    res.status(500).json({ error: 'Failed to check saved status' })
  }
})

export default router