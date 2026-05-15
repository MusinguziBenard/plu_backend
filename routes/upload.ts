// // routes/upload.ts
// import { Router } from 'express'
// import multer from 'multer'
// import cloudinary from 'cloudinary'
// import { requireAuth } from '../middleware/auth'

// const router = Router()
// const upload = multer({ storage: multer.memoryStorage() })

// router.post('/avatar', requireAuth, upload.single('avatar'), async (req: any, res) => {
//   if (!req.file) return res.status(400).json({ error: 'No file' })

//   const result = await cloudinary.v2.uploader.upload_stream(
//     { folder: 'plu-avatars' },
//     (error, result) => {
//       if (error) return res.status(500).json({ error: 'Upload failed' })
//       res.json({ url: result?.secure_url })
//     }
//   )

//   req.file.stream.pipe(result)
// })

// export default router

// routes/upload.ts - WITH SOCKET.IO INTEGRATION (TYPE-SAFE)
import { Router, Request, Response } from 'express'
import multer from 'multer'
import cloudinary from 'cloudinary'
import { requireAuth } from '../middleware/auth'
import { User } from '../models/User'

const router = Router()

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
})

// Extended Request interface
interface AuthRequest extends Request {
  user?: {
    id: string;
    name?: string;
    role?: string;
    user_metadata?: {
      role?: string;
    };
  };
  file?: Express.Multer.File;
}

// Upload avatar
router.post('/avatar', requireAuth, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const userId: string = req.user.id

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { 
          folder: 'plu-avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      )

      // Convert buffer to stream and pipe to Cloudinary
      const { Readable } = require('stream')
      const bufferStream = Readable.from(req.file!.buffer)
      bufferStream.pipe(uploadStream)
    })

    // Update user's avatar in database
    await User.update(
      { avatar_url: result.secure_url },
      { where: { id: userId } }
    )

    // Get updated user
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'avatar_url']
    })

    // ✅ SOCKET.IO - Emit avatar updated event
    const io = req.app.get('io')
    if (io && user) {
      // Notify user
      io.to(`user:${userId}`).emit('avatar_updated', {
        userId,
        avatarUrl: result.secure_url,
        timestamp: Date.now()
      })

      // Notify admins
      io.to('admins').emit('user_avatar_updated', {
        userId,
        userName: user.name,
        avatarUrl: result.secure_url,
        timestamp: Date.now()
      })
    }

    return res.json({ 
      success: true, 
      url: result.secure_url 
    })

  } catch (error) {
    console.error('Avatar upload error:', error)
    return res.status(500).json({ 
      error: 'Upload failed',
      details: (error as Error).message 
    })
  }
})

// Upload error handler
router.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' })
    }
    return res.status(400).json({ error: err.message })
  }
  
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message })
  }
  
  next(err)
})

export default router