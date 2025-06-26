import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
// Load environment variables before importing any application code that relies on them
dotenv.config()

import authRoutes from './routes/auth'
import profileRoutes from './routes/profile'
import activitiesRoutes from './routes/activities'
import playerRoutes from './routes/player'

const FRONTEND = process.env.FRONTEND_ORIGIN

// Allowed request origins (env FRONTEND_ORIGIN, localhost, and GitHub Pages)
const ORIGINS = [
  FRONTEND,
  'http://localhost:4000',
  'http://localhost:5173',
  'https://clayzenx.github.io',
  'https://archiveplay.github.io'
]

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    // если запрос не из браузера (Postman) – пропускаем
    if (!origin) return callback(null, true)
    if (ORIGINS.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`))
    }
  },
  credentials: true,            // разрешаем отдавать и принимать куки
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-telegram-initdata',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.use(express.json())
app.use(bodyParser.json())

app.use('/auth', authRoutes)
app.use('/profile', profileRoutes)
app.use('/activities', activitiesRoutes)
app.use('/player', playerRoutes)

app.get('/', (req, res) => {
  res.send('Backend is running!')
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

