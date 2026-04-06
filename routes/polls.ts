// // routes/polls.ts - COMPLETE FIXED VERSION
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { Poll } from '../models/Poll'
// import { PollOption } from '../models/PollOption'
// import { PollVote } from '../models/PollVote'
// import { Post } from '../models/Post'

// const router = Router()

// // ============================================
// // PUBLIC ROUTES (No authentication required)
// // ============================================

// // Get poll results - PUBLIC
// router.get('/results/:pollId', async (req, res) => {
//   try {
//     const { pollId } = req.params

//     const poll = await Poll.findByPk(pollId, {
//       include: [{ model: PollOption }]
//     })

//     if (!poll) {
//       return res.status(404).json({ error: 'Poll not found' })
//     }

//     const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0

//     const results = poll.options?.map(opt => ({
//       id: opt.id,
//       text: opt.option_text,
//       votes: opt.votes_count,
//       percentage: totalVotes > 0 ? (opt.votes_count / totalVotes) * 100 : 0
//     }))

//     res.json({ poll, results, totalVotes })
//   } catch (error) {
//     console.error('Get poll results error:', error)
//     res.status(500).json({ error: 'Failed to get results' })
//   }
// })

// // ============================================
// // PROTECTED ROUTES (Authentication required)
// // ============================================

// const protectedRouter = Router()
// protectedRouter.use(requireAuth)

// // Create poll for a post
// protectedRouter.post('/create/:postId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { postId } = req.params
//     const { question, options, is_multiple, ends_at } = req.body

//     const post = await Post.findByPk(postId)
//     if (!post || post.user_id !== userId) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     // Set ends_at to a future date if not provided
//     let endDate = ends_at;
//     if (!endDate) {
//       const futureDate = new Date();
//       futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
//       endDate = futureDate.toISOString();
//     }

//     const poll = await Poll.create({
//       post_id: postId,
//       question,
//       is_multiple: is_multiple || false,
//       ends_at: endDate,
//       is_active: true
//     })

//     const createdOptions = []
//     for (const optionText of options) {
//       const option = await PollOption.create({
//         poll_id: poll.id,
//         option_text: optionText
//       })
//       createdOptions.push(option)
//     }

//     res.status(201).json({ ...poll.toJSON(), options: createdOptions })
//   } catch (error) {
//     console.error('Create poll error:', error)
//     res.status(500).json({ error: 'Failed to create poll' })
//   }
// })

// // Vote on poll
// protectedRouter.post('/vote/:pollId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { pollId } = req.params
//     const { option_ids } = req.body

//     console.log('Vote attempt - Poll ID:', pollId, 'User:', userId, 'Options:', option_ids)

//     const poll = await Poll.findByPk(pollId)
//     if (!poll) {
//       return res.status(404).json({ error: 'Poll not found' })
//     }
    
//     if (!poll.is_active) {
//       return res.status(400).json({ error: 'Poll is not active' })
//     }

//     // Check if poll has ended
//     if (poll.ends_at) {
//       const now = new Date();
//       const endDate = new Date(poll.ends_at);
//       console.log('Now:', now, 'Ends at:', endDate);
//       if (endDate < now) {
//         return res.status(400).json({ error: 'Poll has ended' });
//       }
//     }

//     if (!poll.is_multiple && option_ids.length > 1) {
//       return res.status(400).json({ error: 'Only one option allowed' })
//     }

//     // Check if user already voted
//     const existingVote = await PollVote.findOne({
//       where: { user_id: userId },
//       include: [{ model: PollOption, where: { poll_id: pollId } }]
//     })

//     if (existingVote) {
//       return res.status(400).json({ error: 'Already voted' })
//     }

//     for (const optionId of option_ids) {
//       await PollVote.create({ user_id: userId, option_id: optionId })
//       await PollOption.increment('votes_count', { where: { id: optionId } })
//     }

//     res.json({ success: true, message: 'Vote recorded' })
//   } catch (error) {
//     console.error('Vote error:', error)
//     res.status(500).json({ error: 'Failed to vote: ' + (error as Error).message })
//   }
// })

// // End poll (admin or post owner)
// protectedRouter.patch('/end/:pollId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { pollId } = req.params

//     const poll = await Poll.findByPk(pollId, {
//       include: [{ model: Post }]
//     })

//     if (!poll) {
//       return res.status(404).json({ error: 'Poll not found' })
//     }

//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
//     if (poll.post?.user_id !== userId && !isAdmin) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     poll.is_active = false
//     await poll.save()

//     res.json({ success: true, message: 'Poll ended' })
//   } catch (error) {
//     console.error('End poll error:', error)
//     res.status(500).json({ error: 'Failed to end poll' })
//   }
// })

// router.use(protectedRouter)

// export default router

// routes/polls.ts - COMPLETE WELL-ORDERED VERSION
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { Poll } from '../models/Poll'
import { PollOption } from '../models/PollOption'
import { PollVote } from '../models/PollVote'
import { Post } from '../models/Post'
import { User } from '../models/User'
import sequelize from '../config/sequelize'
import { Op } from 'sequelize'

const router = Router()

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get all polls
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, active_only = 'true' } = req.query
    const pageNum = Number(page)
    const limitNum = Number(limit)
    const offset = (pageNum - 1) * limitNum

    const where: any = {}
    if (active_only === 'true') {
      where.is_active = true
    }

    const polls = await Poll.findAll({
      where,
      include: [
        { model: PollOption },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] },
        { model: Post, attributes: ['id', 'title'] }
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset
    })

    res.json(polls)
  } catch (error) {
    console.error('Get polls error:', error)
    res.status(500).json({ error: 'Failed to get polls' })
  }
})

// Get poll results
router.get('/results/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params

    const poll = await Poll.findByPk(pollId, {
      include: [{ model: PollOption }]
    })

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0

    const results = poll.options?.map(opt => ({
      id: opt.id,
      text: opt.option_text,
      votes: opt.votes_count,
      percentage: totalVotes > 0 ? (opt.votes_count / totalVotes) * 100 : 0
    }))

    res.json({ poll, results, totalVotes })
  } catch (error) {
    console.error('Get poll results error:', error)
    res.status(500).json({ error: 'Failed to get results' })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication required)
// ORDER MATTERS - Specific routes FIRST, parameter routes LAST
// ============================================

const protectedRouter = Router()
protectedRouter.use(requireAuth)

// 1. CREATE routes (most specific)
protectedRouter.post('/create', async (req, res) => {
  try {
    const userId = req.user.id
    const { question, description, options, is_multiple, ends_at, post_id } = req.body

    if (!question || !options || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options required' })
    }

    let postId = post_id || null
    if (postId) {
      const post = await Post.findByPk(postId)
      if (!post) {
        return res.status(404).json({ error: 'Post not found' })
      }
      if (post.user_id !== userId) {
        return res.status(403).json({ error: 'Can only add poll to your own post' })
      }
    }

    const poll = await Poll.create({
      post_id: postId,
      created_by: userId,
      question,
      description: description || '',
      is_multiple: is_multiple || false,
      ends_at: ends_at || null,
      is_active: true
    })

    const createdOptions = []
    for (const optionText of options) {
      const option = await PollOption.create({
        poll_id: poll.id,
        option_text: optionText
      })
      createdOptions.push(option)
    }

    res.status(201).json({ ...poll.toJSON(), options: createdOptions })
  } catch (error) {
    console.error('Create poll error:', error)
    res.status(500).json({ error: 'Failed to create poll: ' + (error as Error).message })
  }
})

// 2. Create poll for post (legacy)
protectedRouter.post('/create/:postId', async (req, res) => {
  try {
    const userId = req.user.id
    const { postId } = req.params
    const { question, options, is_multiple, ends_at } = req.body

    const post = await Post.findByPk(postId)
    if (!post || post.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const poll = await Poll.create({
      post_id: postId,
      created_by: userId,
      question,
      is_multiple: is_multiple || false,
      ends_at: ends_at || null,
      is_active: true
    })

    const createdOptions = []
    for (const optionText of options) {
      const option = await PollOption.create({
        poll_id: poll.id,
        option_text: optionText
      })
      createdOptions.push(option)
    }

    res.status(201).json({ ...poll.toJSON(), options: createdOptions })
  } catch (error) {
    console.error('Create poll error:', error)
    res.status(500).json({ error: 'Failed to create poll' })
  }
})

// 3. GET my-votes (specific, must come before /:pollId)
protectedRouter.get('/my-votes', async (req, res) => {
  try {
    const userId = req.user.id

    const votes = await PollVote.findAll({
      where: { user_id: userId },
      include: [
        {
          model: PollOption,
          include: [
            {
              model: Poll,
              include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] }
              ]
            }
          ]
        }
      ],
      order: [['voted_at', 'DESC']]
    })

    const formattedVotes = votes.map(vote => {
      const option = vote.option
      const poll = option?.poll
      return {
        id: vote.id,
        user_id: vote.user_id,
        option_id: vote.option_id,
        voted_at: vote.voted_at,
        option: option ? {
          id: option.id,
          option_text: option.option_text,
          votes_count: option.votes_count,
          poll_id: option.poll_id,
          poll: poll ? {
            id: poll.id,
            question: poll.question,
            is_active: poll.is_active,
            ends_at: poll.ends_at,
            total_votes: poll.total_votes,
            creator: poll.creator
          } : null
        } : null
      }
    })

    res.json(formattedVotes)
  } catch (error) {
    console.error('Get my votes error:', error)
    res.status(500).json({ error: 'Failed to get votes: ' + (error as Error).message })
  }
})

// 4. POST vote (specific, must come before /:pollId)
protectedRouter.post('/vote/:pollId', async (req, res) => {
  try {
    const userId = req.user.id
    const { pollId } = req.params
    const { option_ids } = req.body

    const poll = await Poll.findByPk(pollId)
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }
    
    if (!poll.is_active) {
      return res.status(400).json({ error: 'Poll is not active' })
    }

    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      return res.status(400).json({ error: 'Poll has ended' })
    }

    if (!poll.is_multiple && option_ids.length > 1) {
      return res.status(400).json({ error: 'Only one option allowed' })
    }

    // Check if user already voted using raw query to avoid association issues
    const existingVote = await sequelize.query(
      `SELECT pv.* FROM poll_votes pv 
       JOIN poll_options po ON po.id = pv.option_id 
       WHERE pv.user_id = :userId AND po.poll_id = :pollId`,
      {
        replacements: { userId, pollId },
        type: 'SELECT'
      }
    )

    if (existingVote && existingVote.length > 0) {
      return res.status(400).json({ error: 'Already voted' })
    }

    for (const optionId of option_ids) {
      await PollVote.create({ user_id: userId, option_id: optionId })
      await PollOption.increment('votes_count', { where: { id: optionId } })
      await Poll.increment('total_votes', { where: { id: pollId } })
    }

    res.json({ success: true, message: 'Vote recorded' })
  } catch (error) {
    console.error('Vote error:', error)
    res.status(500).json({ error: 'Failed to vote: ' + (error as Error).message })
  }
})

// 5. PATCH end poll (specific, must come before /:pollId)
protectedRouter.patch('/end/:pollId', async (req, res) => {
  try {
    const userId = req.user.id
    const { pollId } = req.params

    const poll = await Poll.findByPk(pollId)
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
    if (poll.created_by !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    poll.is_active = false
    await poll.save()

    res.json({ success: true, message: 'Poll ended' })
  } catch (error) {
    console.error('End poll error:', error)
    res.status(500).json({ error: 'Failed to end poll' })
  }
})

// 6. DELETE poll (parameter route)
protectedRouter.delete('/:pollId', async (req, res) => {
  try {
    const userId = req.user.id
    const { pollId } = req.params

    const poll = await Poll.findByPk(pollId)
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
    if (poll.created_by !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    await poll.destroy()
    res.json({ success: true, message: 'Poll deleted' })
  } catch (error) {
    console.error('Delete poll error:', error)
    res.status(500).json({ error: 'Failed to delete poll' })
  }
})

// 7. GET single poll (MUST BE LAST - catches all remaining /:pollId routes)
protectedRouter.get('/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params

    const poll = await Poll.findByPk(pollId, {
      include: [
        { model: PollOption },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] }
      ]
    })

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    res.json(poll)
  } catch (error) {
    console.error('Get poll error:', error)
    res.status(500).json({ error: 'Failed to get poll' })
  }
})

router.use(protectedRouter)

export default router