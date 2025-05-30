import { Request, Response, NextFunction } from 'express'
import { UserJwtPayload } from '../types/auth'
import { verifyInitData } from '../utils/verifyInitData'
import { upsertTelegramUser, getUserByTelegramId } from '../services/user'
import type { TelegramUser } from '../types/telegram'
import type { User } from '@prisma/client'

// Extend Express Request to include dbUser
declare global {
  namespace Express {
    interface Request {
      dbUser?: User
    }
  }
}

/**
 * Middleware to load the current user from the database.
 * If requireInitData is true, insists on a valid Telegram initData header and upserts on every request.
 * Otherwise, will look up an existing user by telegramId (from JWT payload).
 */
export function loadUser(options: { requireInitData: boolean }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const jwtUser = req.user as UserJwtPayload
    const initDataHeader = req.headers['x-telegram-initdata']
    let dbUser: User | null = null

    if (typeof initDataHeader === 'string') {
      // If initData provided, validate and upsert
      if (!verifyInitData(initDataHeader)) {
        res.status(401).json({ error: 'Invalid initData signature' })
        return
      }
      const params = new URLSearchParams(initDataHeader)
      const userRaw = params.get('user')
      if (!userRaw) {
        res.status(400).json({ error: 'Missing user data in initData' })
        return
      }
      let tgUser: TelegramUser
      try {
        tgUser = JSON.parse(userRaw)
      } catch {
        res.status(400).json({ error: 'Invalid user JSON in initData' })
        return
      }
      if (tgUser.id !== jwtUser.id) {
        res.status(403).json({ error: 'initData user mismatch' })
        return
      }
      try {
        dbUser = await upsertTelegramUser(tgUser)
      } catch (err) {
        console.error('[userLoader] upsert error:', err)
        res.status(500).json({ error: 'Internal server error' })
        return
      }
    } else if (options.requireInitData) {
      // initData required but not provided
      res.status(400).json({ error: 'Missing initData header' })
      return
    } else {
      // No initData: just fetch existing user
      try {
        dbUser = await getUserByTelegramId(jwtUser.id.toString())
      } catch (err) {
        console.error('[userLoader] fetch error:', err)
        res.status(500).json({ error: 'Internal server error' })
        return
      }
      if (!dbUser) {
        res.status(404).json({ error: 'User not found' })
        return
      }
    }
    req.dbUser = dbUser
    next()
  }
}
