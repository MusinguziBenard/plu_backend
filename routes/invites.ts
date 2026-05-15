// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { Invite } from '../models/Invite'
// import { User } from '../models/User'
// import { Post } from '../models/Post'
// import { LiveEvent } from '../models/LiveEvent'
// import pushService from '../services/expoPushNotification'

// const router = Router()
// router.use(requireAuth)

// router.post('/send', async (req, res) => {
//   try {
//     const inviterId = req.user.id
//     const { invitee_id, type, reference_id } = req.body

//     if (inviterId === invitee_id) {
//       return res.status(400).json({ error: 'Cannot invite yourself' })
//     }

//     const existing = await Invite.findOne({
//       where: { inviter_id: inviterId, invitee_id, type, reference_id, status: 'pending' }
//     })

//     if (existing) {
//       return res.status(400).json({ error: 'Invite already sent' })
//     }

//     const invite = await Invite.create({
//       inviter_id: inviterId,
//       invitee_id,
//       type,
//       reference_id,
//       status: 'pending'
//     })

//     const inviter = await User.findByPk(inviterId)
//     let referenceName = ''
//     if (type === 'event') {
//       const event = await LiveEvent.findByPk(reference_id)
//       referenceName = event?.title || ''
//     } else if (type === 'post') {
//       const post = await Post.findByPk(reference_id)
//       referenceName = post?.title || ''
//     }

//     await pushService.createAndSend(
//       invitee_id,
//       'new_post',
//       invite.id,
//       `Invitation from ${inviter?.name}`,
//       `You're invited to ${type}: ${referenceName}`,
//       undefined,
//       { inviteId: invite.id, type: 'invite', referenceId: reference_id }
//     )

//     res.status(201).json(invite)
//   } catch (error) {
//     console.error('Send invite error:', error)
//     res.status(500).json({ error: 'Failed to send invite' })
//   }
// })

// router.get('/my-invites', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { status = 'pending' } = req.query

//     const invites = await Invite.findAll({
//       where: { invitee_id: userId, status },
//       include: [
//         { model: User, as: 'inviter', attributes: ['id', 'name', 'avatar_url'] },
//         { model: User, as: 'invitee', attributes: ['id', 'name', 'avatar_url'] }
//       ],
//       order: [['created_at', 'DESC']]
//     })

//     const enrichedInvites = await Promise.all(invites.map(async (invite) => {
//       let reference: any = null
//       if (invite.type === 'event') {
//         reference = await LiveEvent.findByPk(invite.reference_id, {
//           attributes: ['id', 'title', 'scheduled_start']
//         })
//       } else if (invite.type === 'post') {
//         reference = await Post.findByPk(invite.reference_id, {
//           attributes: ['id', 'title', 'photo_url']
//         })
//       }
//       return { ...invite.toJSON(), reference }
//     }))

//     res.json(enrichedInvites)
//   } catch (error) {
//     console.error('Get invites error:', error)
//     res.status(500).json({ error: 'Failed to get invites' })
//   }
// })

// router.get('/sent', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const invites = await Invite.findAll({
//       where: { inviter_id: userId },
//       include: [
//         { model: User, as: 'invitee', attributes: ['id', 'name', 'avatar_url'] }
//       ],
//       order: [['created_at', 'DESC']]
//     })
//     res.json(invites)
//   } catch (error) {
//     console.error('Get sent invites error:', error)
//     res.status(500).json({ error: 'Failed to get sent invites' })
//   }
// })

// router.patch('/:inviteId/respond', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { inviteId } = req.params
//     const { action } = req.body

//     const invite = await Invite.findByPk(inviteId)
//     if (!invite) {
//       return res.status(404).json({ error: 'Invite not found' })
//     }

//     if (invite.invitee_id !== userId) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     invite.status = action === 'accept' ? 'accepted' : 'rejected'
//     await invite.save()

//     res.json({ success: true, status: invite.status })
//   } catch (error) {
//     console.error('Respond to invite error:', error)
//     res.status(500).json({ error: 'Failed to respond to invite' })
//   }
// })

// export default router

// routes/invites.ts - WITH SOCKET.IO INTEGRATION
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { Invite } from '../models/Invite'
import { User } from '../models/User'
import { Post } from '../models/Post'
import { LiveEvent } from '../models/LiveEvent'
import pushService from '../services/expoPushNotification'

const router = Router()
router.use(requireAuth)

// Send invite
router.post('/send', async (req: any, res: Response) => {
  try {
    const inviterId = req.user.id
    const { invitee_id, type, reference_id } = req.body

    if (inviterId === invitee_id) {
      return res.status(400).json({ error: 'Cannot invite yourself' })
    }

    const existing = await Invite.findOne({
      where: { inviter_id: inviterId, invitee_id, type, reference_id, status: 'pending' }
    })

    if (existing) {
      return res.status(400).json({ error: 'Invite already sent' })
    }

    const invite = await Invite.create({
      inviter_id: inviterId,
      invitee_id,
      type,
      reference_id,
      status: 'pending'
    })

    const inviter = await User.findByPk(inviterId)
    let referenceName = ''
    if (type === 'event') {
      const event = await LiveEvent.findByPk(reference_id)
      referenceName = event?.title || ''
    } else if (type === 'post') {
      const post = await Post.findByPk(reference_id)
      referenceName = post?.title || ''
    }

    await pushService.createAndSend(
      invitee_id,
      'new_post',
      invite.id,
      `Invitation from ${inviter?.name}`,
      `You're invited to ${type}: ${referenceName}`,
      undefined,
      { inviteId: invite.id, type: 'invite', referenceId: reference_id }
    )

    // ✅ SOCKET.IO - Emit invite events
    const io = req.app.get('io')
    if (io) {
      // Notify invitee
      io.to(`user:${invitee_id}`).emit('new_invite', {
        inviteId: invite.id,
        inviterId,
        inviterName: inviter?.name || 'Someone',
        inviteeId: invitee_id,
        type,
        referenceId: reference_id,
        referenceName,
        status: 'pending',
        timestamp: Date.now()
      })

      io.to(`notifications:${invitee_id}`).emit('new_notification', {
        type: 'invite',
        title: 'New Invitation',
        message: `${inviter?.name || 'Someone'} invited you to ${type}: ${referenceName}`,
        inviteId: invite.id,
        timestamp: Date.now()
      })

      // Confirm to sender
      io.to(`user:${inviterId}`).emit('invite_sent', {
        inviteId: invite.id,
        inviteeId: invitee_id,
        message: 'Invite sent successfully',
        timestamp: Date.now()
      })

      // If event invite, notify event room
      if (type === 'event') {
        io.to(`event:${reference_id}`).emit('user_invited_to_event', {
          eventId: reference_id,
          inviteeId: invitee_id,
          inviterId,
          timestamp: Date.now()
        })
      }
    }

    res.status(201).json(invite)
  } catch (error) {
    console.error('Send invite error:', error)
    res.status(500).json({ error: 'Failed to send invite' })
  }
})

// Get my invites
router.get('/my-invites', async (req: any, res: Response) => {
  try {
    const userId = req.user.id
    const { status = 'pending' } = req.query

    const invites = await Invite.findAll({
      where: { invitee_id: userId, status },
      include: [
        { model: User, as: 'inviter', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'invitee', attributes: ['id', 'name', 'avatar_url'] }
      ],
      order: [['created_at', 'DESC']]
    })

    const enrichedInvites = await Promise.all(invites.map(async (invite) => {
      let reference: any = null
      if (invite.type === 'event') {
        reference = await LiveEvent.findByPk(invite.reference_id, {
          attributes: ['id', 'title', 'scheduled_start']
        })
      } else if (invite.type === 'post') {
        reference = await Post.findByPk(invite.reference_id, {
          attributes: ['id', 'title', 'photo_url']
        })
      }
      return { ...invite.toJSON(), reference }
    }))

    res.json(enrichedInvites)
  } catch (error) {
    console.error('Get invites error:', error)
    res.status(500).json({ error: 'Failed to get invites' })
  }
})

// Get sent invites
router.get('/sent', async (req: any, res: Response) => {
  try {
    const userId = req.user.id
    const invites = await Invite.findAll({
      where: { inviter_id: userId },
      include: [
        { model: User, as: 'invitee', attributes: ['id', 'name', 'avatar_url'] }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json(invites)
  } catch (error) {
    console.error('Get sent invites error:', error)
    res.status(500).json({ error: 'Failed to get sent invites' })
  }
})

// Respond to invite
router.patch('/:inviteId/respond', async (req: any, res: Response) => {
  try {
    const userId = req.user.id
    const { inviteId } = req.params
    const { action } = req.body

    const invite = await Invite.findByPk(inviteId)
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' })
    }

    if (invite.invitee_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    invite.status = action === 'accept' ? 'accepted' : 'rejected'
    await invite.save()

    // Get reference name for notification
    let referenceName = ''
    if (invite.type === 'event') {
      const event = await LiveEvent.findByPk(invite.reference_id)
      referenceName = event?.title || ''
    } else if (invite.type === 'post') {
      const post = await Post.findByPk(invite.reference_id)
      referenceName = post?.title || ''
    }

    // ✅ SOCKET.IO - Emit response events
    const io = req.app.get('io')
    if (io) {
      // Notify inviter
      io.to(`user:${invite.inviter_id}`).emit('invite_response', {
        inviteId,
        inviteeId: userId,
        action,
        status: invite.status,
        referenceName,
        message: `Your invite was ${invite.status}`,
        timestamp: Date.now()
      })

      io.to(`notifications:${invite.inviter_id}`).emit('new_notification', {
        type: 'invite_response',
        title: `Invite ${invite.status}`,
        message: `Someone ${invite.status} your invite to ${invite.type}: ${referenceName}`,
        inviteId,
        timestamp: Date.now()
      })

      // Confirm to responder
      io.to(`user:${userId}`).emit('invite_response_sent', {
        inviteId,
        action,
        status: invite.status,
        message: `You ${invite.status} the invite`,
        timestamp: Date.now()
      })

      // If accepted event invite, notify event room
      if (invite.type === 'event' && action === 'accept') {
        io.to(`event:${invite.reference_id}`).emit('user_accepted_event_invite', {
          eventId: invite.reference_id,
          userId,
          timestamp: Date.now()
        })
      }
    }

    res.json({ success: true, status: invite.status })
  } catch (error) {
    console.error('Respond to invite error:', error)
    res.status(500).json({ error: 'Failed to respond to invite' })
  }
})

// Cancel sent invite
router.delete('/:inviteId/cancel', async (req: any, res: Response) => {
  try {
    const userId = req.user.id
    const { inviteId } = req.params

    const invite = await Invite.findByPk(inviteId)
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' })
    }

    if (invite.inviter_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending invites' })
    }

    const inviteeId = invite.invitee_id
    await invite.destroy()

    // ✅ SOCKET.IO - Notify invitee
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${inviteeId}`).emit('invite_cancelled', {
        inviteId,
        cancelledBy: userId,
        timestamp: Date.now()
      })
    }

    res.json({ success: true, message: 'Invite cancelled' })
  } catch (error) {
    console.error('Cancel invite error:', error)
    res.status(500).json({ error: 'Failed to cancel invite' })
  }
})

export default router