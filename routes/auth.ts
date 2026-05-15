// // routes/auth.ts — FINAL VERSION (YOUR CODE + LOGIN)
// import { Router } from 'express'
// import { supabaseAdmin } from '../utils/supabase'
// import { supabase } from '../utils/supabase'
// import { User } from '../models/User'

// const router = Router()

// // YOUR ORIGINAL JOIN — WE KEEP 100%
// router.post('/join', async (req, res) => {
//   const { name, phone, password } = req.body

//   if (!name || !phone || !password) {
//     return res.status(400).json({ error: 'Name, phone, and password required' })
//   }

//   try {
//     const { data, error } = await supabaseAdmin.auth.admin.createUser({
//       email: `${phone}@plu.local`,
//       password,
//       user_metadata: { name, phone, role: 'user' },  // ← ADD ROLE
//       email_confirm: true
//     })

//     if (error) {
//       if (error.message.includes('already exists')) {
//         return res.status(400).json({ error: 'Phone already registered' })
//       }
//       return res.status(400).json({ error: error.message })
//     }

//     await User.upsert({
//       id: data.user.id,
//       name,
//       phone,
//       role: 'user'
//     })

//     res.json({ success: true, message: 'Welcome to PLU! You can now log in.' })
//   } catch (err: any) {
//     res.status(500).json({ error: err.message })
//   }
// })

// // NEW: LOGIN WITH PHONE + PASSWORD
// router.post('/login', async (req, res) => {
//   const { phone, password } = req.body

//   if (!phone || !password) {
//     return res.status(400).json({ error: 'Phone and password required' })
//   }

//   try {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email: `${phone}@plu.local`,
//       password
//     })

//     if (error) {
//       return res.status(401).json({ error: 'Invalid phone or password' })
//     }

//     res.json({
//       success: true,
//       token: data.session.access_token,
//       user: {
//         id: data.user.id,
//         name: data.user.user_metadata.name,
//         phone: data.user.user_metadata.phone,
//         role: data.user.user_metadata.role || 'user'
//       }
//     })
//   } catch (err: any) {
//     res.status(500).json({ error: err.message })
//   }
// })

// export default router

// routes/auth.ts — FINAL VERSION WITH SOCKET.IO INTEGRATION
import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../utils/supabase'
import { supabase } from '../utils/supabase'
import { User } from '../models/User'

const router = Router()

// Type definitions for socket events
interface UserRegisteredData {
  userId: string;
  name: string;
  phone: string;
  timestamp: number;
}

interface UserLoggedInData {
  userId: string;
  name: string;
  phone: string;
  role: string;
  timestamp: number;
}

// Type definitions for request body
interface JoinRequestBody {
  name: string;
  phone: string;
  password: string;
}

interface LoginRequestBody {
  phone: string;
  password: string;
}

// JOIN — Register new user
router.post('/join', async (req: Request, res: Response) => {
  const { name, phone, password }: JoinRequestBody = req.body

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Name, phone, and password required' })
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: `${phone}@plu.local`,
      password,
      user_metadata: { name, phone, role: 'user' },
      email_confirm: true
    })

    if (error) {
      if (error.message.includes('already exists')) {
        return res.status(400).json({ error: 'Phone already registered' })
      }
      return res.status(400).json({ error: error.message })
    }

    if (!data.user) {
      return res.status(500).json({ error: 'Failed to create user' })
    }

    await User.upsert({
      id: data.user.id,
      name,
      phone,
      role: 'user'
    })

    // ✅ SOCKET.IO - Emit user registered event
    const io = req.app.get('io')
    if (io) {
      const userData: UserRegisteredData = {
        userId: data.user.id,
        name,
        phone,
        timestamp: Date.now()
      }

      // Notify admins about new user registration
      io.to('admins').emit('user_registered', userData)

      // Emit to the new user's room (they may connect later)
      io.to(`user:${data.user.id}`).emit('welcome', {
        ...userData,
        message: 'Welcome to PLU! Your account has been created.'
      })
    }

    return res.json({ 
      success: true, 
      message: 'Welcome to PLU! You can now log in.',
      user: {
        id: data.user.id,
        name,
        phone
      }
    })
  } catch (err: any) {
    console.error('Join error:', err)
    return res.status(500).json({ error: err.message || 'Failed to register' })
  }
})

// LOGIN — Sign in with phone + password
router.post('/login', async (req: Request, res: Response) => {
  const { phone, password }: LoginRequestBody = req.body

  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password required' })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${phone}@plu.local`,
      password
    })

    if (error) {
      return res.status(401).json({ error: 'Invalid phone or password' })
    }

    if (!data.session || !data.user) {
      return res.status(401).json({ error: 'Login failed' })
    }

    const userInfo = {
      id: data.user.id,
      name: data.user.user_metadata?.name || 'User',
      phone: data.user.user_metadata?.phone || phone,
      role: data.user.user_metadata?.role || 'user'
    }

    // ✅ SOCKET.IO - Emit user logged in event
    const io = req.app.get('io')
    if (io) {
      const loginData: UserLoggedInData = {
        userId: userInfo.id,
        name: userInfo.name,
        phone: userInfo.phone,
        role: userInfo.role,
        timestamp: Date.now()
      }

      // Notify admins if admin user logged in
      if (userInfo.role === 'admin') {
        io.to('admins').emit('admin_logged_in', loginData)
      }

      // Emit to user's personal room
      io.to(`user:${userInfo.id}`).emit('login_success', {
        ...loginData,
        message: 'Login successful'
      })
    }

    return res.json({
      success: true,
      token: data.session.access_token,
      user: userInfo
    })
  } catch (err: any) {
    console.error('Login error:', err)
    return res.status(500).json({ error: err.message || 'Failed to login' })
  }
})

// LOGOUT — Optional endpoint for logging out
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // ✅ SOCKET.IO - Emit logout event if user info is available
    const userId = (req as any).user?.id
    const io = req.app.get('io')
    if (io && userId) {
      io.to(`user:${userId}`).emit('logged_out', {
        userId,
        message: 'You have been logged out',
        timestamp: Date.now()
      })
    }

    return res.json({ success: true, message: 'Logged out successfully' })
  } catch (err: any) {
    console.error('Logout error:', err)
    return res.status(500).json({ error: err.message || 'Failed to logout' })
  }
})

// REFRESH TOKEN — Get new access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      return res.status(401).json({ error: 'Session expired, please login again' })
    }

    if (!data.session) {
      return res.status(401).json({ error: 'No active session' })
    }

    return res.json({
      success: true,
      token: data.session.access_token,
      expiresAt: data.session.expires_at
    })
  } catch (err: any) {
    console.error('Refresh error:', err)
    return res.status(500).json({ error: err.message || 'Failed to refresh token' })
  }
})

// GET CURRENT USER — Verify token and get user info
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')
    
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const user = await User.findByPk(data.user.id, {
      attributes: ['id', 'name', 'phone', 'avatar_url', 'role', 'followers_count', 'following_count']
    })

    return res.json({
      user: {
        id: data.user.id,
        name: data.user.user_metadata?.name || user?.name,
        phone: data.user.user_metadata?.phone || user?.phone,
        role: data.user.user_metadata?.role || user?.role || 'user',
        avatar_url: user?.avatar_url,
        followers_count: user?.followers_count || 0,
        following_count: user?.following_count || 0
      }
    })
  } catch (err: any) {
    console.error('Get user error:', err)
    return res.status(500).json({ error: err.message || 'Failed to get user' })
  }
})

// DELETE ACCOUNT — Remove user account
router.delete('/delete-account', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token)

    if (getUserError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Delete from Supabase
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Delete from local database
    await User.destroy({ where: { id: user.id } })

    // ✅ SOCKET.IO - Notify about account deletion
    const io = req.app.get('io')
    if (io) {
      io.to('admins').emit('user_deleted_account', {
        userId: user.id,
        timestamp: Date.now()
      })
    }

    return res.json({ success: true, message: 'Account deleted successfully' })
  } catch (err: any) {
    console.error('Delete account error:', err)
    return res.status(500).json({ error: err.message || 'Failed to delete account' })
  }
})

export default router