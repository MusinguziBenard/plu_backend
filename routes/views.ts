// // routes/views.ts - FIXED (tracking endpoints are public)
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { PostView } from '../models/PostView'
// import { Post } from '../models/Post'
// import { Comment } from '../models/Comment'
// import { LiveEvent } from '../models/LiveEvent'
// import { User } from '../models/User'
// import { Op } from 'sequelize'

// const router = Router()

// // Helper functions
// const getString = (value: any): string => {
//   if (!value) return ''
//   return Array.isArray(value) ? value[0] : String(value)
// }

// const getNumber = (value: any, defaultValue: number): number => {
//   if (!value) return defaultValue
//   const str = Array.isArray(value) ? value[0] : value
//   const num = Number(str)
//   return isNaN(num) ? defaultValue : num
// }

// const getIpAddress = (req: any): string | null => {
//   return req.ip || req.socket?.remoteAddress || null
// }

// const getUserAgent = (req: any): string | null => {
//   return req.headers['user-agent'] || null
// }

// // Generic view tracking function
// async function trackView(
//   entityType: string,
//   entityId: string,
//   userId: string | null | undefined,
//   ipAddress: string | null,
//   userAgent: string | null
// ) {
//   const safeUserId = userId || null
  
//   const timeWindow = new Date()
//   timeWindow.setMinutes(timeWindow.getMinutes() - 5)

//   const existingView = await PostView.findOne({
//     where: {
//       entity_type: entityType,
//       entity_id: entityId,
//       viewed_at: { [Op.gte]: timeWindow },
//       ...(safeUserId ? { user_id: safeUserId } : { ip_address: ipAddress })
//     }
//   })

//   if (!existingView) {
//     // Update entity view count
//     switch (entityType) {
//       case 'post':
//         await Post.increment('views_count', { where: { id: entityId } })
//         break
//       case 'comment':
//         await Comment.increment('views_count', { where: { id: entityId } })
//         break
//       case 'event':
//         await LiveEvent.increment('viewer_count', { where: { id: entityId } })
//         break
//     }

//     await PostView.create({
//       user_id: safeUserId,
//       entity_type: entityType,
//       entity_id: entityId,
//       ip_address: ipAddress,
//       user_agent: userAgent?.substring(0, 255)
//     })
//   }
// }

// // ============================================
// // PUBLIC ROUTES (No authentication required)
// // ============================================

// // Track post view (PUBLIC - no auth)
// router.post('/track/:postId', async (req, res) => {
//   try {
//     const postId = getString(req.params.postId)
//     const userId = req.user?.id
//     const ipAddress = getIpAddress(req)
//     const userAgent = getUserAgent(req)

//     await trackView('post', postId, userId, ipAddress, userAgent)
//     res.json({ success: true })
//   } catch (error) {
//     console.error('Error tracking view:', error)
//     res.status(500).json({ success: false, error: 'Failed to track view' })
//   }
// })

// // Get view count for a post (PUBLIC - no auth)
// router.get('/count/:postId', async (req, res) => {
//   try {
//     const postId = getString(req.params.postId)
    
//     const post = await Post.findByPk(postId, {
//       attributes: ['views_count']
//     })
    
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' })
//     }
    
//     res.json({ 
//       postId, 
//       viewsCount: post.views_count 
//     })
//   } catch (error) {
//     console.error('Error getting view count:', error)
//     res.status(500).json({ error: 'Failed to get view count' })
//   }
// })

// // ============================================
// // PROTECTED ROUTES (Authentication required)
// // ============================================

// const protectedRouter = Router()
// protectedRouter.use(requireAuth)

// // Get user's view history
// protectedRouter.get('/my-history', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const page = getNumber(req.query.page, 1)
//     const limit = getNumber(req.query.limit, 20)

//     const views = await PostView.findAll({
//       where: { user_id: userId },
//       order: [['viewed_at', 'DESC']],
//       limit: limit,
//       offset: (page - 1) * limit
//     })

//     const enrichedViews = await Promise.all(views.map(async (view) => {
//       let entity = null
//       switch (view.entity_type) {
//         case 'post':
//           entity = await Post.findByPk(view.entity_id, {
//             attributes: ['id', 'title', 'photo_url'],
//             include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
//           })
//           break
//         case 'comment':
//           entity = await Comment.findByPk(view.entity_id, {
//             attributes: ['id', 'content'],
//             include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
//           })
//           break
//         case 'event':
//           entity = await LiveEvent.findByPk(view.entity_id, {
//             attributes: ['id', 'title', 'image_url', 'scheduled_start']
//           })
//           break
//       }
//       return {
//         id: view.id,
//         viewed_at: view.viewed_at,
//         entity_type: view.entity_type,
//         entity_id: view.entity_id,
//         entity
//       }
//     }))

//     res.json(enrichedViews)
//   } catch (error) {
//     console.error('Error getting view history:', error)
//     res.status(500).json({ error: 'Failed to get view history' })
//   }
// })

// // Get post analytics (owner only)
// protectedRouter.get('/analytics/:postId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const postId = getString(req.params.postId)
//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

//     const post = await Post.findByPk(postId)
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' })
//     }

//     if (post.user_id !== userId && !isAdmin) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     const totalViews = await PostView.count({
//       where: { entity_type: 'post', entity_id: postId }
//     })

//     const uniqueViewers = await PostView.count({
//       where: { 
//         entity_type: 'post',
//         entity_id: postId,
//         user_id: { [Op.ne]: null }
//       },
//       distinct: true,
//       col: 'user_id'
//     })

//     const sevenDaysAgo = new Date()
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

//     const viewsByDay = await PostView.findAll({
//       where: {
//         entity_type: 'post',
//         entity_id: postId,
//         viewed_at: { [Op.gte]: sevenDaysAgo }
//       },
//       attributes: [
//         [require('sequelize').fn('DATE', require('sequelize').col('viewed_at')), 'date'],
//         [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
//       ],
//       group: [require('sequelize').fn('DATE', require('sequelize').col('viewed_at'))],
//       order: [[require('sequelize').fn('DATE', require('sequelize').col('viewed_at')), 'ASC']]
//     })

//     res.json({
//       postId,
//       totalViews,
//       uniqueViewers,
//       viewsByDay: viewsByDay.map(v => ({
//         date: v.getDataValue('date'),
//         count: parseInt(v.getDataValue('count'))
//       }))
//     })
//   } catch (error) {
//     console.error('Error getting analytics:', error)
//     res.status(500).json({ error: 'Failed to get analytics' })
//   }
// })

// router.use(protectedRouter)

// export default router


// routes/views.ts - FIXED (tracking endpoints are public) + Socket.IO Integration
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostView } from '../models/PostView'
import { Post } from '../models/Post'
import { Comment } from '../models/Comment'
import { LiveEvent } from '../models/LiveEvent'
import { User } from '../models/User'
import { Op } from 'sequelize'
import { fn, col } from 'sequelize'

const router = Router()

// Type definitions for socket events
interface ViewCountUpdateData {
  postId: string;
  viewsCount: number;
  timestamp: number;
}

interface EventViewerCountUpdateData {
  eventId: string;
  viewerCount: number;
  timestamp: number;
}

interface PostAnalyticsUpdateData {
  postId: string;
  type: 'view';
  viewsCount: number;
  timestamp: number;
}

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
): Promise<boolean> {
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

    return true // New view tracked
  }
  
  return false // Duplicate view within time window
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Track post view (PUBLIC - no auth) - WITH SOCKET.IO
router.post('/track/:postId', async (req, res) => {
  try {
    const postId: string = getString(req.params.postId)
    const userId: string | undefined = req.user?.id
    const ipAddress: string | null = getIpAddress(req)
    const userAgent: string | null = getUserAgent(req)

    const isNewView: boolean = await trackView('post', postId, userId, ipAddress, userAgent)
    
    // Emit socket event for real-time view updates
    if (isNewView) {
      const io = req.app.get('io')
      
      // Get updated post with view count
      const post = await Post.findByPk(postId, {
        attributes: ['id', 'views_count']
      })
      
      if (post) {
        const viewCountData: ViewCountUpdateData = {
          postId,
          viewsCount: post.views_count,
          timestamp: Date.now()
        }
        
        // Emit to the post room so anyone viewing this post gets updated count
        io.to(`post:${postId}`).emit('view_count_updated', viewCountData)
        
        // Also emit a general analytics update for the post owner
        const analyticsData: PostAnalyticsUpdateData = {
          postId,
          type: 'view',
          viewsCount: post.views_count,
          timestamp: Date.now()
        }
        io.emit('post_analytics_update', analyticsData)
      }
    }
    
    res.json({ success: true, isNewView })
  } catch (error) {
    console.error('Error tracking view:', error)
    res.status(500).json({ success: false, error: 'Failed to track view' })
  }
})

// Track event view (PUBLIC - no auth) - WITH SOCKET.IO
router.post('/track/event/:eventId', async (req, res) => {
  try {
    const eventId: string = getString(req.params.eventId)
    const userId: string | undefined = req.user?.id
    const ipAddress: string | null = getIpAddress(req)
    const userAgent: string | null = getUserAgent(req)

    const isNewView: boolean = await trackView('event', eventId, userId, ipAddress, userAgent)
    
    if (isNewView) {
      const io = req.app.get('io')
      const event = await LiveEvent.findByPk(eventId, {
        attributes: ['id', 'viewer_count']
      })
      
      if (event) {
        const eventData: EventViewerCountUpdateData = {
          eventId,
          viewerCount: event.viewer_count,
          timestamp: Date.now()
        }
        
        io.to(`event:${eventId}`).emit('event_viewer_count_updated', eventData)
      }
    }
    
    res.json({ success: true, isNewView })
  } catch (error) {
    console.error('Error tracking event view:', error)
    res.status(500).json({ success: false, error: 'Failed to track event view' })
  }
})

// Get view count for a post (PUBLIC - no auth)
router.get('/count/:postId', async (req, res) => {
  try {
    const postId: string = getString(req.params.postId)
    
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
    const userId: string = req.user.id
    const page: number = getNumber(req.query.page, 1)
    const limit: number = getNumber(req.query.limit, 20)

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

// Get post analytics (owner only) - WITH SOCKET.IO
protectedRouter.get('/analytics/:postId', async (req, res) => {
  try {
    const userId: string = req.user.id
    const postId: string = getString(req.params.postId)
    const isAdmin: boolean = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

    const post = await Post.findByPk(postId)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const totalViews: number = await PostView.count({
      where: { entity_type: 'post', entity_id: postId }
    })

    const uniqueViewers: number = await PostView.count({
      where: { 
        entity_type: 'post',
        entity_id: postId,
        user_id: { [Op.ne]: null }
      },
      distinct: true,
      col: 'user_id'
    })

    const sevenDaysAgo: Date = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const viewsByDay = await PostView.findAll({
      where: {
        entity_type: 'post',
        entity_id: postId,
        viewed_at: { [Op.gte]: sevenDaysAgo }
      },
      attributes: [
        [fn('DATE', col('viewed_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE', col('viewed_at'))],
      order: [[fn('DATE', col('viewed_at')), 'ASC']]
    })

    const analytics = {
      postId,
      totalViews,
      uniqueViewers,
      viewsByDay: viewsByDay.map((v: any) => ({
        date: v.getDataValue('date'),
        count: parseInt(v.getDataValue('count'))
      }))
    }

    // Emit analytics update via socket
    const io = req.app.get('io')
    io.to(`user:${userId}`).emit('post_analytics_update', {
      ...analytics,
      timestamp: Date.now()
    })

    res.json(analytics)
  } catch (error) {
    console.error('Error getting analytics:', error)
    res.status(500).json({ error: 'Failed to get analytics' })
  }
})

// Subscribe to real-time analytics (WebSocket connection for live updates)
protectedRouter.post('/analytics/:postId/subscribe', async (req, res) => {
  try {
    const userId: string = req.user.id
    const postId: string = getString(req.params.postId)

    const post = await Post.findByPk(postId)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Verify ownership or admin
    if (post.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // The actual subscription happens on the client side via socket
    // This endpoint just confirms the subscription is allowed
    res.json({ 
      success: true, 
      message: 'Subscribed to real-time analytics',
      socketRoom: `analytics:${postId}` 
    })
  } catch (error) {
    console.error('Error subscribing to analytics:', error)
    res.status(500).json({ error: 'Failed to subscribe to analytics' })
  }
})

router.use(protectedRouter)

export default router