// middleware/auth.ts — FINAL FIXED
import { Request, Response, NextFunction } from 'express'
import { supabase } from '../utils/supabase'
import { User } from '../models/User'

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Invalid token' })

    // Use Supabase user.id + metadata
    req.user = {
      id: user.id,
      name: user.user_metadata?.name || 'User',
      phone: user.user_metadata?.phone,
      role: user.user_metadata?.role || 'user'
    }

    // Sync to Sequelize (ensure User exists)
    await User.upsert({
      id: user.id,
      name: req.user.name,
      phone: req.user.phone || null,
      role: req.user.role
    })

    next()
  } catch (err) {
    res.status(401).json({ error: 'Auth failed' })
  }
}