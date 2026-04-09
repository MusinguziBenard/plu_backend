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



// routes/user.ts - FILE STORAGE + BASE64 RESPONSE (FULLY FIXED)
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { User } from '../models/User'
import path from 'path'
import fs from 'fs'

const router = Router()
router.use(requireAuth)

// GET MY PROFILE - Returns base64 if avatar exists
router.get('/me', async (req: any, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'phone', 'role', 'location', 'bio', 'avatar_url', 'created_at']
  })
  
  // Convert file path to base64 if needed
  if (user?.avatar_url && !user.avatar_url.startsWith('data:')) {
    try {
      const filePath = path.join(__dirname, '../../', user.avatar_url)
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath)
        const base64 = `data:image/jpeg;base64,${fileData.toString('base64')}`
        user.avatar_url = base64
      }
    } catch (err) {
      console.error('Error reading avatar file:', err)
    }
  }
  
  res.json(user)
})

// UPLOAD AVATAR - Save file, return base64
router.post('/avatar', async (req: any, res) => {
  try {
    const { image } = req.body
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' })
    }

    const user = await User.findByPk(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Delete old avatar if exists
    if (user.avatar_url && !user.avatar_url.startsWith('data:')) {
      const oldPath = path.join(__dirname, '../../', user.avatar_url)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    // Save file
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    const filename = `avatar_${user.id}_${Date.now()}.jpg`
    const uploadDir = path.join(__dirname, '../../uploads/avatars')
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    const filepath = path.join(uploadDir, filename)
    fs.writeFileSync(filepath, buffer)
    
    // Store file path in DB
    const fileUrl = `/uploads/avatars/${filename}`
    user.avatar_url = fileUrl
    await user.save()
    
    // Return base64 for immediate display
    res.json({ 
      success: true, 
      avatar_url: image,
      url: image
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    res.status(500).json({ error: 'Failed to upload avatar' })
  }
})

// DELETE AVATAR - FIXED: Use undefined instead of null
router.delete('/avatar', async (req: any, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Delete file if it's a file path
    if (user.avatar_url && !user.avatar_url.startsWith('data:')) {
      const filePath = path.join(__dirname, '../../', user.avatar_url)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    // ✅ FIX #1: Use undefined instead of null
    user.avatar_url = undefined
    await user.save()

    res.json({ success: true, message: 'Avatar removed' })
  } catch (error) {
    console.error('Avatar delete error:', error)
    res.status(500).json({ error: 'Failed to remove avatar' })
  }
})

// UPDATE MY PROFILE - FIXED: Use undefined and proper field handling
router.put('/me', async (req: any, res) => {
  const { name, location, bio, avatar_url } = req.body

  const user = await User.findByPk(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  // Only update fields that are provided
  if (name !== undefined) user.name = name
  if (location !== undefined) user.location = location || undefined
  if (bio !== undefined) user.bio = bio || undefined
  
  // ✅ FIX #2: Use undefined instead of null
  if (avatar_url !== undefined) {
    user.avatar_url = avatar_url || undefined
  }

  await user.save()
  
  // Return updated user without sensitive data
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

// ADMIN: GET ALL USERS - FIXED: Use req.user.role directly
router.get('/all', async (req: any, res) => {
  // ✅ FIX #3: Use req.user.role (matches your User model)
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