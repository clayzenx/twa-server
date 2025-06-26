import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/jwtAuthentication'
import { loadUser } from '../middleware/userLoader'
import { prisma } from '../db'

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
  async (req: Request, res: Response) => {
    const user = req.dbUser

    // Include player data in the response
    const userWithPlayer = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { player: true }
    })

    res.json(userWithPlayer)
  }
)

export default router

