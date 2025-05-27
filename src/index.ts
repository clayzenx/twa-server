import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
// Load environment variables before importing any application code that relies on them
dotenv.config()

import authRoutes from './routes/auth'
import profileRoutes from './routes/profile'

const app = express()
app.use(cors())
app.use(express.json())
app.use(bodyParser.json())

app.use('/auth', authRoutes)
app.use('/profile', profileRoutes)

app.get('/', (req, res) => {
  res.send('Backend is running!')
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

