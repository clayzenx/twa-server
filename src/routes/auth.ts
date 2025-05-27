import { Router, Request, Response, NextFunction } from 'express'
import { verifyInitData } from '../utils/verifyInitData'
import { TelegramUser } from '../types/telegram'

const router = Router()

interface UserRecord {
  id: number
  username?: string
  first_name: string
  balance: number
}

// TODO: In-memory users (позже заменим на БД)
const users = new Map<number, UserRecord>()

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

  // Создаём пользователя если нет
  if (!users.has(user.id)) {
    users.set(user.id, {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      balance: 0,
    })
  }

  res.json({ user: users.get(user.id) })
  return
})

export default router

