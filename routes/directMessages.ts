// routes/directMessages.ts - FIXED CONVERSATION ENDPOINT
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { DirectMessage } from '../models/DirectMessage'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'
import { Op } from 'sequelize'

const router = Router()
router.use(requireAuth)

// Send a message
router.post('/send', async (req, res) => {
  try {
    const senderId = req.user.id
    const { receiver_id, content, parent_message_id } = req.body

    if (!receiver_id || !content) {
      return res.status(400).json({ error: 'Receiver and content required' })
    }

    const message = await DirectMessage.create({
      sender_id: senderId,
      receiver_id,
      content,
      parent_message_id: parent_message_id || null
    })

    const sender = await User.findByPk(senderId)
    pushService.createAndSend(
      receiver_id,
      'comment',
      message.id,
      'New Message',
      `${sender?.name}: ${content.substring(0, 50)}`,
      undefined,
      { messageId: message.id, type: 'direct_message' }
    )

    const messageWithSender = await DirectMessage.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar_url'] }
      ]
    })

    res.status(201).json(messageWithSender)
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Get conversation between two users - FIXED (removed replies for now)
router.get('/conversation/:userId', async (req, res) => {
  try {
    const currentUserId = req.user.id
    const { userId: otherUserId } = req.params
    const { page = 1, limit = 50 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    // Get all messages between the two users (simple version without replies)
    const messages = await DirectMessage.findAll({
      where: {
        [Op.or]: [
          { sender_id: currentUserId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: currentUserId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar_url'] }
      ],
      order: [['created_at', 'ASC']],
      limit: Number(limit),
      offset
    })

    // Mark messages as read
    await DirectMessage.update(
      { read: true },
      {
        where: {
          sender_id: otherUserId,
          receiver_id: currentUserId,
          read: false
        }
      }
    )

    res.json(messages)
  } catch (error) {
    console.error('Get conversation error:', error)
    res.status(500).json({ error: 'Failed to get conversation: ' + (error as Error).message })
  }
})

// Get conversation with replies (alternative endpoint)
router.get('/conversation/:userId/threaded', async (req, res) => {
  try {
    const currentUserId = req.user.id
    const { userId: otherUserId } = req.params

    // Get parent messages (no parent)
    const parentMessages = await DirectMessage.findAll({
      where: {
        [Op.or]: [
          { sender_id: currentUserId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: currentUserId }
        ],
        parent_message_id: null
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar_url'] }
      ],
      order: [['created_at', 'ASC']]
    })

    // Get replies for each parent message
    const messagesWithReplies = await Promise.all(
      parentMessages.map(async (parent) => {
        const replies = await DirectMessage.findAll({
          where: { parent_message_id: parent.id },
          include: [
            { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
            { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar_url'] }
          ],
          order: [['created_at', 'ASC']]
        })
        return {
          ...parent.toJSON(),
          replies
        }
      })
    )

    // Mark messages as read
    await DirectMessage.update(
      { read: true },
      {
        where: {
          sender_id: otherUserId,
          receiver_id: currentUserId,
          read: false
        }
      }
    )

    res.json(messagesWithReplies)
  } catch (error) {
    console.error('Get threaded conversation error:', error)
    res.status(500).json({ error: 'Failed to get conversation' })
  }
})

// Get user's conversations
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id

    const sentMessages = await DirectMessage.findAll({
      where: { sender_id: userId },
      attributes: ['receiver_id'],
      group: ['receiver_id']
    })

    const receivedMessages = await DirectMessage.findAll({
      where: { receiver_id: userId },
      attributes: ['sender_id'],
      group: ['sender_id']
    })

    const userIds = new Set([
      ...sentMessages.map(m => m.receiver_id),
      ...receivedMessages.map(m => m.sender_id)
    ])

    const conversations = await Promise.all(
      Array.from(userIds).map(async (otherId) => {
        const lastMessage = await DirectMessage.findOne({
          where: {
            [Op.or]: [
              { sender_id: userId, receiver_id: otherId },
              { sender_id: otherId, receiver_id: userId }
            ]
          },
          order: [['created_at', 'DESC']]
        })

        const otherUser = await User.findByPk(otherId, {
          attributes: ['id', 'name', 'avatar_url']
        })

        const unreadCount = await DirectMessage.count({
          where: {
            sender_id: otherId,
            receiver_id: userId,
            read: false
          }
        })

        return {
          user: otherUser,
          lastMessage,
          unreadCount
        }
      })
    )

    conversations.sort((a, b) => 
      new Date(b.lastMessage?.created_at || 0).getTime() - 
      new Date(a.lastMessage?.created_at || 0).getTime()
    )

    res.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ error: 'Failed to get conversations' })
  }
})

// Reply to a message
router.post('/reply/:messageId', async (req, res) => {
  try {
    const senderId = req.user.id
    const { messageId } = req.params
    const { content } = req.body

    const parentMessage = await DirectMessage.findByPk(messageId)
    if (!parentMessage) {
      return res.status(404).json({ error: 'Message not found' })
    }

    const reply = await DirectMessage.create({
      sender_id: senderId,
      receiver_id: parentMessage.sender_id,
      content,
      parent_message_id: messageId
    })

    const replyWithSender = await DirectMessage.findByPk(reply.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] }]
    })

    res.status(201).json(replyWithSender)
  } catch (error) {
    console.error('Reply error:', error)
    res.status(500).json({ error: 'Failed to send reply' })
  }
})

// Mark conversation as read
router.patch('/mark-read/:userId', async (req, res) => {
  try {
    const currentUserId = req.user.id
    const { userId: otherUserId } = req.params

    await DirectMessage.update(
      { read: true },
      {
        where: {
          sender_id: otherUserId,
          receiver_id: currentUserId,
          read: false
        }
      }
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const userId = req.user.id
    const { messageId } = req.params

    const message = await DirectMessage.findByPk(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Can only delete your own messages' })
    }

    await message.destroy()
    res.json({ success: true })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ error: 'Failed to delete message' })
  }
})

export default router