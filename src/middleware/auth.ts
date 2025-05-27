import { Request, Response, NextFunction } from 'express'
import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { UserJwtPayload } from '../types/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const user = jwt.verify(token, JWT_SECRET) as UserJwtPayload
    req.user = user
    next()
  } catch (err: unknown) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' })
    }
    res.status(403).json({ error: 'Invalid token' })
  }

}

