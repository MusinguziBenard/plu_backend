// import dotenv from 'dotenv'
// dotenv.config()

// import express from 'express'
// import cors from 'cors'
// import sequelize from './config/sequelize'
// import authRoutes from './routes/auth'
// import userRoutes from './routes/user'
// import likesRoutes from './routes/likes'
// import postsRoutes from './routes/posts'   

// const app = express()
// app.use(cors())
// app.use(express.json())

// app.use('/api/auth', authRoutes)
// app.use('/api/user', userRoutes)
// app.use('/api/likes', likesRoutes)
// app.use('/api/posts', postsRoutes)     

// app.get('/', (req, res) => {
//   res.json({ message: 'PLU Backend LIVE - Uganda', db: 'Connected' })
// })

// sequelize.sync({ alter: true }).then(() => {
//   console.log('Database connected & synced')
//   const PORT = process.env.PORT || 3000
//   app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`)
//   })
// })

// export default app





import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { request } from 'https'                  // ← Built-in Node.js, no install needed
import sequelize from './config/sequelize'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import likesRoutes from './routes/likes'
import postsRoutes from './routes/posts'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/likes', likesRoutes)
app.use('/api/posts', postsRoutes)

// ======================== M.K AI – NO AXIOS VERSION ========================
let remotePLUKnowledge = `
PLU programs: youth leadership, community development, patriotic education.
Recent events: PLU Annual General Meeting 2025, National Patriotic Campaign "Uganda Tuli Wamu".
Leadership: Patron – Gen. Muhoozi Kainerugaba
Current membership drive: Ongoing nationwide registration via PLU App.
`

app.post('/api/ask-plu-ai', (req, res) => {
  const { question } = req.body

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ answer: 'Please send a valid question.' })
  }

  const LOCAL_KNOWLEDGE = `
Mission: Foster national unity and civic responsibility in Uganda.
Leadership: Gen. Muhoozi Kainerugaba (Patron)
Values: Patriotism • Integrity • Accountability • Service • Discipline
Official name: Patriots League of Uganda (PLU)
`

  const prompt = `You are M.K AI, the official PLU assistant.
Answer professionally using only the knowledge below.
If unsure, say "I don't have confirmed information on that."

KNOWLEDGE:
${LOCAL_KNOWLEDGE}

${remotePLUKnowledge}

QUESTION: ${question}

Answer in clear, respectful Ugandan English.`

  const postData = JSON.stringify({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 800,
  })

  const options = {
    hostname: 'api.deepseek.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length,
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
  }

  const apiReq = request(options, (apiRes) => {
    let data = ''

    apiRes.on('data', (chunk) => {
      data += chunk
    })

    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data)
        const answer = parsed.choices?.[0]?.message?.content?.trim() || 'No response from AI.'
        res.json({ answer })
      } catch (e) {
        res.status(500).json({ answer: 'Sorry, M.K AI is busy right now.' })
      }
    })
  })

  apiReq.on('error', (e) => {
    console.error('DeepSeek error:', e.message)
    res.status(500).json({ answer: 'M.K AI is temporarily unavailable.' })
  })

  apiReq.write(postData)
  apiReq.end()
})

// ======================== ROOT HEALTH CHECK ========================
app.get('/', (req, res) => {
  res.json({ message: 'PLU Backend LIVE - Uganda', db: 'Connected' })
})

// ======================== SERVER START ========================
sequelize.sync({ alter: true }).then(() => {
  console.log('Database connected & synced')
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`M.K AI ready → POST /api/ask-plu-ai`)
  })
})

export default app