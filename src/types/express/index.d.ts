// types/express/index.d.ts
import { UserJwtPayload } from '../../types/auth' // если есть отдельный тип user

declare global {
  namespace Express {
    interface Request {
      user?: UserJwtPayload
    }
  }
}

