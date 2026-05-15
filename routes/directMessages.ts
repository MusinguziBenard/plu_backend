// // routes/directMessages.ts - FIXED CONVERSATION ENDPOINT
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { DirectMessage } from '../models/DirectMessage'
// import { User } from '../models/User'
// import pushService from '../services/expoPushNotification'
// import { Op } from 'sequelize'

// const router = Router()
// router.use(requireAuth)

// // Send a message
// router.post('/send', async (req, res) => {
//   try {
//     const senderId = req.user.id
//     const { receiver_id, content, parent_message_id } = req.body

//     if (!receiver_id || !content) {
//       return res.status(400).json({ error: 'Receiver and content required' })
//     }

//     const message = await DirectMessage.create({
//       sender_id: senderId,
//       receiver_id,
//       content,
//       parent_message_id: parent_message_id || null
//     })

//     const sender = await User.findByPk(senderId)
//     pushService.createAndSend(
//       receiver_id,
//       'comment',
//       message.id,
//       'New Message',
//       `${sender?.name}: ${content.substring(0, 50)}`,
//       undefined,
//       { messageId: message.id, type: 'direct_message' }
//     )

//     const messageWithSender = await DirectMessage.findByPk(message.id, {
//       include: [
//         { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
//         { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar_url'] }
//       ]
//     })

//     res.status(201).json(messageWithSender)
//   } catch (error) {
//     console.error('Send message error:', error)
//     res.status(500).json({ error: 'Failed to send message' })
//   }
// })

// // Get conversation between two users - FIXED (removed replies for now)
// router.get('/conversation/:userId', async (req, res) => {
//   try {
//     const currentUserId = req.user.id
//     const { userId: otherUserId } = req.params
//     const { page = 1, limit = 50 } = req.query
//     const offset = (Number(page) - 1) * Number(limit)

//     // Get all messages between the two users (simple version without replies)
//     const messages = await DirectMessage.findAll({
//       where: {
//         [Op.or]: [
//           { sender_id: currentUserId, receiver_id: otherUserId },
//           { sender_id: otherUserId, receiver_id: currentUserId }
//         ]
//       },
//       include: [
//         { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
//         { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar_url'] }
//       ],
//       order: [['created_at', 'ASC']],
//       limit: Number(limit),
//       offset
//     })

//     // Mark messages as read
//     await DirectMessage.update(
//       { read: true },
//       {
//         where: {
//           sender_id: otherUserId,
//           receiver_id: currentUserId,
//           read: false
//         }
//       }
//     )

//     res.json(messages)
//   } catch (error) {
//     console.error('Get conversation error:', error)
//     res.status(500).json({ error: 'Failed to get conversation: ' + (error as Error).message })
//   }
// })

// // Get conversation with replies (alternative endpoint)
// router.get('/conversation/:userId/threaded', async (req, res) => {
//   try {
//     const currentUserId = req.user.id
//     const { userId: otherUserId } = req.params

//     // Get parent messages (no parent)
//     const parentMessages = await DirectMessage.findAll({
//       where: {
//         [Op.or]: [
//           { sender_id: currentUserId, receiver_id: otherUserId },
//           { sender_id: otherUserId, receiver_id: currentUserId }
//         ],
//         parent_message_id: null
//       },
//       include: [
//         { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
//         { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar_url'] }
//       ],
//       order: [['created_at', 'ASC']]
//     })

//     // Get replies for each parent message
//     const messagesWithReplies = await Promise.all(
//       parentMessages.map(async (parent) => {
//         const replies = await DirectMessage.findAll({
//           where: { parent_message_id: parent.id },
//           include: [
//             { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
//             { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar_url'] }
//           ],
//           order: [['created_at', 'ASC']]
//         })
//         return {
//           ...parent.toJSON(),
//           replies
//         }
//       })
//     )

//     // Mark messages as read
//     await DirectMessage.update(
//       { read: true },
//       {
//         where: {
//           sender_id: otherUserId,
//           receiver_id: currentUserId,
//           read: false
//         }
//       }
//     )

//     res.json(messagesWithReplies)
//   } catch (error) {
//     console.error('Get threaded conversation error:', error)
//     res.status(500).json({ error: 'Failed to get conversation' })
//   }
// })

// // Get user's conversations
// router.get('/conversations', async (req, res) => {
//   try {
//     const userId = req.user.id

//     const sentMessages = await DirectMessage.findAll({
//       where: { sender_id: userId },
//       attributes: ['receiver_id'],
//       group: ['receiver_id']
//     })

//     const receivedMessages = await DirectMessage.findAll({
//       where: { receiver_id: userId },
//       attributes: ['sender_id'],
//       group: ['sender_id']
//     })

//     const userIds = new Set([
//       ...sentMessages.map(m => m.receiver_id),
//       ...receivedMessages.map(m => m.sender_id)
//     ])

//     const conversations = await Promise.all(
//       Array.from(userIds).map(async (otherId) => {
//         const lastMessage = await DirectMessage.findOne({
//           where: {
//             [Op.or]: [
//               { sender_id: userId, receiver_id: otherId },
//               { sender_id: otherId, receiver_id: userId }
//             ]
//           },
//           order: [['created_at', 'DESC']]
//         })

//         const otherUser = await User.findByPk(otherId, {
//           attributes: ['id', 'name', 'avatar_url']
//         })

//         const unreadCount = await DirectMessage.count({
//           where: {
//             sender_id: otherId,
//             receiver_id: userId,
//             read: false
//           }
//         })

//         return {
//           user: otherUser,
//           lastMessage,
//           unreadCount
//         }
//       })
//     )

//     conversations.sort((a, b) => 
//       new Date(b.lastMessage?.created_at || 0).getTime() - 
//       new Date(a.lastMessage?.created_at || 0).getTime()
//     )

//     res.json(conversations)
//   } catch (error) {
//     console.error('Get conversations error:', error)
//     res.status(500).json({ error: 'Failed to get conversations' })
//   }
// })

// // Reply to a message
// router.post('/reply/:messageId', async (req, res) => {
//   try {
//     const senderId = req.user.id
//     const { messageId } = req.params
//     const { content } = req.body

//     const parentMessage = await DirectMessage.findByPk(messageId)
//     if (!parentMessage) {
//       return res.status(404).json({ error: 'Message not found' })
//     }

//     const reply = await DirectMessage.create({
//       sender_id: senderId,
//       receiver_id: parentMessage.sender_id,
//       content,
//       parent_message_id: messageId
//     })

//     const replyWithSender = await DirectMessage.findByPk(reply.id, {
//       include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] }]
//     })

//     res.status(201).json(replyWithSender)
//   } catch (error) {
//     console.error('Reply error:', error)
//     res.status(500).json({ error: 'Failed to send reply' })
//   }
// })

// // Mark conversation as read
// router.patch('/mark-read/:userId', async (req, res) => {
//   try {
//     const currentUserId = req.user.id
//     const { userId: otherUserId } = req.params

//     await DirectMessage.update(
//       { read: true },
//       {
//         where: {
//           sender_id: otherUserId,
//           receiver_id: currentUserId,
//           read: false
//         }
//       }
//     )

//     res.json({ success: true })
//   } catch (error) {
//     console.error('Mark read error:', error)
//     res.status(500).json({ error: 'Failed to mark as read' })
//   }
// })

// // Delete message
// router.delete('/:messageId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { messageId } = req.params

//     const message = await DirectMessage.findByPk(messageId)
//     if (!message) {
//       return res.status(404).json({ error: 'Message not found' })
//     }

//     if (message.sender_id !== userId) {
//       return res.status(403).json({ error: 'Can only delete your own messages' })
//     }

//     await message.destroy()
//     res.json({ success: true })
//   } catch (error) {
//     console.error('Delete message error:', error)
//     res.status(500).json({ error: 'Failed to delete message' })
//   }
// })

// export default router

// routes/directMessages.ts - COMPLETE WITH SOCKET.IO INTEGRATION
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { DirectMessage } from '../models/DirectMessage'
import { User } from '../models/User'
import pushService from '../services/expoPushNotification'
import { Op } from 'sequelize'

const router = Router()
router.use(requireAuth)

// Type definitions for socket events
interface MessageSentData {
  messageId: string;
  senderId: string;
  receiverId: string;
  content: string;
  parentMessageId: string | null;
  sender?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  timestamp: number;
}

interface MessageReadData {
  readBy: string;
  senderId: string;
  timestamp: number;
}

interface MessageDeletedData {
  messageId: string;
  deletedBy: string;
  conversationWith: string;
  timestamp: number;
}

interface TypingIndicatorData {
  senderId: string;
  receiverId: string;
  isTyping: boolean;
  timestamp: number;
}

interface UnreadCountData {
  userId: string;
  totalUnread: number;
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

// Helper to safely get route parameter
const getParam = (params: any, key: string): string => {
  const value = params[key];
  if (Array.isArray(value)) return String(value[0]);
  return String(value || '');
}

// Helper to get number from query
const getNumberQuery = (value: any, defaultValue: number): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Helper to emit message via socket
const emitMessageToUser = (io: any, userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data)
    io.to(`notifications:${userId}`).emit('new_notification', {
      type: 'direct_message',
      ...data
    })
  }
}

// Helper to update unread count
const emitUnreadCount = async (io: any, userId: string) => {
  if (io) {
    const count = await DirectMessage.count({
      where: { receiver_id: userId, read: false }
    })
    
    const countData: UnreadCountData = {
      userId,
      totalUnread: count,
      timestamp: Date.now()
    }
    
    io.to(`user:${userId}`).emit('unread_messages_count', countData)
  }
}

// Send a message
router.post('/send', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const senderId: string = req.user.id
    const { receiver_id, content, parent_message_id }: {
      receiver_id: string;
      content: string;
      parent_message_id?: string;
    } = req.body

    if (!receiver_id || !content) {
      return res.status(400).json({ error: 'Receiver and content required' })
    }

    // Verify receiver exists
    const receiver = await User.findByPk(receiver_id, {
      attributes: ['id', 'name']
    })
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' })
    }

    const message = await DirectMessage.create({
      sender_id: senderId,
      receiver_id,
      content,
      parent_message_id: parent_message_id || null
    })

    // Get sender info
    const sender = await User.findByPk(senderId, {
      attributes: ['id', 'name', 'avatar_url']
    })

    // Send push notification
    if (sender) {
      pushService.createAndSend(
        receiver_id,
        'comment',
        message.id,
        'New Message',
        `${sender.name || 'Someone'}: ${content.substring(0, 50)}`,
        undefined,
        { messageId: message.id, type: 'direct_message', senderId }
      )
    }

    // Get full message with relations
    const messageWithSender = await DirectMessage.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar_url'] }
      ]
    })

    // ✅ SOCKET.IO - Emit message events
    const io = req.app.get('io')
    if (io && messageWithSender) {
      const messageData: MessageSentData = {
        messageId: message.id,
        senderId,
        receiverId: receiver_id,
        content,
        parentMessageId: parent_message_id || null,
        sender: sender ? {
          id: sender.id,
          name: sender.name || 'Unknown',
          avatar_url: sender.avatar_url || null
        } : undefined,
        timestamp: Date.now()
      }

      // Send to receiver
      emitMessageToUser(io, receiver_id, 'new_message', messageData)

      // Send confirmation to sender
      io.to(`user:${senderId}`).emit('message_sent_confirmation', {
        ...messageData,
        message: 'Message sent'
      })

      // Update unread count for receiver
      await emitUnreadCount(io, receiver_id)

      // Notify both users about conversation update
      const conversationUpdate = {
        userId: senderId,
        otherUserId: receiver_id,
        lastMessage: messageData,
        timestamp: Date.now()
      }
      
      io.to(`user:${senderId}`).emit('conversation_updated', conversationUpdate)
      io.to(`user:${receiver_id}`).emit('conversation_updated', {
        ...conversationUpdate,
        userId: receiver_id,
        otherUserId: senderId
      })
    }

    return res.status(201).json(messageWithSender)
  } catch (error) {
    console.error('Send message error:', error)
    return res.status(500).json({ error: 'Failed to send message' })
  }
})

// Get conversation between two users
router.get('/conversation/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const currentUserId: string = req.user.id
    const otherUserId: string = getParam(req.params, 'userId')
    const page: number = getNumberQuery(req.query.page, 1)
    const limit: number = getNumberQuery(req.query.limit, 50)

    const { count, rows: messages } = await DirectMessage.findAndCountAll({
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
      limit,
      offset: (page - 1) * limit
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

    // ✅ SOCKET.IO - Emit messages read event
    const io = req.app.get('io')
    if (io) {
      const readData: MessageReadData = {
        readBy: currentUserId,
        senderId: otherUserId,
        timestamp: Date.now()
      }

      io.to(`user:${otherUserId}`).emit('messages_read', readData)
      
      // Update unread count for current user
      await emitUnreadCount(io, currentUserId)

      // Notify conversation opened
      io.to(`user:${currentUserId}`).emit('conversation_opened', {
        userId: currentUserId,
        otherUserId,
        timestamp: Date.now()
      })
    }

    return res.json({
      messages,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    return res.status(500).json({ error: 'Failed to get conversation: ' + (error as Error).message })
  }
})

// Get conversation with replies (threaded)
router.get('/conversation/:userId/threaded', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const currentUserId: string = req.user.id
    const otherUserId: string = getParam(req.params, 'userId')

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

    return res.json(messagesWithReplies)
  } catch (error) {
    console.error('Get threaded conversation error:', error)
    return res.status(500).json({ error: 'Failed to get conversation' })
  }
})

// Get user's conversations list
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id

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
          include: [
            { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] }
          ],
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

    return res.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    return res.status(500).json({ error: 'Failed to get conversations' })
  }
})

// Reply to a message
router.post('/reply/:messageId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const senderId: string = req.user.id
    const messageId: string = getParam(req.params, 'messageId')
    const { content }: { content: string } = req.body

    if (!content) {
      return res.status(400).json({ error: 'Content required' })
    }

    const parentMessage = await DirectMessage.findByPk(messageId)
    if (!parentMessage) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Determine receiver (the other person in the conversation)
    const receiverId = parentMessage.sender_id === senderId 
      ? parentMessage.receiver_id 
      : parentMessage.sender_id

    const reply = await DirectMessage.create({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      parent_message_id: messageId
    })

    const replyWithSender = await DirectMessage.findByPk(reply.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] }]
    })

    // ✅ SOCKET.IO - Emit reply event
    const io = req.app.get('io')
    if (io && replyWithSender) {
      const replyData: MessageSentData = {
        messageId: reply.id,
        senderId,
        receiverId,
        content,
        parentMessageId: messageId,
        sender: {
          id: replyWithSender.sender?.id || senderId,
          name: replyWithSender.sender?.name || 'Unknown',
          avatar_url: replyWithSender.sender?.avatar_url || null
        },
        timestamp: Date.now()
      }

      emitMessageToUser(io, receiverId, 'message_reply', replyData)
      await emitUnreadCount(io, receiverId)
    }

    return res.status(201).json(replyWithSender)
  } catch (error) {
    console.error('Reply error:', error)
    return res.status(500).json({ error: 'Failed to send reply' })
  }
})

// Mark conversation as read
router.patch('/mark-read/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const currentUserId: string = req.user.id
    const otherUserId: string = getParam(req.params, 'userId')

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

    // ✅ SOCKET.IO - Emit messages read event
    const io = req.app.get('io')
    if (io) {
      const readData: MessageReadData = {
        readBy: currentUserId,
        senderId: otherUserId,
        timestamp: Date.now()
      }

      io.to(`user:${otherUserId}`).emit('messages_read', readData)
      await emitUnreadCount(io, currentUserId)
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    return res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// Delete message
router.delete('/:messageId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const messageId: string = getParam(req.params, 'messageId')

    const message = await DirectMessage.findByPk(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Can only delete your own messages' })
    }

    const receiverId: string = message.receiver_id
    await message.destroy()

    // ✅ SOCKET.IO - Emit message deleted event
    const io = req.app.get('io')
    if (io) {
      const deleteData: MessageDeletedData = {
        messageId,
        deletedBy: userId,
        conversationWith: receiverId,
        timestamp: Date.now()
      }

      // Notify both users
      io.to(`user:${userId}`).emit('message_deleted', deleteData)
      io.to(`user:${receiverId}`).emit('message_deleted', deleteData)
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('Delete message error:', error)
    return res.status(500).json({ error: 'Failed to delete message' })
  }
})

// Typing indicator endpoint
router.post('/typing/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const senderId: string = req.user.id
    const receiverId: string = getParam(req.params, 'userId')
    const { isTyping }: { isTyping: boolean } = req.body

    // ✅ SOCKET.IO - Emit typing indicator
    const io = req.app.get('io')
    if (io) {
      const typingData: TypingIndicatorData = {
        senderId,
        receiverId,
        isTyping,
        timestamp: Date.now()
      }

      io.to(`user:${receiverId}`).emit('user_typing', typingData)
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('Typing indicator error:', error)
    return res.status(500).json({ error: 'Failed to send typing indicator' })
  }
})

export default router