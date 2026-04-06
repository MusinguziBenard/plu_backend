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

// AI Configuration (minimal, from .env)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY missing from .env – AI endpoint disabled')
}

// PLU system prompt (concise)
const SYSTEM_PROMPT = `You are M.K AI, the official AI assistant for the Patriots League of Uganda (PLU).

IMPORTANT PLU INFORMATION:
- Organization: Patriots League of Uganda (PLU)
- Patron: General Muhoozi Kainerugaba
- Mission: Promote patriotism, national unity, and civic responsibility in Uganda
- Core Values: Patriotism, Integrity, Accountability, Service, Discipline
- Activities: Community development projects, youth empowerment programs, patriotic education
- Membership: Open to all patriotic Ugandans aged 18 and above
- Headquarters: Kampala, Uganda
- Contact: info@plu.ug (for general inquiries)

RESPONSE GUIDELINES:
1. Always respond in clear, respectful Ugandan English
2. Be informative and helpful about PLU matters
3. If you don't know specific details, be honest and suggest contacting PLU directly
4. Emphasize PLU's positive impact on communities
5. Highlight youth involvement and national development
6. Keep responses concise but comprehensive
7. Avoid political statements, focus on community development`

const getGeminiResponse = async (userMessage: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  console.log('🔄 Getting response from Gemini...')

  const modelsToTry = [
    'gemini-2.0-flash',  // Fastest, free tier
    'gemini-2.5-flash',  // Newer
    'gemini-1.5-flash',  // Fallback
  ]

  let lastError: Error | null = null

  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    const modelName = modelsToTry[attempt]
    try {
      console.log(`Trying model: ${modelName}`)

      const requestBody = {
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\nUser Question: ${userMessage}\n\nPlease provide a helpful response:`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      console.log(`Response Status for ${modelName}:`, response.status)

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Success with model: ${modelName}`)

        if (data.candidates && data.candidates.length > 0) {
          const text = data.candidates[0].content.parts[0]?.text?.trim()

          if (text && text.length > 5) {
            if (data.usageMetadata) {
              console.log(`Tokens used: ${data.usageMetadata.promptTokenCount + data.usageMetadata.candidatesTokenCount}`)
            }
            return text
          }
        }
      } else {
        const errorText = await response.text()
        console.log(`Model ${modelName} failed:`, response.status, errorText)
        lastError = new Error(`Model ${modelName}: ${response.status} - ${errorText}`)
      }

      // Backoff (1s, 2s, 4s)
      if (attempt < modelsToTry.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    } catch (modelError) {
      console.log(`Model ${modelName} error:`, modelError)
      lastError = modelError as Error
    }
  }

  throw lastError || new Error('All Gemini models failed')
}

// Minimal AI endpoint: POST /api/ai/chat { message: string } -> { response: string }
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string' })
  }

  try {
    const aiResponse = await getGeminiResponse(message)
    res.json({ response: aiResponse })
  } catch (error: any) {
    console.error('❌ AI request failed:', error)
    res.status(500).json({ 
      error: 'AI service unavailable',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    })
  }
})

app.get('/', (req, res) => {
  res.json({ message: 'PLU Backend LIVE - Uganda', db: 'Connected' })
})

sequelize.sync({ alter: true }).then(() => {
  console.log('Database connected & synced')
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
  })
})

export default app