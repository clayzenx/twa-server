import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/jwtAuthentication'
import { loadUser } from '../middleware/userLoader'
import { prisma } from '../db'

const router = express.Router()

/**
 * POST /player/initialize
 * Initialize player data for user if not exists
 */
router.post(
  '/initialize',
  authenticateJWT,
  loadUser({ requireInitData: true }),
  async (req: Request, res: Response) => {
    try {
      const user = req.dbUser

      if (!user)
        res.status(500).json({ error: 'User not found' })

      // Check if player already exists
      const existingPlayer = await prisma.player.findUnique({
        where: { userId: user!.id }
      })

      if (existingPlayer) {
        res.json(existingPlayer)
      }

      // Create new player with default stats
      const newPlayer = await prisma.player.create({
        data: {
          userId: user!.id,
          health: 100,
          maxHealth: 100,
          damage: 10,
          attackRange: 1.5,
          attackSpeed: 1.0,
          movementSpeed: 5.0,
          level: 1,
          experience: 0
        }
      })

      console.log('newPlayer', newPlayer);
      res.json(newPlayer)
    } catch (error) {
      console.error('Error initializing player:', error)
      res.status(500).json({ error: 'Failed to initialize player' })
    }
  }
)

/**
 * PUT /player/stats
 * Update player stats
 */
router.put(
  '/stats',
  authenticateJWT,
  loadUser({ requireInitData: true }),
  async (req: Request, res: Response) => {
    try {
      const user = req.dbUser
      const { health, maxHealth, damage, attackRange, attackSpeed, movementSpeed, level, experience } = req.body

      const updatedPlayer = await prisma.player.update({
        where: { userId: user?.id },
        data: {
          ...(health !== undefined && { health }),
          ...(maxHealth !== undefined && { maxHealth }),
          ...(damage !== undefined && { damage }),
          ...(attackRange !== undefined && { attackRange }),
          ...(attackSpeed !== undefined && { attackSpeed }),
          ...(movementSpeed !== undefined && { movementSpeed }),
          ...(level !== undefined && { level }),
          ...(experience !== undefined && { experience })
        }
      })

      res.json(updatedPlayer)
    } catch (error) {
      console.error('Error updating player stats:', error)
      res.status(500).json({ error: 'Failed to update player stats' })
    }
  }
)

export default router
