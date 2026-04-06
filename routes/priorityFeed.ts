import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Post } from '../models/Post'
import { Follow } from '../models/Follow'
import { PostLike } from '../models/PostLike'
import { Comment } from '../models/Comment'
import { User } from '../models/User'
import { Op } from 'sequelize'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const following = await Follow.findAll({
      where: { follower_id: userId },
      attributes: ['following_id']
    })
    const followingIds = following.map(f => f.following_id)

    const followers = await Follow.findAll({
      where: { following_id: userId },
      attributes: ['follower_id']
    })
    const followerIds = followers.map(f => f.follower_id)

    const likedPosts = await PostLike.findAll({
      where: { user_id: userId },
      include: [{ model: Post, attributes: ['user_id'] }]
    })
    const likedUserIds = [...new Set(likedPosts.map(lp => lp.post?.user_id).filter(Boolean))]

    const userPosts = await Post.findAll({
      where: { user_id: userId },
      attributes: ['id']
    })
    const userPostIds = userPosts.map(p => p.id)
    const postLikes = await PostLike.findAll({
      where: { post_id: userPostIds },
      attributes: ['user_id']
    })
    const usersWhoLikedMyPosts = [...new Set(postLikes.map(pl => pl.user_id))]

    const priorityScores: Record<string, number> = {}
    followingIds.forEach(id => { priorityScores[id] = (priorityScores[id] || 0) + 100 })
    followerIds.forEach(id => { priorityScores[id] = (priorityScores[id] || 0) + 80 })
    likedUserIds.forEach(id => { priorityScores[id] = (priorityScores[id] || 0) + 60 })
    usersWhoLikedMyPosts.forEach(id => { priorityScores[id] = (priorityScores[id] || 0) + 40 })

    const posts = await Post.findAll({
      where: { status: 'posted' },
      include: [
        { model: User, attributes: ['id', 'name', 'avatar_url'] },
        { model: PostLike, attributes: ['user_id'] },
        { model: Comment, attributes: ['id'] }
      ],
      limit: Number(limit),
      offset
    })

    const sortedPosts = posts.sort((a, b) => {
      const priorityA = priorityScores[a.user_id] || 20
      const priorityB = priorityScores[b.user_id] || 20
      if (priorityA !== priorityB) return priorityB - priorityA
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const enrichedPosts = sortedPosts.map(post => ({
      ...post.toJSON(),
      priority: priorityScores[post.user_id] || 20,
      is_following: followingIds.includes(post.user_id),
      follows_you: followerIds.includes(post.user_id)
    }))

    res.json(enrichedPosts)
  } catch (error) {
    console.error('Priority feed error:', error)
    res.status(500).json({ error: 'Failed to get feed' })
  }
})

router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 10 } = req.query

    const following = await Follow.findAll({
      where: { follower_id: userId },
      attributes: ['following_id']
    })
    const followingIds = following.map(f => f.following_id)

    const followers = await Follow.findAll({
      where: { following_id: userId },
      attributes: ['follower_id']
    })
    const followerIds = followers.map(f => f.follower_id)

    const likedPosts = await PostLike.findAll({
      where: { user_id: userId },
      include: [{ model: Post, attributes: ['user_id'] }]
    })
    const likedUserIds = [...new Set(likedPosts.map(lp => lp.post?.user_id).filter(Boolean))]

    const suggestedIds = new Set([
      ...followerIds.filter(id => !followingIds.includes(id)),
      ...likedUserIds.filter(id => !followingIds.includes(id))
    ])
    suggestedIds.delete(userId)

    const suggestedUsers = await User.findAll({
      where: { id: { [Op.in]: Array.from(suggestedIds) } },
      attributes: ['id', 'name', 'avatar_url', 'bio', 'followers_count']
    })

    suggestedUsers.sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0))
    res.json(suggestedUsers.slice(0, Number(limit)))
  } catch (error) {
    console.error('Suggestions error:', error)
    res.status(500).json({ error: 'Failed to get suggestions' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id

    const following = await Follow.count({ where: { follower_id: userId } })
    const followers = await Follow.count({ where: { following_id: userId } })
    
    const myPosts = await Post.findAll({ where: { user_id: userId }, attributes: ['id'] })
    const myPostIds = myPosts.map(p => p.id)
    const likesReceived = await PostLike.count({ where: { post_id: myPostIds } })
    const likesGiven = await PostLike.count({ where: { user_id: userId } })

    res.json({
      following,
      followers,
      likes_received: likesReceived,
      likes_given: likesGiven,
      engagement_rate: followers > 0 ? (likesReceived / followers) * 100 : 0
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

export default router