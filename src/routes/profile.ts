import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/jwtAuthentication'
import { loadUser } from '../middleware/userLoader'

const router = express.Router()

/**
 * GET /profile
 * Requires a valid JWT and a Telegram initData header on every request.
 * Uses loadUser middleware to upsert and load the Prisma User record.
 */
router.get(
  '/',
  authenticateJWT,
  loadUser({ requireInitData: true }),
  (req: Request, res: Response) => {
    res.json(req.dbUser)
  }
)

export default router

