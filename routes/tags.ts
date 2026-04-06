import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Tag } from '../models/Tag'
import { User } from '../models/User'
import { Post } from '../models/Post'
import pushService from '../services/expoPushNotification'

const router = Router()

// PUBLIC ROUTES
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params
    const tags = await Tag.findAll({
      where: { post_id: postId },
      include: [
        { model: User, as: 'tagger', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'tagged', attributes: ['id', 'name', 'avatar_url'] }
      ]
    })
    res.json(tags)
  } catch (error) {
    console.error('Get tags error:', error)
    res.status(500).json({ error: 'Failed to get tags' })
  }
})

// PROTECTED ROUTES
const protectedRouter = Router()
protectedRouter.use(requireAuth)

protectedRouter.post('/tag', async (req, res) => {
  try {
    const taggerId = req.user.id
    const { tagged_id, post_id } = req.body

    if (taggerId === tagged_id) {
      return res.status(400).json({ error: 'Cannot tag yourself' })
    }

    const existing = await Tag.findOne({
      where: { tagger_id: taggerId, tagged_id, post_id }
    })

    if (existing) {
      return res.status(400).json({ error: 'Already tagged this user' })
    }

    const tag = await Tag.create({
      tagger_id: taggerId,
      tagged_id,
      post_id,
      notified: false
    })

    const tagger = await User.findByPk(taggerId)
    const post = await Post.findByPk(post_id)
    
    await pushService.createAndSend(
      tagged_id,
      'comment',
      tag.id,
      'You were tagged!',
      `${tagger?.name} tagged you in a post: "${post?.title?.substring(0, 50) || 'a post'}"`,
      post?.photo_url || undefined,
      { postId: post_id, tagId: tag.id, type: 'tag' }
    )

    res.status(201).json(tag)
  } catch (error) {
    console.error('Tag error:', error)
    res.status(500).json({ error: 'Failed to tag user' })
  }
})

protectedRouter.get('/my-tags', async (req, res) => {
  try {
    const userId = req.user.id
    const tags = await Tag.findAll({
      where: { tagged_id: userId },
      include: [
        { model: Post, include: [{ model: User, attributes: ['name', 'avatar_url'] }] },
        { model: User, as: 'tagger', attributes: ['name', 'avatar_url'] }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json(tags)
  } catch (error) {
    console.error('Get my tags error:', error)
    res.status(500).json({ error: 'Failed to get tags' })
  }
})

protectedRouter.delete('/:tagId', async (req, res) => {
  try {
    const userId = req.user.id
    const { tagId } = req.params

    const tag = await Tag.findByPk(tagId)
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    if (tag.tagger_id !== userId && tag.tagged_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    await tag.destroy()
    res.json({ success: true })
  } catch (error) {
    console.error('Remove tag error:', error)
    res.status(500).json({ error: 'Failed to remove tag' })
  }
})

router.use(protectedRouter)

export default router