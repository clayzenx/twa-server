import { Request, Response, NextFunction } from 'express'
import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { parseCookies } from '../utils/cookies'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

/**
 * Middleware to authenticate a user based on a JWT stored in cookies or Authorization header.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  // Try to read JWT from httpOnly cookie
  const cookies = parseCookies(req.headers.cookie)
  let token = cookies['token']
  // Fallback: Authorization header
  const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }
  if (!token) {
    res.status(401).json({ error: 'Missing auth token' })
    return
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as import('../types/telegram').TelegramUser
    req.user = user
    next()
  } catch (err: unknown) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' })
      return
    }
    res.status(403).json({ error: 'Invalid auth token' })
  }
}
