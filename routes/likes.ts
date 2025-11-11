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


import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { PostLike } from '../models/PostLike'
import { Post } from '../models/Post'
import sequelize from '../config/sequelize' // or { sequelize } depending on your export

const router = Router()
router.use(requireAuth)

// EXISTING CODE - KEEP AS IS
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

// NEW ENDPOINTS WITH PROPER SEQUELIZE USAGE
router.get('/counts', async (req, res) => {
  try {
    const { post_ids } = req.query

    if (!post_ids) {
      return res.status(400).json({ 
        success: false, 
        message: 'post_ids is required' 
      })
    }

    const postIdsArray = (Array.isArray(post_ids) 
      ? post_ids 
      : String(post_ids).split(',')
    ).map(id => String(id))

    // Use sequelize.fn for efficient SQL counting
    const likeCounts = await PostLike.findAll({
      attributes: [
        'post_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'like_count']
      ],
      where: {
        post_id: postIdsArray
      },
      group: ['post_id'],
      raw: true
    })

    const countsMap: { [key: string]: number } = {}
    likeCounts.forEach((item: any) => {
      countsMap[item.post_id] = Number(item.like_count)
    })

    const result = postIdsArray.map(postId => ({
      post_id: postId,
      likes_count: countsMap[postId] || 0
    }))

    res.json({
      success: true,
      counts: result
    })

  } catch (error) {
    console.error('Like counts error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching like counts' 
    })
  }
})

router.get('/user-status', async (req, res) => {
  try {
    const { post_ids } = req.query

    if (!post_ids) {
      return res.status(400).json({ 
        success: false, 
        message: 'post_ids is required' 
      })
    }

    const userId = req.user.id
    const postIdsArray = (Array.isArray(post_ids) 
      ? post_ids 
      : String(post_ids).split(',')
    ).map(id => String(id))

    // Get user's likes
    const userLikes = await PostLike.findAll({
      where: { 
        user_id: userId,
        post_id: postIdsArray
      },
      attributes: ['post_id'],
      raw: true
    })

    // Get counts using sequelize
    const likeCounts = await PostLike.findAll({
      attributes: [
        'post_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'like_count']
      ],
      where: {
        post_id: postIdsArray
      },
      group: ['post_id'],
      raw: true
    })

    const likedPostIds = new Set(userLikes.map(like => like.post_id))
    const countsMap: { [key: string]: number } = {}
    
    likeCounts.forEach((item: any) => {
      countsMap[item.post_id] = Number(item.like_count)
    })

    const result = postIdsArray.map(postId => ({
      post_id: postId,
      is_liked: likedPostIds.has(postId),
      likes_count: countsMap[postId] || 0
    }))

    res.json({
      success: true,
      likes: result
    })

  } catch (error) {
    console.error('User like status error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching like status' 
    })
  }
})

export default router