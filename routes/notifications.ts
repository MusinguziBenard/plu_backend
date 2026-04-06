// routes/notifications.ts - COMPLETE WORKING VERSION
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Notification } from '../models/Notification'
import { UserPushToken } from '../models/UserPushToken'
import { pushService } from '../services/expoPushNotification'

const router = Router()
router.use(requireAuth)

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20, unread_only = false } = req.query
    
    const where: any = { user_id: userId }
    if (unread_only === 'true') {
      where.read = false
    }
    
    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    })
    
    res.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const userId = req.user.id
    const notificationId = req.params.id
    
    const notification = await Notification.findOne({
      where: { id: notificationId, user_id: userId }
    })
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    
    notification.read = true
    await notification.save()
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

// Mark all as read
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.id
    
    await Notification.update(
      { read: true },
      { where: { user_id: userId, read: false } }
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error marking all as read:', error)
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id
    
    const count = await Notification.count({
      where: { user_id: userId, read: false }
    })
    
    res.json({ count })
  } catch (error) {
    console.error('Error getting unread count:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
})

// Register Expo push token
router.post('/push-token', async (req, res) => {
  try {
    const userId = req.user.id
    const { expo_push_token, device_name, device_os } = req.body
    
    if (!expo_push_token) {
      return res.status(400).json({ error: 'Expo push token required' })
    }
    
    const existing = await UserPushToken.findOne({
      where: { user_id: userId, expo_push_token }
    })
    
    if (existing) {
      if (!existing.is_active) {
        existing.is_active = true
        await existing.save()
      }
      res.json({ success: true, message: 'Token already registered' })
    } else {
      await UserPushToken.create({
        user_id: userId,
        expo_push_token,
        device_name,
        device_os,
        is_active: true
      })
      res.json({ success: true, message: 'Token registered' })
    }
  } catch (error) {
    console.error('Error registering push token:', error)
    res.status(500).json({ error: 'Failed to register push token' })
  }
})

// Remove push token
router.delete('/push-token', async (req, res) => {
  try {
    const userId = req.user.id
    const { expo_push_token } = req.body
    
    await UserPushToken.update(
      { is_active: false },
      { where: { user_id: userId, expo_push_token } }
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error removing push token:', error)
    res.status(500).json({ error: 'Failed to remove push token' })
  }
})

// Test notification - SIMPLE WORKING VERSION
router.post('/test', async (req, res) => {
  try {
    const userId = req.user.id
    
    console.log('Creating test notification for user:', userId)
    
    // Create a simple test notification
    const notification = await Notification.create({
      user_id: userId,
      type: 'comment',
      reference_id: '00000000-0000-0000-0000-000000000001',
      title: 'Test Notification',
      message: 'This is a test notification from PLU! 🎉',
      read: false,
      push_sent: false
    })
    
    console.log('Test notification created:', notification.id)
    
    res.json({ 
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
    res.status(500).json({ 
      error: 'Failed to create test notification',
      details: (error as Error).message
    })
  }
})

// Admin broadcast endpoint
router.post('/admin/broadcast', async (req: any, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin only' })
    }
    
    const { title, message, data } = req.body
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' })
    }
    
    pushService.sendToAllUsers(title, message, data).catch(error => {
      console.error('Broadcast error:', error)
    })
    
    res.json({ 
      success: true, 
      message: 'Broadcast initiated. Notifications will be sent to all users.' 
    })
  } catch (error) {
    console.error('Broadcast error:', error)
    res.status(500).json({ error: 'Failed to send broadcast' })
  }
})

export default router