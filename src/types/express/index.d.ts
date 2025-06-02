// types/express/index.d.ts
import { TelegramUser } from '../../types/telegram'

declare global {
  namespace Express {
    interface Request {
      user?: TelegramUser
    }
  }
}

