// // routes/liveEvents.ts
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { LiveEvent } from '../models/LiveEvent'
// import { User } from '../models/User'
// import pushService from '../services/expoPushNotification'

// const router = Router()

// // Public routes
// router.get('/', async (req, res) => {
//   try {
//     const { page = 1, limit = 20, status } = req.query
//     const where: any = {}
//     if (status) where.status = status

//     const events = await LiveEvent.findAll({
//       where,
//       include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
//       order: [['scheduled_start', 'ASC']],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit)
//     })
//     res.json(events)
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get events' })
//   }
// })

// router.get('/:id', async (req, res) => {
//   try {
//     const event = await LiveEvent.findByPk(req.params.id, {
//       include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
//     })
//     if (!event) return res.status(404).json({ error: 'Event not found' })
//     res.json(event)
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get event' })
//   }
// })

// // Protected routes (admin only for creation)
// const protectedRouter = Router()
// protectedRouter.use(requireAuth)

// protectedRouter.post('/', async (req: any, res) => {
//   try {
//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
//     if (!isAdmin) {
//       return res.status(403).json({ error: 'Admin only' })
//     }

//     const { title, description, stream_url, scheduled_start, scheduled_end } = req.body

//     const event = await LiveEvent.create({
//       created_by: req.user.id,
//       title,
//       description,
//       stream_url,
//       scheduled_start,
//       scheduled_end,
//       status: 'scheduled'
//     })

//     // Notify all users about new event
//     pushService.sendToAllUsers(
//       'New Live Event',
//       `${title} - Starting ${new Date(scheduled_start).toLocaleString()}`,
//       { eventId: event.id, type: 'live_event' }
//     )

//     res.status(201).json(event)
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to create event' })
//   }
// })

// protectedRouter.patch('/:id/status', async (req: any, res) => {
//   try {
//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
//     if (!isAdmin) {
//       return res.status(403).json({ error: 'Admin only' })
//     }

//     const { status } = req.body
//     const event = await LiveEvent.findByPk(req.params.id)
//     if (!event) return res.status(404).json({ error: 'Event not found' })

//     event.status = status
//     await event.save()

//     if (status === 'live') {
//       pushService.sendToAllUsers(
//         '🔴 Live Now!',
//         event.title,
//         { eventId: event.id, type: 'live_now' }
//       )
//     }

//     res.json(event)
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to update event status' })
//   }
// })

// protectedRouter.post('/:id/view', async (req, res) => {
//   try {
//     const event = await LiveEvent.findByPk(req.params.id)
//     if (!event) return res.status(404).json({ error: 'Event not found' })

//     await event.increment('viewer_count')
//     res.json({ success: true })
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to track view' })
//   }
// })

// router.use(protectedRouter)
// export default router


// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { LiveEvent } from '../models/LiveEvent'
// import { User } from '../models/User'
// import { Op } from 'sequelize'

// const router = Router()

// // PUBLIC ROUTES
// router.get('/', async (req, res) => {
//   try {
//     const { page = 1, limit = 20, upcoming = 'true' } = req.query
//     const where: any = {}
    
//     if (upcoming === 'true') {
//       where.scheduled_start = { [Op.gte]: new Date() }
//     }

//     const events = await LiveEvent.findAll({
//       where,
//       include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
//       order: [['scheduled_start', 'ASC']],
//       limit: Number(limit),
//       offset: (Number(page) - 1) * Number(limit)
//     })

//     res.json(events)
//   } catch (error) {
//     console.error('Get events error:', error)
//     res.status(500).json({ error: 'Failed to get events' })
//   }
// })

// router.get('/featured', async (req, res) => {
//   try {
//     const events = await LiveEvent.findAll({
//       where: { is_featured: true, status: { [Op.ne]: 'ended' } },
//       include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
//       order: [['scheduled_start', 'ASC']],
//       limit: 5
//     })
//     res.json(events)
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get featured events' })
//   }
// })

// router.get('/:id', async (req, res) => {
//   try {
//     const event = await LiveEvent.findByPk(req.params.id, {
//       include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
//     })
//     if (!event) return res.status(404).json({ error: 'Event not found' })
//     res.json(event)
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get event' })
//   }
// })

// // PROTECTED ROUTES
// const protectedRouter = Router()
// protectedRouter.use(requireAuth)

// protectedRouter.post('/', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { title, description, image_url, stream_url, scheduled_start, scheduled_end } = req.body

//     if (!title || !stream_url || !scheduled_start) {
//       return res.status(400).json({ error: 'Title, stream URL, and start time required' })
//     }

//     const event = await LiveEvent.create({
//       created_by: userId,
//       title,
//       description,
//       image_url,
//       stream_url,
//       scheduled_start,
//       scheduled_end,
//       status: 'scheduled'
//     })

//     res.status(201).json(event)
//   } catch (error) {
//     console.error('Create event error:', error)
//     res.status(500).json({ error: 'Failed to create event' })
//   }
// })

// protectedRouter.patch('/:id/status', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { status } = req.body
//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

//     const event = await LiveEvent.findByPk(req.params.id)
//     if (!event) return res.status(404).json({ error: 'Event not found' })

//     if (event.created_by !== userId && !isAdmin) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     event.status = status
//     await event.save()
//     res.json(event)
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to update event status' })
//   }
// })

// protectedRouter.post('/:id/view', async (req, res) => {
//   try {
//     const event = await LiveEvent.findByPk(req.params.id)
//     if (!event) return res.status(404).json({ error: 'Event not found' })
//     await event.increment('viewer_count')
//     res.json({ success: true })
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to track view' })
//   }
// })

// protectedRouter.patch('/:id', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const event = await LiveEvent.findByPk(req.params.id)
//     if (!event) return res.status(404).json({ error: 'Event not found' })

//     if (event.created_by !== userId) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     await event.update(req.body)
//     res.json(event)
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to update event' })
//   }
// })

// protectedRouter.delete('/:id', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const event = await LiveEvent.findByPk(req.params.id)
//     if (!event) return res.status(404).json({ error: 'Event not found' })

//     if (event.created_by !== userId) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     await event.destroy()
//     res.json({ success: true })
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to delete event' })
//   }
// })

// router.use(protectedRouter)

// export default router


// routes/liveEvents.ts - COMPLETE WITH SOCKET.IO INTEGRATION
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { LiveEvent } from '../models/LiveEvent'
import { User } from '../models/User'
import { Op } from 'sequelize'

const router = Router()

// Type definitions for socket events
interface EventCreatedData {
  eventId: string;
  title: string;
  scheduledStart: Date;
  streamUrl: string;
  createdBy: string;
  timestamp: number;
}

interface EventStatusUpdatedData {
  eventId: string;
  status: string;
  updatedBy: string;
  timestamp: number;
}

interface EventViewerData {
  eventId: string;
  viewerCount: number;
  timestamp: number;
}

interface EventUpdatedData {
  eventId: string;
  updatedBy: string;
  changes: string[];
  timestamp: number;
}

interface EventDeletedData {
  eventId: string;
  deletedBy: string;
  timestamp: number;
}

interface EventLiveData {
  eventId: string;
  status: 'live';
  streamUrl: string;
  viewerCount: number;
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

// Helper to get number from query
const getNumberQuery = (value: any, defaultValue: number): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all events
router.get('/', async (req: Request, res: Response) => {
  try {
    const page: number = getNumberQuery(req.query.page, 1)
    const limit: number = getNumberQuery(req.query.limit, 20)
    const upcoming: boolean = req.query.upcoming !== 'false'
    
    const where: any = {}
    
    if (upcoming) {
      where.scheduled_start = { [Op.gte]: new Date() }
    }

    const { count, rows: events } = await LiveEvent.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
      order: [['scheduled_start', 'ASC']],
      limit,
      offset: (page - 1) * limit
    })

    return res.json({
      events,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get events error:', error)
    return res.status(500).json({ error: 'Failed to get events' })
  }
})

// Get featured events
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const events = await LiveEvent.findAll({
      where: { is_featured: true, status: { [Op.ne]: 'ended' } },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
      order: [['scheduled_start', 'ASC']],
      limit: 5
    })
    
    return res.json(events)
  } catch (error) {
    console.error('Get featured events error:', error)
    return res.status(500).json({ error: 'Failed to get featured events' })
  }
})

// Get live events
router.get('/live', async (req: Request, res: Response) => {
  try {
    const liveEvents = await LiveEvent.findAll({
      where: { status: 'live' },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
      order: [['viewer_count', 'DESC']]
    })
    
    return res.json(liveEvents)
  } catch (error) {
    console.error('Get live events error:', error)
    return res.status(500).json({ error: 'Failed to get live events' })
  }
})

// Get single event
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const eventId: string = getParam(req.params, 'id')
    const event = await LiveEvent.findByPk(eventId, {
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
    })
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    return res.json(event)
  } catch (error) {
    console.error('Get event error:', error)
    return res.status(500).json({ error: 'Failed to get event' })
  }
})

// ============================================
// PROTECTED ROUTES
// ============================================

const protectedRouter = Router()
protectedRouter.use(requireAuth)

// Create event
protectedRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { title, description, image_url, stream_url, scheduled_start, scheduled_end }: {
      title: string;
      description?: string;
      image_url?: string;
      stream_url: string;
      scheduled_start: string;
      scheduled_end?: string;
    } = req.body

    if (!title || !stream_url || !scheduled_start) {
      return res.status(400).json({ error: 'Title, stream URL, and start time required' })
    }

    const event = await LiveEvent.create({
      created_by: userId,
      title,
      description: description || '',
      image_url: image_url || null,
      stream_url,
      scheduled_start,
      scheduled_end: scheduled_end || null,
      status: 'scheduled'
    })

    // ✅ SOCKET.IO - Emit event created
    const io = req.app.get('io')
    if (io) {
      const eventData: EventCreatedData = {
        eventId: event.id,
        title,
        scheduledStart: new Date(scheduled_start),
        streamUrl: stream_url,
        createdBy: userId,
        timestamp: Date.now()
      }

      // Notify all users about new event
      io.emit('new_event', eventData)

      // Notify admins
      io.to('admins').emit('event_created', {
        ...eventData,
        creatorName: req.user.name || 'Unknown'
      })

      // Confirm to creator
      io.to(`user:${userId}`).emit('event_created_confirmation', {
        ...eventData,
        message: 'Your event has been created successfully'
      })
    }

    return res.status(201).json(event)
  } catch (error) {
    console.error('Create event error:', error)
    return res.status(500).json({ error: 'Failed to create event' })
  }
})

// Update event status (go live, end, etc.)
protectedRouter.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const eventId: string = getParam(req.params, 'id')
    const { status }: { status: string } = req.body

    const event = await LiveEvent.findByPk(eventId, {
      include: [{ model: User, attributes: ['id', 'name'] }]
    })
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (event.created_by !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const oldStatus: string = event.status
    event.status = status
    await event.save()

    // ✅ SOCKET.IO - Emit status change events
    const io = req.app.get('io')
    if (io) {
      const statusData: EventStatusUpdatedData = {
        eventId,
        status,
        updatedBy: userId,
        timestamp: Date.now()
      }

      // Emit to event room
      io.to(`event:${eventId}`).emit('event_status_changed', {
        ...statusData,
        oldStatus
      })

      // If going live, notify all users
      if (status === 'live') {
        const liveData: EventLiveData = {
          eventId,
          status: 'live',
          streamUrl: event.stream_url,
          viewerCount: event.viewer_count,
          timestamp: Date.now()
        }

        io.emit('event_went_live', liveData)

        // Notify followers or interested users
        io.emit('live_event_started', {
          eventId,
          title: event.title,
          streamUrl: event.stream_url,
          timestamp: Date.now()
        })
      }

      // If ended, notify viewers
      if (status === 'ended') {
        io.to(`event:${eventId}`).emit('event_ended', {
          eventId,
          title: event.title,
          timestamp: Date.now()
        })
      }

      // Notify admins
      io.to('admins').emit('event_status_updated', {
        ...statusData,
        eventTitle: event.title,
        oldStatus
      })
    }

    return res.json(event)
  } catch (error) {
    console.error('Update event status error:', error)
    return res.status(500).json({ error: 'Failed to update event status' })
  }
})

// Track event view
protectedRouter.post('/:id/view', async (req: AuthRequest, res: Response) => {
  try {
    const eventId: string = getParam(req.params, 'id')
    const userId: string | undefined = req.user?.id
    
    const event = await LiveEvent.findByPk(eventId)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    await event.increment('viewer_count')
    await event.reload()
    
    // ✅ SOCKET.IO - Emit viewer count update
    const io = req.app.get('io')
    if (io) {
      const viewerData: EventViewerData = {
        eventId,
        viewerCount: event.viewer_count,
        timestamp: Date.now()
      }

      // Emit to event room for real-time viewer count
      io.to(`event:${eventId}`).emit('viewer_count_updated', viewerData)

      // If user is authenticated, track their view
      if (userId) {
        io.to(`event:${eventId}`).emit('user_joined_event', {
          eventId,
          userId,
          timestamp: Date.now()
        })
      }

      // Update event analytics for admins
      io.to('admins').emit('event_analytics_update', {
        eventId,
        eventTitle: event.title,
        viewerCount: event.viewer_count,
        status: event.status,
        timestamp: Date.now()
      })
    }
    
    return res.json({ success: true, viewerCount: event.viewer_count })
  } catch (error) {
    console.error('Track view error:', error)
    return res.status(500).json({ error: 'Failed to track view' })
  }
})

// Update event details
protectedRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const eventId: string = getParam(req.params, 'id')
    
    const event = await LiveEvent.findByPk(eventId)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (event.created_by !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const updatedFields: string[] = []
    const allowedFields = ['title', 'description', 'image_url', 'stream_url', 'scheduled_start', 'scheduled_end']
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updatedFields.push(field)
      }
    }

    await event.update(req.body)

    // ✅ SOCKET.IO - Emit event updated
    const io = req.app.get('io')
    if (io) {
      const updateData: EventUpdatedData = {
        eventId,
        updatedBy: userId,
        changes: updatedFields,
        timestamp: Date.now()
      }

      io.to(`event:${eventId}`).emit('event_updated', {
        ...updateData,
        event: event.toJSON()
      })

      // Notify admins if changed by non-admin
      if (!isAdmin(req)) {
        io.to('admins').emit('event_edited_by_user', updateData)
      }
    }

    return res.json(event)
  } catch (error) {
    console.error('Update event error:', error)
    return res.status(500).json({ error: 'Failed to update event' })
  }
})

// Delete event
protectedRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const eventId: string = getParam(req.params, 'id')
    
    const event = await LiveEvent.findByPk(eventId)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (event.created_by !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    await event.destroy()

    // ✅ SOCKET.IO - Emit event deleted
    const io = req.app.get('io')
    if (io) {
      const deleteData: EventDeletedData = {
        eventId,
        deletedBy: userId,
        timestamp: Date.now()
      }

      // Notify event room
      io.to(`event:${eventId}`).emit('event_cancelled', {
        ...deleteData,
        message: 'This event has been cancelled'
      })

      // Notify all users
      io.emit('event_removed', deleteData)

      // Notify admins
      io.to('admins').emit('event_deleted', {
        ...deleteData,
        eventTitle: event.title
      })

      // Notify creator if deleted by admin
      if (event.created_by !== userId) {
        io.to(`user:${event.created_by}`).emit('event_deleted_by_admin', {
          ...deleteData,
          message: 'Your event was removed by an administrator'
        })
      }
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('Delete event error:', error)
    return res.status(500).json({ error: 'Failed to delete event' })
  }
})

// Subscribe to event updates
protectedRouter.post('/:id/subscribe', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const eventId: string = getParam(req.params, 'id')

    const event = await LiveEvent.findByPk(eventId)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // The actual socket room joining happens on the client side
    // This endpoint confirms the subscription
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('event_subscription_confirmed', {
        eventId,
        message: 'You are now subscribed to this event',
        timestamp: Date.now()
      })
    }

    return res.json({ 
      success: true, 
      message: 'Subscribed to event updates',
      socketRoom: `event:${eventId}`
    })
  } catch (error) {
    console.error('Subscribe to event error:', error)
    return res.status(500).json({ error: 'Failed to subscribe to event' })
  }
})

router.use(protectedRouter)

export default router