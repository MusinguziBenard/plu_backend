// // routes/user.ts
// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { User } from '../models/User'

// const router = Router()
// router.use(requireAuth)

// // GET MY PROFILE
// router.get('/me', async (req: any, res) => {
//   const user = await User.findByPk(req.user.id, {
//     attributes: ['id', 'name', 'phone', 'role', 'location', 'bio', 'avatar_url', 'created_at']
//   })
//   res.json(user)
// })

// // UPDATE MY PROFILE
// router.put('/me', async (req: any, res) => {
//   const { name, location, bio, avatar_url } = req.body

//   const user = await User.findByPk(req.user.id)
//   if (!user) return res.status(404).json({ error: 'User not found' })

//   user.name = name || user.name
//   user.location = location || user.location
//   user.bio = bio || user.bio
//   user.avatar_url = avatar_url || user.avatar_url

//   await user.save()
//   res.json({ success: true, user })
// })

// // ADMIN: GET ALL USERS (optional)
// router.get('/all', async (req: any, res) => {
//   if (req.user.user_metadata?.role !== 'admin') {
//     return res.status(403).json({ error: 'Admin only' })
//   }
//   const users = await User.findAll({
//     attributes: ['id', 'name', 'phone', 'role', 'location', 'created_at'],
//     order: [['created_at', 'DESC']]
//   })
//   res.json(users)
// })

// export default router



// routes/user.ts - SIMPLIFIED FOR CLOUDINARY UPLOADS
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { User } from '../models/User'

const router = Router()
router.use(requireAuth)

// GET MY PROFILE
router.get('/me', async (req: any, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'phone', 'role', 'location', 'bio', 'avatar_url', 'created_at']
  })
  res.json(user)
})

// UPDATE MY PROFILE - Now handles Cloudinary URLs
router.put('/me', async (req: any, res) => {
  const { name, location, bio, avatar_url } = req.body

  const user = await User.findByPk(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  // Only update fields that are provided
  if (name !== undefined) user.name = name
  if (location !== undefined) user.location = location || undefined
  if (bio !== undefined) user.bio = bio || undefined
  
  // Handle avatar_url from Cloudinary
  if (avatar_url !== undefined) {
    user.avatar_url = avatar_url || undefined
  }

  await user.save()
  
  // Return updated user
  const updatedUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    location: user.location,
    bio: user.bio,
    avatar_url: user.avatar_url,
    created_at: user.created_at
  }
  
  res.json({ success: true, user: updatedUser })
})

// ADMIN: GET ALL USERS
router.get('/all', async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }
  
  const users = await User.findAll({
    attributes: ['id', 'name', 'phone', 'role', 'location', 'created_at'],
    order: [['created_at', 'DESC']]
  })
  res.json(users)
})

export default router