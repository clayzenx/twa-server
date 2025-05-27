import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { verifyInitData } from '../utils/verifyInitData'
import { TelegramUser } from '../types/telegram'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

router.post('/', (req: Request, res: Response, _next: NextFunction) => {
  const { initData } = req.body

  if (!initData || !verifyInitData(initData)) {
    res.status(401).json({ error: 'Invalid initData' })
    return
  }

  const params = new URLSearchParams(initData)
  const userRaw = params.get('user')

  if (!userRaw) {
    res.status(400).json({ error: 'Missing user data' })
    return
  }

  let user: TelegramUser
  try {
    user = JSON.parse(userRaw)
  } catch {
    res.status(400).json({ error: 'Invalid user data' })
    return
  }

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })

  res.json({ token, user })
})

export default router

