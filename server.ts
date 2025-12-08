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

import express, { Request, Response, NextFunction } from 'express'
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

// ======================== TYPE DEFINITIONS ========================
interface AIRequest {
  question: string;
}

interface AIResponse {
  success: boolean;
  answer?: string;
  error?: string;
  details?: string;
  timestamp?: string;
  model?: string;
}

interface HealthResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: string;
}

interface GeminiErrorResponse {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

// ======================== AI ASSISTANT ENDPOINT (Updated for React Native) ========================
app.post('/api/ai/ask', async (req: Request<{}, {}, AIRequest>, res: Response<AIResponse>): Promise<void> => {
  try {
    const { question } = req.body

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ 
        success: false,
        error: 'Please ask a question to continue.' 
      })
      return
    }

    const trimmedQuestion = question.trim()
    const geminiApiKey = process.env.GEMINI_API_KEY

    // Check if API key is configured
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not configured in environment variables')
      res.status(500).json({
        success: false,
        error: 'AI service is not properly configured. Please contact support.',
      })
      return
    }

    // PLU context for the AI (simplified version for React Native compatibility)
    const PLU_CONTEXT = `You are M.K AI, the official AI assistant for the Patriots League of Uganda (PLU).

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

    const requestBody = {
      contents: [{
        parts: [{
          text: `${PLU_CONTEXT}\n\nUser Question: ${trimmedQuestion}\n\nPlease provide a helpful response:`
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
          category: "HARM_CATEGORY_HARASSMENT" as const,
          threshold: "BLOCK_MEDIUM_AND_ABOVE" as const
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH" as const,
          threshold: "BLOCK_MEDIUM_AND_ABOVE" as const
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as const,
          threshold: "BLOCK_MEDIUM_AND_ABOVE" as const
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT" as const,
          threshold: "BLOCK_MEDIUM_AND_ABOVE" as const
        }
      ]
    }

    console.log(`Making Gemini API call for question: "${trimmedQuestion.substring(0, 50)}..."`)

    // Try different models in order
    const modelsToTry = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ]

    let responseData: AIResponse | null = null
    let lastError: string | null = null

    for (const modelName of modelsToTry) {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        )

        console.log(`Gemini response status for ${modelName}: ${geminiResponse.status}`)

        if (geminiResponse.ok) {
          const data = await geminiResponse.json()
          
          if (data.candidates && data.candidates.length > 0) {
            const text = data.candidates[0].content?.parts?.[0]?.text?.trim()
            
            if (text && text.length > 5) {
              responseData = {
                success: true,
                answer: text,
                timestamp: new Date().toISOString(),
                model: modelName
              }
              console.log(`Successfully got response from ${modelName}`)
              break
            }
          }
        } else {
          const errorText = await geminiResponse.text()
          lastError = `Model ${modelName} failed with status ${geminiResponse.status}: ${errorText}`
          console.error(lastError)
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        lastError = `Model ${modelName} error: ${errorMessage}`
        console.error(lastError)
        continue
      }
    }

    // If all models fail, try direct approach with header-based auth
    if (!responseData) {
      try {
        console.log('Trying direct approach with header auth...')
        const directResponse = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${PLU_CONTEXT}\n\nUser: ${trimmedQuestion}\n\nAssistant:`
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
              }
            }),
          }
        )

        if (directResponse.ok) {
          const data = await directResponse.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (text) {
            responseData = {
              success: true,
              answer: text,
              timestamp: new Date().toISOString(),
              model: 'gemini-2.0-flash-direct'
            }
          }
        } else {
          const errorText = await directResponse.text()
          lastError = `Direct approach failed: ${directResponse.status} - ${errorText}`
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        lastError = `Direct approach error: ${errorMessage}`
      }
    }

    if (responseData) {
      res.status(200).json(responseData)
      return
    } else {
      console.error('All AI attempts failed:', lastError)
      res.status(503).json({
        success: false,
        error: 'Our AI assistant is currently unavailable. Please try again in a few moments.',
        details: process.env.NODE_ENV === 'development' ? lastError || undefined : undefined
      })
      return
    }

  } catch (error: unknown) {
    console.error('Unexpected error in AI endpoint:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    })
  }
})

// ======================== AI HEALTH CHECK ========================
app.get('/api/ai/health', async (req: Request, res: Response<HealthResponse>): Promise<void> => {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not configured')
      res.status(200).json({
        success: false,
        status: 'unhealthy',
        message: 'AI API key is not configured',
        timestamp: new Date().toISOString(),
      })
      return
    }

    console.log('Testing Gemini API health...')
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello'
            }]
          }],
          generationConfig: {
            maxOutputTokens: 10,
          }
        }),
      }
    )

    const isHealthy = testResponse.ok
    
    if (!isHealthy) {
      const errorText = await testResponse.text()
      console.error('Gemini health check failed:', testResponse.status, errorText)
    }

    res.status(200).json({
      success: true,
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy ? 'AI service is operational' : 'AI service is unavailable',
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('AI health check error:', error)
    res.status(200).json({
      success: false,
      status: 'unhealthy',
      message: 'AI service is temporarily unavailable',
      timestamp: new Date().toISOString(),
    })
  }
})

// ======================== ERROR HANDLING MIDDLEWARE ========================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// ======================== ROOT ENDPOINT ========================
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'PLU Backend LIVE - Uganda', 
    db: 'Connected',
    version: '1.0.0',
    ai: 'Available at /api/ai/ask',
    health: 'Available at /api/ai/health'
  })
})

// ======================== 404 HANDLER ========================
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  })
})

// ======================== SERVER START ========================
sequelize.sync({ alter: true }).then(() => {
  console.log('Database connected & synced')
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`AI endpoint: POST http://localhost:${PORT}/api/ai/ask`)
    console.log(`Health check: GET http://localhost:${PORT}/api/ai/health`)
  })
}).catch((error: Error) => {
  console.error('Database connection failed:', error)
})

export default app