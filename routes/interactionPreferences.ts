import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { InteractionPreference } from '../models/InteractionPreference'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id

    let preferences = await InteractionPreference.findOne({
      where: { user_id: userId }
    })

    if (!preferences) {
      preferences = await InteractionPreference.create({ user_id: userId })
    }

    res.json(preferences)
  } catch (error) {
    console.error('Get preferences error:', error)
    res.status(500).json({ error: 'Failed to get preferences' })
  }
})

router.patch('/', async (req, res) => {
  try {
    const userId = req.user.id
    const { notify_on_follow, notify_on_like, notify_on_comment, notify_on_tag, notify_on_invite, auto_accept_follows } = req.body

    let preferences = await InteractionPreference.findOne({
      where: { user_id: userId }
    })

    if (!preferences) {
      preferences = await InteractionPreference.create({ user_id: userId })
    }

    if (notify_on_follow !== undefined) preferences.notify_on_follow = notify_on_follow
    if (notify_on_like !== undefined) preferences.notify_on_like = notify_on_like
    if (notify_on_comment !== undefined) preferences.notify_on_comment = notify_on_comment
    if (notify_on_tag !== undefined) preferences.notify_on_tag = notify_on_tag
    if (notify_on_invite !== undefined) preferences.notify_on_invite = notify_on_invite
    if (auto_accept_follows !== undefined) preferences.auto_accept_follows = auto_accept_follows

    await preferences.save()

    res.json(preferences)
  } catch (error) {
    console.error('Update preferences error:', error)
    res.status(500).json({ error: 'Failed to update preferences' })
  }
})

router.post('/reset', async (req, res) => {
  try {
    const userId = req.user.id

    await InteractionPreference.upsert({
      user_id: userId,
      notify_on_follow: true,
      notify_on_like: true,
      notify_on_comment: true,
      notify_on_tag: true,
      notify_on_invite: true,
      auto_accept_follows: true
    })

    const preferences = await InteractionPreference.findOne({
      where: { user_id: userId }
    })

    res.json(preferences)
  } catch (error) {
    console.error('Reset preferences error:', error)
    res.status(500).json({ error: 'Failed to reset preferences' })
  }
})

export default router