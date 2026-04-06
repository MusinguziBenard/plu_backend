import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/ping', (req, res) => res.json({ status: 'ok', message: 'Server is running!' }))
app.get('/', (req, res) => res.json({ message: 'PLU Backend - Simple Mode', db: 'Not connected' }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log('⚠️ Running in simple mode - no database connection')
})

export default app