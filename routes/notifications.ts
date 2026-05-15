// // routes/notifications.ts - COMPLETE WORKING VERSION
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { Notification } from '../models/Notification'
// import { UserPushToken } from '../models/UserPushToken'
// import { pushService } from '../services/expoPushNotification'

// const router = Router()
// router.use(requireAuth)

// // Get user notifications
// router.get('/', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { page = 1, limit = 20, unread_only = false } = req.query
    
//     const where: any = { user_id: userId }
//     if (unread_only === 'true') {
//       where.read = false
//     }
    
//     const notifications = await Notification.findAll({
//       where,
//       order: [['created_at', 'DESC']],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit)
//     })
    
//     res.json(notifications)
//   } catch (error) {
//     console.error('Error fetching notifications:', error)
//     res.status(500).json({ error: 'Failed to fetch notifications' })
//   }
// })

// // Mark notification as read
// router.patch('/:id/read', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const notificationId = req.params.id
    
//     const notification = await Notification.findOne({
//       where: { id: notificationId, user_id: userId }
//     })
    
//     if (!notification) {
//       return res.status(404).json({ error: 'Notification not found' })
//     }
    
//     notification.read = true
//     await notification.save()
    
//     res.json({ success: true })
//   } catch (error) {
//     console.error('Error marking notification as read:', error)
//     res.status(500).json({ error: 'Failed to mark notification as read' })
//   }
// })

// // Mark all as read
// router.patch('/read-all', async (req, res) => {
//   try {
//     const userId = req.user.id
    
//     await Notification.update(
//       { read: true },
//       { where: { user_id: userId, read: false } }
//     )
    
//     res.json({ success: true })
//   } catch (error) {
//     console.error('Error marking all as read:', error)
//     res.status(500).json({ error: 'Failed to mark all as read' })
//   }
// })

// // Get unread count
// router.get('/unread-count', async (req, res) => {
//   try {
//     const userId = req.user.id
    
//     const count = await Notification.count({
//       where: { user_id: userId, read: false }
//     })
    
//     res.json({ count })
//   } catch (error) {
//     console.error('Error getting unread count:', error)
//     res.status(500).json({ error: 'Failed to get unread count' })
//   }
// })

// // Register Expo push token
// router.post('/push-token', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { expo_push_token, device_name, device_os } = req.body
    
//     if (!expo_push_token) {
//       return res.status(400).json({ error: 'Expo push token required' })
//     }
    
//     const existing = await UserPushToken.findOne({
//       where: { user_id: userId, expo_push_token }
//     })
    
//     if (existing) {
//       if (!existing.is_active) {
//         existing.is_active = true
//         await existing.save()
//       }
//       res.json({ success: true, message: 'Token already registered' })
//     } else {
//       await UserPushToken.create({
//         user_id: userId,
//         expo_push_token,
//         device_name,
//         device_os,
//         is_active: true
//       })
//       res.json({ success: true, message: 'Token registered' })
//     }
//   } catch (error) {
//     console.error('Error registering push token:', error)
//     res.status(500).json({ error: 'Failed to register push token' })
//   }
// })

// // Remove push token
// router.delete('/push-token', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { expo_push_token } = req.body
    
//     await UserPushToken.update(
//       { is_active: false },
//       { where: { user_id: userId, expo_push_token } }
//     )
    
//     res.json({ success: true })
//   } catch (error) {
//     console.error('Error removing push token:', error)
//     res.status(500).json({ error: 'Failed to remove push token' })
//   }
// })

// // Test notification - SIMPLE WORKING VERSION
// router.post('/test', async (req, res) => {
//   try {
//     const userId = req.user.id
    
//     console.log('Creating test notification for user:', userId)
    
//     // Create a simple test notification
//     const notification = await Notification.create({
//       user_id: userId,
//       type: 'comment',
//       reference_id: '00000000-0000-0000-0000-000000000001',
//       title: 'Test Notification',
//       message: 'This is a test notification from PLU! 🎉',
//       read: false,
//       push_sent: false
//     })
    
//     console.log('Test notification created:', notification.id)
    
//     res.json({ 
//       success: true, 
//       message: 'Test notification created successfully',
//       notification: {
//         id: notification.id,
//         title: notification.title,
//         message: notification.message
//       }
//     })
//   } catch (error) {
//     console.error('Test notification error:', error)
//     res.status(500).json({ 
//       error: 'Failed to create test notification',
//       details: (error as Error).message
//     })
//   }
// })

// // Admin broadcast endpoint
// router.post('/admin/broadcast', async (req: any, res) => {
//   try {
//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
    
//     if (!isAdmin) {
//       return res.status(403).json({ error: 'Admin only' })
//     }
    
//     const { title, message, data } = req.body
    
//     if (!title || !message) {
//       return res.status(400).json({ error: 'Title and message required' })
//     }
    
//     pushService.sendToAllUsers(title, message, data).catch(error => {
//       console.error('Broadcast error:', error)
//     })
    
//     res.json({ 
//       success: true, 
//       message: 'Broadcast initiated. Notifications will be sent to all users.' 
//     })
//   } catch (error) {
//     console.error('Broadcast error:', error)
//     res.status(500).json({ error: 'Failed to send broadcast' })
//   }
// })

// export default router


// routes/notifications.ts - COMPLETE WITH SOCKET.IO INTEGRATION (TYPE-SAFE)
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { Notification } from '../models/Notification'
import { UserPushToken } from '../models/UserPushToken'
import { User } from '../models/User'
import { pushService } from '../services/expoPushNotification'
import { Op } from 'sequelize'

const router = Router()
router.use(requireAuth)

// Type definitions for socket events
interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  timestamp: number;
}

interface NotificationReadData {
  notificationId: string;
  userId: string;
  timestamp: number;
}

interface UnreadCountData {
  userId: string;
  count: number;
  timestamp: number;
}

interface BroadcastData {
  title: string;
  message: string;
  data?: any;
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

// Helper to safely get route parameter
const getParam = (params: any, key: string): string => {
  const value = params[key];
  if (Array.isArray(value)) return String(value[0]);
  return String(value || '');
}

// Helper to emit notification via socket
const emitNotificationToUser = (io: any, userId: string, notification: NotificationData) => {
  if (io) {
    io.to(`user:${userId}`).emit('new_notification', notification)
    io.to(`notifications:${userId}`).emit('notification_received', notification)
    updateUnreadCount(io, userId)
  }
}

// Helper to update unread count via socket
const updateUnreadCount = async (io: any, userId: string) => {
  if (io) {
    const count = await Notification.count({
      where: { user_id: userId, read: false }
    })
    
    const countData: UnreadCountData = {
      userId,
      count,
      timestamp: Date.now()
    }
    
    io.to(`user:${userId}`).emit('unread_count_updated', countData)
  }
}

// Get user notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const page: number = Number(req.query.page) || 1
    const limit: number = Number(req.query.limit) || 20
    const unreadOnly: boolean = req.query.unread_only === 'true'
    
    const where: any = { user_id: userId }
    if (unreadOnly) {
      where.read = false
    }
    
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })
    
    // SOCKET.IO - Emit notifications loaded event
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('notifications_loaded', {
        count: notifications.length,
        hasMore: count > page * limit,
        timestamp: Date.now()
      })
    }
    
    return res.json({
      notifications,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const notificationId: string = getParam(req.params, 'id')
    
    const notification = await Notification.findOne({
      where: { id: notificationId, user_id: userId }
    })
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    
    notification.read = true
    await notification.save()
    
    // SOCKET.IO - Emit notification read event
    const io = req.app.get('io')
    if (io) {
      const readData: NotificationReadData = {
        notificationId,
        userId,
        timestamp: Date.now()
      }
      
      io.to(`user:${userId}`).emit('notification_read', readData)
      await updateUnreadCount(io, userId)
    }
    
    return res.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

// Mark all as read
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    
    await Notification.update(
      { read: true },
      { where: { user_id: userId, read: false } }
    )
    
    // SOCKET.IO - Emit all read event
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('all_notifications_read', {
        userId,
        timestamp: Date.now()
      })
      
      const countData: UnreadCountData = {
        userId,
        count: 0,
        timestamp: Date.now()
      }
      
      io.to(`user:${userId}`).emit('unread_count_updated', countData)
    }
    
    return res.json({ success: true })
  } catch (error) {
    console.error('Error marking all as read:', error)
    return res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

// Delete notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const notificationId: string = getParam(req.params, 'id')
    
    const notification = await Notification.findOne({
      where: { id: notificationId, user_id: userId }
    })
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    
    const wasUnread: boolean = !notification.read
    await notification.destroy()
    
    // SOCKET.IO - Emit notification deleted event
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('notification_deleted', {
        notificationId,
        userId,
        timestamp: Date.now()
      })
      
      if (wasUnread) {
        await updateUnreadCount(io, userId)
      }
    }
    
    return res.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return res.status(500).json({ error: 'Failed to delete notification' })
  }
})

// Delete all notifications
router.delete('/clear-all', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    
    await Notification.destroy({
      where: { user_id: userId }
    })
    
    // SOCKET.IO - Emit all cleared event
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('all_notifications_cleared', {
        userId,
        timestamp: Date.now()
      })
      
      const countData: UnreadCountData = {
        userId,
        count: 0,
        timestamp: Date.now()
      }
      
      io.to(`user:${userId}`).emit('unread_count_updated', countData)
    }
    
    return res.json({ success: true })
  } catch (error) {
    console.error('Error clearing notifications:', error)
    return res.status(500).json({ error: 'Failed to clear notifications' })
  }
})

// Get unread count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    
    const count: number = await Notification.count({
      where: { user_id: userId, read: false }
    })
    
    // SOCKET.IO - Emit unread count
    const io = req.app.get('io')
    if (io) {
      const countData: UnreadCountData = {
        userId,
        count,
        timestamp: Date.now()
      }
      
      io.to(`user:${userId}`).emit('unread_count_updated', countData)
    }
    
    return res.json({ count })
  } catch (error) {
    console.error('Error getting unread count:', error)
    return res.status(500).json({ error: 'Failed to get unread count' })
  }
})

// Register Expo push token
router.post('/push-token', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { expo_push_token, device_name, device_os }: {
      expo_push_token: string;
      device_name?: string;
      device_os?: string;
    } = req.body
    
    if (!expo_push_token) {
      return res.status(400).json({ error: 'Expo push token required' })
    }
    
    const existing = await UserPushToken.findOne({
      where: { user_id: userId, expo_push_token }
    })
    
    if (existing) {
      if (!existing.is_active) {
        existing.is_active = true
        existing.device_name = device_name || existing.device_name
        existing.device_os = device_os || existing.device_os
        await existing.save()
      }
      
      const io = req.app.get('io')
      if (io) {
        io.to(`user:${userId}`).emit('push_token_registered', {
          userId,
          token: expo_push_token.substring(0, 10) + '...',
          timestamp: Date.now()
        })
      }
      
      return res.json({ success: true, message: 'Token already registered' })
    } else {
      await UserPushToken.create({
        user_id: userId,
        expo_push_token,
        device_name,
        device_os,
        is_active: true
      })
      
      const io = req.app.get('io')
      if (io) {
        io.to(`user:${userId}`).emit('push_token_registered', {
          userId,
          token: expo_push_token.substring(0, 10) + '...',
          timestamp: Date.now()
        })
      }
      
      return res.json({ success: true, message: 'Token registered' })
    }
  } catch (error) {
    console.error('Error registering push token:', error)
    return res.status(500).json({ error: 'Failed to register push token' })
  }
})

// Remove push token
router.delete('/push-token', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { expo_push_token }: { expo_push_token: string } = req.body
    
    await UserPushToken.update(
      { is_active: false },
      { where: { user_id: userId, expo_push_token } }
    )
    
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('push_token_removed', {
        userId,
        token: expo_push_token.substring(0, 10) + '...',
        timestamp: Date.now()
      })
    }
    
    return res.json({ success: true })
  } catch (error) {
    console.error('Error removing push token:', error)
    return res.status(500).json({ error: 'Failed to remove push token' })
  }
})

// Test notification
router.post('/test', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    
    console.log('Creating test notification for user:', userId)
    
    const notification = await Notification.create({
      user_id: userId,
      type: 'comment',
      reference_id: '00000000-0000-0000-0000-000000000001',
      title: 'Test Notification',
      message: 'This is a test notification from PLU! 🎉',
      read: false,
      push_sent: false
    })
    
    const io = req.app.get('io')
    if (io) {
      const notificationData: NotificationData = {
        id: notification.id,
        userId,
        type: 'test',
        title: notification.title,
        message: notification.message,
        referenceId: null,
        read: false,
        timestamp: Date.now()
      }
      
      emitNotificationToUser(io, userId, notificationData)
    }
    
    return res.json({ 
      success: true, 
      message: 'Test notification created successfully',
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message
      }
    })
  } catch (error) {
    console.error('Test notification error:', error)
    return res.status(500).json({ 
      error: 'Failed to create test notification',
      details: (error as Error).message
    })
  }
})

// Admin broadcast endpoint
router.post('/admin/broadcast', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' })
    }
    
    const { title, message, data }: {
      title: string;
      message: string;
      data?: any;
    } = req.body
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' })
    }
    
    pushService.sendToAllUsers(title, message, data).catch(error => {
      console.error('Broadcast error:', error)
    })
    
    const users = await User.findAll({
      attributes: ['id'],
      where: { 
        [Op.or]: [
          { role: { [Op.ne]: 'admin' } },
          { role: null }
        ]
      }
    })
    
    const notifications = []
    for (const user of users) {
      const notification = await Notification.create({
        user_id: user.id,
        type: 'broadcast',
        reference_id: null,
        title,
        message,
        read: false,
        push_sent: true
      })
      notifications.push(notification)
    }
    
    const io = req.app.get('io')
    if (io) {
      const broadcastData: BroadcastData = {
        title,
        message,
        data,
        timestamp: Date.now()
      }
      
      io.emit('broadcast_notification', broadcastData)
      
      for (const user of users) {
        const userNotification = notifications.find(n => n.user_id === user.id)
        const notificationData: NotificationData = {
          id: userNotification?.id || '',
          userId: user.id,
          type: 'broadcast',
          title,
          message,
          referenceId: null,
          read: false,
          timestamp: Date.now()
        }
        
        emitNotificationToUser(io, user.id, notificationData)
      }
      
      io.to('admins').emit('broadcast_sent', {
        title,
        recipientCount: users.length,
        timestamp: Date.now()
      })
    }
    
    return res.json({ 
      success: true, 
      message: `Broadcast sent to ${users.length} users`
    })
  } catch (error) {
    console.error('Broadcast error:', error)
    return res.status(500).json({ error: 'Failed to send broadcast' })
  }
})

// Subscribe to real-time notifications
router.post('/subscribe', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('notification_subscription_confirmed', {
        userId,
        message: 'Subscribed to real-time notifications',
        timestamp: Date.now()
      })
    }
    
    return res.json({ 
      success: true, 
      message: 'Subscribed to real-time notifications'
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return res.status(500).json({ error: 'Failed to subscribe to notifications' })
  }
})

export default router