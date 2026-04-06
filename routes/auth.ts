// routes/auth.ts — FINAL VERSION (YOUR CODE + LOGIN)
import { Router } from 'express'
import { supabaseAdmin } from '../utils/supabase'
import { supabase } from '../utils/supabase'
import { User } from '../models/User'

const router = Router()

// YOUR ORIGINAL JOIN — WE KEEP 100%
router.post('/join', async (req, res) => {
  const { name, phone, password } = req.body

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Name, phone, and password required' })
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: `${phone}@plu.local`,
      password,
      user_metadata: { name, phone, role: 'user' },  // ← ADD ROLE
      email_confirm: true
    })

    if (error) {
      if (error.message.includes('already exists')) {
        return res.status(400).json({ error: 'Phone already registered' })
      }
      return res.status(400).json({ error: error.message })
    }

    await User.upsert({
      id: data.user.id,
      name,
      phone,
      role: 'user'
    })

    res.json({ success: true, message: 'Welcome to PLU! You can now log in.' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// NEW: LOGIN WITH PHONE + PASSWORD
router.post('/login', async (req, res) => {
  const { phone, password } = req.body

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

    res.json({
      success: true,
      token: data.session.access_token,
      user: {
        id: data.user.id,
        name: data.user.user_metadata.name,
        phone: data.user.user_metadata.phone,
        role: data.user.user_metadata.role || 'user'
      }
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router