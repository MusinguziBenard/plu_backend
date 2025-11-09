import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostLike } from '../models/PostLike'
import { Post } from '../models/Post'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const userId = req.user.id

  const likes = await PostLike.findAll({
    where: { user_id: userId },
    include: [{
      model: Post,
      include: ['user']
    }]
  })

  const posts = likes.map((like: any) => like.post)
  res.json(posts)
})

router.post('/', async (req, res) => {
  const userId = req.user.id
  const { post_id } = req.body

  await PostLike.upsert({
    user_id: userId,
    post_id
  })

  res.json({ success: true, message: 'Post liked!' })
})

router.delete('/', async (req, res) => {
  const userId = req.user.id
  const { post_id } = req.body

  await PostLike.destroy({
    where: { user_id: userId, post_id }
  })

  res.json({ success: true, message: 'Like removed (swipe away!)' })
})

export default router