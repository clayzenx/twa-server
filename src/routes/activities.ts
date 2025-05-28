import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import type { UserJwtPayload } from '../types/auth'
import { getAvailableActivities, getActivityById } from '../services/activity'
import { findOrCreateUser, incrementUserBalance } from '../services/user'
import { canPerformActivity, recordActivity } from '../services/userActivity'

const router = express.Router()

/**
 * GET /activities
 * Returns a list of activities with availability info for the authenticated user.
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const userPayload = req.user as UserJwtPayload
  const user = await findOrCreateUser(userPayload.id.toString())
  const activities = await Promise.all(
    getAvailableActivities().map(async a => {
      const { available, nextAvailableAt } = await canPerformActivity(user.id, a)
      return {
        id: a.id,
        name: a.name,
        reward: a.reward,
        availability: a.availability,
        available,
        nextAvailableAt: nextAvailableAt?.toISOString(),
      }
    })
  )
  res.json(activities);
})

/**
 * POST /activities/reward
 * Body: { id: string }
 * Rewards the authenticated user if the activity is available.
 */
router.post('/reward', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.body
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing activity id' })
    return
  }

  const activity = getActivityById(id)
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' })
    return
  }

  const userPayload = req.user as UserJwtPayload
  try {
    const user = await findOrCreateUser(userPayload.id.toString())
    const { available, nextAvailableAt } = await canPerformActivity(user.id, activity)
    if (!available) {
      res.status(403).json({ error: 'Activity not available', nextAvailableAt })
      return
    }
    await recordActivity(user.id, activity.id)
    const updatedUser = await incrementUserBalance(user.id, activity.reward)
    // Re-check availability for response
    const next = await canPerformActivity(user.id, activity)
    res.json({ user: updatedUser, activity, availability: next })
  } catch (err) {
    console.error('Error in rewarding user:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
