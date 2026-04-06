import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Invite } from '../models/Invite'
import { User } from '../models/User'
import { Post } from '../models/Post'
import { LiveEvent } from '../models/LiveEvent'
import pushService from '../services/expoPushNotification'

const router = Router()
router.use(requireAuth)

router.post('/send', async (req, res) => {
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

    res.status(201).json(invite)
  } catch (error) {
    console.error('Send invite error:', error)
    res.status(500).json({ error: 'Failed to send invite' })
  }
})

router.get('/my-invites', async (req, res) => {
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

router.get('/sent', async (req, res) => {
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

router.patch('/:inviteId/respond', async (req, res) => {
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

    res.json({ success: true, status: invite.status })
  } catch (error) {
    console.error('Respond to invite error:', error)
    res.status(500).json({ error: 'Failed to respond to invite' })
  }
})

export default router