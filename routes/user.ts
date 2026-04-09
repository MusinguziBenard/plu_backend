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



// routes/user.ts - FIXED FOR SEQUELIZE + TYPESCRIPT
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

// UPDATE MY PROFILE - FIXED FOR SEQUELIZE TYPESCRIPT
router.put('/me', async (req: any, res) => {
  try {
    const { name, location, bio, avatar_url } = req.body
    
    console.log('📥 PUT /me received:', { name, location, bio, avatar_url })

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Build update object with only provided fields
    const updateData: Partial<User> = {}
    
    if (name !== undefined) {
      updateData.name = name
    }
    
    if (location !== undefined) {
      updateData.location = location || null
    }
    
    if (bio !== undefined) {
      updateData.bio = bio || null
    }
    
    // ✅ CRITICAL: Handle avatar_url properly
    if (avatar_url !== undefined) {
      console.log('💾 Setting avatar_url to:', avatar_url ? avatar_url.substring(0, 50) + '...' : 'null')
      updateData.avatar_url = avatar_url || null
    }

    console.log('📝 Update data:', Object.keys(updateData))

    // Use update method instead of direct assignment
    await user.update(updateData)
    
    // Reload to get fresh data from database
    await user.reload()
    
    console.log('✅ User updated. Avatar in DB:', user.avatar_url)

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
    
  } catch (error) {
    console.error('❌ Update error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
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