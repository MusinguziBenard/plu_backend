// routes/upload.ts
import { Router } from 'express'
import multer from 'multer'
import cloudinary from 'cloudinary'
import { requireAuth } from '../middleware/auth'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/avatar', requireAuth, upload.single('avatar'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })

  const result = await cloudinary.v2.uploader.upload_stream(
    { folder: 'plu-avatars' },
    (error, result) => {
      if (error) return res.status(500).json({ error: 'Upload failed' })
      res.json({ url: result?.secure_url })
    }
  )

  req.file.stream.pipe(result)
})

export default router