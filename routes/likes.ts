// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { PostLike } from '../models/PostLike'
// import { Post } from '../models/Post'

// const router = Router()
// router.use(requireAuth)

// router.get('/', async (req, res) => {
//   const userId = req.user.id

//   const likes = await PostLike.findAll({
//     where: { user_id: userId },
//     include: [{
//       model: Post,
//       include: ['user']
//     }]
//   })

//   const posts = likes.map((like: any) => like.post)
//   res.json(posts)
// })

// router.post('/', async (req, res) => {
//   const userId = req.user.id
//   const { post_id } = req.body

//   await PostLike.upsert({
//     user_id: userId,
//     post_id
//   })

//   res.json({ success: true, message: 'Post liked!' })
// })

// router.delete('/', async (req, res) => {
//   const userId = req.user.id
//   const { post_id } = req.body

//   await PostLike.destroy({
//     where: { user_id: userId, post_id }
//   })

//   res.json({ success: true, message: 'Like removed (swipe away!)' })
// })

// export default router




// routes/likes.ts
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostLike } from '../models/PostLike'
import sequelize from '../config/sequelize'

// LOCAL AUGMENTATION – fixes duplicate declaration error
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number }
  }
}

// Types
interface ToggleLikeBody {
  post_id: number | string
}
interface IdsQuery {
  post_ids?: string | string[]
}
interface CountResult {
  post_id: string
  likes_count: number
}
interface StatusResult {
  post_id: string
  is_liked: boolean
  likes_count: number
}

const router = Router()

// TOGGLE LIKE
router.post(
  '/',
  requireAuth,
  async (req: Request<{}, {}, ToggleLikeBody>, res: Response) => {
    const userId = (req as any).user.id
    const { post_id } = req.body

    if (!post_id) return res.status(400).json({ error: 'post_id required' })

    const postId = Number(post_id)
    if (Number.isNaN(postId)) return res.status(400).json({ error: 'Invalid post_id' })

    try {
      const [like, created] = await PostLike.findOrCreate({
        where: { user_id: userId, post_id: postId },
        defaults: { user_id: userId, post_id: postId },
      })

      if (!created) {
        await like.destroy()
        return res.json({ success: true, liked: false, message: 'Like removed' })
      }

      return res.json({ success: true, liked: true, message: 'Post liked' })
    } catch (err: any) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Already liked' })
      }
      return res.status(500).json({ error: err.message })
    }
  }
)

// PUBLIC COUNTS – FIXED TYPO HERE
router.get(
  '/counts',
  async (req: Request<{}, {}, {}, IdsQuery>, res: Response) => {
    const { post_ids } = req.query
    if (!post_ids) return res.status(400).json({ error: 'post_ids required' })

    const ids = Array.isArray(post_ids) ? post_ids : String(post_ids).split(',')

    const rows = await PostLike.findAll({
      attributes: [
        'post_id',
        [sequelize.fn('COUNT', sequelize.col('PostLike.id')), 'likes_count'],
      ],
      where: { post_id: ids.map(Number) },
      group: ['post_id'],
      raw: true,
    })

    const map = Object.fromEntries(
      (rows as any[]).map(r => [String(r.post_id), Number(r.likes_count)])
    )

    const result: CountResult[] = ids.map(id => ({
      post_id: id,
      likes_count: map[id] ?? 0,   // ← FIXED: was likes_count_count
    }))

    return res.json({ success: true, counts: result })
  }
)

// USER STATUS + COUNTS
router.get(
  '/status',
  requireAuth,
  async (req: Request<{}, {}, {}, IdsQuery>, res: Response) => {
    const userId = (req as any).user.id
    const { post_ids } = req.query
    if (!post_ids) return res.status(400).json({ error: 'post_ids required' })

    const ids = Array.isArray(post_ids) ? post_ids : String(post_ids).split(',')

    const userLikes = await PostLike.findAll({
      where: { user_id: userId, post_id: ids.map(Number) },
      attributes: ['post_id'],
      raw: true,
    })
    const likedSet = new Set((userLikes as any[]).map(l => String(l.post_id)))

    const counts = await PostLike.findAll({
      attributes: [
        'post_id',
        [sequelize.fn('COUNT', sequelize.col('PostLike.id')), 'likes_count'],
      ],
      where: { post_id: ids.map(Number) },
      group: ['post_id'],
      raw: true,
    })
    const countMap = Object.fromEntries(
      (counts as any[]).map(c => [String(c.post_id), Number(c.likes_count)])
    )

    const result: StatusResult[] = ids.map(id => ({
      post_id: id,
      is_liked: likedSet.has(id),
      likes_count: countMap[id] ?? 0,
    }))

    return res.json({ success: true, status: result })
  }
)

export default router