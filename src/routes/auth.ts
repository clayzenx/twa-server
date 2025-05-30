import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { verifyInitData } from '../utils/verifyInitData'
import { TelegramUser } from '../types/telegram'
import { parseCookies } from '../utils/cookies'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

router.post('/', async (req: Request, res: Response, _next: NextFunction) => {
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

  // if no valid JWT cookie, issue a new token and set it
  const cookies = parseCookies(req.headers.cookie)
  let token = cookies['token']
  let needNew = true
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET)
      needNew = false
    } catch {
      needNew = true
    }
  }
  if (needNew) {
    token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
    // set cookie for client persistence
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
  }
  // return token and user data
  res.json({ token, user })
})

export default router

