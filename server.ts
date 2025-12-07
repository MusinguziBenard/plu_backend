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

// health check point
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ======================== AI ASSISTANT ENDPOINT ========================
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question } = req.body

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Please ask a question to continue.' 
      })
    }

    const trimmedQuestion = question.trim()
    const geminiApiKey = process.env.GEMINI_API_KEY

    // Check if API key is configured
    if (!geminiApiKey) {
      return res.status(500).json({
        success: false,
        error: 'AI service is not properly configured. Please contact support.',
      })
    }

    // PLU context for the AI
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

APPLICATION DEVELOPER INFORMATION:
- Name: Musinguzi Benard
- Education: Bachelor's Degree in Information Systems, Muni University (Graduated 2025)
- Student ID: 2201200218
- Political Affiliation: Supporter of NRM (National Resistance Movement) and PLU
- Contact: +256 763 313 707
- Email: musinguzibenard37@gmail.com, 2201200218@muni.ac.ug
- Notable Projects Developed:
  1. Muni University E-Voting System - Digital voting platform for university elections
  2. SchoolMaster - Educational management system for schools
  3. Muni Grad Space - Platform for Muni University graduates
  4. Air Quality Monitoring System for Dar es Salaam - Environmental monitoring project
  5. PLU Mobile App - This current application for Patriots League of Uganda
- Skills: Software Development, Mobile App Development, Web Development, Database Management
- Location: Uganda
- University: Muni University, Arua, Uganda

RESPONSE GUIDELINES:
1. Always respond in clear, respectful Ugandan English
2. Be informative and helpful about PLU matters
3. If asked about the developer, provide accurate information from the developer section
4. If you don't know specific details, be honest and suggest contacting PLU directly
5. Emphasize PLU's positive impact on communities
6. Highlight youth involvement and national development
7. Keep responses concise but comprehensive
8. Avoid political statements, focus on community development
9. When discussing the developer, mention his educational background and projects with pride`

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

    // Try different models in order
    const modelsToTry = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ]

    let responseData = null

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

        if (geminiResponse.ok) {
          const data = await geminiResponse.json()
          
          if (data.candidates && data.candidates.length > 0) {
            const text = data.candidates[0].content.parts[0]?.text?.trim()
            
            if (text && text.length > 5) {
              responseData = {
                success: true,
                answer: text,
                timestamp: new Date().toISOString()
              }
              break
            }
          }
        }
      } catch {
        // Silently try next model
        continue
      }
    }

    // If all models fail, try direct approach
    if (!responseData) {
      try {
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
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            responseData = {
              success: true,
              answer: data.candidates[0].content.parts[0].text.trim(),
              timestamp: new Date().toISOString()
            }
          }
        }
      } catch {
        // Silently handle error
      }
    }

    if (responseData) {
      return res.status(200).json(responseData)
    } else {
      return res.status(503).json({
        success: false,
        error: 'Our AI assistant is currently unavailable. Please try again in a few moments.',
      })
    }

  } catch {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    })
  }
})

// ======================== HEALTH CHECK ========================
app.get('/api/ai/health', async (req, res) => {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY
    
    if (!geminiApiKey) {
      return res.status(200).json({
        success: false,
        status: 'unhealthy',
        message: 'AI API key is not configured',
      })
    }

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
    
    return res.status(200).json({
      success: true,
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: 'AI service is operational',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return res.status(200).json({
      success: false,
      status: 'unhealthy',
      message: 'AI service is temporarily unavailable',
    })
  }
})

// ======================== ROOT ENDPOINT ========================
app.get('/', (req, res) => {
  res.json({ 
    message: 'PLU Backend LIVE - Uganda', 
    db: 'Connected',
    version: '1.0.0'
  })
})

// ======================== SERVER START ========================
sequelize.sync({ alter: true }).then(() => {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
})

export default app