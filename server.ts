
// import dotenv from 'dotenv'
// dotenv.config()

// import express from 'express'
// import cors from 'cors'
// import sequelize from './config/sequelize'
// import authRoutes from './routes/auth'
// import userRoutes from './routes/user'
// import likesRoutes from './routes/likes'
// import postsRoutes from './routes/posts'
// // NEW: Import additional routes
// import commentsRoutes from './routes/comments'
// import commentLikesRoutes from './routes/commentLikes'
// import viewsRoutes from './routes/views'
// import notificationsRoutes from './routes/notifications'
// import savedPostsRoutes from './routes/savedPosts'
// import followsRoutes from './routes/follows'
// import directMessagesRoutes from './routes/directMessages'
// import liveEventsRoutes from './routes/liveEvents'
// import pollsRoutes from './routes/polls'
// import reportsRoutes from './routes/reports'
// import tagsRoutes from './routes/tags'
// import invitesRoutes from './routes/invites'
// import priorityFeedRoutes from './routes/priorityFeed'
// import interactionPreferencesRoutes from './routes/interactionPreferences'

// const app = express()
// app.use(cors())
// app.use(express.json())

// // EXISTING ROUTES (kept exactly as they were)
// app.use('/api/auth', authRoutes)
// app.use('/api/user', userRoutes)
// app.use('/api/likes', likesRoutes)
// app.use('/api/posts', postsRoutes)

// // NEW ROUTES (added without modifying existing ones)
// app.use('/api/comments', commentsRoutes)
// app.use('/api/comment-likes', commentLikesRoutes)
// app.use('/api/views', viewsRoutes)
// app.use('/api/notifications', notificationsRoutes)

// app.use('/api/saved-posts', savedPostsRoutes)
// app.use('/api/follows', followsRoutes)
// app.use('/api/messages', directMessagesRoutes)
// app.use('/api/events', liveEventsRoutes)
// app.use('/api/polls', pollsRoutes)
// app.use('/api/reports', reportsRoutes)
// app.use('/api/tags', tagsRoutes)
// app.use('/api/invites', invitesRoutes)
// app.use('/api/priority-feed', priorityFeedRoutes)
// app.use('/api/preferences', interactionPreferencesRoutes)

// app.get('/ping', (req, res) => res.status(200).send('pong'));


// // AI Configuration (minimal, from .env) - KEPT EXACTLY AS IS
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY
// const GROK_API_KEY = process.env.GROK_API_KEY
// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

// if (!GEMINI_API_KEY) {
//   console.error('❌ GEMINI_API_KEY missing from .env – AI endpoint degraded')
// }
// if (!GROK_API_KEY) {
//   console.warn('⚠️ GROK_API_KEY missing from .env – fallback disabled. See https://x.ai/api for details.')
// }
// if (!DEEPSEEK_API_KEY) {
//   console.warn('⚠️ DEEPSEEK_API_KEY missing from .env – tertiary fallback disabled. See https://platform.deepseek.com/api-docs/ for details.')
// }

// // PLU system prompt (concise) - KEPT EXACTLY AS IS
// const SYSTEM_PROMPT = `You are M.K AI, the official AI assistant for the Patriots League of Uganda (PLU).

// IMPORTANT PLU INFORMATION:
// - Organization: Patriots League of Uganda (PLU)
// - Patron: General Muhoozi Kainerugaba
// - Mission: Promote patriotism, national unity, and civic responsibility in Uganda
// - Core Values: Patriotism, Integrity, Accountability, Service, Discipline
// - Activities: Community development projects, youth empowerment programs, patriotic education
// - Membership: Open to all patriotic Ugandans aged 18 and above
// - Headquarters: Kampala, Uganda
// - Developer of this application is Musinguzi Benard who graduated from Muni university with a degree in information systems in the year 2025 reachable on 256763313707 or email musinguzibenard37gmail.com.

// RESPONSE GUIDELINES:
// 1. Always respond in clear, respectful Ugandan English
// 2. Be informative and helpful about PLU matters and NRM initiatives and leadership and achievements
// 3. If you don't know specific details, be honest and suggest contacting PLU directly
// 4. Emphasize PLU's positive impact on communities
// 5. Highlight youth involvement and national development
// 6. Keep responses concise but comprehensive
// 7. Avoid negative political statements, focus on community development`

// const getGeminiResponse = async (userMessage: string): Promise<string> => {
//   if (!GEMINI_API_KEY) {
//     throw new Error('GEMINI_API_KEY not configured')
//   }

//   console.log('🔄 Getting response from Gemini...')

//   const modelsToTry = [
//     'gemini-2.0-flash', 
//     'gemini-2.5-flash',
//     'gemini-1.5-flash',
//   ]

//   let lastError: Error | null = null

//   for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
//     const modelName = modelsToTry[attempt]
//     try {
//       console.log(`Trying model: ${modelName}`)

//       const requestBody = {
//         contents: [{
//           parts: [{
//             text: `${SYSTEM_PROMPT}\n\nUser Question: ${userMessage}\n\nPlease provide a helpful response:`
//           }]
//         }],
//         generationConfig: {
//           temperature: 0.7,
//           topK: 40,
//           topP: 0.95,
//           maxOutputTokens: 1000,
//         },
//         safetySettings: [
//           {
//             category: "HARM_CATEGORY_HARASSMENT",
//             threshold: "BLOCK_MEDIUM_AND_ABOVE"
//           },
//           {
//             category: "HARM_CATEGORY_HATE_SPEECH",
//             threshold: "BLOCK_MEDIUM_AND_ABOVE"
//           },
//           {
//             category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
//             threshold: "BLOCK_MEDIUM_AND_ABOVE"
//           },
//           {
//             category: "HARM_CATEGORY_DANGEROUS_CONTENT",
//             threshold: "BLOCK_MEDIUM_AND_ABOVE"
//           }
//         ]
//       }

//       const response = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(requestBody),
//         }
//       )

//       console.log(`Response Status for ${modelName}:`, response.status)

//       if (response.ok) {
//         const data = await response.json()
//         console.log(`✅ Success with model: ${modelName}`)

//         if (data.candidates && data.candidates.length > 0) {
//           const text = data.candidates[0].content.parts[0]?.text?.trim()

//           if (text && text.length > 5) {
//             if (data.usageMetadata) {
//               console.log(`Tokens used: ${data.usageMetadata.promptTokenCount + data.usageMetadata.candidatesTokenCount}`)
//             }
//             return text
//           } else {
//             // Invalid/short response, treat as error
//             lastError = new Error(`Model ${modelName}: Invalid or short response`)
//           }
//         } else {
//           lastError = new Error(`Model ${modelName}: No candidates in response`)
//         }
//       } else {
//         const errorText = await response.text()
//         console.log(`Model ${modelName} failed:`, response.status, errorText)
//         lastError = new Error(`Model ${modelName}: ${response.status} - ${errorText}`)
//       }

//       // Backoff (1s, 2s, 4s)
//       if (attempt < modelsToTry.length - 1) {
//         await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
//       }
//     } catch (modelError) {
//       console.log(`Model ${modelName} error:`, modelError)
//       lastError = modelError as Error
//     }
//   }

//   throw lastError || new Error('All Gemini models failed')
// }

// // Grok API fallback (OpenAI-compatible) - KEPT EXACTLY AS IS
// const getGrokResponse = async (userMessage: string): Promise<string> => {
//   if (!GROK_API_KEY) {
//     throw new Error('GROK_API_KEY not configured')
//   }

//   console.log('🔄 Falling back to Grok API (Responses API)...')

//   try {
//     const response = await fetch('https://api.x.ai/v1/responses', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${GROK_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'grok-4-1-fast-reasoning',
//         input: [
//           {
//             role: 'system',
//             content: SYSTEM_PROMPT
//           },
//           {
//             role: 'user',
//             content: userMessage
//           }
//         ]
//       }),
//     })

//     console.log('Grok response status:', response.status)

//     if (!response.ok) {
//       const errorText = await response.text()
//       throw new Error(`Grok: ${response.status} - ${errorText}`)
//     }

//     const data = await response.json()

//     console.log('✅ Success with Grok')

//     return data.output?.[0]?.content?.[0]?.text || 'No response generated'

//   } catch (error) {
//     console.error('Grok API error:', error)
//     throw error
//   }
// }


// // DeepSeek API fallback (OpenAI-compatible) - KEPT EXACTLY AS IS
// const getDeepSeekResponse = async (userMessage: string): Promise<string> => {
//   if (!DEEPSEEK_API_KEY) {
//     throw new Error('DEEPSEEK_API_KEY not configured. See https://platform.deepseek.com/api-docs/ for setup.')
//   }

//   console.log('🔄 Falling back to DeepSeek API...')

//   try {
//     const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'deepseek-chat',  // Primary model; check https://platform.deepseek.com/api-docs/ for latest
//         messages: [
//           { role: 'system', content: SYSTEM_PROMPT },
//           { role: 'user', content: userMessage }
//         ],
//         temperature: 0.7,
//         max_tokens: 1000,
//       }),
//     })

//     console.log('DeepSeek response status:', response.status)

//     if (response.ok) {
//       const data = await response.json()
//       console.log('✅ Success with DeepSeek')
//       const text = data.choices?.[0]?.message?.content?.trim()
//       if (text && text.length > 5) {
//         return text
//       } else {
//         throw new Error('DeepSeek: Invalid or short response')
//       }
//     } else {
//       const errorText = await response.text()
//       console.error('DeepSeek failed:', response.status, errorText)
//       throw new Error(`DeepSeek: ${response.status} - ${errorText}`)
//     }
//   } catch (error) {
//     console.error('DeepSeek API error:', error)
//     throw error
//   }
// }

// // Minimal AI endpoint: POST /api/ai/chat { message: string } -> { response: string }
// // Fault-tolerant: Gemini first, then Grok, then DeepSeek - WITH TIMEOUT PROTECTION
// app.post('/api/ai/chat', async (req, res) => {
//   const { message } = req.body

//   if (!message || typeof message !== 'string') {
//     return res.status(400).json({ error: 'Message is required and must be a string' })
//   }

//   // Create timeout promise
//   const timeoutPromise = new Promise((_, reject) => {
//     setTimeout(() => reject(new Error('AI request timeout after 30 seconds')), 30000)
//   })

//   try {
//     let aiResponse = ''
    
//     // Try Gemini with timeout
//     try {
//       const geminiPromise = getGeminiResponse(message)
//       aiResponse = await Promise.race([geminiPromise, timeoutPromise]) as string
//     } catch (geminiError: any) {
//       console.log('Gemini failed:', geminiError.message)
      
//       // Try Grok with timeout
//       try {
//         console.log('Trying Grok fallback...')
//         const grokPromise = getGrokResponse(message)
//         aiResponse = await Promise.race([grokPromise, timeoutPromise]) as string
//       } catch (grokError: any) {
//         console.log('Grok failed:', grokError.message)
        
//         // Try DeepSeek with timeout
//         try {
//           console.log('Trying DeepSeek fallback...')
//           const deepSeekPromise = getDeepSeekResponse(message)
//           aiResponse = await Promise.race([deepSeekPromise, timeoutPromise]) as string
//         } catch (deepSeekError: any) {
//           console.log('DeepSeek failed:', deepSeekError.message)
//           throw new Error('All AI services failed or timed out')
//         }
//       }
//     }
     
//     res.json({ response: aiResponse })
//   } catch (error: any) {
//     console.error('All AI attempts failed:', error)
    
//     // Return a friendly fallback response instead of error
//     res.json({ 
//       response: "I'm currently experiencing high demand. Please try again in a moment. For immediate PLU inquiries, contact our support team or visit the PLU website.",
//       fallback: true
//     })
//   }
// })

// app.get('/', (req, res) => {
//   res.json({ message: 'PLU Backend LIVE - Uganda', db: 'Connected' })
// })

// sequelize.sync({ alter: true }).then(() => {
//   console.log('Database connected & synced')
//   console.log('📊 Routes available:')
//   console.log('   ✅ /api/auth/*')
//   console.log('   ✅ /api/user/*')
//   console.log('   ✅ /api/likes/*')
//   console.log('   ✅ /api/posts/*')
//   console.log('   ✅ /api/comments/*')
//   console.log('   ✅ /api/comment-likes/*')
//   console.log('   ✅ /api/views/*')
//   console.log('   ✅ /api/notifications/*')
//   console.log('   ✅ /api/ai/chat')
//   console.log('   ✅ /ping')
//   console.log('   ✅ /')
  
//   const PORT = process.env.PORT || 3000
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`)
//   })
// })

// export default app


// server.ts - DEPLOYMENT READY (COMPLETE WITH ALL SOCKET EVENTS)
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import sequelize from './config/sequelize'

// ALL ROUTE IMPORTS
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import likesRoutes from './routes/likes'
import postsRoutes from './routes/posts'
import commentsRoutes from './routes/comments'
import commentLikesRoutes from './routes/commentLikes'
import viewsRoutes from './routes/views'
import notificationsRoutes from './routes/notifications'
import savedPostsRoutes from './routes/savedPosts'
import followsRoutes from './routes/follows'
import directMessagesRoutes from './routes/directMessages'
import liveEventsRoutes from './routes/liveEvents'
import pollsRoutes from './routes/polls'
import reportsRoutes from './routes/reports'
import tagsRoutes from './routes/tags'
import invitesRoutes from './routes/invites'
import priorityFeedRoutes from './routes/priorityFeed'
import interactionPreferencesRoutes from './routes/interactionPreferences'
import uploadRoutes from './routes/upload'

const app = express()
const server = http.createServer(app)

// Socket.IO - Mobile app friendly
const io = new Server(server, {
  cors: {
    origin: "*", // Mobile apps don't have a fixed origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  },
  transports: ['polling', 'websocket'], // Polling first for Render free plan
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  allowEIO3: true
}) as any

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Make io accessible to all routes
app.set('io', io)

// ====================== SOCKET.IO - ALL EVENTS ======================
const onlineUsers = new Map<string, string>()

io.on('connection', (socket: any) => {
  console.log(`🔌 Connected: ${socket.id}`)

  // ========== AUTH EVENTS ==========
  socket.on('user_connected', (userId: string) => {
    if (userId) {
      onlineUsers.set(userId, socket.id)
      socket.join(`user:${userId}`)
      socket.join(`notifications:${userId}`)
      socket.userId = userId
      io.emit('user_online', { userId, timestamp: Date.now() })
    }
  })

  // ========== ROOM JOIN/LEAVE ==========
  socket.on('join_post', (postId: string) => { if (postId) socket.join(`post:${postId}`) })
  socket.on('leave_post', (postId: string) => { if (postId) socket.leave(`post:${postId}`) })
  socket.on('join_event', (eventId: string) => { if (eventId) socket.join(`event:${eventId}`) })
  socket.on('leave_event', (eventId: string) => { if (eventId) socket.leave(`event:${eventId}`) })
  socket.on('join_admin', () => { if (socket.userId) socket.join('admins') })
  socket.on('join_feed', () => { if (socket.userId) socket.join(`feed:${socket.userId}`) })

  // ========== POST EVENTS ==========
  socket.on('like_post', (data: any) => {
    io.to(`post:${data.postId}`).emit('post_liked', { ...data, timestamp: Date.now() })
    io.to(`post:${data.postId}`).emit('post_updated', { postId: data.postId, type: 'like', timestamp: Date.now() })
  })
  socket.on('unlike_post', (data: any) => {
    io.to(`post:${data.postId}`).emit('post_unliked', { ...data, timestamp: Date.now() })
  })
  socket.on('new_post', (post: any) => {
    socket.broadcast.emit('feed_new_post', { post, timestamp: Date.now() })
  })

  // ========== COMMENT EVENTS ==========
  socket.on('new_comment', (data: any) => {
    io.to(`post:${data.postId}`).emit('comment_added', { ...data, timestamp: Date.now() })
  })
  socket.on('comment_reply', (data: any) => {
    io.to(`post:${data.postId}`).emit('comment_reply_added', { ...data, timestamp: Date.now() })
  })

  // ========== COMMENT LIKE EVENTS ==========
  socket.on('like_comment', (data: any) => {
    io.to(`post:${data.postId}`).emit('comment_like_toggled', { ...data, timestamp: Date.now() })
  })

  // ========== VIEW EVENTS ==========
  socket.on('view_post', (data: any) => {
    io.to(`post:${data.postId}`).emit('view_count_updated', { ...data, timestamp: Date.now() })
  })

  // ========== NOTIFICATION EVENTS ==========
  socket.on('send_notification', (data: any) => {
    io.to(`notifications:${data.userId}`).emit('new_notification', { ...data.notification, timestamp: Date.now() })
    io.to(`user:${data.userId}`).emit('notification_received', { ...data.notification, timestamp: Date.now() })
  })

  // ========== SAVED POSTS EVENTS ==========
  socket.on('save_post', (data: any) => {
    io.to(`post:${data.postId}`).emit('post_saved', { ...data, timestamp: Date.now() })
    io.to(`user:${data.userId}`).emit('saved_posts_updated', { type: 'save', postId: data.postId, timestamp: Date.now() })
  })
  socket.on('unsave_post', (data: any) => {
    io.to(`post:${data.postId}`).emit('post_unsaved', { ...data, timestamp: Date.now() })
  })

  // ========== FOLLOW EVENTS ==========
  socket.on('follow_user', (data: any) => {
    io.to(`user:${data.followingId}`).emit('user_followed', { ...data, timestamp: Date.now() })
    io.to(`user:${data.followerId}`).emit('follow_action_confirmed', { ...data, timestamp: Date.now() })
  })
  socket.on('unfollow_user', (data: any) => {
    io.to(`user:${data.followingId}`).emit('user_unfollowed', { ...data, timestamp: Date.now() })
  })
  
// ========== DIRECT MESSAGE EVENTS ==========
socket.on('send_message', (data: any) => {
  const recipientSocket = onlineUsers.get(data.recipientId)
  if (recipientSocket) {
    io.to(recipientSocket).emit('new_message', { ...data.message, timestamp: Date.now() })
  }
  io.to(`user:${data.senderId}`).emit('message_sent_confirmation', { ...data, timestamp: Date.now() })
})

// 🆕 ADD THIS: GROUP CHAT MESSAGE HANDLER
socket.on('send_group_message', (data: any) => {
  // Broadcast to EVERYONE except sender
  socket.broadcast.emit('group_new_message', {
    messageId: data.messageId,
    senderId: data.senderId,
    senderName: data.senderName,
    content: data.content,
    timestamp: Date.now()
  })
  
  // Also send confirmation to sender
  socket.emit('group_message_sent', {
    messageId: data.messageId,
    timestamp: Date.now()
  })
})

// Or simpler: broadcast to ALL connected clients including sender
socket.on('send_group_message', (data: any) => {
  io.emit('group_new_message', {
    messageId: data.messageId,
    senderId: data.senderId,
    senderName: data.senderName,
    content: data.content,
    timestamp: Date.now()
  })
})

socket.on('typing_start', (data: any) => {
  socket.to(`user:${data.conversationId}`).emit('user_typing', data)
})

socket.on('typing_stop', (data: any) => {
  socket.to(`user:${data.conversationId}`).emit('user_stopped_typing', data)
})

socket.on('mark_read', (data: any) => {
  io.to(`user:${data.senderId}`).emit('messages_read', { ...data, timestamp: Date.now() })
})

  // ========== LIVE EVENT EVENTS ==========
  socket.on('event_chat', (data: any) => {
    io.to(`event:${data.eventId}`).emit('event_chat_message', {
      eventId: data.eventId, userId: socket.userId, message: data.message, timestamp: Date.now()
    })
  })
  socket.on('event_reaction', (data: any) => {
    io.to(`event:${data.eventId}`).emit('event_reaction_received', { ...data, timestamp: Date.now() })
  })
  socket.on('event_go_live', (data: any) => {
    io.emit('event_went_live', { ...data, timestamp: Date.now() })
  })

  // ========== POLL EVENTS ==========
  socket.on('poll_vote', (data: any) => {
    io.to(`post:${data.postId}`).emit('poll_vote', { ...data, timestamp: Date.now() })
    io.to(`post:${data.postId}`).emit('poll_results_updated', { ...data, timestamp: Date.now() })
  })

  // ========== REPORT EVENTS ==========
  socket.on('submit_report', (data: any) => {
    io.to('admins').emit('new_report', { ...data, timestamp: Date.now() })
  })

  // ========== TAG EVENTS ==========
  socket.on('tag_user', (data: any) => {
    io.to(`post:${data.postId}`).emit('user_tagged', { ...data, timestamp: Date.now() })
    io.to(`user:${data.taggedUserId}`).emit('tagged_in_post', { ...data, timestamp: Date.now() })
  })

  // ========== INVITE EVENTS ==========
  socket.on('send_invite', (data: any) => {
    io.to(`user:${data.inviteeId}`).emit('new_invite', { ...data, timestamp: Date.now() })
  })
  socket.on('respond_invite', (data: any) => {
    io.to(`user:${data.inviterId}`).emit('invite_response', { ...data, timestamp: Date.now() })
  })

  // ========== PREFERENCE EVENTS ==========
  socket.on('update_preferences', (data: any) => {
    io.to(`user:${data.userId}`).emit('preferences_updated', { ...data, timestamp: Date.now() })
  })

  // ========== DISCONNECT ==========
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId)
      io.emit('user_offline', { userId: socket.userId, timestamp: Date.now() })
    }
    console.log(`🔌 Disconnected: ${socket.id}`)
  })
})

// ====================== ALL ROUTES ======================
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/likes', likesRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/comment-likes', commentLikesRoutes)
app.use('/api/views', viewsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/saved-posts', savedPostsRoutes)
app.use('/api/follows', followsRoutes)
app.use('/api/messages', directMessagesRoutes)
app.use('/api/events', liveEventsRoutes)
app.use('/api/polls', pollsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/tags', tagsRoutes)
app.use('/api/invites', invitesRoutes)
app.use('/api/priority-feed', priorityFeedRoutes)
app.use('/api/preferences', interactionPreferencesRoutes)
app.use('/api/upload', uploadRoutes)

// Health check
app.get('/ping', (req: any, res: any) => res.status(200).send('pong'))

app.get('/api/socket/status', (req: any, res: any) => {
  res.json({ connected: true, activeUsers: onlineUsers.size, timestamp: Date.now() })
})

// ====================== AI ======================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GROK_API_KEY = process.env.GROK_API_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

if (!GEMINI_API_KEY) console.error('❌ GEMINI_API_KEY missing')
if (!GROK_API_KEY) console.warn('⚠️ GROK_API_KEY missing')
if (!DEEPSEEK_API_KEY) console.warn('⚠️ DEEPSEEK_API_KEY missing')

const SYSTEM_PROMPT = `You are M.K AI, the official AI assistant for the Patriots League of Uganda (PLU).

IMPORTANT PLU INFORMATION:
- Organization: Patriots League of Uganda (PLU)
- Patron: General Muhoozi Kainerugaba
- Mission: Promote patriotism, national unity, and civic responsibility in Uganda
- Core Values: Patriotism, Integrity, Accountability, Service, Discipline
- Activities: Community development projects, youth empowerment programs, patriotic education
- Membership: Open to all patriotic Ugandans aged 18 and above
- Headquarters: Kampala, Uganda
- Developer of this application is Musinguzi Benard who graduated from Muni university with a degree in information systems in the year 2025 reachable on 256763313707 or email musinguzibenard37gmail.com.

RESPONSE GUIDELINES:
1. Always respond in clear, respectful Ugandan English
2. Be informative and helpful about PLU matters and NRM initiatives and leadership and achievements
3. If you don't know specific details, be honest and suggest contacting PLU directly
4. Emphasize PLU's positive impact on communities
5. Highlight youth involvement and national development
6. Keep responses concise but comprehensive
7. Avoid negative political statements, focus on community development`

const getGeminiResponse = async (userMessage: string): Promise<string> => {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')
  const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']
  let lastError: Error | null = null
  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelsToTry[attempt]}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${userMessage}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
          })
        }
      )
      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text?.length > 5) return text
      }
      lastError = new Error(`Model failed`)
    } catch (err) { lastError = err as Error }
    if (attempt < modelsToTry.length - 1) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
  }
  throw lastError || new Error('All Gemini models failed')
}

const getGrokResponse = async (userMessage: string): Promise<string> => {
  if (!GROK_API_KEY) throw new Error('GROK_API_KEY not configured')
  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST', headers: { 'Authorization': `Bearer ${GROK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'grok-4-1-fast-reasoning', input: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userMessage }] })
  })
  if (!response.ok) throw new Error(`Grok failed`)
  const data = await response.json()
  return data.output?.[0]?.content?.[0]?.text || 'No response'
}

const getDeepSeekResponse = async (userMessage: string): Promise<string> => {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not configured')
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userMessage }], temperature: 0.7, max_tokens: 1000 })
  })
  if (!response.ok) throw new Error(`DeepSeek failed`)
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (text?.length > 5) return text
  throw new Error('DeepSeek: Invalid response')
}

app.post('/api/ai/chat', async (req: any, res: any) => {
  const { message } = req.body
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message required' })
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
  try {
    let aiResponse = ''
    try { aiResponse = await Promise.race([getGeminiResponse(message), timeout]) as string }
    catch { try { aiResponse = await Promise.race([getGrokResponse(message), timeout]) as string }
    catch { try { aiResponse = await Promise.race([getDeepSeekResponse(message), timeout]) as string }
    catch { throw new Error('All failed') } } }
    res.json({ response: aiResponse })
  } catch { res.json({ response: "High demand. Please try again.", fallback: true }) }
})

app.get('/', (req: any, res: any) => {
  res.json({ message: 'PLU Backend LIVE', db: 'Connected', socket: 'Active', timestamp: Date.now() })
})

// ====================== STARTUP ======================
const PORT = process.env.PORT || 3000

sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Database connected')
  server.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`)
    console.log(`🔌 Socket.IO ready`)
  })
})

export default app