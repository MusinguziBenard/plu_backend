// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { Tag } from '../models/Tag'
// import { User } from '../models/User'
// import { Post } from '../models/Post'
// import pushService from '../services/expoPushNotification'

// const router = Router()

// // PUBLIC ROUTES
// router.get('/post/:postId', async (req, res) => {
//   try {
//     const { postId } = req.params
//     const tags = await Tag.findAll({
//       where: { post_id: postId },
//       include: [
//         { model: User, as: 'tagger', attributes: ['id', 'name', 'avatar_url'] },
//         { model: User, as: 'tagged', attributes: ['id', 'name', 'avatar_url'] }
//       ]
//     })
//     res.json(tags)
//   } catch (error) {
//     console.error('Get tags error:', error)
//     res.status(500).json({ error: 'Failed to get tags' })
//   }
// })

// // PROTECTED ROUTES
// const protectedRouter = Router()
// protectedRouter.use(requireAuth)

// protectedRouter.post('/tag', async (req, res) => {
//   try {
//     const taggerId = req.user.id
//     const { tagged_id, post_id } = req.body

//     if (taggerId === tagged_id) {
//       return res.status(400).json({ error: 'Cannot tag yourself' })
//     }

//     const existing = await Tag.findOne({
//       where: { tagger_id: taggerId, tagged_id, post_id }
//     })

//     if (existing) {
//       return res.status(400).json({ error: 'Already tagged this user' })
//     }

//     const tag = await Tag.create({
//       tagger_id: taggerId,
//       tagged_id,
//       post_id,
//       notified: false
//     })

//     const tagger = await User.findByPk(taggerId)
//     const post = await Post.findByPk(post_id)
    
//     await pushService.createAndSend(
//       tagged_id,
//       'comment',
//       tag.id,
//       'You were tagged!',
//       `${tagger?.name} tagged you in a post: "${post?.title?.substring(0, 50) || 'a post'}"`,
//       post?.photo_url || undefined,
//       { postId: post_id, tagId: tag.id, type: 'tag' }
//     )

//     res.status(201).json(tag)
//   } catch (error) {
//     console.error('Tag error:', error)
//     res.status(500).json({ error: 'Failed to tag user' })
//   }
// })

// protectedRouter.get('/my-tags', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const tags = await Tag.findAll({
//       where: { tagged_id: userId },
//       include: [
//         { model: Post, include: [{ model: User, attributes: ['name', 'avatar_url'] }] },
//         { model: User, as: 'tagger', attributes: ['name', 'avatar_url'] }
//       ],
//       order: [['created_at', 'DESC']]
//     })
//     res.json(tags)
//   } catch (error) {
//     console.error('Get my tags error:', error)
//     res.status(500).json({ error: 'Failed to get tags' })
//   }
// })

// protectedRouter.delete('/:tagId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { tagId } = req.params

//     const tag = await Tag.findByPk(tagId)
//     if (!tag) {
//       return res.status(404).json({ error: 'Tag not found' })
//     }

//     if (tag.tagger_id !== userId && tag.tagged_id !== userId) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     await tag.destroy()
//     res.json({ success: true })
//   } catch (error) {
//     console.error('Remove tag error:', error)
//     res.status(500).json({ error: 'Failed to remove tag' })
//   }
// })

// router.use(protectedRouter)

// export default router

import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Tag } from '../models/Tag'
import { User } from '../models/User'
import { Post } from '../models/Post'
import pushService from '../services/expoPushNotification'

const router = Router()

// Type definitions for socket events
interface TagCreatedData {
  tagId: string;
  postId: string;
  taggerId: string;
  taggedUserId: string;
  taggerName: string;
  postTitle: string;
  timestamp: number;
}

interface TagRemovedData {
  tagId: string;
  postId: string;
  removedBy: string;
  timestamp: number;
}

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
    const taggerId: string = req.user.id
    const { tagged_id, post_id }: { tagged_id: string; post_id: string } = req.body

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

    const tagger: User | null = await User.findByPk(taggerId)
    const post: Post | null = await Post.findByPk(post_id)
    
    // Get tagged user for notification
    const taggedUser: User | null = await User.findByPk(tagged_id)
    
    // Send push notification
    await pushService.createAndSend(
      tagged_id,
      'comment',
      tag.id,
      'You were tagged!',
      `${tagger?.name || 'Someone'} tagged you in a post: "${post?.title?.substring(0, 50) || 'a post'}"`,
      post?.photo_url || undefined,
      { postId: post_id, tagId: tag.id, type: 'tag' }
    )

    // Socket.IO - Emit real-time tag events
    const io = req.app.get('io')
    
    const tagData: TagCreatedData = {
      tagId: tag.id,
      postId: post_id,
      taggerId,
      taggedUserId: tagged_id,
      taggerName: tagger?.name || 'Someone',
      postTitle: post?.title || 'a post',
      timestamp: Date.now()
    }
    
    // Emit to the post room so everyone viewing the post sees the tag
    io.to(`post:${post_id}`).emit('user_tagged', tagData)
    
    // Emit to the tagged user's personal notification room
    io.to(`notifications:${tagged_id}`).emit('new_notification', {
      type: 'tag',
      tagId: tag.id,
      postId: post_id,
      taggerName: tagger?.name || 'Someone',
      message: `${tagger?.name || 'Someone'} tagged you in a post`,
      timestamp: Date.now()
    })
    
    // Emit to the tagged user's personal room for real-time updates
    io.to(`user:${tagged_id}`).emit('tagged_in_post', tagData)
    
    // General notification for anyone subscribed to the post
    io.to(`post:${post_id}`).emit('post_updated', {
      postId: post_id,
      type: 'tag_added',
      timestamp: Date.now()
    })

    res.status(201).json(tag)
  } catch (error) {
    console.error('Tag error:', error)
    res.status(500).json({ error: 'Failed to tag user' })
  }
})

protectedRouter.get('/my-tags', async (req, res) => {
  try {
    const userId: string = req.user.id
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
    const userId: string = req.user.id
    const { tagId } = req.params

    const tag = await Tag.findByPk(tagId, {
      include: [
        { model: User, as: 'tagged', attributes: ['id', 'name'] }
      ]
    })
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    if (tag.tagger_id !== userId && tag.tagged_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const postId: string = tag.post_id
    const taggedUserId: string = tag.tagged_id
    
    await tag.destroy()

    // Socket.IO - Emit tag removal events
    const io = req.app.get('io')
    
    const tagRemovedData: TagRemovedData = {
      tagId,
      postId,
      removedBy: userId,
      timestamp: Date.now()
    }
    
    // Emit to the post room
    io.to(`post:${postId}`).emit('tag_removed', tagRemovedData)
    
    // Emit to the tagged user's personal room
    io.to(`user:${taggedUserId}`).emit('tag_removed_from_post', {
      ...tagRemovedData,
      message: 'A tag was removed from a post'
    })
    
    // Notify about post update
    io.to(`post:${postId}`).emit('post_updated', {
      postId,
      type: 'tag_removed',
      tagId,
      timestamp: Date.now()
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Remove tag error:', error)
    res.status(500).json({ error: 'Failed to remove tag' })
  }
})

// Get users who tagged a specific post (for real-time tracking)
protectedRouter.get('/post/:postId/taggers', async (req, res) => {
  try {
    const { postId } = req.params
    const tags = await Tag.findAll({
      where: { post_id: postId },
      include: [
        { model: User, as: 'tagger', attributes: ['id', 'name', 'avatar_url'] }
      ],
      attributes: ['id', 'tagged_id', 'created_at']
    })
    
    res.json(tags)
  } catch (error) {
    console.error('Get taggers error:', error)
    res.status(500).json({ error: 'Failed to get taggers' })
  }
})

router.use(protectedRouter)

export default router