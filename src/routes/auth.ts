import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { verifyInitData } from '../utils/verifyInitData'
import { TelegramUser } from '../types/telegram'
import { parseCookies } from '../utils/cookies'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'
const IS_PROD = process.env.NODE_ENV === 'production';

router.post('/', async (req: Request, res: Response, _next: NextFunction) => {
  const initData = req.headers['x-telegram-initdata'] as string

  if (!initData) {
    res.status(401).json({ error: 'initData is not provided' })
    return
  }
  if (IS_PROD && !verifyInitData(initData)) {
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
    // set cookie for client persistence; for cross-site XHR, SameSite=None and secure required
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
  }
  // return token and user data
  res.json({ token, user })
})

export default router

