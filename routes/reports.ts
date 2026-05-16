// // routes/reports.ts - UPDATED WITH CASCADE SUPPORT
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { Report } from '../models/Report'
// import { Post } from '../models/Post'
// import { Comment } from '../models/Comment'
// import { User } from '../models/User'
// import pushService from '../services/expoPushNotification'

// const router = Router()

// // ============================================
// // PROTECTED ROUTES (Authentication required)
// // ============================================

// const protectedRouter = Router()
// protectedRouter.use(requireAuth)

// // Create a report
// protectedRouter.post('/', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { post_id, comment_id, reason, description } = req.body

//     if (!post_id && !comment_id) {
//       return res.status(400).json({ error: 'Post ID or Comment ID required' })
//     }

//     const report = await Report.create({
//       reporter_id: userId,
//       post_id: post_id || null,
//       comment_id: comment_id || null,
//       reason,
//       description,
//       status: 'pending'
//     })

//     // Notify admins
//     const admins = await User.findAll({
//       where: { role: 'admin' }
//     })

//     for (const admin of admins) {
//       await pushService.createAndSend(
//         admin.id,
//         'new_post',
//         report.id,
//         'New Report',
//         `User reported content: ${reason}`,
//         undefined,
//         { reportId: report.id, type: 'report' }
//       )
//     }

//     res.status(201).json(report)
//   } catch (error) {
//     console.error('Create report error:', error)
//     res.status(500).json({ error: 'Failed to create report' })
//   }
// })

// // Get my reports
// protectedRouter.get('/my-reports', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { page = 1, limit = 20 } = req.query

//     const reports = await Report.findAll({
//       where: { reporter_id: userId },
//       include: [
//         { model: Post, attributes: ['id', 'title'] },
//         { model: Comment, attributes: ['id', 'content'] }
//       ],
//       order: [['created_at', 'DESC']],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit)
//     })

//     res.json(reports)
//   } catch (error) {
//     console.error('Get my reports error:', error)
//     res.status(500).json({ error: 'Failed to get reports' })
//   }
// })

// // ============================================
// // ADMIN ROUTES
// // ============================================

// // Get all reports (Admin only)
// protectedRouter.get('/admin/all', async (req, res) => {
//   try {
//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
//     if (!isAdmin) {
//       return res.status(403).json({ error: 'Admin access required' })
//     }

//     const { page = 1, limit = 20, status } = req.query
//     const where: any = {}
//     if (status) where.status = status

//     const reports = await Report.findAll({
//       where,
//       include: [
//         { model: User, as: 'reporter', attributes: ['id', 'name', 'phone'] },
//         { model: Post, attributes: ['id', 'title', 'user_id'] },
//         { model: Comment, attributes: ['id', 'content', 'user_id'] }
//       ],
//       order: [['created_at', 'DESC']],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit)
//     })

//     res.json(reports)
//   } catch (error) {
//     console.error('Get all reports error:', error)
//     res.status(500).json({ error: 'Failed to get reports' })
//   }
// })

// // Update report status (Admin only) - FIXED VERSION
// protectedRouter.patch('/admin/:reportId/status', async (req, res) => {
//   try {
//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
//     if (!isAdmin) {
//       return res.status(403).json({ error: 'Admin access required' })
//     }

//     const { reportId } = req.params
//     const { status, action_taken } = req.body

//     console.log('Updating report:', reportId, 'Status:', status, 'Action:', action_taken)

//     const report = await Report.findByPk(reportId)
//     if (!report) {
//       return res.status(404).json({ error: 'Report not found' })
//     }

//     report.status = status
//     await report.save()

//     // Handle action taken only if status is 'action_taken'
//     if (status === 'action_taken' && action_taken) {
//       if (action_taken === 'delete_post' && report.post_id) {
//         try {
//           // The poll will be automatically deleted due to CASCADE constraint
//           await Post.destroy({ where: { id: report.post_id } })
//           console.log('Deleted post:', report.post_id)
//         } catch (deleteError) {
//           console.error('Error deleting post:', deleteError)
//           // Don't fail the request, just log the error
//           return res.json({ 
//             success: true, 
//             message: 'Report status updated, but post deletion failed',
//             warning: (deleteError as Error).message
//           })
//         }
//       } else if (action_taken === 'delete_comment' && report.comment_id) {
//         await Comment.destroy({ where: { id: report.comment_id } })
//         console.log('Deleted comment:', report.comment_id)
//       } else if (action_taken === 'warn_user') {
//         // Future feature: send warning to user
//         console.log('Warning sent to user')
//       } else if (action_taken === 'dismiss') {
//         // Just dismiss, no action needed
//         console.log('Report dismissed')
//       }
//     }

//     res.json({ success: true, message: 'Report status updated successfully' })
//   } catch (error) {
//     console.error('Update report status error:', error)
//     res.status(500).json({ error: 'Failed to update report status: ' + (error as Error).message })
//   }
// })

// router.use(protectedRouter)

// export default router


// routes/reports.ts - ORIGINAL CODE + SOCKET.IO ONLY
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Report } from '../models/Report'
import { Post } from '../models/Post'
import { Comment } from '../models/Comment'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'

const router = Router()

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

const protectedRouter = Router()
protectedRouter.use(requireAuth)

// Create a report
protectedRouter.post('/', async (req, res) => {
  try {
    const userId = req.user.id
    const { post_id, comment_id, reason, description } = req.body

    if (!post_id && !comment_id) {
      return res.status(400).json({ error: 'Post ID or Comment ID required' })
    }

    const report = await Report.create({
      reporter_id: userId,
      post_id: post_id || null,
      comment_id: comment_id || null,
      reason,
      description,
      status: 'pending'
    })

    // Notify admins
    const admins = await User.findAll({
      where: { role: 'admin' }
    })

    for (const admin of admins) {
      await pushService.createAndSend(
        admin.id,
        'new_post',
        report.id,
        'New Report',
        `User reported content: ${reason}`,
        undefined,
        { reportId: report.id, type: 'report' }
      )
    }

    // ✅ SOCKET.IO - Emit new report to admins
    const io = req.app.get('io')
    if (io) {
      io.to('admins').emit('new_report', {
        reportId: report.id,
        reporterId: userId,
        postId: post_id || null,
        commentId: comment_id || null,
        reason,
        status: 'pending',
        timestamp: Date.now()
      })
    }

    res.status(201).json(report)
  } catch (error) {
    console.error('Create report error:', error)
    res.status(500).json({ error: 'Failed to create report' })
  }
})

// Get my reports
protectedRouter.get('/my-reports', async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const reports = await Report.findAll({
      where: { reporter_id: userId },
      include: [
        { model: Post, attributes: ['id', 'title'] },
        { model: Comment, attributes: ['id', 'content'] }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    })

    res.json(reports)
  } catch (error) {
    console.error('Get my reports error:', error)
    res.status(500).json({ error: 'Failed to get reports' })
  }
})

// ============================================
// ADMIN ROUTES
// ============================================

// Get all reports (Admin only)
protectedRouter.get('/admin/all', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { page = 1, limit = 20, status } = req.query
    const where: any = {}
    if (status) where.status = status

    const reports = await Report.findAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'phone'] },
        { model: Post, attributes: ['id', 'title', 'user_id'] },
        { model: Comment, attributes: ['id', 'content', 'user_id'] }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    })

    res.json(reports)
  } catch (error) {
    console.error('Get all reports error:', error)
    res.status(500).json({ error: 'Failed to get reports' })
  }
})

// Update report status (Admin only) - FIXED VERSION
protectedRouter.patch('/admin/:reportId/status', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { reportId } = req.params
    const { status, action_taken } = req.body

    console.log('Updating report:', reportId, 'Status:', status, 'Action:', action_taken)

    const report = await Report.findByPk(reportId)
    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    report.status = status
    await report.save()

    // Handle action taken only if status is 'action_taken'
    if (status === 'action_taken' && action_taken) {
      if (action_taken === 'delete_post' && report.post_id) {
        try {
          const postId = report.post_id
          await Post.destroy({ where: { id: postId } })
          console.log('Deleted post:', postId)
          
          // ✅ SOCKET.IO - Emit post deleted
          const io = req.app.get('io')
          if (io) {
            io.to(`post:${postId}`).emit('post_removed', { postId, reason: 'reported', timestamp: Date.now() })
            io.to('admins').emit('content_moderated', { contentType: 'post', contentId: postId, action: 'deleted', reportId, timestamp: Date.now() })
          }
        } catch (deleteError) {
          console.error('Error deleting post:', deleteError)
          return res.json({ 
            success: true, 
            message: 'Report status updated, but post deletion failed',
            warning: (deleteError as Error).message
          })
        }
      } else if (action_taken === 'delete_comment' && report.comment_id) {
        const commentId = report.comment_id
        await Comment.destroy({ where: { id: commentId } })
        console.log('Deleted comment:', commentId)
        
        // ✅ SOCKET.IO - Emit comment deleted
        const io = req.app.get('io')
        if (io) {
          io.to('admins').emit('content_moderated', { contentType: 'comment', contentId: commentId, action: 'deleted', reportId, timestamp: Date.now() })
        }
      } else if (action_taken === 'warn_user') {
        console.log('Warning sent to user')
      } else if (action_taken === 'dismiss') {
        console.log('Report dismissed')
      }
    }

    // ✅ SOCKET.IO - Emit report status changed
    const io = req.app.get('io')
    if (io) {
      io.to('admins').emit('report_status_changed', {
        reportId,
        status,
        actionTaken: action_taken || 'none',
        timestamp: Date.now()
      })
    }

    res.json({ success: true, message: 'Report status updated successfully' })
  } catch (error) {
    console.error('Update report status error:', error)
    res.status(500).json({ error: 'Failed to update report status: ' + (error as Error).message })
  }
})

router.use(protectedRouter)

export default router