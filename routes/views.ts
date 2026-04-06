// routes/views.ts - FIXED (tracking endpoints are public)
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostView } from '../models/PostView'
import { Post } from '../models/Post'
import { Comment } from '../models/Comment'
import { LiveEvent } from '../models/LiveEvent'
import { User } from '../models/User'
import { Op } from 'sequelize'

const router = Router()

// Helper functions
const getString = (value: any): string => {
  if (!value) return ''
  return Array.isArray(value) ? value[0] : String(value)
}

const getNumber = (value: any, defaultValue: number): number => {
  if (!value) return defaultValue
  const str = Array.isArray(value) ? value[0] : value
  const num = Number(str)
  return isNaN(num) ? defaultValue : num
}

const getIpAddress = (req: any): string | null => {
  return req.ip || req.socket?.remoteAddress || null
}

const getUserAgent = (req: any): string | null => {
  return req.headers['user-agent'] || null
}

// Generic view tracking function
async function trackView(
  entityType: string,
  entityId: string,
  userId: string | null | undefined,
  ipAddress: string | null,
  userAgent: string | null
) {
  const safeUserId = userId || null
  
  const timeWindow = new Date()
  timeWindow.setMinutes(timeWindow.getMinutes() - 5)

  const existingView = await PostView.findOne({
    where: {
      entity_type: entityType,
      entity_id: entityId,
      viewed_at: { [Op.gte]: timeWindow },
      ...(safeUserId ? { user_id: safeUserId } : { ip_address: ipAddress })
    }
  })

  if (!existingView) {
    // Update entity view count
    switch (entityType) {
      case 'post':
        await Post.increment('views_count', { where: { id: entityId } })
        break
      case 'comment':
        await Comment.increment('views_count', { where: { id: entityId } })
        break
      case 'event':
        await LiveEvent.increment('viewer_count', { where: { id: entityId } })
        break
    }

    await PostView.create({
      user_id: safeUserId,
      entity_type: entityType,
      entity_id: entityId,
      ip_address: ipAddress,
      user_agent: userAgent?.substring(0, 255)
    })
  }
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Track post view (PUBLIC - no auth)
router.post('/track/:postId', async (req, res) => {
  try {
    const postId = getString(req.params.postId)
    const userId = req.user?.id
    const ipAddress = getIpAddress(req)
    const userAgent = getUserAgent(req)

    await trackView('post', postId, userId, ipAddress, userAgent)
    res.json({ success: true })
  } catch (error) {
    console.error('Error tracking view:', error)
    res.status(500).json({ success: false, error: 'Failed to track view' })
  }
})

// Get view count for a post (PUBLIC - no auth)
router.get('/count/:postId', async (req, res) => {
  try {
    const postId = getString(req.params.postId)
    
    const post = await Post.findByPk(postId, {
      attributes: ['views_count']
    })
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    
    res.json({ 
      postId, 
      viewsCount: post.views_count 
    })
  } catch (error) {
    console.error('Error getting view count:', error)
    res.status(500).json({ error: 'Failed to get view count' })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

const protectedRouter = Router()
protectedRouter.use(requireAuth)

// Get user's view history
protectedRouter.get('/my-history', async (req, res) => {
  try {
    const userId = req.user.id
    const page = getNumber(req.query.page, 1)
    const limit = getNumber(req.query.limit, 20)

    const views = await PostView.findAll({
      where: { user_id: userId },
      order: [['viewed_at', 'DESC']],
      limit: limit,
      offset: (page - 1) * limit
    })

    const enrichedViews = await Promise.all(views.map(async (view) => {
      let entity = null
      switch (view.entity_type) {
        case 'post':
          entity = await Post.findByPk(view.entity_id, {
            attributes: ['id', 'title', 'photo_url'],
            include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
          })
          break
        case 'comment':
          entity = await Comment.findByPk(view.entity_id, {
            attributes: ['id', 'content'],
            include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
          })
          break
        case 'event':
          entity = await LiveEvent.findByPk(view.entity_id, {
            attributes: ['id', 'title', 'image_url', 'scheduled_start']
          })
          break
      }
      return {
        id: view.id,
        viewed_at: view.viewed_at,
        entity_type: view.entity_type,
        entity_id: view.entity_id,
        entity
      }
    }))

    res.json(enrichedViews)
  } catch (error) {
    console.error('Error getting view history:', error)
    res.status(500).json({ error: 'Failed to get view history' })
  }
})

// Get post analytics (owner only)
protectedRouter.get('/analytics/:postId', async (req, res) => {
  try {
    const userId = req.user.id
    const postId = getString(req.params.postId)
    const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

    const post = await Post.findByPk(postId)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const totalViews = await PostView.count({
      where: { entity_type: 'post', entity_id: postId }
    })

    const uniqueViewers = await PostView.count({
      where: { 
        entity_type: 'post',
        entity_id: postId,
        user_id: { [Op.ne]: null }
      },
      distinct: true,
      col: 'user_id'
    })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const viewsByDay = await PostView.findAll({
      where: {
        entity_type: 'post',
        entity_id: postId,
        viewed_at: { [Op.gte]: sevenDaysAgo }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('viewed_at')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('viewed_at'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('viewed_at')), 'ASC']]
    })

    res.json({
      postId,
      totalViews,
      uniqueViewers,
      viewsByDay: viewsByDay.map(v => ({
        date: v.getDataValue('date'),
        count: parseInt(v.getDataValue('count'))
      }))
    })
  } catch (error) {
    console.error('Error getting analytics:', error)
    res.status(500).json({ error: 'Failed to get analytics' })
  }
})

router.use(protectedRouter)

export default router