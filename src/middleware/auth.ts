import { Request, Response, NextFunction } from 'express'
import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { UserJwtPayload } from '../types/auth'
import { parseCookies } from '../utils/cookies'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

/**
 * Middleware to authenticate a user based on a JWT stored in cookies.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie)
  const token = cookies['token']
  if (!token) {
    res.status(401).json({ error: 'Missing auth token' })
    return
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as UserJwtPayload
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

