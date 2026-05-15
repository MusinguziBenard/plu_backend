// import { Router } from 'express'
// import { requireAuth } from '../middleware/auth'
// import { InteractionPreference } from '../models/InteractionPreference'

// const router = Router()
// router.use(requireAuth)

// router.get('/', async (req, res) => {
//   try {
//     const userId = req.user.id

//     let preferences = await InteractionPreference.findOne({
//       where: { user_id: userId }
//     })

//     if (!preferences) {
//       preferences = await InteractionPreference.create({ user_id: userId })
//     }

//     res.json(preferences)
//   } catch (error) {
//     console.error('Get preferences error:', error)
//     res.status(500).json({ error: 'Failed to get preferences' })
//   }
// })

// router.patch('/', async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { notify_on_follow, notify_on_like, notify_on_comment, notify_on_tag, notify_on_invite, auto_accept_follows } = req.body

//     let preferences = await InteractionPreference.findOne({
//       where: { user_id: userId }
//     })

//     if (!preferences) {
//       preferences = await InteractionPreference.create({ user_id: userId })
//     }

//     if (notify_on_follow !== undefined) preferences.notify_on_follow = notify_on_follow
//     if (notify_on_like !== undefined) preferences.notify_on_like = notify_on_like
//     if (notify_on_comment !== undefined) preferences.notify_on_comment = notify_on_comment
//     if (notify_on_tag !== undefined) preferences.notify_on_tag = notify_on_tag
//     if (notify_on_invite !== undefined) preferences.notify_on_invite = notify_on_invite
//     if (auto_accept_follows !== undefined) preferences.auto_accept_follows = auto_accept_follows

//     await preferences.save()

//     res.json(preferences)
//   } catch (error) {
//     console.error('Update preferences error:', error)
//     res.status(500).json({ error: 'Failed to update preferences' })
//   }
// })

// router.post('/reset', async (req, res) => {
//   try {
//     const userId = req.user.id

//     await InteractionPreference.upsert({
//       user_id: userId,
//       notify_on_follow: true,
//       notify_on_like: true,
//       notify_on_comment: true,
//       notify_on_tag: true,
//       notify_on_invite: true,
//       auto_accept_follows: true
//     })

//     const preferences = await InteractionPreference.findOne({
//       where: { user_id: userId }
//     })

//     res.json(preferences)
//   } catch (error) {
//     console.error('Reset preferences error:', error)
//     res.status(500).json({ error: 'Failed to reset preferences' })
//   }
// })

// export default router


// routes/interactionPreferences.ts - COMPLETE WITH SOCKET.IO INTEGRATION (TYPE-SAFE)
import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { InteractionPreference } from '../models/InteractionPreference'

const router = Router()
router.use(requireAuth)

// Type definitions for socket events
interface PreferencesUpdatedData {
  userId: string;
  preferences: {
    notify_on_follow: boolean;
    notify_on_like: boolean;
    notify_on_comment: boolean;
    notify_on_tag: boolean;
    notify_on_invite: boolean;
    auto_accept_follows: boolean;
  };
  changedFields: string[];
  message: string;
  timestamp: number;
}

interface PreferenceToggledData {
  userId: string;
  key: string;
  value: boolean;
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

// Allowed preference fields
const ALLOWED_FIELDS = [
  'notify_on_follow', 
  'notify_on_like', 
  'notify_on_comment', 
  'notify_on_tag', 
  'notify_on_invite', 
  'auto_accept_follows'
] as const;

type PreferenceKey = typeof ALLOWED_FIELDS[number];

// Helper to safely get route parameter
const getParam = (params: any, key: string): string => {
  const value = params[key];
  if (Array.isArray(value)) return String(value[0]);
  return String(value || '');
}

// Get user preferences
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id

    let preferences = await InteractionPreference.findOne({
      where: { user_id: userId }
    })

    if (!preferences) {
      preferences = await InteractionPreference.create({ user_id: userId })
    }

    // SOCKET.IO - Emit preferences loaded
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('preferences_loaded', {
        userId,
        preferences: {
          notify_on_follow: preferences.notify_on_follow,
          notify_on_like: preferences.notify_on_like,
          notify_on_comment: preferences.notify_on_comment,
          notify_on_tag: preferences.notify_on_tag,
          notify_on_invite: preferences.notify_on_invite,
          auto_accept_follows: preferences.auto_accept_follows
        },
        timestamp: Date.now()
      })
    }

    return res.json(preferences)
  } catch (error) {
    console.error('Get preferences error:', error)
    return res.status(500).json({ error: 'Failed to get preferences' })
  }
})

// Update user preferences
router.patch('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const updates: Record<string, boolean> = req.body

    // Validate update fields
    const invalidFields = Object.keys(updates).filter(key => !ALLOWED_FIELDS.includes(key as PreferenceKey))
    if (invalidFields.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid fields', 
        invalidFields,
        allowedFields: ALLOWED_FIELDS 
      })
    }

    let preferences = await InteractionPreference.findOne({
      where: { user_id: userId }
    })

    if (!preferences) {
      preferences = await InteractionPreference.create({ user_id: userId })
    }

    // Track changed fields
    const changedFields: string[] = []

    if (updates.notify_on_follow !== undefined && preferences.notify_on_follow !== updates.notify_on_follow) {
      changedFields.push('notify_on_follow')
      preferences.notify_on_follow = updates.notify_on_follow
    }
    
    if (updates.notify_on_like !== undefined && preferences.notify_on_like !== updates.notify_on_like) {
      changedFields.push('notify_on_like')
      preferences.notify_on_like = updates.notify_on_like
    }
    
    if (updates.notify_on_comment !== undefined && preferences.notify_on_comment !== updates.notify_on_comment) {
      changedFields.push('notify_on_comment')
      preferences.notify_on_comment = updates.notify_on_comment
    }
    
    if (updates.notify_on_tag !== undefined && preferences.notify_on_tag !== updates.notify_on_tag) {
      changedFields.push('notify_on_tag')
      preferences.notify_on_tag = updates.notify_on_tag
    }
    
    if (updates.notify_on_invite !== undefined && preferences.notify_on_invite !== updates.notify_on_invite) {
      changedFields.push('notify_on_invite')
      preferences.notify_on_invite = updates.notify_on_invite
    }
    
    if (updates.auto_accept_follows !== undefined && preferences.auto_accept_follows !== updates.auto_accept_follows) {
      changedFields.push('auto_accept_follows')
      preferences.auto_accept_follows = updates.auto_accept_follows
    }

    await preferences.save()

    // SOCKET.IO - Emit preferences updated
    const io = req.app.get('io')
    if (io && changedFields.length > 0) {
      const preferencesData: PreferencesUpdatedData = {
        userId,
        preferences: {
          notify_on_follow: preferences.notify_on_follow,
          notify_on_like: preferences.notify_on_like,
          notify_on_comment: preferences.notify_on_comment,
          notify_on_tag: preferences.notify_on_tag,
          notify_on_invite: preferences.notify_on_invite,
          auto_accept_follows: preferences.auto_accept_follows
        },
        changedFields,
        message: `Updated: ${changedFields.join(', ')}`,
        timestamp: Date.now()
      }

      io.to(`user:${userId}`).emit('preferences_updated', preferencesData)
    }

    return res.json({
      preferences,
      changedFields,
      message: changedFields.length > 0 
        ? `Updated: ${changedFields.join(', ')}` 
        : 'No changes made'
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    return res.status(500).json({ error: 'Failed to update preferences' })
  }
})

// Reset preferences to defaults
router.post('/reset', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id

    await InteractionPreference.upsert({
      user_id: userId,
      notify_on_follow: true,
      notify_on_like: true,
      notify_on_comment: true,
      notify_on_tag: true,
      notify_on_invite: true,
      auto_accept_follows: true
    })

    const preferences = await InteractionPreference.findOne({
      where: { user_id: userId }
    })

    // SOCKET.IO - Emit preferences reset
    const io = req.app.get('io')
    if (io && preferences) {
      const preferencesData: PreferencesUpdatedData = {
        userId,
        preferences: {
          notify_on_follow: preferences.notify_on_follow,
          notify_on_like: preferences.notify_on_like,
          notify_on_comment: preferences.notify_on_comment,
          notify_on_tag: preferences.notify_on_tag,
          notify_on_invite: preferences.notify_on_invite,
          auto_accept_follows: preferences.auto_accept_follows
        },
        changedFields: [...ALLOWED_FIELDS],
        message: 'Preferences reset to defaults',
        timestamp: Date.now()
      }

      io.to(`user:${userId}`).emit('preferences_reset', preferencesData)
    }

    return res.json(preferences)
  } catch (error) {
    console.error('Reset preferences error:', error)
    return res.status(500).json({ error: 'Failed to reset preferences' })
  }
})

// Toggle specific preference
router.patch('/toggle/:key', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId: string = req.user.id
    const key: string = getParam(req.params, 'key') // ✅ Fixed: using getParam helper

    if (!ALLOWED_FIELDS.includes(key as PreferenceKey)) {
      return res.status(400).json({ 
        error: 'Invalid preference key',
        allowedKeys: ALLOWED_FIELDS 
      })
    }

    let preferences = await InteractionPreference.findOne({
      where: { user_id: userId }
    })

    if (!preferences) {
      preferences = await InteractionPreference.create({ user_id: userId })
    }

    // Toggle the value
    const typedKey = key as PreferenceKey
    const currentValue: boolean = (preferences as any)[typedKey]
    ;(preferences as any)[typedKey] = !currentValue
    await preferences.save()

    // SOCKET.IO - Emit preference toggled
    const io = req.app.get('io')
    if (io) {
      const toggleData: PreferenceToggledData = {
        userId,
        key,
        value: !currentValue,
        timestamp: Date.now()
      }

      io.to(`user:${userId}`).emit('preference_toggled', toggleData)
    }

    return res.json({ 
      key, 
      value: !currentValue,
      message: `${key.replace(/_/g, ' ')} ${!currentValue ? 'enabled' : 'disabled'}`
    })
  } catch (error) {
    console.error('Toggle preference error:', error)
    return res.status(500).json({ error: 'Failed to toggle preference' })
  }
})

export default router