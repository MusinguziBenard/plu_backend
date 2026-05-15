// // // routes/polls.ts - COMPLETE FIXED VERSION
// // import { Router } from 'express'
// // import { requireAuth } from '../middleware/auth'
// // import { Poll } from '../models/Poll'
// // import { PollOption } from '../models/PollOption'
// // import { PollVote } from '../models/PollVote'
// // import { Post } from '../models/Post'

// // const router = Router()

// // // ============================================
// // // PUBLIC ROUTES (No authentication required)
// // // ============================================

// // // Get poll results - PUBLIC
// // router.get('/results/:pollId', async (req, res) => {
// //   try {
// //     const { pollId } = req.params

// //     const poll = await Poll.findByPk(pollId, {
// //       include: [{ model: PollOption }]
// //     })

// //     if (!poll) {
// //       return res.status(404).json({ error: 'Poll not found' })
// //     }

// //     const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0

// //     const results = poll.options?.map(opt => ({
// //       id: opt.id,
// //       text: opt.option_text,
// //       votes: opt.votes_count,
// //       percentage: totalVotes > 0 ? (opt.votes_count / totalVotes) * 100 : 0
// //     }))

// //     res.json({ poll, results, totalVotes })
// //   } catch (error) {
// //     console.error('Get poll results error:', error)
// //     res.status(500).json({ error: 'Failed to get results' })
// //   }
// // })

// // // ============================================
// // // PROTECTED ROUTES (Authentication required)
// // // ============================================

// // const protectedRouter = Router()
// // protectedRouter.use(requireAuth)

// // // Create poll for a post
// // protectedRouter.post('/create/:postId', async (req, res) => {
// //   try {
// //     const userId = req.user.id
// //     const { postId } = req.params
// //     const { question, options, is_multiple, ends_at } = req.body

// //     const post = await Post.findByPk(postId)
// //     if (!post || post.user_id !== userId) {
// //       return res.status(403).json({ error: 'Unauthorized' })
// //     }

// //     // Set ends_at to a future date if not provided
// //     let endDate = ends_at;
// //     if (!endDate) {
// //       const futureDate = new Date();
// //       futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
// //       endDate = futureDate.toISOString();
// //     }

// //     const poll = await Poll.create({
// //       post_id: postId,
// //       question,
// //       is_multiple: is_multiple || false,
// //       ends_at: endDate,
// //       is_active: true
// //     })

// //     const createdOptions = []
// //     for (const optionText of options) {
// //       const option = await PollOption.create({
// //         poll_id: poll.id,
// //         option_text: optionText
// //       })
// //       createdOptions.push(option)
// //     }

// //     res.status(201).json({ ...poll.toJSON(), options: createdOptions })
// //   } catch (error) {
// //     console.error('Create poll error:', error)
// //     res.status(500).json({ error: 'Failed to create poll' })
// //   }
// // })

// // // Vote on poll
// // protectedRouter.post('/vote/:pollId', async (req, res) => {
// //   try {
// //     const userId = req.user.id
// //     const { pollId } = req.params
// //     const { option_ids } = req.body

// //     console.log('Vote attempt - Poll ID:', pollId, 'User:', userId, 'Options:', option_ids)

// //     const poll = await Poll.findByPk(pollId)
// //     if (!poll) {
// //       return res.status(404).json({ error: 'Poll not found' })
// //     }
    
// //     if (!poll.is_active) {
// //       return res.status(400).json({ error: 'Poll is not active' })
// //     }

// //     // Check if poll has ended
// //     if (poll.ends_at) {
// //       const now = new Date();
// //       const endDate = new Date(poll.ends_at);
// //       console.log('Now:', now, 'Ends at:', endDate);
// //       if (endDate < now) {
// //         return res.status(400).json({ error: 'Poll has ended' });
// //       }
// //     }

// //     if (!poll.is_multiple && option_ids.length > 1) {
// //       return res.status(400).json({ error: 'Only one option allowed' })
// //     }

// //     // Check if user already voted
// //     const existingVote = await PollVote.findOne({
// //       where: { user_id: userId },
// //       include: [{ model: PollOption, where: { poll_id: pollId } }]
// //     })

// //     if (existingVote) {
// //       return res.status(400).json({ error: 'Already voted' })
// //     }

// //     for (const optionId of option_ids) {
// //       await PollVote.create({ user_id: userId, option_id: optionId })
// //       await PollOption.increment('votes_count', { where: { id: optionId } })
// //     }

// //     res.json({ success: true, message: 'Vote recorded' })
// //   } catch (error) {
// //     console.error('Vote error:', error)
// //     res.status(500).json({ error: 'Failed to vote: ' + (error as Error).message })
// //   }
// // })

// // // End poll (admin or post owner)
// // protectedRouter.patch('/end/:pollId', async (req, res) => {
// //   try {
// //     const userId = req.user.id
// //     const { pollId } = req.params

// //     const poll = await Poll.findByPk(pollId, {
// //       include: [{ model: Post }]
// //     })

// //     if (!poll) {
// //       return res.status(404).json({ error: 'Poll not found' })
// //     }

// //     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
// //     if (poll.post?.user_id !== userId && !isAdmin) {
// //       return res.status(403).json({ error: 'Unauthorized' })
// //     }

// //     poll.is_active = false
// //     await poll.save()

// //     res.json({ success: true, message: 'Poll ended' })
// //   } catch (error) {
// //     console.error('End poll error:', error)
// //     res.status(500).json({ error: 'Failed to end poll' })
// //   }
// // })

// // router.use(protectedRouter)

// // export default router

// // routes/polls.ts - COMPLETE WELL-ORDERED VERSION
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { Poll } from '../models/Poll'
// import { PollOption } from '../models/PollOption'
// import { PollVote } from '../models/PollVote'
// import { Post } from '../models/Post'
// import { User } from '../models/User'
// import sequelize from '../config/sequelize'
// import { Op } from 'sequelize'

// const router = Router()

// // ============================================
// // PUBLIC ROUTES (No authentication required)
// // ============================================

// // Get all polls
// router.get('/', async (req, res) => {
//   try {
//     const { page = 1, limit = 20, active_only = 'true' } = req.query
//     const pageNum = Number(page)
//     const limitNum = Number(limit)
//     const offset = (pageNum - 1) * limitNum

//     const where: any = {}
//     if (active_only === 'true') {
//       where.is_active = true
//     }

//     const polls = await Poll.findAll({
//       where,
//       include: [
//         { model: PollOption },
//         { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] },
//         { model: Post, attributes: ['id', 'title'] }
//       ],
//       order: [['created_at', 'DESC']],
//       limit: limitNum,
//       offset
//     })

//     res.json(polls)
//   } catch (error) {
//     console.error('Get polls error:', error)
//     res.status(500).json({ error: 'Failed to get polls' })
//   }
// })

// // Get poll results
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
// // ORDER MATTERS - Specific routes FIRST, parameter routes LAST
// // ============================================

// const protectedRouter = Router()
// protectedRouter.use(requireAuth)

// // 1. CREATE routes (most specific)
// protectedRouter.post('/create', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { question, description, options, is_multiple, ends_at, post_id } = req.body

//     if (!question || !options || options.length < 2) {
//       return res.status(400).json({ error: 'Question and at least 2 options required' })
//     }

//     let postId = post_id || null
//     if (postId) {
//       const post = await Post.findByPk(postId)
//       if (!post) {
//         return res.status(404).json({ error: 'Post not found' })
//       }
//       if (post.user_id !== userId) {
//         return res.status(403).json({ error: 'Can only add poll to your own post' })
//       }
//     }

//     const poll = await Poll.create({
//       post_id: postId,
//       created_by: userId,
//       question,
//       description: description || '',
//       is_multiple: is_multiple || false,
//       ends_at: ends_at || null,
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
//     res.status(500).json({ error: 'Failed to create poll: ' + (error as Error).message })
//   }
// })

// // 2. Create poll for post (legacy)
// protectedRouter.post('/create/:postId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { postId } = req.params
//     const { question, options, is_multiple, ends_at } = req.body

//     const post = await Post.findByPk(postId)
//     if (!post || post.user_id !== userId) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     const poll = await Poll.create({
//       post_id: postId,
//       created_by: userId,
//       question,
//       is_multiple: is_multiple || false,
//       ends_at: ends_at || null,
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

// // 3. GET my-votes (specific, must come before /:pollId)
// protectedRouter.get('/my-votes', async (req, res) => {
//   try {
//     const userId = req.user.id

//     const votes = await PollVote.findAll({
//       where: { user_id: userId },
//       include: [
//         {
//           model: PollOption,
//           include: [
//             {
//               model: Poll,
//               include: [
//                 { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] }
//               ]
//             }
//           ]
//         }
//       ],
//       order: [['voted_at', 'DESC']]
//     })

//     const formattedVotes = votes.map(vote => {
//       const option = vote.option
//       const poll = option?.poll
//       return {
//         id: vote.id,
//         user_id: vote.user_id,
//         option_id: vote.option_id,
//         voted_at: vote.voted_at,
//         option: option ? {
//           id: option.id,
//           option_text: option.option_text,
//           votes_count: option.votes_count,
//           poll_id: option.poll_id,
//           poll: poll ? {
//             id: poll.id,
//             question: poll.question,
//             is_active: poll.is_active,
//             ends_at: poll.ends_at,
//             total_votes: poll.total_votes,
//             creator: poll.creator
//           } : null
//         } : null
//       }
//     })

//     res.json(formattedVotes)
//   } catch (error) {
//     console.error('Get my votes error:', error)
//     res.status(500).json({ error: 'Failed to get votes: ' + (error as Error).message })
//   }
// })

// // 4. POST vote (specific, must come before /:pollId)
// protectedRouter.post('/vote/:pollId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { pollId } = req.params
//     const { option_ids } = req.body

//     const poll = await Poll.findByPk(pollId)
//     if (!poll) {
//       return res.status(404).json({ error: 'Poll not found' })
//     }
    
//     if (!poll.is_active) {
//       return res.status(400).json({ error: 'Poll is not active' })
//     }

//     if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
//       return res.status(400).json({ error: 'Poll has ended' })
//     }

//     if (!poll.is_multiple && option_ids.length > 1) {
//       return res.status(400).json({ error: 'Only one option allowed' })
//     }

//     // Check if user already voted using raw query to avoid association issues
//     const existingVote = await sequelize.query(
//       `SELECT pv.* FROM poll_votes pv 
//        JOIN poll_options po ON po.id = pv.option_id 
//        WHERE pv.user_id = :userId AND po.poll_id = :pollId`,
//       {
//         replacements: { userId, pollId },
//         type: 'SELECT'
//       }
//     )

//     if (existingVote && existingVote.length > 0) {
//       return res.status(400).json({ error: 'Already voted' })
//     }

//     for (const optionId of option_ids) {
//       await PollVote.create({ user_id: userId, option_id: optionId })
//       await PollOption.increment('votes_count', { where: { id: optionId } })
//       await Poll.increment('total_votes', { where: { id: pollId } })
//     }

//     res.json({ success: true, message: 'Vote recorded' })
//   } catch (error) {
//     console.error('Vote error:', error)
//     res.status(500).json({ error: 'Failed to vote: ' + (error as Error).message })
//   }
// })

// // 5. PATCH end poll (specific, must come before /:pollId)
// protectedRouter.patch('/end/:pollId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { pollId } = req.params

//     const poll = await Poll.findByPk(pollId)
//     if (!poll) {
//       return res.status(404).json({ error: 'Poll not found' })
//     }

//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
//     if (poll.created_by !== userId && !isAdmin) {
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

// // 6. DELETE poll (parameter route)
// protectedRouter.delete('/:pollId', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { pollId } = req.params

//     const poll = await Poll.findByPk(pollId)
//     if (!poll) {
//       return res.status(404).json({ error: 'Poll not found' })
//     }

//     const isAdmin = req.user.role === 'admin' || req.user.user_metadata?.role === 'admin'
//     if (poll.created_by !== userId && !isAdmin) {
//       return res.status(403).json({ error: 'Unauthorized' })
//     }

//     await poll.destroy()
//     res.json({ success: true, message: 'Poll deleted' })
//   } catch (error) {
//     console.error('Delete poll error:', error)
//     res.status(500).json({ error: 'Failed to delete poll' })
//   }
// })

// // 7. GET single poll (MUST BE LAST - catches all remaining /:pollId routes)
// protectedRouter.get('/:pollId', async (req, res) => {
//   try {
//     const { pollId } = req.params

//     const poll = await Poll.findByPk(pollId, {
//       include: [
//         { model: PollOption },
//         { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] }
//       ]
//     })

//     if (!poll) {
//       return res.status(404).json({ error: 'Poll not found' })
//     }

//     res.json(poll)
//   } catch (error) {
//     console.error('Get poll error:', error)
//     res.status(500).json({ error: 'Failed to get poll' })
//   }
// })

// router.use(protectedRouter)

// export default router

// routes/polls.ts - COMPLETE WITH SOCKET.IO INTEGRATION
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { Poll } from '../models/Poll'
import { PollOption } from '../models/PollOption'
import { PollVote } from '../models/PollVote'
import { Post } from '../models/Post'
import { User } from '../models/User'
import sequelize from '../config/sequelize'
import { Op } from 'sequelize'

const router = Router()

// Type definitions for socket events
interface PollCreatedData {
  pollId: string;
  postId: string | null;
  question: string;
  options: Array<{ id: string; text: string }>;
  timestamp: number;
}

interface PollVoteData {
  pollId: string;
  optionId: string;
  userId: string;
  totalVotes: number;
  timestamp: number;
}

interface PollEndedData {
  pollId: string;
  endedBy: string;
  timestamp: number;
}

interface PollResultsData {
  pollId: string;
  results: Array<{
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  timestamp: number;
}

// Extended Request interface for authenticated requests
interface AuthRequest extends Request {
  user?: {
    id: string;
    name?: string;
    role?: string;
    user_metadata?: {
      role?: string;
    };
  };
}

// Helper function to check if user is admin
const isAdmin = (req: AuthRequest): boolean => {
  if (!req.user) return false;
  return req.user.role === 'admin' || req.user.user_metadata?.role === 'admin';
}

// Helper to safely get parameter
const getParam = (params: any, key: string): string => {
  const value = params[key];
  return Array.isArray(value) ? value[0] : String(value || '');
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get all polls
router.get('/', async (req: Request, res: Response) => {
  try {
    const page: number = Number(req.query.page) || 1
    const limit: number = Number(req.query.limit) || 20
    const activeOnly: boolean = req.query.active_only !== 'false'
    const offset: number = (page - 1) * limit

    const where: any = {}
    if (activeOnly) {
      where.is_active = true
    }

    const { count, rows: polls } = await Poll.findAndCountAll({
      where,
      include: [
        { model: PollOption },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] },
        { model: Post, attributes: ['id', 'title'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    })

    res.json({
      polls,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get polls error:', error)
    res.status(500).json({ error: 'Failed to get polls' })
  }
})

// Get poll results - PUBLIC
router.get('/results/:pollId', async (req: Request, res: Response) => {
  try {
    const pollId: string = getParam(req.params, 'pollId')

    const poll = await Poll.findByPk(pollId, {
      include: [{ model: PollOption }]
    })

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    const totalVotes: number = poll.options?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0

    const results = poll.options?.map(opt => ({
      id: opt.id,
      text: opt.option_text,
      votes: opt.votes_count,
      percentage: totalVotes > 0 ? (opt.votes_count / totalVotes) * 100 : 0
    })) || []

    // ✅ SOCKET.IO - Emit poll results
    const io = req.app.get('io')
    if (io && poll.post_id) {
      const resultsData: PollResultsData = {
        pollId,
        results,
        totalVotes,
        timestamp: Date.now()
      }
      
      io.to(`post:${poll.post_id}`).emit('poll_results_updated', resultsData)
    }

    res.json({ poll, results, totalVotes })
  } catch (error) {
    console.error('Get poll results error:', error)
    res.status(500).json({ error: 'Failed to get results' })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

const protectedRouter = Router()
protectedRouter.use(requireAuth)

// 1. CREATE poll
protectedRouter.post('/create', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const { question, description, options, is_multiple, ends_at, post_id } = req.body

    if (!question || !options || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options required' })
    }

    let postId: string | null = post_id || null
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

    // ✅ SOCKET.IO - Emit poll created event
    const io = req.app.get('io')
    if (io) {
      const pollData: PollCreatedData = {
        pollId: poll.id,
        postId,
        question,
        options: createdOptions.map(opt => ({ id: opt.id, text: opt.option_text })),
        timestamp: Date.now()
      }

      if (postId) {
        io.to(`post:${postId}`).emit('poll_created', pollData)
      }
      
      io.to(`user:${userId}`).emit('poll_created', {
        ...pollData,
        message: 'Your poll has been created successfully'
      })
    }

    return res.status(201).json({ ...poll.toJSON(), options: createdOptions })
  } catch (error) {
    console.error('Create poll error:', error)
    return res.status(500).json({ error: 'Failed to create poll: ' + (error as Error).message })
  }
})

// 2. Create poll for post (legacy endpoint)
protectedRouter.post('/create/:postId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const postId: string = getParam(req.params, 'postId')
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

    // ✅ SOCKET.IO - Emit poll created event
    const io = req.app.get('io')
    if (io) {
      const pollData: PollCreatedData = {
        pollId: poll.id,
        postId,
        question,
        options: createdOptions.map(opt => ({ id: opt.id, text: opt.option_text })),
        timestamp: Date.now()
      }

      io.to(`post:${postId}`).emit('poll_created', pollData)
      
      io.to(`user:${userId}`).emit('poll_created', {
        ...pollData,
        message: 'Your poll has been created successfully'
      })
    }

    return res.status(201).json({ ...poll.toJSON(), options: createdOptions })
  } catch (error) {
    console.error('Create poll error:', error)
    return res.status(500).json({ error: 'Failed to create poll' })
  }
})

// 3. GET my-votes
protectedRouter.get('/my-votes', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id

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

    return res.json(formattedVotes)
  } catch (error) {
    console.error('Get my votes error:', error)
    return res.status(500).json({ error: 'Failed to get votes: ' + (error as Error).message })
  }
})

// 4. POST vote
protectedRouter.post('/vote/:pollId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const pollId: string = getParam(req.params, 'pollId')
    const { option_ids }: { option_ids: string[] } = req.body

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

    // Check if user already voted
    const existingVote = await sequelize.query(
      `SELECT pv.* FROM poll_votes pv 
       JOIN poll_options po ON po.id = pv.option_id 
       WHERE pv.user_id = :userId AND po.poll_id = :pollId`,
      {
        replacements: { userId, pollId },
        type: 'SELECT'
      }
    ) as any[]

    if (existingVote && existingVote.length > 0) {
      return res.status(400).json({ error: 'Already voted' })
    }

    const votedOptions: string[] = []
    for (const optionId of option_ids) {
      await PollVote.create({ user_id: userId, option_id: optionId })
      await PollOption.increment('votes_count', { where: { id: optionId } })
      await Poll.increment('total_votes', { where: { id: pollId } })
      votedOptions.push(optionId)
    }

    // Get updated poll for total votes
    const updatedPoll = await Poll.findByPk(pollId, {
      attributes: ['id', 'total_votes']
    })

    // ✅ SOCKET.IO - Emit vote event
    const io = req.app.get('io')
    if (io) {
      const voteData: PollVoteData = {
        pollId,
        optionId: option_ids[0], // Primary option
        userId,
        totalVotes: updatedPoll?.total_votes || 0,
        timestamp: Date.now()
      }

      // Emit to post room if poll is attached to a post
      if (poll.post_id) {
        io.to(`post:${poll.post_id}`).emit('poll_vote', voteData)
      }

      // Notify poll creator
      if (poll.created_by) {
        io.to(`user:${poll.created_by}`).emit('poll_vote_received', {
          ...voteData,
          votedOptions
        })
      }

      // Emit updated results to post room
      if (poll.post_id) {
        const updatedPollData = await Poll.findByPk(pollId, {
          include: [{ model: PollOption }]
        })

        if (updatedPollData) {
          const totalVotes = updatedPollData.options?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0
          const results = updatedPollData.options?.map(opt => ({
            id: opt.id,
            text: opt.option_text,
            votes: opt.votes_count,
            percentage: totalVotes > 0 ? (opt.votes_count / totalVotes) * 100 : 0
          })) || []

          io.to(`post:${poll.post_id}`).emit('poll_results_updated', {
            pollId,
            results,
            totalVotes,
            timestamp: Date.now()
          })
        }
      }
    }

    return res.json({ success: true, message: 'Vote recorded' })
  } catch (error) {
    console.error('Vote error:', error)
    return res.status(500).json({ error: 'Failed to vote: ' + (error as Error).message })
  }
})

// 5. PATCH end poll
protectedRouter.patch('/end/:pollId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const pollId: string = getParam(req.params, 'pollId')

    const poll = await Poll.findByPk(pollId)
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    if (poll.created_by !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    poll.is_active = false
    await poll.save()

    // ✅ SOCKET.IO - Emit poll ended event
    const io = req.app.get('io')
    if (io) {
      const endData: PollEndedData = {
        pollId,
        endedBy: userId,
        timestamp: Date.now()
      }

      if (poll.post_id) {
        io.to(`post:${poll.post_id}`).emit('poll_ended', endData)
      }

      if (poll.created_by) {
        io.to(`user:${poll.created_by}`).emit('poll_ended', {
          ...endData,
          message: 'Your poll has been ended'
        })
      }
    }

    return res.json({ success: true, message: 'Poll ended' })
  } catch (error) {
    console.error('End poll error:', error)
    return res.status(500).json({ error: 'Failed to end poll' })
  }
})

// 6. DELETE poll
protectedRouter.delete('/:pollId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const pollId: string = getParam(req.params, 'pollId')

    const poll = await Poll.findByPk(pollId)
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    if (poll.created_by !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const postId: string | null = poll.post_id
    await poll.destroy()

    // ✅ SOCKET.IO - Emit poll deleted event
    const io = req.app.get('io')
    if (io && postId) {
      io.to(`post:${postId}`).emit('poll_deleted', {
        pollId,
        postId,
        deletedBy: userId,
        timestamp: Date.now()
      })
    }

    return res.json({ success: true, message: 'Poll deleted' })
  } catch (error) {
    console.error('Delete poll error:', error)
    return res.status(500).json({ error: 'Failed to delete poll' })
  }
})

// 7. GET single poll (MUST BE LAST)
protectedRouter.get('/:pollId', async (req: AuthRequest, res: Response) => {
  try {
    const pollId: string = getParam(req.params, 'pollId')

    const poll = await Poll.findByPk(pollId, {
      include: [
        { model: PollOption },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] }
      ]
    })

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    return res.json(poll)
  } catch (error) {
    console.error('Get poll error:', error)
    return res.status(500).json({ error: 'Failed to get poll' })
  }
})

router.use(protectedRouter)

export default router