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


// routes/liveEvents.ts - ORIGINAL CODE + SOCKET.IO ONLY
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { LiveEvent } from '../models/LiveEvent'
import { User } from '../models/User'
import { Op } from 'sequelize'

const router = Router()

// PUBLIC ROUTES
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, upcoming = 'true' } = req.query
    const where: any = {}
    
    if (upcoming === 'true') {
      where.scheduled_start = { [Op.gte]: new Date() }
    }

    const events = await LiveEvent.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
      order: [['scheduled_start', 'ASC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    })

    res.json(events)
  } catch (error) {
    console.error('Get events error:', error)
    res.status(500).json({ error: 'Failed to get events' })
  }
})

router.get('/featured', async (req, res) => {
  try {
    const events = await LiveEvent.findAll({
      where: { is_featured: true, status: { [Op.ne]: 'ended' } },
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }],
      order: [['scheduled_start', 'ASC']],
      limit: 5
    })
    res.json(events)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get featured events' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const event = await LiveEvent.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
    })
    if (!event) return res.status(404).json({ error: 'Event not found' })
    res.json(event)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get event' })
  }
})

// PROTECTED ROUTES
const protectedRouter = Router()
protectedRouter.use(requireAuth)

protectedRouter.post('/', async (req, res) => {
  try {
    const userId = req.user.id
    const { title, description, image_url, stream_url, scheduled_start, scheduled_end } = req.body

    if (!title || !stream_url || !scheduled_start) {
      return res.status(400).json({ error: 'Title, stream URL, and start time required' })
    }

    const event = await LiveEvent.create({
      created_by: userId,
      title,
      description,
      image_url,
      stream_url,
      scheduled_start,
      scheduled_end,
      status: 'scheduled'
    })

    // ✅ SOCKET.IO - Emit new event
    const io = req.app.get('io')
    if (io) {
      io.emit('new_event', {
        eventId: event.id,
        title,
        scheduledStart: scheduled_start,
        streamUrl: stream_url,
        timestamp: Date.now()
      })
    }

    res.status(201).json(event)
  } catch (error) {
    console.error('Create event error:', error)
    res.status(500).json({ error: 'Failed to create event' })
  }
})

protectedRouter.patch('/:id/status', async (req, res) => {
  try {
    const userId = req.user.id
    const { status } = req.body
    const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'

    const event = await LiveEvent.findByPk(req.params.id)
    if (!event) return res.status(404).json({ error: 'Event not found' })

    if (event.created_by !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const oldStatus = event.status
    event.status = status
    await event.save()

    // ✅ SOCKET.IO - Emit status change
    const io = req.app.get('io')
    if (io) {
      io.to(`event:${event.id}`).emit('event_status_changed', {
        eventId: event.id,
        status,
        oldStatus,
        timestamp: Date.now()
      })

      if (status === 'live') {
        io.emit('event_went_live', {
          eventId: event.id,
          title: event.title,
          streamUrl: event.stream_url,
          timestamp: Date.now()
        })
      }

      if (status === 'ended') {
        io.to(`event:${event.id}`).emit('event_ended', {
          eventId: event.id,
          title: event.title,
          timestamp: Date.now()
        })
      }
    }

    res.json(event)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event status' })
  }
})

protectedRouter.post('/:id/view', async (req, res) => {
  try {
    const event = await LiveEvent.findByPk(req.params.id)
    if (!event) return res.status(404).json({ error: 'Event not found' })
    await event.increment('viewer_count')
    await event.reload()

    // ✅ SOCKET.IO - Emit viewer count
    const io = req.app.get('io')
    if (io) {
      io.to(`event:${event.id}`).emit('viewer_count_updated', {
        eventId: event.id,
        viewerCount: event.viewer_count,
        timestamp: Date.now()
      })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to track view' })
  }
})

protectedRouter.patch('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const event = await LiveEvent.findByPk(req.params.id)
    if (!event) return res.status(404).json({ error: 'Event not found' })

    if (event.created_by !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    await event.update(req.body)

    // ✅ SOCKET.IO - Emit event updated
    const io = req.app.get('io')
    if (io) {
      io.to(`event:${event.id}`).emit('event_updated', {
        eventId: event.id,
        timestamp: Date.now()
      })
    }

    res.json(event)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' })
  }
})

protectedRouter.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const event = await LiveEvent.findByPk(req.params.id)
    if (!event) return res.status(404).json({ error: 'Event not found' })

    if (event.created_by !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const eventId = event.id
    await event.destroy()

    // ✅ SOCKET.IO - Emit event deleted
    const io = req.app.get('io')
    if (io) {
      io.to(`event:${eventId}`).emit('event_cancelled', {
        eventId,
        timestamp: Date.now()
      })
      io.emit('event_removed', { eventId, timestamp: Date.now() })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' })
  }
})

router.use(protectedRouter)

export default router