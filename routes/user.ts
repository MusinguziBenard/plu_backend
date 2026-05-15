// // // routes/user.ts
// // import { Router } from 'express'
// // import { requireAuth } from '../middleware/auth'
// // import { User } from '../models/User'

// // const router = Router()
// // router.use(requireAuth)

// // // GET MY PROFILE
// // router.get('/me', async (req: any, res) => {
// //   const user = await User.findByPk(req.user.id, {
// //     attributes: ['id', 'name', 'phone', 'role', 'location', 'bio', 'avatar_url', 'created_at']
// //   })
// //   res.json(user)
// // })

// // // UPDATE MY PROFILE
// // router.put('/me', async (req: any, res) => {
// //   const { name, location, bio, avatar_url } = req.body

// //   const user = await User.findByPk(req.user.id)
// //   if (!user) return res.status(404).json({ error: 'User not found' })

// //   user.name = name || user.name
// //   user.location = location || user.location
// //   user.bio = bio || user.bio
// //   user.avatar_url = avatar_url || user.avatar_url

// //   await user.save()
// //   res.json({ success: true, user })
// // })

// // // ADMIN: GET ALL USERS (optional)
// // router.get('/all', async (req: any, res) => {
// //   if (req.user.user_metadata?.role !== 'admin') {
// //     return res.status(403).json({ error: 'Admin only' })
// //   }
// //   const users = await User.findAll({
// //     attributes: ['id', 'name', 'phone', 'role', 'location', 'created_at'],
// //     order: [['created_at', 'DESC']]
// //   })
// //   res.json(users)
// // })

// // export default router



// // routes/user.ts - FIXED FOR SEQUELIZE + TYPESCRIPT
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

// // UPDATE MY PROFILE - FIXED FOR SEQUELIZE TYPESCRIPT
// router.put('/me', async (req: any, res) => {
//   try {
//     const { name, location, bio, avatar_url } = req.body
    
//     console.log('📥 PUT /me received:', { name, location, bio, avatar_url })

//     const user = await User.findByPk(req.user.id)
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' })
//     }

//     // Build update object with only provided fields
//     const updateData: Partial<User> = {}
    
//     if (name !== undefined) {
//       updateData.name = name
//     }
    
//     if (location !== undefined) {
//       updateData.location = location || null
//     }
    
//     if (bio !== undefined) {
//       updateData.bio = bio || null
//     }
    
//     // ✅ CRITICAL: Handle avatar_url properly
//     if (avatar_url !== undefined) {
//       console.log('💾 Setting avatar_url to:', avatar_url ? avatar_url.substring(0, 50) + '...' : 'null')
//       updateData.avatar_url = avatar_url || null
//     }

//     console.log('📝 Update data:', Object.keys(updateData))

//     // Use update method instead of direct assignment
//     await user.update(updateData)
    
//     // Reload to get fresh data from database
//     await user.reload()
    
//     console.log('✅ User updated. Avatar in DB:', user.avatar_url)

//     // Return updated user
//     const updatedUser = {
//       id: user.id,
//       name: user.name,
//       phone: user.phone,
//       role: user.role,
//       location: user.location,
//       bio: user.bio,
//       avatar_url: user.avatar_url,
//       created_at: user.created_at
//     }
    
//     res.json({ success: true, user: updatedUser })
    
//   } catch (error) {
//     console.error('❌ Update error:', error)
//     res.status(500).json({ error: 'Failed to update profile' })
//   }
// })

// // ADMIN: GET ALL USERS
// router.get('/all', async (req: any, res) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ error: 'Admin only' })
//   }
  
//   const users = await User.findAll({
//     attributes: ['id', 'name', 'phone', 'role', 'location', 'created_at'],
//     order: [['created_at', 'DESC']]
//   })
//   res.json(users)
// })

// export default router



// routes/user.ts - COMPLETE WITH SOCKET.IO INTEGRATION (FULLY TYPE-SAFE)
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { User } from '../models/User'
import { Post } from '../models/Post'
import { Follow } from '../models/Follow'
import { Op } from 'sequelize'

const router = Router()
router.use(requireAuth)

// Type definitions - Matches User model exactly
type UserRole = 'user' | 'admin';

interface ProfileUpdatedData {
  userId: string;
  changes: string[];
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    location: string | null;
    bio: string | null;
    avatar_url: string | null;
  };
  timestamp: number;
}

interface UserStatusData {
  userId: string;
  isOnline: boolean;
  lastSeen: number;
  timestamp: number;
}

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

// Helper functions
const getParam = (params: any, key: string): string => {
  const value = params[key];
  if (Array.isArray(value)) return String(value[0]);
  return String(value || '');
}

const getNumberQuery = (value: any, defaultValue: number): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

const isAdmin = (req: AuthRequest): boolean => {
  if (!req.user) return false;
  return req.user.role === 'admin' || req.user.user_metadata?.role === 'admin';
}

const isValidRole = (role: string): role is UserRole => {
  return ['user', 'admin'].includes(role);
}

// GET MY PROFILE
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'phone', 'role', 'location', 'bio', 'avatar_url', 'created_at', 'followers_count', 'following_count']
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(user)
  } catch (error) {
    console.error('Get profile error:', error)
    return res.status(500).json({ error: 'Failed to get profile' })
  }
})

// GET USER BY ID
router.get('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId: string = getParam(req.params, 'userId')
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'avatar_url', 'bio', 'location', 'followers_count', 'following_count', 'created_at']
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const postCount: number = await Post.count({
      where: { user_id: userId, status: 'posted' }
    })

    let isFollowing: boolean = false
    let followsYou: boolean = false
    
    if (req.user && req.user.id !== userId) {
      const follow = await Follow.findOne({
        where: { follower_id: req.user.id, following_id: userId }
      })
      isFollowing = !!follow

      const followsBack = await Follow.findOne({
        where: { follower_id: userId, following_id: req.user.id }
      })
      followsYou = !!followsBack
    }

    return res.json({
      ...user.toJSON(),
      postCount,
      isFollowing,
      followsYou
    })
  } catch (error) {
    console.error('Get user error:', error)
    return res.status(500).json({ error: 'Failed to get user' })
  }
})

// UPDATE MY PROFILE
router.put('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { name, location, bio, avatar_url }: {
      name?: string;
      location?: string | null;
      bio?: string | null;
      avatar_url?: string | null;
    } = req.body
    
    console.log('📥 PUT /me received:', { name, location, bio, avatar_url })

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updateData: Record<string, any> = {}
    const changedFields: string[] = []
    
    if (name !== undefined && name !== user.name) {
      updateData.name = name
      changedFields.push('name')
    }
    
    if (location !== undefined && location !== user.location) {
      updateData.location = location || null
      changedFields.push('location')
    }
    
    if (bio !== undefined && bio !== user.bio) {
      updateData.bio = bio || null
      changedFields.push('bio')
    }
    
    if (avatar_url !== undefined) {
      console.log('💾 Setting avatar_url to:', avatar_url ? avatar_url.substring(0, 50) + '...' : 'null')
      updateData.avatar_url = avatar_url || null
      changedFields.push('avatar_url')
    }

    console.log('📝 Update data:', Object.keys(updateData))

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData)
      await user.reload()
    }
    
    console.log('✅ User updated. Avatar in DB:', user.avatar_url)

    const io = req.app.get('io')
    if (io && changedFields.length > 0) {
      const profileData: ProfileUpdatedData = {
        userId: user.id,
        changes: changedFields,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          location: user.location ?? null,
          bio: user.bio ?? null,
          avatar_url: user.avatar_url ?? null
        },
        timestamp: Date.now()
      }

      io.to(`user:${user.id}`).emit('profile_updated', profileData)
      io.to(`user:${user.id}`).emit('user_profile_changed', {
        userId: user.id,
        changes: changedFields,
        timestamp: Date.now()
      })

      if (changedFields.includes('name') || changedFields.includes('avatar_url')) {
        io.to('admins').emit('user_profile_updated', profileData)
      }
    }

    const updatedUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      location: user.location ?? null,
      bio: user.bio ?? null,
      avatar_url: user.avatar_url ?? null,
      created_at: user.created_at,
      followers_count: user.followers_count,
      following_count: user.following_count
    }
    
    return res.json({ 
      success: true, 
      user: updatedUser,
      changedFields 
    })
    
  } catch (error) {
    console.error('❌ Update error:', error)
    return res.status(500).json({ error: 'Failed to update profile' })
  }
})

// UPDATE USER STATUS
router.patch('/status', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { isOnline }: { isOnline: boolean } = req.body

    const io = req.app.get('io')
    if (io) {
      const statusData: UserStatusData = {
        userId: req.user.id,
        isOnline,
        lastSeen: Date.now(),
        timestamp: Date.now()
      }

      io.emit('user_status_changed', statusData)
      io.to('admins').emit('user_status_updated', statusData)
    }

    return res.json({ success: true, isOnline })
  } catch (error) {
    console.error('Status update error:', error)
    return res.status(500).json({ error: 'Failed to update status' })
  }
})

// SEARCH USERS
router.get('/search/:query', async (req: AuthRequest, res: Response) => {
  try {
    const query: string = getParam(req.params, 'query')
    const page: number = getNumberQuery(req.query.page, 1)
    const limit: number = getNumberQuery(req.query.limit, 20)

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' })
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { phone: { [Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'name', 'avatar_url', 'bio', 'followers_count'],
      limit,
      offset: (page - 1) * limit,
      order: [['followers_count', 'DESC']]
    })

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Search users error:', error)
    return res.status(500).json({ error: 'Failed to search users' })
  }
})

// ADMIN: GET ALL USERS
router.get('/all', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' })
    }

    const page: number = getNumberQuery(req.query.page, 1)
    const limit: number = getNumberQuery(req.query.limit, 50)
    const roleFilter: string | undefined = req.query.role as string | undefined

    const where: any = {}
    if (roleFilter && isValidRole(roleFilter)) {
      where.role = roleFilter
    }
    
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'phone', 'role', 'location', 'created_at', 'followers_count', 'following_count'],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get all users error:', error)
    return res.status(500).json({ error: 'Failed to get users' })
  }
})

// ADMIN: UPDATE USER ROLE
router.patch('/admin/:userId/role', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' })
    }

    const userId: string = getParam(req.params, 'userId')
    const { role }: { role: string } = req.body

    if (!isValidRole(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: user or admin' })
    }

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const oldRole: string = user.role
    user.role = role // ✅ No type assertion needed - isValidRole ensures it's UserRole
    await user.save()

    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('role_updated', {
        userId,
        oldRole,
        newRole: role,
        updatedBy: req.user.id,
        timestamp: Date.now()
      })

      io.to('admins').emit('user_role_changed', {
        userId,
        oldRole,
        newRole: role,
        updatedBy: req.user.id,
        timestamp: Date.now()
      })
    }

    return res.json({ 
      success: true, 
      message: `User role changed from ${oldRole} to ${role}`,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Update role error:', error)
    return res.status(500).json({ error: 'Failed to update role' })
  }
})

// ADMIN: DELETE USER
router.delete('/admin/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' })
    }

    const userId: string = getParam(req.params, 'userId')

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin users' })
    }

    await user.destroy()

    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('account_deleted', {
        message: 'Your account has been deleted by an administrator',
        timestamp: Date.now()
      })

      io.to('admins').emit('user_deleted_by_admin', {
        userId,
        deletedBy: req.user.id,
        timestamp: Date.now()
      })
    }

    return res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router