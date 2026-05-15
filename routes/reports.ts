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

// routes/reports.ts - WITH FULL SOCKET.IO INTEGRATION
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Report } from '../models/Report'
import { Post } from '../models/Post'
import { Comment } from '../models/Comment'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'
import { fn, col } from 'sequelize'

const router = Router()

// Local type definition for report status
type ReportStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed';

// Type guard to validate report status
const isValidReportStatus = (status: string): status is ReportStatus => {
  return ['pending', 'reviewed', 'action_taken', 'dismissed'].includes(status);
}

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

const protectedRouter = Router()
protectedRouter.use(requireAuth)

// Create a report - WITH SOCKET.IO
protectedRouter.post('/', async (req, res) => {
  try {
    const userId: string = req.user.id
    const { post_id, comment_id, reason, description }: {
      post_id?: string;
      comment_id?: string;
      reason: string;
      description?: string;
    } = req.body

    if (!post_id && !comment_id) {
      return res.status(400).json({ error: 'Post ID or Comment ID required' })
    }

    const report = await Report.create({
      reporter_id: userId,
      post_id: post_id || null,
      comment_id: comment_id || null,
      reason,
      description: description || '',
      status: 'pending'
    })

    // Get reporter info for notifications
    const reporter = await User.findByPk(userId, {
      attributes: ['id', 'name', 'avatar_url']
    })

    // Notify admins via push notification
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

    // ✅ SOCKET.IO - Emit real-time report events
    const io = req.app.get('io')
    
    if (io) {
      const reportData = {
        reportId: report.id,
        reporterId: userId,
        reporterName: reporter?.name || 'Unknown User',
        postId: post_id || null,
        commentId: comment_id || null,
        reason,
        description: description || '',
        status: 'pending' as ReportStatus,
        timestamp: Date.now()
      }

      // 1. Notify all admins via their personal rooms
      for (const admin of admins) {
        io.to(`user:${admin.id}`).emit('new_report', reportData)
        io.to(`notifications:${admin.id}`).emit('admin_notification', {
          type: 'report',
          title: 'New Report',
          message: `${reporter?.name || 'A user'} reported ${reason}`,
          ...reportData
        })
      }

      // 2. Emit to admin room (all admins get it at once)
      io.to('admins').emit('new_report', reportData)

      // 3. Confirm to reporter
      io.to(`user:${userId}`).emit('report_submitted', {
        reportId: report.id,
        message: 'Your report has been submitted and will be reviewed by our team',
        timestamp: Date.now()
      })

      // 4. If reporting a post, notify the post room
      if (post_id) {
        io.to(`post:${post_id}`).emit('content_reported', {
          contentType: 'post',
          contentId: post_id,
          reportId: report.id,
          reason,
          timestamp: Date.now()
        })
      }

      // 5. If reporting a comment, notify the comment's post room
      if (comment_id) {
        const comment = await Comment.findByPk(comment_id, {
          attributes: ['post_id']
        })
        if (comment?.post_id) {
          io.to(`post:${comment.post_id}`).emit('content_reported', {
            contentType: 'comment',
            contentId: comment_id,
            reportId: report.id,
            reason,
            timestamp: Date.now()
          })
        }
      }
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
    const userId: string = req.user.id
    const page: number = Number(req.query.page) || 1
    const limit: number = Number(req.query.limit) || 20

    const { count, rows: reports } = await Report.findAndCountAll({
      where: { reporter_id: userId },
      include: [
        { model: Post, attributes: ['id', 'title', 'photo_url', 'status'] },
        { model: Comment, attributes: ['id', 'content'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })

    res.json({
      reports,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get my reports error:', error)
    res.status(500).json({ error: 'Failed to get reports' })
  }
})

// ============================================
// ADMIN ROUTES
// ============================================

// Get all reports (Admin only) - WITH SOCKET.IO STATS
protectedRouter.get('/admin/all', async (req, res) => {
  try {
    const isAdmin: boolean = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const page: number = Number(req.query.page) || 1
    const limit: number = Number(req.query.limit) || 20
    const status: string | undefined = req.query.status as string

    const where: any = {}
    if (status && isValidReportStatus(status)) {
      where.status = status
    }

    const { count, rows: reports } = await Report.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'phone', 'avatar_url'] },
        { model: Post, attributes: ['id', 'title', 'user_id', 'status'] },
        { model: Comment, attributes: ['id', 'content', 'user_id'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })

    // Get counts by status for admin dashboard
    const statusCounts = await Report.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status']
    })

    const countsByStatus: Record<string, number> = {
      pending: 0,
      reviewed: 0,
      action_taken: 0,
      dismissed: 0
    }
    
    statusCounts.forEach((item: any) => {
      const statusValue: string = item.getDataValue('status')
      if (isValidReportStatus(statusValue)) {
        countsByStatus[statusValue] = parseInt(item.getDataValue('count'))
      }
    })

    const stats = {
      total: count,
      ...countsByStatus
    }

    // ✅ SOCKET.IO - Emit admin dashboard stats
    const io = req.app.get('io')
    if (io) {
      io.to('admins').emit('admin_stats_update', {
        stats,
        timestamp: Date.now()
      })
    }

    res.json({
      reports,
      stats,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get all reports error:', error)
    res.status(500).json({ error: 'Failed to get reports' })
  }
})

// Update report status (Admin only) - WITH FULL SOCKET.IO
protectedRouter.patch('/admin/:reportId/status', async (req, res) => {
  try {
    const adminId: string = req.user.id
    const isAdmin: boolean = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { reportId } = req.params
    const { status, action_taken }: { status: string; action_taken?: string } = req.body

    // Validate status
    if (!isValidReportStatus(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses: ['pending', 'reviewed', 'action_taken', 'dismissed']
      })
    }

    console.log('Updating report:', reportId, 'Status:', status, 'Action:', action_taken)

    const report = await Report.findByPk(reportId, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name'] }
      ]
    })
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    const oldStatus: string = report.status
    report.status = status as ReportStatus
    await report.save()

    // ✅ SOCKET.IO - Emit status update events
    const io = req.app.get('io')
    
    if (io) {
      const statusUpdateData = {
        reportId,
        status: status as ReportStatus,
        oldStatus,
        actionTaken: action_taken || 'none',
        updatedBy: adminId,
        timestamp: Date.now()
      }

      // 1. Notify the reporter about status change
      if (report.reporter_id) {
        io.to(`user:${report.reporter_id}`).emit('report_status_updated', {
          ...statusUpdateData,
          message: `Your report status has been changed from ${oldStatus} to ${status}`
        })
        
        io.to(`notifications:${report.reporter_id}`).emit('new_notification', {
          type: 'report_update',
          reportId,
          status,
          message: `Your report has been ${status.replace('_', ' ')}`,
          timestamp: Date.now()
        })
      }

      // 2. Notify all admins
      io.to('admins').emit('report_status_changed', statusUpdateData)
    }

    // Handle content moderation actions
    if (status === 'action_taken' && action_taken) {
      let moderationData: {
        contentType: 'post' | 'comment';
        contentId: string;
        action: 'deleted' | 'warned' | 'dismissed';
        reportId: string;
        timestamp: number;
      } | null = null;

      if (action_taken === 'delete_post' && report.post_id) {
        try {
          const postId: string = report.post_id
          await Post.destroy({ where: { id: postId } })
          console.log('Deleted post:', postId)
          
          moderationData = {
            contentType: 'post',
            contentId: postId,
            action: 'deleted',
            reportId,
            timestamp: Date.now()
          }
          
          // ✅ SOCKET.IO - Notify post room about deletion
          if (io) {
            io.to(`post:${postId}`).emit('post_deleted', {
              postId,
              reason: 'reported_content',
              reportId,
              timestamp: Date.now()
            })
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
        const commentId: string = report.comment_id
        await Comment.destroy({ where: { id: commentId } })
        console.log('Deleted comment:', commentId)
        
        moderationData = {
          contentType: 'comment',
          contentId: commentId,
          action: 'deleted',
          reportId,
          timestamp: Date.now()
        }
      } else if (action_taken === 'warn_user') {
        console.log('Warning sent to user')
        moderationData = {
          contentType: report.post_id ? 'post' : 'comment',
          contentId: report.post_id || report.comment_id || '',
          action: 'warned',
          reportId,
          timestamp: Date.now()
        }
      } else if (action_taken === 'dismiss') {
        console.log('Report dismissed')
        moderationData = {
          contentType: report.post_id ? 'post' : 'comment',
          contentId: report.post_id || report.comment_id || '',
          action: 'dismissed',
          reportId,
          timestamp: Date.now()
        }
      }

      // ✅ SOCKET.IO - Emit moderation events
      if (io && moderationData) {
        io.to('admins').emit('content_moderated', moderationData)
        
        io.to('admins').emit('admin_dashboard_update', {
          type: 'report_resolved',
          reportId,
          action: action_taken,
          timestamp: Date.now()
        })
      }
    }

    res.json({ 
      success: true, 
      message: 'Report status updated successfully',
      report: {
        id: report.id,
        status: report.status,
        oldStatus
      }
    })
  } catch (error) {
    console.error('Update report status error:', error)
    res.status(500).json({ error: 'Failed to update report status: ' + (error as Error).message })
  }
})

// Admin: Subscribe to real-time report updates
protectedRouter.post('/admin/subscribe', async (req, res) => {
  try {
    const isAdmin: boolean = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // The actual socket subscription happens on the client side
    // This endpoint just confirms admin privileges
    res.json({ 
      success: true, 
      message: 'Subscribed to real-time report updates',
      socketRoom: 'admins'
    })
  } catch (error) {
    console.error('Subscribe to reports error:', error)
    res.status(500).json({ error: 'Failed to subscribe to reports' })
  }
})

router.use(protectedRouter)

export default router